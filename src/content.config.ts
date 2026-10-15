import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/*
 * Schémas du catalogue (brief §4).
 * Ajouter un produit = ajouter un fichier dans src/content/produits/.
 * Toute erreur de saisie fait échouer le build avec un message explicite.
 * Procédure complète : docs/AJOUTER-UN-PRODUIT.md
 */

const DOSSIER_MEDIAS = join(process.cwd(), 'assets', 'produits');

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug en minuscules, chiffres et tirets uniquement');

/** Montant en euros, au centime près (ex. 79.00). */
const montant = z
  .number()
  .nonnegative()
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'montant au centime près');

const media = z.strictObject({
  /** Nom du fichier dans assets/produits/[slug]/ (ex. "01-hero.jpg"). */
  src: z.string().min(1),
  alt: z.string().trim().min(1, 'texte alternatif obligatoire'),
  /** Fichier à afficher à la place de src quand cette variante est choisie (ex. { "32x32": "01-hero-32.jpg" }). */
  par_variante: z.record(z.string(), z.string().min(1)).optional(),
  /** Variantes pour lesquelles la photo est montrée (par défaut : toutes). */
  variantes: z.array(z.string()).min(1).optional(),
});

const video = z.strictObject({
  src: z.string().min(1),
  alt: z.string().trim().min(1, 'texte alternatif obligatoire'),
  poster: z.string().min(1).optional(),
});

const variante = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/i, 'identifiant de variante sans espace ni accent'),
  nom: z.string().min(1),
  /** Options libres, ex. { taille: "32 x 32", couleur: "noir" }. */
  options: z.record(z.string(), z.string()).optional(),
  /** Prix spécifique de la variante. Sinon, le prix du produit s'applique. */
  prix_ttc: montant.optional(),
  prix_barre_ttc: montant.optional(),
  disponible: z.boolean(),
});

const faq = z.strictObject({
  question: z.string().min(1),
  reponse: z.string().min(1),
});

const seo = z.strictObject({
  mot_cle_principal: z.string().min(1),
  mots_cles_secondaires: z.array(z.string().min(1)).default([]),
  title: z.string().min(1).max(70, 'title trop long (70 caractères max)'),
  meta_description: z.string().min(50).max(170, 'meta description trop longue (170 caractères max)'),
});

/*
 * Bloc fournisseur : JAMAIS exposé côté client.
 * Il n'est lu que par src/lib/catalogue.ts (qui le retire) et, plus tard,
 * par les fonctions serveur. scripts/verifier-build.ts fait échouer le build
 * si une de ces valeurs apparaît dans dist/.
 */
const varianteFournisseur = z.strictObject({
  /** Identifiant de la variante côté fournisseur (SKU), si connu. */
  id_variante: z.string().min(1).optional(),
  libelle_fournisseur: z.string().min(1),
  prix_achat_ttc: montant,
  /** Prix d'achat dégressif à partir de 2 pièces, si le fournisseur en propose un. */
  prix_achat_ttc_des_2: montant.optional(),
  port_achat: montant,
});

const fournisseur = z.strictObject({
  nom: z.string().min(1),
  url: z.url(),
  id_produit: z.string().min(1),
  /** Clé = id de la variante côté boutique. */
  variantes: z.record(z.string(), varianteFournisseur),
  limite_achat: z.string().optional(),
  note_vendeur: z.string().optional(),
  releve_le: z.iso.date().optional(),
  medias_sources: z
    .strictObject({
      galerie: z.array(z.string()),
      base_url: z.url(),
      usage: z.string(),
    })
    .optional(),
});

