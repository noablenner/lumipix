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

export function routeExiste(chemin: string): boolean {
  return routesStatiques.has(chemin);
}

/** /page.html ou /page/ → /page (au build, Astro.url.pathname porte l'extension). */
export function cheminPublic(pathname: string): string {
  return pathname.replace(/(\/index)?\.html$/, '').replace(/\/$/, '') || '/';
}
