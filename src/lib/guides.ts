import { getCollection, type CollectionEntry } from 'astro:content';

export type Guide = CollectionEntry<'guides'>;

/** Guides triés par ordre d'affichage. */
export async function getGuides(): Promise<Guide[]> {
  return (await getCollection('guides')).sort((a, b) => a.data.ordre - b.data.ordre);
}

export const lienGuide = (g: Pick<Guide['data'], 'slug'>) => `/guides/${g.slug}`;
