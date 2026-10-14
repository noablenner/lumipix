/*
 * Médias produit déposés dans assets/produits/[slug]/ (brief §10 bis).
 * Les images passent par astro:assets (AVIF, WebP, plusieurs tailles) ;
 * les vidéos sont copiées telles quelles avec un nom haché.
 */
import type { ImageMetadata } from 'astro';

const images = import.meta.glob<{ default: ImageMetadata }>('/assets/produits/**/*.{jpg,jpeg,png,webp,avif}');
const videos = import.meta.glob<string>('/assets/produits/**/*.{mp4,webm}', { query: '?url', import: 'default', eager: true });

export async function imageProduit(slug: string, fichier: string): Promise<ImageMetadata> {
  const charger = images[`/assets/produits/${slug}/${fichier}`];
  if (!charger) throw new Error(`Image introuvable : assets/produits/${slug}/${fichier}`);
  return (await charger()).default;
}

export function urlVideoProduit(slug: string, fichier: string): string {
  const url = videos[`/assets/produits/${slug}/${fichier}`];
  if (!url) throw new Error(`Vidéo introuvable : assets/produits/${slug}/${fichier}`);
  return url;
}
