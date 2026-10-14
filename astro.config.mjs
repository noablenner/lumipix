// @ts-check
import { defineConfig } from 'astro/config';

// Sortie statique pour toutes les pages publiques (brief §3).
// Les fonctions serveur vivront dans /functions (Cloudflare Pages Functions).
/*
 * Cible du build (variable CIBLE_DEPLOIEMENT) :
 *  - production   : lumipix.shop, produits actifs uniquement, pages indexables (défaut)
 *  - preprod      : Worker Cloudflare avant le lancement : brouillons visibles, tout en noindex
 *  - github-pages : prévisualisation statique sous /lumipix, sans fonctions serveur
 */
const cible = process.env.CIBLE_DEPLOIEMENT || 'production';
const githubPages = cible === 'github-pages';
process.env.PUBLIC_PREVISUALISATION = cible === 'production' ? '' : '1';
process.env.PUBLIC_FONCTIONS_SERVEUR = githubPages ? '' : '1';

export default defineConfig({
  // URL du déploiement courant (images de partage) ; URL_SITE permet de viser l'adresse workers.dev en préproduction
  site: githubPages ? 'https://noablenner.github.io' : process.env.URL_SITE || 'https://lumipix.shop',
  base: githubPages ? '/lumipix' : undefined,
  output: 'static',
  // URLs sans slash final (/produits/mon-produit) : Cloudflare Pages sert
  // /mon-produit.html sous /mon-produit et redirige le reste.
  trailingSlash: 'never',
  build: {
    format: 'file',
    inlineStylesheets: 'always',
  },
  devToolbar: { enabled: false },
});
