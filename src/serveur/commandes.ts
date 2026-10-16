/*
 * Paiement et commandes (brief §6), côté Worker :
 *   POST /api/checkout          recalcule le panier depuis le catalogue serveur, crée la session Stripe Checkout
 *   POST /api/stripe/webhook    signature vérifiée, traitement idempotent, enregistre la commande dans D1
 *   GET  /api/commande/statut   état d'une commande pour la page /commande/merci (numéro, total)
 *
 * Les prix envoyés par le navigateur ne sont jamais lus : seuls les
 * identifiants produit / variante et les quantités le sont.
 */
import { BOUTIQUE } from '../config/boutique.ts';
import { SOCIETE } from '../config/societe.ts';
import { calculerPanier, QUANTITE_MAX, type LigneDemandee, type Recapitulatif } from '../lib/panier-calcul.ts';
import { versArticles, type ProduitServeur } from './catalogue.ts';
import { SCHEMA } from './schema.ts';
import { appelStripe, ErreurStripe, verifierSignature, type Parametres } from './stripe.ts';

// --- Types minimaux des liaisons Cloudflare (sans dépendance @cloudflare/workers-types) ---
export interface D1Requete {
  bind(...valeurs: unknown[]): D1Requete;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}
export interface D1Base {
  prepare(sql: string): D1Requete;
  batch(requetes: D1Requete[]): Promise<unknown[]>;
}
export interface EnvPaiement {
  DB?: D1Base;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}

const json = (donnees: unknown, statut = 200) =>
  new Response(JSON.stringify(donnees), {
    status: statut,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const centimes = (euros: number) => Math.round(euros * 100);
const maintenant = () => new Date().toISOString();
const texte = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);

// --- Base de données : schéma appliqué une fois par instance du Worker ---
let schemaPret: Promise<unknown> | null = null;
export function preparerBase(db: D1Base): Promise<unknown> {
  schemaPret ??= db.batch(SCHEMA.map((s) => db.prepare(s))).catch((e) => {
    schemaPret = null;
    throw e;
  });
  return schemaPret;
}

/** Numéro de commande lisible et non devinable : LPX-7K2M9QXA (alphabet sans I, L, O, U). */
export function numeroCommande(): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const octets = crypto.getRandomValues(new Uint8Array(8));
  return `LPX-${[...octets].map((o) => alphabet[o % 32]).join('')}`;
}

// --- Origine de la visite (UTM et référent de première visite, brief §6.3) ---
export interface Origine {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referent?: string;
  page_arrivee?: string;
}

export function nettoyerOrigine(brut: unknown): Origine {
  const o = (brut && typeof brut === 'object' ? brut : {}) as Record<string, unknown>;
  const res: Origine = {};
  for (const cle of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const) res[cle] = texte(o[cle], 200);
  res.referent = texte(o.referent, 400);
  res.page_arrivee = texte(o.page_arrivee, 400);
  return res;
}

function lireLignes(brut: unknown): LigneDemandee[] | null {
  if (!Array.isArray(brut) || brut.length < 1 || brut.length > 20) return null;
  const lignes: LigneDemandee[] = [];
  for (const l of brut) {
    const produit = texte(l?.produit, 100);
    const variante = texte(l?.variante, 50);
    const quantite = l?.quantite;
    if (!produit || !variante || !Number.isInteger(quantite) || quantite < 1 || quantite > QUANTITE_MAX) return null;
    lignes.push({ produit, variante, quantite });
  }
  return lignes;
}

// --- TVA : taux de 20 % inclus dans les prix, créé une fois dans le compte Stripe ---
const cacheTva = new Map<string, string>();
async function tauxTva(cle: string): Promise<string> {
  const connu = cacheTva.get(cle);
  if (connu) return connu;
  const liste = await appelStripe<{ data: { id: string; metadata?: Record<string, string> }[] }>(cle, 'GET', 'tax_rates', {
    active: true,
    inclusive: true,
    limit: 100,
  });
  let id = liste.data.find((t) => t.metadata?.lumipix === 'tva-fr-20')?.id;
  if (!id) {
    const cree = await appelStripe<{ id: string }>(
      cle,
      'POST',
      'tax_rates',
      {
        display_name: 'TVA',
        description: 'TVA française 20 %',
        percentage: SOCIETE.tauxTva * 100,
        inclusive: true,
        country: 'FR',
        jurisdiction: 'FR',
        tax_type: 'vat',
        metadata: { lumipix: 'tva-fr-20' },
      },
      { idempotence: 'lumipix-tva-fr-20' },
    );
    id = cree.id;
  }
  cacheTva.set(cle, id);
  return id;
}

