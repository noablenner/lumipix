// @ts-check
import { defineConfig } from 'astro/config';

// Sortie statique pour toutes les pages publiques (brief §3).
// Les fonctions serveur vivront dans /functions (Cloudflare Pages Functions).
export default defineConfig({
  site: 'https://lumipix.shop',
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
