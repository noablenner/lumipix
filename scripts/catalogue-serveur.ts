/*
 * Génère src/serveur/catalogue.genere.ts à partir des fiches produit, pour le
 * Worker (recalcul des prix au paiement, rattachement des lignes au fournisseur).
 * Lancé en tête de npm run build. Le schéma complet est validé ensuite par Astro.
 *
 * Vendable : statut « actif », ou « brouillon » hors production
 * (CIBLE_DEPLOIEMENT=preprod), comme les pages du site.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { ProduitServeur } from '../src/serveur/catalogue.ts';

const RACINE = join(import.meta.dirname, '..');
const DOSSIER = join(RACINE, 'src/content/produits');
const cible = process.env.CIBLE_DEPLOIEMENT || 'production';

const produits: ProduitServeur[] = readdirSync(DOSSIER)
  .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
  .map((f) => {
    const fm = readFileSync(join(DOSSIER, f), 'utf8').match(/^---\n([\s\S]*?)\n---/);
    if (!fm) throw new Error(`${f} : en-tête YAML introuvable`);
    const p = parse(fm[1]!);
    return {
      slug: p.slug,
      nom: p.nom,
      vendable: p.statut === 'actif' || (p.statut === 'brouillon' && cible !== 'production'),
      frais_de_port: p.frais_de_port,
      delai: { min: p.delai_livraison.min_jours_ouvres, max: p.delai_livraison.max_jours_ouvres },
      variantes: p.variantes.map((v: any) => {
        const fv = p.fournisseur.variantes[v.id];
        if (!fv) throw new Error(`${f} : variante fournisseur « ${v.id} » manquante`);
        return {
          id: v.id,
          nom: v.nom,
          prix_ttc: v.prix_ttc ?? p.prix_ttc,
          disponible: v.disponible,
          fournisseur: {
            libelle: fv.libelle_fournisseur,
            id_variante: fv.id_variante ?? null,
            prix_achat_ttc: fv.prix_achat_ttc,
            port_achat: fv.port_achat,
          },
        };
      }),
      fournisseur: { nom: p.fournisseur.nom, url: p.fournisseur.url, id_produit: String(p.fournisseur.id_produit) },
    };
  });

for (const p of produits) {
  for (const v of p.variantes) {
    if (typeof v.prix_ttc !== 'number' || !(v.prix_ttc > 0)) throw new Error(`${p.slug} / ${v.id} : prix invalide`);
  }
}

writeFileSync(
  join(RACINE, 'src/serveur/catalogue.genere.ts'),
  `// Généré par scripts/catalogue-serveur.ts (cible : ${cible}). Ne pas modifier, ne pas commiter.\n` +
    `import type { ProduitServeur } from './catalogue.ts';\n\n` +
    `export const CATALOGUE: ProduitServeur[] = ${JSON.stringify(produits, null, 2)};\n`,
);
console.log(`✓ Catalogue serveur : ${produits.filter((p) => p.vendable).length} produit(s) vendable(s) sur ${produits.length} (cible ${cible})`);
