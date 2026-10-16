/*
 * Tests du paiement (phase 4), lancés à chaque build : node --no-warnings scripts/tester-paiement.ts
 * - base D1 simulée par SQLite (node:sqlite) : le vrai schéma et les vraies requêtes SQL sont exécutés ;
 * - API Stripe simulée (fetch intercepté) : on vérifie ce qui lui est envoyé et ce qui est enregistré.
 */
import { DatabaseSync } from 'node:sqlite';
import { creerPaiement, masquerEmail, statutCommande, webhookStripe, type D1Base, type D1Requete } from '../src/serveur/commandes.ts';
import { encoderFormulaire, signer, verifierSignature } from '../src/serveur/stripe.ts';
import type { ProduitServeur } from '../src/serveur/catalogue.ts';
import { CATALOGUE } from '../src/serveur/catalogue.genere.ts';

let echecs = 0;
const verifier = (ok: unknown, message: string) => {
  if (!ok) {
    echecs++;
    console.error(`  ✗ ${message}`);
  }
};

// --- D1 simulée ---
function baseD1(): { db: D1Base; sqlite: DatabaseSync } {
  const sqlite = new DatabaseSync(':memory:');
  const requete = (sql: string, valeurs: unknown[] = []): D1Requete => ({
    bind: (...v) => requete(sql, v),
    first: async <T,>() => (sqlite.prepare(sql).get(...(valeurs as any[])) ?? null) as T | null,
    all: async <T,>() => ({ results: sqlite.prepare(sql).all(...(valeurs as any[])) as T[] }),
    run: async () => ({ meta: { changes: Number(sqlite.prepare(sql).run(...(valeurs as any[])).changes) } }),
    // exécution brute pour batch
    ...({ _sql: sql, _v: valeurs } as object),
  });
  const db: D1Base = {
    prepare: (sql) => requete(sql),
    batch: async (rs) => {
      sqlite.exec('BEGIN');
      try {
        const res = rs.map((r: any) => sqlite.prepare(r._sql).run(...r._v));
        sqlite.exec('COMMIT');
        return res;
      } catch (e) {
        sqlite.exec('ROLLBACK');
        throw e;
      }
    },
  };
  return { db, sqlite };
}

// --- Stripe simulé ---
const appels: { methode: string; chemin: string; corps: URLSearchParams }[] = [];
const sessions = new Map<string, any>();
let taxRates: any[] = [];
const fetchOrigine = globalThis.fetch;
globalThis.fetch = (async (entree: string | URL | Request, init?: RequestInit) => {
  const url = new URL(String(entree));
  if (url.hostname !== 'api.stripe.com') return fetchOrigine(entree, init);
  const methode = init?.method ?? 'GET';
  const corps = new URLSearchParams(methode === 'POST' ? String(init?.body ?? '') : url.search.slice(1));
  appels.push({ methode, chemin: url.pathname, corps });
  const ok = (d: unknown) => new Response(JSON.stringify(d), { status: 200 });
  if (url.pathname === '/v1/tax_rates' && methode === 'GET') return ok({ data: taxRates });
  if (url.pathname === '/v1/tax_rates' && methode === 'POST') {
    const t = { id: 'txr_test', metadata: { lumipix: corps.get('metadata[lumipix]') } };
    taxRates.push(t);
    return ok(t);
  }
  if (url.pathname === '/v1/checkout/sessions' && methode === 'POST') return ok({ id: 'cs_test_nouvelle', url: 'https://checkout.stripe.com/c/pay/cs_test_nouvelle' });
  let m = url.pathname.match(/^\/v1\/checkout\/sessions\/([^/]+)\/line_items$/);
  if (m) return ok({ data: sessions.get(m[1]!)?.articles ?? [] });
  m = url.pathname.match(/^\/v1\/checkout\/sessions\/([^/]+)$/);
  if (m && sessions.has(m[1]!)) return ok(sessions.get(m[1]!).session);
  return new Response(JSON.stringify({ error: { message: 'introuvable' } }), { status: 404 });
}) as typeof fetch;

