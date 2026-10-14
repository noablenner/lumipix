/*
 * Paires texte / fond réellement utilisées dans l'interface.
 * Contrôlées en WCAG AA (4,5:1 pour le texte courant, 3:1 pour le grand texte
 * et les éléments d'interface) par scripts/verifier-build.ts et affichées
 * sur /design-system.
 */
export const PAIRES_CONTRASTE: { texte: string; fond: string; usage: string; min: 4.5 | 3 }[] = [
  { texte: 'c-texte', fond: 'c-fond', usage: 'Texte courant', min: 4.5 },
  { texte: 'c-texte', fond: 'c-surface', usage: 'Texte sur carte', min: 4.5 },
  { texte: 'c-texte', fond: 'c-surface-2', usage: 'Texte sur badge neutre', min: 4.5 },
  { texte: 'c-texte-doux', fond: 'c-fond', usage: 'Texte secondaire', min: 4.5 },
  { texte: 'c-texte-doux', fond: 'c-surface', usage: 'Texte secondaire sur carte', min: 4.5 },
  { texte: 'c-texte-doux', fond: 'c-fond-2', usage: 'Liens du pied de page', min: 4.5 },
  { texte: 'c-cyan', fond: 'c-fond', usage: 'Liens', min: 4.5 },
  { texte: 'c-cyan', fond: 'c-surface', usage: 'Liens sur carte', min: 4.5 },
  { texte: 'c-jaune', fond: 'c-fond', usage: 'Prix, focus', min: 4.5 },
  { texte: 'c-jaune', fond: 'c-surface', usage: 'Prix sur carte', min: 4.5 },
  { texte: 'c-rouge', fond: 'c-fond', usage: "Messages d'erreur", min: 4.5 },
  { texte: 'c-vert', fond: 'c-fond', usage: 'Succès', min: 4.5 },
  { texte: 'c-sur-neon', fond: 'c-jaune', usage: 'Bouton principal', min: 4.5 },
  { texte: 'c-sur-neon', fond: 'c-cyan', usage: 'Badge cyan', min: 4.5 },
  { texte: 'c-sur-neon', fond: 'c-rose', usage: 'Badge rose, sélection', min: 4.5 },
  { texte: 'c-sur-neon', fond: 'c-vert', usage: 'Badge vert', min: 4.5 },
  { texte: 'c-rose', fond: 'c-fond', usage: 'Accents roses', min: 4.5 },
  { texte: 'c-violet', fond: 'c-fond', usage: 'Accents violets', min: 4.5 },
  { texte: 'c-bordure-ui', fond: 'c-fond', usage: 'Bordure des contrôles', min: 3 },
  { texte: 'c-bordure-ui', fond: 'c-fond-2', usage: 'Bordure des champs', min: 3 },
  { texte: 'c-bordure-ui', fond: 'c-surface', usage: 'Bordure des contrôles sur carte', min: 3 },
];
