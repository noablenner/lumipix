/*
 * Panier stocké dans le navigateur (brief §5). Il ne contient que des
 * identifiants et des quantités : les prix sont toujours recalculés côté
 * serveur au moment du paiement (phase 4).
 */
export interface LignePanier {
  produit: string;
  variante: string;
  quantite: number;
}

const CLE = 'lumipix:panier';
export const EVENEMENT_PANIER = 'lumipix:panier';

export function lirePanier(): LignePanier[] {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? '[]');
    return Array.isArray(brut)
      ? brut.filter((l) => typeof l?.produit === 'string' && typeof l?.variante === 'string' && Number.isInteger(l?.quantite) && l.quantite > 0)
      : [];
  } catch {
    return [];
  }
}

function ecrire(lignes: LignePanier[]) {
  try {
    localStorage.setItem(CLE, JSON.stringify(lignes));
  } catch {
    // stockage indisponible (navigation privée stricte) : le panier reste en mémoire pour la page
  }
  window.dispatchEvent(new CustomEvent(EVENEMENT_PANIER, { detail: lignes }));
}

export function ajouterAuPanier(produit: string, variante: string, quantite = 1): LignePanier[] {
  const lignes = lirePanier();
  const existante = lignes.find((l) => l.produit === produit && l.variante === variante);
  if (existante) existante.quantite = Math.min(10, existante.quantite + quantite);
  else lignes.push({ produit, variante, quantite });
  ecrire(lignes);
  return lignes;
}

export function nombreArticles(lignes = lirePanier()): number {
  return lignes.reduce((n, l) => n + l.quantite, 0);
}
