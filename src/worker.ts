/*
 * Point d'entrée du Worker Cloudflare (wrangler.jsonc).
 * Les fichiers statiques de dist/ sont servis directement par Cloudflare ;
 * ce script ne reçoit que /dessin/* et /api/* (run_worker_first), plus les
 * requêtes qui ne correspondent à aucun fichier.
 */
import { imagePartage, pagePartage, type ContexteExecution } from './serveur/partage.ts';
import { creerPaiement, statutCommande, webhookStripe, type EnvPaiement } from './serveur/commandes.ts';
import { CATALOGUE } from './serveur/catalogue.genere.ts';

interface Env extends EnvPaiement {
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
      if (pathname === '/api/commande/statut') return statutCommande(request, env);
    }

    if (methode === 'POST') {
      if (pathname === '/api/checkout') return creerPaiement(request, env, CATALOGUE);
      if (pathname === '/api/stripe/webhook') return webhookStripe(request, env, CATALOGUE);
    }

    if (pathname.startsWith('/api/')) return new Response('Introuvable', { status: 404 });

    // Tout le reste : fichiers statiques (avec la page 404 du site)
    return env.ASSETS.fetch(request);
  },
};