/** Paramètres de la session Stripe Checkout (fonction pure, testée dans scripts/tester-dessin.ts). */
export function parametresSession(recap: Recapitulatif, numero: string, site: string, idTva: string, origine: Origine): Parametres {
  const delai = recap.delai ?? { min: 1, max: 1 };
  const panier = recap.lignes.map((l) => `${l.produit.slug}:${l.variante.id}:${l.quantite}`).join(';');
  return {
    mode: 'payment',
    locale: 'fr',
    currency: 'eur',
    client_reference_id: numero,
    success_url: `${site}/commande/merci?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/panier`,
    line_items: recap.lignes.map((l) => ({
      quantity: l.quantite,
      tax_rates: [idTva],
      price_data: {
        currency: 'eur',
        unit_amount: centimes(l.variante.prix_ttc),
        tax_behavior: 'inclusive',
        product_data: {
          name: `${l.produit.nom} ${l.variante.nom}`,
          metadata: { produit: l.produit.slug, variante: l.variante.id },
        },
      },
    })),
    shipping_address_collection: { allowed_countries: [...BOUTIQUE.paysLivraison] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: recap.port === 0 ? 'Livraison offerte' : 'Livraison',
          fixed_amount: { amount: centimes(recap.port), currency: 'eur' },
          tax_behavior: 'inclusive',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: delai.min },
            maximum: { unit: 'business_day', value: delai.max },
          },
        },
      },
    ],
    phone_number_collection: { enabled: true },
    billing_address_collection: 'auto',
    customer_creation: 'always',
    allow_promotion_codes: true,
    consent_collection: { terms_of_service: 'required' },
    custom_text: {
      terms_of_service_acceptance: {
        message: `J’accepte les [conditions générales de vente](${site}/cgv) de ${SOCIETE.marque} et je reconnais être informé(e) de mon droit de rétractation de ${BOUTIQUE.delaiRetractationJours} jours.`,
      },
      shipping_address: { message: 'Livraison en France métropolitaine uniquement.' },
    },
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: `Commande ${numero}`,
        metadata: { numero },
        custom_fields: [{ name: 'N° TVA vendeur', value: SOCIETE.tvaIntracom }],
        footer: `${SOCIETE.raisonSociale}, ${SOCIETE.formeJuridique} au capital de ${SOCIETE.capital}. Siège : ${SOCIETE.adresseSiege}. ${SOCIETE.rcs}. TVA intracommunautaire ${SOCIETE.tvaIntracom}.`,
      },
    },
    payment_intent_data: { description: `Commande ${numero}`, metadata: { numero } },
    metadata: { numero, panier: panier.slice(0, 500), ...origine },
  };
}

export async function creerPaiement(request: Request, env: EnvPaiement, catalogue: ProduitServeur[]): Promise<Response> {
  const cle = env.STRIPE_SECRET_KEY;
  if (!cle) return json({ erreur: 'Le paiement est momentanément indisponible. Réessaie un peu plus tard.' }, 503);

  const site = new URL(request.url).origin;
  const provenance = request.headers.get('Origin');
  if (provenance && provenance !== site) return json({ erreur: 'Requête refusée.' }, 403);

  const brut = await request.text();
  if (brut.length > 10_000) return json({ erreur: 'Panier trop volumineux.' }, 413);
  let corps: any;
  try {
    corps = JSON.parse(brut);
  } catch {
    return json({ erreur: 'Requête invalide.' }, 400);
  }
  const lignes = lireLignes(corps?.lignes);
  if (!lignes) return json({ erreur: 'Panier invalide.' }, 400);

  const recap = calculerPanier(lignes, versArticles(catalogue), BOUTIQUE.seuilLivraisonGratuite);
  if (recap.retirees.length || !recap.lignes.length) {
    return json({ erreur: 'Un article de ton panier n’est plus disponible. Le panier a été mis à jour.', retirees: recap.retirees }, 409);
  }

  try {
    const numero = numeroCommande();
    const params = parametresSession(recap, numero, site, await tauxTva(cle), nettoyerOrigine(corps?.origine));
    const session = await appelStripe<{ url: string }>(cle, 'POST', 'checkout/sessions', params);
    return json({ url: session.url });
  } catch (e) {
    console.error('Création de la session Stripe impossible', e instanceof ErreurStripe ? e.detail : e);
    return json({ erreur: 'Le paiement n’a pas pu démarrer. Réessaie dans un instant.' }, 502);
  }
}

// --- Webhook ---

