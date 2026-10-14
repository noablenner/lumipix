/*
 * Paramètres commerciaux de la boutique (hors données société).
 */

export const BOUTIQUE = {
  devise: 'EUR',
  locale: 'fr-FR',
  /** Livraison en France métropolitaine uniquement au lancement. */
  paysLivraison: ['FR'] as const,
  /**
   * [SEUIL_LIVRAISON_GRATUITE] : montant TTC au-delà duquel la livraison est
   * offerte pour les futurs produits payants en port. null = pas de seuil.
   * Le cadre est déjà livré gratuitement (frais_de_port: 0 dans sa fiche).
   */
  seuilLivraisonGratuite: null as number | null,
  /** Délai légal de rétractation, en jours. */
  delaiRetractationJours: 14,
} as const;
