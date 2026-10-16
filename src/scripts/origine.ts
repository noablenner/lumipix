/*
 * Origine de la visite (brief §6.3) : paramètres UTM et site référent de la
 * première visite qui en a, conservés dans le navigateur 30 jours, puis transmis à la
 * session Stripe au paiement (savoir quelle vidéo ou quel réseau a fait la vente).
 * Rien n'est envoyé ailleurs, aucun cookie.
 */
const CLE = 'lumipix:origine';
const DUREE_MS = 30 * 24 * 3600 * 1000;
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export type Origine = Partial<Record<(typeof UTM)[number] | 'referent' | 'page_arrivee', string>>;

export function lireOrigine(): Origine {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? 'null') as (Origine & { date?: number }) | null;
    if (!brut || typeof brut.date !== 'number' || Date.now() - brut.date > DUREE_MS) return {};
    const { date: _date, ...origine } = brut;
    return origine;
  } catch {
    return {};
  }
}

export function memoriserOrigine() {
  try {
    const connue = lireOrigine();
    const aUneSource = (o: Origine) => Boolean(o.utm_source || o.referent);
    const params = new URLSearchParams(location.search);
    const origine: Origine & { date: number } = { date: Date.now(), page_arrivee: location.pathname.slice(0, 300) };
    for (const cle of UTM) {
      const v = params.get(cle);
      if (v) origine[cle] = v.slice(0, 200);
    }
    if (document.referrer) {
      const ref = new URL(document.referrer);
      if (ref.host !== location.host) origine.referent = `${ref.origin}${ref.pathname}`.slice(0, 300);
    }
    // La première visite avec une source (UTM ou site référent) l'emporte ; une visite directe ne l'efface pas.
    if (aUneSource(connue) || (Object.keys(connue).length && !aUneSource(origine))) return;
    localStorage.setItem(CLE, JSON.stringify(origine));
  } catch {
    // stockage indisponible : la vente sera simplement sans source
  }
}
