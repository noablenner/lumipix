/*
 * Outils communs aux fonctions de partage de dessin (Cloudflare Pages Functions).
 * Placé hors de functions/ pour ne jamais être exposé comme route.
 */
import { decoderDessin, type Dessin } from './pixel/dessin.ts';

export interface Contexte {
  request: Request;
  params: Record<string, string | string[]>;
  waitUntil(promesse: Promise<unknown>): void;
}

export const SLUG_CADRE = 'cadre-pixel-art-led';

/** Code du dessin depuis l'URL, sans l'extension éventuelle. */
export function lireCode(params: Contexte['params']): { code: string; dessin: Dessin } | null {
  const brut = Array.isArray(params.code) ? params.code[0] : params.code;
  const code = (brut ?? '').replace(/\.png$/, '');
  const dessin = decoderDessin(code);
  return dessin ? { code, dessin } : null;
}

export const echapper = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