const catalogue: ProduitServeur[] = [
  {
    slug: 'cadre',
    nom: 'Cadre',
    vendable: true,
    frais_de_port: 0,
    delai: { min: 5, max: 10 },
    fournisseur: { nom: 'Fournisseur A', url: 'https://fournisseur.example/a', id_produit: 'A1' },
    variantes: [
      { id: '32x32', nom: '32 x 32', prix_ttc: 79, disponible: true, fournisseur: { libelle: 'A 32', id_variante: null, prix_achat_ttc: 37.59, port_achat: 0 } },
      { id: '64x64', nom: '64 x 64', prix_ttc: 149, disponible: true, fournisseur: { libelle: 'A 64', id_variante: 'SKU64', prix_achat_ttc: 86.69, port_achat: 0 } },
    ],
  },
  {
    slug: 'lampe',
    nom: 'Lampe',
    vendable: true,
    frais_de_port: 4.9,
    delai: { min: 7, max: 15 },
    fournisseur: { nom: 'Fournisseur B', url: 'https://fournisseur.example/b', id_produit: 'B1' },
    variantes: [{ id: 'unique', nom: 'Unique', prix_ttc: 25, disponible: true, fournisseur: { libelle: 'B', id_variante: null, prix_achat_ttc: 9, port_achat: 2 } }],
  },
  { slug: 'brouillon', nom: 'Brouillon', vendable: false, frais_de_port: 0, delai: { min: 1, max: 2 }, fournisseur: { nom: 'C', url: 'https://c.example', id_produit: 'C' }, variantes: [{ id: 'u', nom: 'U', prix_ttc: 10, disponible: true, fournisseur: { libelle: 'C', id_variante: null, prix_achat_ttc: 1, port_achat: 0 } }] },
];

const SITE = 'https://lumipix.shop';
const checkout = (corps: unknown, env: object = { STRIPE_SECRET_KEY: 'sk_test_x' }, origin = SITE) =>
  creerPaiement(
    new Request(`${SITE}/api/checkout`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(corps) }),
    env,
    catalogue,
  );

// --- Encodage et signature ---
verifier(encoderFormulaire({ a: { b: [1, 'x y'] }, c: undefined, d: true }) === 'a%5Bb%5D%5B0%5D=1&a%5Bb%5D%5B1%5D=x+y&d=true', 'encodage formulaire Stripe');
{
  const t = Math.floor(Date.now() / 1000);
  const sig = await signer('whsec_a', `${t}.{"x":1}`);
  verifier(await verifierSignature('{"x":1}', `t=${t},v1=${sig}`, 'whsec_a'), 'signature valide acceptée');
  verifier(await verifierSignature('{"x":1}', `t=${t},v1=deadbeef,v1=${sig}`, 'whsec_a'), 'signature parmi plusieurs v1');
  verifier(!(await verifierSignature('{"x":2}', `t=${t},v1=${sig}`, 'whsec_a')), 'corps modifié refusé');
  verifier(!(await verifierSignature('{"x":1}', `t=${t},v1=${sig}`, 'whsec_b')), 'mauvais secret refusé');
  verifier(!(await verifierSignature('{"x":1}', `t=${t - 600},v1=${await signer('whsec_a', `${t - 600}.{"x":1}`)}`, 'whsec_a')), 'horodatage trop ancien refusé');
  verifier(!(await verifierSignature('{"x":1}', null, 'whsec_a')), 'en-tête absent refusé');
}

