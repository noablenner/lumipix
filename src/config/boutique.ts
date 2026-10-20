/*
 * Paramètres commerciaux de la boutique (hors données société).
 */

export const BOUTIQUE = {
  /** Slug du produit phare mis en avant partout (accueil, navigation, 404). */
  produitPhare: 'cadre-pixel-art-led',
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
  /**
   * Google Analytics 4 (dépose des cookies) : chargé UNIQUEMENT après accord
   * du visiteur dans le bandeau de consentement. null = désactivé.
   */
  googleAnalytics: 'G-946R13FWHX' as string | null,
  /** Délai légal de rétractation, en jours. */
  delaiRetractationJours: 14,
} as const;
