/*
 * sitemap.xml généré au build (brief §8) : uniquement les pages indexables.
 * Hors production (préproduction, GitHub Pages), tout est en noindex : sitemap vide.
 */
import type { APIRoute } from 'astro';
import { SOCIETE } from '../config/societe';
import { getCollectionsVisibles, getProduitsPublies } from '../lib/catalogue';
import { estPrevisualisation, routeExiste } from '../lib/routes';
import { getGuides, lienGuide } from '../lib/guides';

const PAGES_EDITORIALES = ['/guides', '/idees-cadeaux', '/faq', '/livraison', '/retours', '/cgv', '/mentions-legales', '/confidentialite', '/contact'];

export const GET: APIRoute = async () => {
  const chemins: string[] = [];
  if (!estPrevisualisation) {
    chemins.push('/');
    for (const p of await getProduitsPublies()) chemins.push(`/produits/${p.slug}`);
    for (const c of await getCollectionsVisibles()) chemins.push(`/collections/${c.data.slug}`);
    chemins.push(...PAGES_EDITORIALES.filter(routeExiste));
    for (const g of await getGuides()) chemins.push(lienGuide(g.data));
  }
  const corps = chemins.map((c) => `  <url><loc>${new URL(c, SOCIETE.urlSite).href}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${corps}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