// --- Création de session ---
verifier((await checkout({ lignes: [{ produit: 'cadre', variante: '32x32', quantite: 1 }] }, {})).status === 503, 'sans clé Stripe : 503');
verifier((await checkout({ lignes: [{ produit: 'cadre', variante: '32x32', quantite: 1 }] }, undefined, 'https://pirate.example')).status === 403, 'autre origine refusée');
verifier((await checkout({ lignes: [] })).status === 400, 'panier vide refusé');
verifier((await checkout({ lignes: [{ produit: 'cadre', variante: '32x32', quantite: 0 }] })).status === 400, 'quantité 0 refusée');
verifier((await checkout({ lignes: [{ produit: 'cadre', variante: '32x32', quantite: 11 }] })).status === 400, 'quantité au-delà du maximum refusée');
verifier((await checkout({ lignes: [{ produit: 'brouillon', variante: 'u', quantite: 1 }] })).status === 409, 'produit non vendable : 409');
verifier((await checkout({ lignes: [{ produit: 'cadre', variante: '128x128', quantite: 1 }] })).status === 409, 'variante inconnue : 409');
verifier(appels.length === 0, 'aucun appel Stripe pour un panier refusé');

{
  const r = await checkout({
    lignes: [
      { produit: 'cadre', variante: '32x32', quantite: 2, prix_ttc: 1 },
      { produit: 'lampe', variante: 'unique', quantite: 1 },
    ],
    origine: { utm_source: 'tiktok', utm_campaign: 'lancement', referent: 'https://www.tiktok.com/', inconnu: 'x' },
  });
  const corps = (await r.json()) as { url: string };
  verifier(r.status === 200 && corps.url.startsWith('https://checkout.stripe.com/'), 'session créée, URL Stripe renvoyée');
  const s = appels.find((a) => a.chemin === '/v1/checkout/sessions')!.corps;
  verifier(s.get('line_items[0][price_data][unit_amount]') === '7900', 'prix recalculé depuis le catalogue (prix du navigateur ignoré)');
  verifier(s.get('line_items[0][quantity]') === '2' && s.get('line_items[1][price_data][unit_amount]') === '2500', 'quantités et seconde ligne');
  verifier(s.get('line_items[0][tax_rates][0]') === 'txr_test' && s.get('line_items[0][price_data][tax_behavior]') === 'inclusive', 'TVA 20 % incluse');
  verifier(s.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]') === '490', 'frais de port du catalogue');
  verifier(s.get('shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]') === '15', 'délai affiché avant paiement');
  verifier(s.get('shipping_address_collection[allowed_countries][0]') === 'FR' && !s.has('shipping_address_collection[allowed_countries][1]'), 'livraison France uniquement');
  verifier(s.get('phone_number_collection[enabled]') === 'true', 'téléphone obligatoire');
  verifier(s.get('consent_collection[terms_of_service]') === 'required', 'acceptation des CGV obligatoire');
  verifier(s.get('allow_promotion_codes') === 'true', 'codes promo activés');
  verifier(s.get('invoice_creation[enabled]') === 'true' && s.get('invoice_creation[invoice_data][custom_fields][0][value]') === 'FR31898741640', 'facture avec numéro de TVA');
  verifier(s.get('metadata[utm_source]') === 'tiktok' && s.get('metadata[referent]') === 'https://www.tiktok.com/' && !s.has('metadata[inconnu]'), 'UTM transmis, champs inconnus ignorés');
  verifier(s.get('metadata[panier]') === 'cadre:32x32:2;lampe:unique:1', 'panier en métadonnées');
  verifier(/^LPX-[0-9A-Z]{8}$/.test(s.get('metadata[numero]') ?? '') && s.get('client_reference_id') === s.get('metadata[numero]'), 'numéro de commande');
  verifier(s.get('success_url') === `${SITE}/commande/merci?session_id={CHECKOUT_SESSION_ID}`, 'URL de retour');
  verifier(!s.has('customer_email') && ![...s.values()].some((v) => v.includes('fournisseur.example')), 'aucune donnée fournisseur envoyée à Stripe');
  await checkout({ lignes: [{ produit: 'cadre', variante: '64x64', quantite: 1 }] });
  verifier(appels.filter((a) => a.chemin === '/v1/tax_rates' && a.methode === 'POST').length === 1, 'taux de TVA créé une seule fois');
}

