/*
 * GET /api/dessin/<code>.png : image Open Graph d'un dessin partagé.
 * Le code contient tout le dessin : même code = même image, donc mise en
 * cache longue durée sur le réseau Cloudflare (calculée une seule fois).
 */
import { pngPartage } from '../../../src/lib/pixel/og-dessin.ts';
import { lireCode, type Contexte } from '../../../src/lib/partage-serveur.ts';

export const onRequestGet = async ({ request, params, waitUntil }: Contexte): Promise<Response> => {
  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  const enCache = await cache?.match(request);
  if (enCache) return enCache;

  const lu = lireCode(params);
  if (!lu) return new Response('Dessin invalide', { status: 404 });

  const reponse = new Response((await pngPartage(lu.dessin)) as BodyInit, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
  if (cache) waitUntil(cache.put(request, reponse.clone()));
  return reponse;
};