const produits = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/produits' }),
  schema: z
    .strictObject({
      id: slug,
      slug,
      statut: z.enum(['brouillon', 'actif', 'archive']),
      nom: z.string().min(1),
      sous_titre: z.string().min(1).optional(),
      collections: z.array(reference('collections')).min(1),
      type: z.enum(['simple', 'bundle']).default('simple'),
      /** Pour un bundle : produits existants qui le composent. */
      composants: z
        .array(z.strictObject({ produit: reference('produits'), quantite: z.number().int().positive() }))
        .optional(),

      /** Prix de vente TTC du produit. Facultatif si chaque variante a son propre prix. */
      prix_ttc: montant.optional(),
      prix_barre_ttc: montant.optional(),
      variantes: z.array(variante).min(1),
      /** Frais de port facturés au client pour ce produit, en euros TTC. */
      frais_de_port: montant,

      photos: z.array(media).default([]),
      videos: z.array(video).default([]),

      description_courte: z.string().min(1).optional(),
      specs: z.record(z.string(), z.string()).default({}),
      contenu_boite: z.array(z.string().min(1)).default([]),
      faq: z.array(faq).default([]),

      delai_livraison: z.strictObject({
        min_jours_ouvres: z.number().int().positive(),
        max_jours_ouvres: z.number().int().positive(),
      }),

      seo,
      produits_lies: z.array(reference('produits')).default([]),

      fournisseur,
    })
    .superRefine((p, ctx) => {
      if (p.id !== p.slug) {
        ctx.addIssue({ code: 'custom', path: ['id'], message: 'id et slug doivent être identiques' });
      }

      const ids = p.variantes.map((v) => v.id);
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({ code: 'custom', path: ['variantes'], message: 'identifiants de variante en double' });
      }

      p.variantes.forEach((v, i) => {
        if (v.prix_ttc === undefined && p.prix_ttc === undefined) {
          ctx.addIssue({
            code: 'custom',
            path: ['variantes', i, 'prix_ttc'],
            message: `variante "${v.id}" sans prix : renseigner prix_ttc sur la variante ou sur le produit`,
          });
        }
        if (!p.fournisseur.variantes[v.id]) {
          ctx.addIssue({
            code: 'custom',
            path: ['fournisseur', 'variantes'],
            message: `variante "${v.id}" sans correspondance fournisseur`,
          });
        }
      });
      for (const cle of Object.keys(p.fournisseur.variantes)) {
        if (!ids.includes(cle)) {
          ctx.addIssue({
            code: 'custom',
            path: ['fournisseur', 'variantes', cle],
            message: `variante fournisseur "${cle}" inconnue côté boutique`,
          });
        }
      }

      // Photos par variante : identifiants de variante existants
      p.photos.forEach((m, i) => {
        for (const [champ, cles] of [['par_variante', Object.keys(m.par_variante ?? {})], ['variantes', m.variantes ?? []]] as const) {
          for (const cle of cles) {
            if (!ids.includes(cle)) {
              ctx.addIssue({ code: 'custom', path: ['photos', i, champ], message: `variante "${cle}" inconnue` });
            }
          }
        }
      });

      if (p.delai_livraison.min_jours_ouvres > p.delai_livraison.max_jours_ouvres) {
        ctx.addIssue({ code: 'custom', path: ['delai_livraison'], message: 'min supérieur à max' });
      }

      if (p.type === 'bundle' && !p.composants?.length) {
        ctx.addIssue({ code: 'custom', path: ['composants'], message: 'un bundle doit référencer au moins un produit' });
      }
      if (p.type === 'simple' && p.composants?.length) {
        ctx.addIssue({ code: 'custom', path: ['composants'], message: 'composants réservés au type bundle' });
      }

      // Les médias doivent exister dans assets/produits/[slug]/
      const fichiers = [
        ...p.photos.flatMap((m, i) => [
          { f: m.src, path: ['photos', i, 'src'] },
          ...Object.entries(m.par_variante ?? {}).map(([v, f]) => ({ f, path: ['photos', i, 'par_variante', v] })),
        ]),
        ...p.videos.flatMap((m, i) => [
          { f: m.src, path: ['videos', i, 'src'] },
          ...(m.poster ? [{ f: m.poster, path: ['videos', i, 'poster'] }] : []),
        ]),
      ];
      for (const { f, path } of fichiers) {
        if (!existsSync(join(DOSSIER_MEDIAS, p.slug, f))) {
          ctx.addIssue({ code: 'custom', path, message: `fichier introuvable : assets/produits/${p.slug}/${f}` });
        }
      }

      // Un produit actif doit être complet côté client.
      if (p.statut === 'actif') {
        for (const champ of ['sous_titre', 'description_courte'] as const) {
          if (!p[champ]) {
            ctx.addIssue({ code: 'custom', path: [champ], message: `${champ} obligatoire pour un produit actif` });
          }
        }
      }
    }),
});

const collectionsBoutique = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/collections' }),
  schema: z.strictObject({
    slug,
    nom: z.string().min(1),
    description: z.string().min(1),
    visuel: media.optional(),
    ordre: z.number().int().default(0),
    seo,
  }),
});

/** Le corps Markdown d'une collection sert de texte SEO de la page. */
export const collections = { produits, collections: collectionsBoutique };
