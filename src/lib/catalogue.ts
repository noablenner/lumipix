import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { BOUTIQUE } from '../config/boutique';
import { estPrevisualisation, lien } from './routes';

/*
 * Accès au catalogue pour les pages publiques.
 * RÈGLE : une page ou un composant ne lit jamais getCollection('produits')
 * directement, il passe par ces fonctions qui retirent le bloc fournisseur.
 */

type DonneesProduit = CollectionEntry<'produits'>['data'];

export type ProduitPublic = Omit<DonneesProduit, 'fournisseur'>;
export type VariantePublique = ProduitPublic['variantes'][number] & { prix_ttc: number };

/** Copie du produit sans le bloc fournisseur. */
export function versPublic(entree: CollectionEntry<'produits'>): ProduitPublic {
  const { fournisseur: _retire, ...publique } = entree.data;
  return publique;
}

/** Variantes avec leur prix effectif (prix de la variante, sinon prix du produit). */
export function variantesAvecPrix(produit: ProduitPublic): VariantePublique[] {
  return produit.variantes.map((v) => ({ ...v, prix_ttc: (v.prix_ttc ?? produit.prix_ttc) as number }));
}

/** Prix le plus bas parmi les variantes disponibles (ou toutes, si aucune ne l'est). */
export function prixAPartirDe(produit: ProduitPublic): number {
  const variantes = variantesAvecPrix(produit);
  const dispo = variantes.filter((v) => v.disponible);
  return Math.min(...(dispo.length ? dispo : variantes).map((v) => v.prix_ttc));
}

/**
 * Les brouillons sont publiés uniquement en développement et sur la
 * prévisualisation GitHub Pages (en noindex, avec un bandeau « brouillon »).
 * En production, seuls les produits actifs existent.
 */
export const BROUILLONS_VISIBLES = import.meta.env.DEV || estPrevisualisation;

function estPublie(statut: DonneesProduit['statut']): boolean {
  return statut === 'actif' || (statut === 'brouillon' && BROUILLONS_VISIBLES);
}

/** Produits qui ont une page sur le site. */
export async function getProduitsPublies(): Promise<ProduitPublic[]> {
  const entrees = await getCollection('produits', ({ data }) => estPublie(data.statut));
  return entrees.map(versPublic);
}

/** Produit phare (le cadre), ou null s'il n'est pas publié. */
export async function getProduitPhare(): Promise<ProduitPublic | null> {
  const entree = await getEntry('produits', BOUTIQUE.produitPhare);
  return entree && estPublie(entree.data.statut) ? versPublic(entree) : null;
}

export function lienProduit(produit: Pick<ProduitPublic, 'slug'>, variante?: string): string {
  return lien(`/produits/${produit.slug}`) + (variante ? `?variante=${encodeURIComponent(variante)}` : '');
}

/** Caractéristiques affichables : celles qui restent à vérifier ne sont jamais montrées au client. */
export function specsPubliques(produit: ProduitPublic): [string, string][] {
  return Object.entries(produit.specs).filter(([, valeur]) => !/\[[^\]]*\]|a verifier|à vérifier|à obtenir/i.test(valeur));
}

/** Tous les produits sauf les archivés : réservé à la page de démonstration du design system. */
export async function getProduitsPourDemo(): Promise<ProduitPublic[]> {
  const entrees = await getCollection('produits', ({ data }) => data.statut !== 'archive');
  return entrees.map(versPublic);
}

/** Produits publiés d'une collection. */
export async function getProduitsDeCollection(slug: string): Promise<ProduitPublic[]> {
  return (await getProduitsPublies()).filter((p) => p.collections.some((c) => c.id === slug));
}

/**
 * Collections affichables : uniquement celles qui contiennent au moins un
 * produit publié (brief §1, pas de catégorie fantôme).
 */
export async function getCollectionsVisibles(): Promise<CollectionEntry<'collections'>[]> {
  const [toutes, actifs] = await Promise.all([getCollection('collections'), getProduitsPublies()]);
  const utilisees = new Set(actifs.flatMap((p) => p.collections.map((c) => c.id)));
  return toutes.filter((c) => utilisees.has(c.id)).sort((a, b) => a.data.ordre - b.data.ordre);
}
