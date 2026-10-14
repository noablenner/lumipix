/*
 * Point d'entrée du Worker Cloudflare (wrangler.jsonc).
 * Les fichiers statiques de dist/ sont servis directement par Cloudflare ;
 * ce script ne reçoit que les requêtes qui ne correspondent à aucun fichier.
 * Les routes serveur des phases suivantes (Stripe, webhook, admin, contact) s'ajoutent ici.
 */
import { imagePartage, pagePartage, type ContexteExecution } from './serveur/partage.ts';

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env, ctx: ContexteExecution): Promise<Response> {
    const { pathname } = new URL(request.url);
    const methode = request.method;

    if (methode === 'GET' || methode === 'HEAD') {
      let m = pathname.match(/^\/dessin\/([A-Za-z0-9_-]{1,12000})$/);
      if (m) return pagePartage(request, m[1]!);
      m = pathname.match(/^\/api\/dessin\/([A-Za-z0-9_-]{1,12000})\.png$/);
      if (m) return imagePartage(request, m[1]!, ctx);
    }

    // Tout le reste : fichiers statiques (avec la page 404 du site)
    return env.ASSETS.fetch(request);
  },
};
