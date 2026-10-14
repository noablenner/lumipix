/*
 * Partage d'un dessin, côté serveur (Worker Cloudflare) :
 *   GET /dessin/<code>          page minimale avec balises Open Graph, puis redirection vers l'éditeur
 *   GET /api/dessin/<code>.png  image d'aperçu (600 x 315), mise en cache sur le réseau Cloudflare
 * Le code contient tout le dessin : aucun stockage.
 */
import { decoderDessin } from '../lib/pixel/dessin.ts';
import { pngPartage } from '../lib/pixel/og-dessin.ts';

export const SLUG_CADRE = 'cadre-pixel-art-led';

export interface ContexteExecution {
  waitUntil(promesse: Promise<unknown>): void;
}

const echapper = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function pagePartage(request: Request, code: string): Response {
  const origine = new URL(request.url).origin;
  const dessin = decoderDessin(code);
  if (!dessin) return Response.redirect(`${origine}/produits/${SLUG_CADRE}#editeur`, 302);

  const editeur = `${origine}/produits/${SLUG_CADRE}?dessin=${code}#editeur`;
  const image = `${origine}/api/dessin/${code}.png`;
  const titre = `Mon pixel art ${dessin.taille}x${dessin.taille} | Lumipix`;
  const description = 'Un dessin créé avec l’éditeur pixel art Lumipix. Ouvre-le, modifie-le et affiche-le sur ton cadre LED.';
  const html = `<!doctype html>
<html lang="fr-FR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${echapper(titre)}</title>
<meta name="description" content="${echapper(description)}">
<meta name="robots" content="noindex">
<link rel="canonical" href="${echapper(`${origine}/produits/${SLUG_CADRE}`)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="Lumipix">
<meta property="og:title" content="${echapper(titre)}">
<meta property="og:description" content="${echapper(description)}">
<meta property="og:url" content="${echapper(request.url)}">
<meta property="og:image" content="${echapper(image)}">
<meta property="og:image:width" content="600">
<meta property="og:image:height" content="315">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${echapper(image)}">
<meta http-equiv="refresh" content="0; url=${echapper(editeur)}">
</head>
<body style="background:#0a0a18;color:#f4f3ff;font-family:system-ui,sans-serif">
<p><a href="${echapper(editeur)}" style="color:#2ee6e6">Ouvrir le dessin dans l’éditeur Lumipix</a></p>
</body>
</html>`;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
  });
}

export async function imagePartage(request: Request, code: string, ctx: ContexteExecution): Promise<Response> {
  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  const enCache = await cache?.match(request);
  if (enCache) return enCache;

  const dessin = decoderDessin(code);
  if (!dessin) return new Response('Dessin invalide', { status: 404 });

  const reponse = new Response((await pngPartage(dessin)) as BodyInit, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
  if (cache) ctx.waitUntil(cache.put(request, reponse.clone()));
  return reponse;
}