// --- Webhook ---
const { db, sqlite } = baseD1();
const env = { DB: db, STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: 'whsec_test' };
const evenement = async (id: string, type: string, objet: unknown, secret = 'whsec_test') => {
  const corps = JSON.stringify({ id, type, data: { object: objet } });
  const t = Math.floor(Date.now() / 1000);
  const r = await webhookStripe(
    new Request(`${SITE}/api/stripe/webhook`, { method: 'POST', headers: { 'Stripe-Signature': `t=${t},v1=${await signer(secret, `${t}.${corps}`)}` }, body: corps }),
    env,
    catalogue,
  );
  return { statut: r.status, corps: (await r.json()) as Record<string, unknown> };
};
const ligneStripe = (produit: string, variante: string, quantite: number, unitaire: number, description: string) => ({
  quantity: quantite,
  description,
  amount_total: unitaire * quantite,
  amount_tax: Math.round((unitaire * quantite) / 6),
  price: { unit_amount: unitaire, product: { metadata: { produit, variante } } },
});
sessions.set('cs_test_payee1234567', {
  session: {
    id: 'cs_test_payee1234567',
    payment_status: 'paid',
    livemode: false,
    created: 1760000000,
    client_reference_id: 'LPX-AAAA1111',
    metadata: { numero: 'LPX-AAAA1111', utm_source: 'tiktok', utm_campaign: 'lancement' },
    payment_intent: 'pi_1',
    customer: 'cus_1',
    customer_details: { email: 'client.test@example.com', phone: '+33600000000', name: 'Client Test' },
    collected_information: { shipping_details: { name: 'Client Test', address: { line1: '1 rue Exemple', postal_code: '75001', city: 'Paris', country: 'FR' } } },
    amount_subtotal: 18300,
    amount_total: 18300,
    total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 3050 },
    invoice: { id: 'in_1', number: 'LUMI-0001', hosted_invoice_url: 'https://invoice.stripe.com/i/1', invoice_pdf: 'https://pay.stripe.com/invoice/1/pdf' },
  },
  articles: [ligneStripe('cadre', '64x64', 1, 14900, 'Cadre 64 x 64'), ligneStripe('lampe', 'unique', 1, 2500, 'Lampe Unique'), ligneStripe('cadre', '32x32', 0 || 1, 7900, 'Cadre 32 x 32')],
});
sessions.set('cs_test_attente12345', { session: { id: 'cs_test_attente12345', payment_status: 'unpaid', metadata: {} }, articles: [] });

verifier((await evenement('evt_0', 'checkout.session.completed', { id: 'cs_test_payee1234567' }, 'whsec_autre')).statut === 400, 'webhook : mauvaise signature refusée');
verifier(!sqlite.prepare("SELECT name FROM sqlite_master WHERE name = 'commandes'").get(), 'webhook refusé : base non touchée');

const r1 = await evenement('evt_1', 'checkout.session.completed', { id: 'cs_test_payee1234567' });
verifier(r1.statut === 200, 'webhook : commande payée acceptée');
const cmd = sqlite.prepare('SELECT * FROM commandes').all() as any[];
verifier(cmd.length === 1 && cmd[0].numero === 'LPX-AAAA1111' && cmd[0].statut === 'payee' && cmd[0].mode === 'test', 'commande enregistrée');
verifier(cmd[0].total === 18300 && cmd[0].tva === 3050 && cmd[0].livraison_ville === 'Paris' && cmd[0].telephone === '+33600000000', 'montants, adresse et téléphone');
verifier(cmd[0].utm_source === 'tiktok' && cmd[0].facture_url === 'https://invoice.stripe.com/i/1', 'source UTM et facture');
const lignes = sqlite.prepare('SELECT * FROM lignes_commande ORDER BY id').all() as any[];
verifier(lignes.length === 3 && lignes[0].prix_achat_unitaire === 8669 && lignes[0].fournisseur_id_variante === 'SKU64', 'lignes avec données fournisseur');
const cf = sqlite.prepare('SELECT * FROM commandes_fournisseur ORDER BY id').all() as any[];
verifier(cf.length === 2 && cf.every((c) => c.statut === 'a_passer'), 'une commande fournisseur par fournisseur, statut « à passer »');
verifier(lignes[0].commande_fournisseur === lignes[2].commande_fournisseur && lignes[0].commande_fournisseur !== lignes[1].commande_fournisseur, 'lignes rattachées au bon fournisseur');

