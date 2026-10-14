// @ts-check
import { defineConfig } from 'astro/config';

// Sortie statique pour toutes les pages publiques (brief §3).
// Les fonctions serveur vivront dans /functions (Cloudflare Pages Functions).
// Prévisualisation GitHub Pages : le site est servi sous /lumipix/.
// En production (Cloudflare Pages), il est servi à la racine de lumipix.shop.
const githubPages = process.env.CIBLE_DEPLOIEMENT === 'github-pages';

export default defineConfig({
  site: githubPages ? 'https://noablenner.github.io' : 'https://lumipix.shop',
  base: githubPages ? '/lumipix' : undefined,
  output: 'static',
  // URLs sans slash final (/produits/mon-produit) : Cloudflare Pages sert
  // /mon-produit.html sous /mon-produit et redirige le reste.
  trailingSlash: 'never',
  build: {
    format: 'file',
    inlineStylesheets: 'auto',
  },
  devToolbar: { enabled: false },
});
