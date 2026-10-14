const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const eurosRonds = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

/** 79 → "79 €", 79.5 → "79,50 €" */
export function formatPrix(montant: number): string {
  return Number.isInteger(montant) ? eurosRonds.format(montant) : euros.format(montant);
}

export function formatDelai(min: number, max: number): string {
  return min === max ? `${min} jours ouvrés` : `${min} à ${max} jours ouvrés`;
}
