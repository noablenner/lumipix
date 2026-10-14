/*
 * Liste des routes réellement construites, pour ne jamais afficher de lien
 * vers une page qui n'existe pas encore (les pages arrivent phase par phase).
 */
const pages = import.meta.glob('/src/pages/**/*.{astro,md,ts}');

const routesStatiques = new Set(
  Object.keys(pages)
    .map((f) =>
      f
        .replace(/^\/src\/pages/, '')
        .replace(/\.(astro|md|ts)$/, '')
        .replace(/\/index$/, '') || '/',
    )
    .filter((r) => !r.includes('[')),
);

/** Préfixe du site : "" en production, "/lumipix" sur la prévisualisation GitHub Pages. */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Lien interne compatible avec le préfixe de déploiement : lien('/faq'). */
export function lien(chemin: string): string {
  return chemin === '/' ? `${BASE}/` : `${BASE}${chemin}`;
}

/** Vrai hors production (GitHub Pages ou préproduction Cloudflare) : brouillons visibles, tout en noindex. */
export const estPrevisualisation = import.meta.env.PUBLIC_PREVISUALISATION === '1';

/** Vrai quand les routes serveur du Worker existent (partage avec aperçu, paiement…). */
export const fonctionsServeur = import.meta.env.PUBLIC_FONCTIONS_SERVEUR === '1';

export function routeExiste(chemin: string): boolean {
  return routesStatiques.has(chemin);
}

/** /page.html ou /page/ → /page (au build, Astro.url.pathname porte l'extension). */
export function cheminPublic(pathname: string): string {
  return pathname.slice(BASE && pathname.startsWith(BASE) ? BASE.length : 0).replace(/(\/index)?\.html$/, '').replace(/\/$/, '') || '/';
}