export async function webhookStripe(request: Request, env: EnvPaiement, catalogue: ProduitServeur[]): Promise<Response> {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET || !env.DB) {
    console.error('Webhook Stripe : configuration incomplète (clés ou base D1)');
    return json({ erreur: 'configuration' }, 500);
  }
  const corps = await request.text();
  if (!(await verifierSignature(corps, request.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET))) {
    return json({ erreur: 'signature invalide' }, 400);
  }
  const evenement = JSON.parse(corps) as { id: string; type: string; data: { object: any } };
  const db = env.DB;

  try {
    await preparerBase(db);
    const deja = await db.prepare('SELECT 1 FROM evenements_stripe WHERE id = ?').bind(evenement.id).first();
    if (deja) return json({ recu: true, deja_traite: true });

    const objet = evenement.data.object;
    switch (evenement.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await enregistrerCommande(db, env.STRIPE_SECRET_KEY, catalogue, objet.id);
        break;
      case 'checkout.session.async_payment_failed':
        console.warn(`Paiement différé échoué pour la session ${objet.id}`);
        break;
      case 'invoice.paid':
      case 'invoice.finalized':
        await enregistrerFacture(db, objet);
        break;
      case 'charge.refunded':
        await enregistrerRemboursement(db, objet);
        break;
    }

    await db
      .prepare('INSERT INTO evenements_stripe (id, type, traite_le) VALUES (?, ?, ?) ON CONFLICT (id) DO NOTHING')
      .bind(evenement.id, evenement.type, maintenant())
      .run();
    return json({ recu: true });
  } catch (e) {
    // 500 : Stripe renverra l'événement (nouvelles tentatives pendant 3 jours). Alerte email admin : phase 5.
    console.error(`Webhook Stripe en échec (${evenement.type} ${evenement.id})`, e instanceof ErreurStripe ? e.detail : e);
    return json({ erreur: 'traitement' }, 500);
  }
}

async function enregistrerCommande(db: D1Base, cle: string, catalogue: ProduitServeur[], idSession: string) {
  if (await db.prepare('SELECT 1 FROM commandes WHERE stripe_session_id = ?').bind(idSession).first()) return;

  const session = await appelStripe(cle, 'GET', `checkout/sessions/${idSession}`, { expand: ['invoice'] });
  if (session.payment_status !== 'paid') return; // paiement différé : on attend async_payment_succeeded
  const articles = await appelStripe<{ data: any[] }>(cle, 'GET', `checkout/sessions/${idSession}/line_items`, {
    limit: 100,
    expand: ['data.price.product'],
  });

  const meta = (session.metadata ?? {}) as Record<string, string>;
  const numero = meta.numero || session.client_reference_id || numeroCommande();
  const client = session.customer_details ?? {};
  const livraison = session.collected_information?.shipping_details ?? session.shipping_details ?? {};
  const adresse = livraison.address ?? {};
  const totaux = session.total_details ?? {};
  const facture = session.invoice && typeof session.invoice === 'object' ? session.invoice : null;
  const date = maintenant();
  const creeLe = session.created ? new Date(session.created * 1000).toISOString() : date;

  const requetes: D1Requete[] = [
    db
      .prepare(
        `INSERT INTO commandes (numero, stripe_session_id, stripe_payment_intent, stripe_customer, mode, statut,
          email, telephone, nom_client, livraison_nom, livraison_ligne1, livraison_ligne2, livraison_code_postal,
          livraison_ville, livraison_pays, sous_total, remise, port, tva, total, facture_id, facture_numero,
          facture_url, facture_pdf, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referent,
          page_arrivee, cree_le, payee_le)
         VALUES (?, ?, ?, ?, ?, 'payee', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        numero,
        idSession,
        typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null),
        typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? null),
        session.livemode ? 'live' : 'test',
        client.email ?? '',
        client.phone ?? null,
        client.name ?? null,
        livraison.name ?? null,
        adresse.line1 ?? null,
        adresse.line2 ?? null,
        adresse.postal_code ?? null,
        adresse.city ?? null,
        adresse.country ?? null,
        session.amount_subtotal ?? 0,
        totaux.amount_discount ?? 0,
        totaux.amount_shipping ?? 0,
        totaux.amount_tax ?? 0,
        session.amount_total ?? 0,
        facture?.id ?? (typeof session.invoice === 'string' ? session.invoice : null),
        facture?.number ?? null,
        facture?.hosted_invoice_url ?? null,
        facture?.invoice_pdf ?? null,
        meta.utm_source ?? null,
        meta.utm_medium ?? null,
        meta.utm_campaign ?? null,
        meta.utm_content ?? null,
        meta.utm_term ?? null,
        meta.referent ?? null,
        meta.page_arrivee ?? null,
        creeLe,
        date,
      ),
  ];

  // Une commande fournisseur par fournisseur (brief §6.5)
  const parFournisseur = new Map<string, string>();
  const idFournisseur = (nom: string) => {
    let id = parFournisseur.get(nom);
    if (!id) {
      id = `${numero}-F${parFournisseur.size + 1}`;
      parFournisseur.set(nom, id);
      requetes.push(
        db
          .prepare(`INSERT INTO commandes_fournisseur (id, commande, fournisseur, statut, cree_le) VALUES (?, ?, ?, ?, ?)`)
          .bind(id, numero, nom, nom === 'inconnu' ? 'probleme' : 'a_passer', date),
      );
    }
    return id;
  };

  for (const a of articles.data) {
    const metaProduit = (a.price?.product?.metadata ?? {}) as Record<string, string>;
    const produit = catalogue.find((p) => p.slug === metaProduit.produit);
    const variante = produit?.variantes.find((v) => v.id === metaProduit.variante);
    const quantite = a.quantity ?? 1;
    const cf = idFournisseur(produit && variante ? produit.fournisseur.nom : 'inconnu');
    requetes.push(
      db
        .prepare(
          `INSERT INTO lignes_commande (commande, commande_fournisseur, produit, variante, nom, quantite, prix_unitaire,
            total, tva, fournisseur_url, fournisseur_id_produit, fournisseur_id_variante, fournisseur_libelle,
            prix_achat_unitaire, port_achat)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          numero,
          cf,
          metaProduit.produit ?? '',
          metaProduit.variante ?? '',
          a.description ?? '',
          quantite,
          a.price?.unit_amount ?? Math.round((a.amount_total ?? 0) / quantite),
          a.amount_total ?? 0,
          a.amount_tax ?? 0,
          produit?.fournisseur.url ?? null,
          produit?.fournisseur.id_produit ?? null,
          variante?.fournisseur.id_variante ?? null,
          variante?.fournisseur.libelle ?? null,
          variante ? centimes(variante.fournisseur.prix_achat_ttc) : null,
          variante ? centimes(variante.fournisseur.port_achat) : null,
        ),
    );
  }

  try {
    await db.batch(requetes); // transaction : tout ou rien
  } catch (e) {
    // Deux livraisons simultanées du même événement : la seconde trouve la commande déjà écrite.
    if (await db.prepare('SELECT 1 FROM commandes WHERE stripe_session_id = ?').bind(idSession).first()) return;
    throw e;
  }
}

