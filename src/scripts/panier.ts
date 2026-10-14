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

import { QUANTITE_MAX } from '../lib/panier-calcul';

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

export function ecrirePanier(lignes: LignePanier[]) {
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
  if (existante) existante.quantite = Math.min(QUANTITE_MAX, existante.quantite + quantite);
  else lignes.push({ produit, variante, quantite });
  ecrirePanier(lignes);
  return lignes;
}

export function nombreArticles(lignes = lirePanier()): number {
  return lignes.reduce((n, l) => n + l.quantite, 0);
}

/** Change la quantité d'une ligne (0 la retire). */
export function changerQuantite(produit: string, variante: string, quantite: number): LignePanier[] {
  const lignes = lirePanier()
    .map((l) => (l.produit === produit && l.variante === variante ? { ...l, quantite: Math.min(QUANTITE_MAX, Math.max(0, Math.floor(quantite))) } : l))
    .filter((l) => l.quantite > 0);
  ecrirePanier(lignes);
  return lignes;
}
