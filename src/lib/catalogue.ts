import { getCollection, type CollectionEntry } from 'astro:content';

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

export async function getProduitsActifs(): Promise<ProduitPublic[]> {
  const entrees = await getCollection('produits', ({ data }) => data.statut === 'actif');
  return entrees.map(versPublic);
}

/** Tous les produits sauf les archivés : réservé à la page de démonstration du design system. */
export async function getProduitsPourDemo(): Promise<ProduitPublic[]> {
  const entrees = await getCollection('produits', ({ data }) => data.statut !== 'archive');
  return entrees.map(versPublic);
}

/**
 * Collections affichables : uniquement celles qui contiennent au moins un
 * produit actif (brief §1, pas de catégorie fantôme).
 */
export async function getCollectionsVisibles(): Promise<CollectionEntry<'collections'>[]> {
  const [toutes, actifs] = await Promise.all([getCollection('collections'), getProduitsActifs()]);
  const utilisees = new Set(actifs.flatMap((p) => p.collections.map((c) => c.id)));
  return toutes.filter((c) => utilisees.has(c.id)).sort((a, b) => a.data.ordre - b.data.ordre);
}