async function enregistrerFacture(db: D1Base, facture: any) {
  const numero = facture?.metadata?.numero;
  if (!numero) return;
  await db
    .prepare(
      `UPDATE commandes SET facture_id = ?, facture_numero = COALESCE(?, facture_numero),
        facture_url = COALESCE(?, facture_url), facture_pdf = COALESCE(?, facture_pdf) WHERE numero = ?`,
    )
    .bind(facture.id, facture.number ?? null, facture.hosted_invoice_url ?? null, facture.invoice_pdf ?? null, numero)
    .run();
}

async function enregistrerRemboursement(db: D1Base, paiement: any) {
  const intention = typeof paiement.payment_intent === 'string' ? paiement.payment_intent : paiement.payment_intent?.id;
  if (!intention) return;
  const rembourse = paiement.amount_refunded ?? 0;
  await db
    .prepare(
      `UPDATE commandes SET rembourse = ?,
        statut = CASE WHEN ? >= total THEN 'remboursee' WHEN ? > 0 THEN 'partiellement_remboursee' ELSE statut END
       WHERE stripe_payment_intent = ?`,
    )
    .bind(rembourse, rembourse, rembourse, intention)
    .run();
}

// --- Statut pour la page /commande/merci ---

export async function statutCommande(request: Request, env: EnvPaiement): Promise<Response> {
  const session = new URL(request.url).searchParams.get('session') ?? '';
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(session)) return json({ erreur: 'session invalide' }, 400);
  if (!env.DB) return json({ etat: 'en_attente' });
  await preparerBase(env.DB);
  const c = await env.DB.prepare('SELECT numero, total, email, statut FROM commandes WHERE stripe_session_id = ?')
    .bind(session)
    .first<{ numero: string; total: number; email: string; statut: string }>();
  if (!c) return json({ etat: 'en_attente' });
  return json({ etat: c.statut, numero: c.numero, total: c.total / 100, email: masquerEmail(c.email) });
}

/** noa.exemple@gmail.com → n•••••••e@gmail.com */
export function masquerEmail(email: string): string {
  const [local = '', domaine = ''] = email.split('@');
  if (local.length <= 2) return `${local[0] ?? ''}•@${domaine}`;
  return `${local[0]}${'•'.repeat(Math.min(local.length - 2, 8))}${local.at(-1)}@${domaine}`;
}