const r2 = await evenement('evt_1', 'checkout.session.completed', { id: 'cs_test_payee1234567' });
verifier(r2.statut === 200 && r2.corps.deja_traite === true, 'webhook rejoué : ignoré');
await evenement('evt_2', 'checkout.session.async_payment_succeeded', { id: 'cs_test_payee1234567' });
verifier((sqlite.prepare('SELECT COUNT(*) AS n FROM commandes').get() as any).n === 1 && (sqlite.prepare('SELECT COUNT(*) AS n FROM lignes_commande').get() as any).n === 3, 'même session, autre événement : pas de doublon');

await evenement('evt_3', 'checkout.session.completed', { id: 'cs_test_attente12345' });
verifier((sqlite.prepare('SELECT COUNT(*) AS n FROM commandes').get() as any).n === 1, 'paiement non encore reçu : pas de commande');

const appelsAvant = appels.length;
const r4 = await evenement('evt_4', 'checkout.session.completed', { id: 'cs_test_inconnue1234' });
verifier(r4.statut === 500 && appels.length > appelsAvant, 'erreur Stripe : 500 pour que Stripe renvoie l’événement');
verifier(!sqlite.prepare("SELECT 1 FROM evenements_stripe WHERE id = 'evt_4'").get(), 'événement en échec non marqué traité');

await evenement('evt_5', 'invoice.paid', { id: 'in_2', number: 'LUMI-0002', hosted_invoice_url: 'https://invoice.stripe.com/i/2', metadata: { numero: 'LPX-AAAA1111' } });
verifier((sqlite.prepare('SELECT facture_numero FROM commandes').get() as any).facture_numero === 'LUMI-0002', 'facture mise à jour');

await evenement('evt_6', 'charge.refunded', { payment_intent: 'pi_1', amount: 18300, amount_refunded: 2500 });
verifier((sqlite.prepare('SELECT statut, rembourse FROM commandes').get() as any).statut === 'partiellement_remboursee', 'remboursement partiel');
await evenement('evt_7', 'charge.refunded', { payment_intent: 'pi_1', amount: 18300, amount_refunded: 18300 });
verifier((sqlite.prepare('SELECT statut FROM commandes').get() as any).statut === 'remboursee', 'remboursement total');

// --- Statut pour /commande/merci ---
const statut = async (session: string) => (await statutCommande(new Request(`${SITE}/api/commande/statut?session=${session}`), env)).json() as Promise<any>;
const s1 = await statut('cs_test_payee1234567');
verifier(s1.numero === 'LPX-AAAA1111' && s1.email === 'c••••••••t@example.com' && !JSON.stringify(s1).includes('Paris'), 'statut : numéro et email masqué, rien de plus');
verifier((await statut('cs_test_attente12345')).etat === 'en_attente', 'statut : commande pas encore enregistrée');
verifier((await statutCommande(new Request(`${SITE}/api/commande/statut?session=x' OR 1=1`), env)).status === 400, 'statut : identifiant invalide refusé');
verifier(masquerEmail('ab@x.fr') === 'a•@x.fr', 'masquage email court');

// --- Catalogue généré ---
verifier(CATALOGUE.length > 0 && CATALOGUE.every((p) => p.variantes.every((v) => v.prix_ttc > 0 && v.fournisseur.libelle)), 'catalogue serveur généré et complet');

globalThis.fetch = fetchOrigine;
if (echecs) {
  console.error(`✗ Tests du paiement : ${echecs} échec(s)`);
  process.exit(1);
}
console.log('✓ Tests du paiement : session Stripe, webhook signé et idempotent, enregistrement D1, statut');
