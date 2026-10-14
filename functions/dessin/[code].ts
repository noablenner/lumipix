/*
 * GET /dessin/<code> : lien de partage d'un dessin.
 * Sert une page minimale avec les balises Open Graph (aperçu du dessin sur
 * les réseaux), puis renvoie le visiteur vers l'éditeur avec le dessin chargé.
 */
import { echapper, lireCode, SLUG_CADRE, type Contexte } from '../../src/lib/partage-serveur.ts';

export const onRequestGet = ({ request, params }: Contexte): Response => {
  const lu = lireCode(params);
  const origine = new URL(request.url).origin;
  const editeur = `${origine}/produits/${SLUG_CADRE}?dessin=${lu?.code ?? ''}#editeur`;
  if (!lu) return Response.redirect(`${origine}/produits/${SLUG_CADRE}#editeur`, 302);

  const image = `${origine}/api/dessin/${lu.code}.png`;
  const titre = `Mon pixel art ${lu.dessin.taille}x${lu.dessin.taille} | Lumipix`;
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
};
