/*
 * Calcul du panier : fonctions pures, partagées entre la page /panier
 * (affichage) et, en phase 4, la fonction serveur qui crée la session Stripe
 * (qui recalcule tout à partir des fiches produit, jamais à partir du navigateur).
 */

export interface ArticleCatalogue {
  slug: string;
  nom: string;
  lien: string;
  image: string;
  frais_de_port: number;
  delai: { min: number; max: number };
  variantes: { id: string; nom: string; prix_ttc: number; disponible: boolean }[];
}

export interface LigneDemandee {
  produit: string;
  variante: string;
  quantite: number;
}

export interface LigneCalculee {
  produit: ArticleCatalogue;
  variante: ArticleCatalogue['variantes'][number];
  quantite: number;
  total: number;
}

export interface Recapitulatif {
  lignes: LigneCalculee[];
  /** Lignes du navigateur qui ne correspondent plus à un produit vendable. */
  retirees: LigneDemandee[];
  sousTotal: number;
  port: number;
  total: number;
  delai: { min: number; max: number } | null;
}

export const QUANTITE_MAX = 10;

const arrondi = (n: number) => Math.round(n * 100) / 100;

/**
 * Frais de port de la commande : le plus élevé des frais des produits du
 * panier (un seul envoi facturé au client), offerts au-delà du seuil de
 * livraison gratuite s'il est défini. Le cadre est à 0 €.
 */
export function calculerPanier(demandees: LigneDemandee[], catalogue: ArticleCatalogue[], seuilGratuit: number | null): Recapitulatif {
  const lignes: LigneCalculee[] = [];
  const retirees: LigneDemandee[] = [];
  for (const d of demandees) {
    const produit = catalogue.find((p) => p.slug === d.produit);
    const variante = produit?.variantes.find((v) => v.id === d.variante);
    if (!produit || !variante || !variante.disponible) {
      retirees.push(d);
      continue;
    }
    const quantite = Math.max(1, Math.min(QUANTITE_MAX, Math.floor(d.quantite)));
    // une même variante en double (panier modifié à la main, deux onglets) est fusionnée
    const doublon = lignes.find((l) => l.produit === produit && l.variante === variante);
    if (doublon) {
      doublon.quantite = Math.min(QUANTITE_MAX, doublon.quantite + quantite);
      doublon.total = arrondi(variante.prix_ttc * doublon.quantite);
      continue;
    }
    lignes.push({ produit, variante, quantite, total: arrondi(variante.prix_ttc * quantite) });
  }
  const sousTotal = arrondi(lignes.reduce((s, l) => s + l.total, 0));
  const portBrut = lignes.length ? Math.max(...lignes.map((l) => l.produit.frais_de_port)) : 0;
  const port = seuilGratuit !== null && sousTotal >= seuilGratuit ? 0 : portBrut;
  const delai = lignes.length
    ? { min: Math.max(...lignes.map((l) => l.produit.delai.min)), max: Math.max(...lignes.map((l) => l.produit.delai.max)) }
    : null;
  return { lignes, retirees, sousTotal, port, total: arrondi(sousTotal + port), delai };
}
