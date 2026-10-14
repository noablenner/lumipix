/* robots.txt généré au build : tout bloquer hors production. */
import type { APIRoute } from 'astro';
import { SOCIETE } from '../config/societe';
import { estPrevisualisation } from '../lib/routes';

export const GET: APIRoute = () => {
  const texte = estPrevisualisation
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${new URL('/sitemap.xml', SOCIETE.urlSite).href}\n`;
  return new Response(texte, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
