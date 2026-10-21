/*
 * SOURCE UNIQUE des informations sur la société (brief §9 et §10).
 * Aucune autre partie du code ne doit écrire ces valeurs en dur.
 *
 * Règles de confidentialité (brief §10), vérifiées par scripts/verifier-build.ts :
 * - directeurPublication : UNIQUEMENT dans la page /mentions-legales.
 * - adresseSiege : UNIQUEMENT dans /mentions-legales, /cgv et les factures.
 *   Jamais comme adresse de retour.
 * - adresseRetours : jamais publiée sur le site, communiquée au client
 *   seulement après validation de sa demande de retour.
 *
 * Les valeurs entre crochets sont des placeholders listés dans TODO.md.
 */

export const SOCIETE = {
  marque: 'Lumipix',
  domaine: 'lumipix.shop',
  urlSite: 'https://lumipix.shop',

  raisonSociale: 'EROS',
  formeJuridique: 'SASU (société par actions simplifiée unipersonnelle)',
  capital: '100 €',
  /** [SOCIETE_ADRESSE_SIEGE] : peut changer en cas de domiciliation. */
  adresseSiege: '53 avenue de Colmar, 68200 Mulhouse',
  siren: '898 741 640',
  siretSiege: '898 741 640 00038',
  rcs: '898 741 640 R.C.S. Mulhouse',
  tvaIntracom: 'FR31898741640',
  codeApe: '47.91A',

  /** [DIRECTEUR_PUBLICATION] : nom du président, mentions légales uniquement. */
  directeurPublication: '[DIRECTEUR_PUBLICATION]',
  /**
   * Email de contact (obligatoire légalement), affiché UNIQUEMENT sur les pages
   * légales : mentions légales, CGV, retours, confidentialité (garde-fou du build).
   */
  emailContact: 'clumipix@gmail.com',
  /** [ADRESSE_RETOURS] : jamais affichée publiquement. */
  adresseRetours: '[ADRESSE_RETOURS]',
  /** [MEDIATEUR_CONSO] : nom, adresse et site du médiateur de la consommation. */
  mediateurConso: '[MEDIATEUR_CONSO]',
  /** [IDENTIFIANT_UNIQUE_REP] : identifiant unique de la filière REP (équipements électriques et électroniques). */
  identifiantUniqueRep: '[IDENTIFIANT_UNIQUE_REP]',

  /** À vérifier au moment de la mise en ligne. */
  hebergeur: {
    nom: 'Cloudflare, Inc.',
    adresse: '101 Townsend St, San Francisco, CA 94107, États-Unis',
  },

  tauxTva: 0.2,
} as const;

/** Vrai si la valeur est encore un placeholder du type [XXX]. */
export function estPlaceholder(valeur: string): boolean {
  return /^\[[A-Z0-9_ ]+\]$/.test(valeur.trim());
}
