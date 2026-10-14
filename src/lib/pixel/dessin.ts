/*
 * Format des dessins de l'éditeur pixel art, partagé par le navigateur
 * (éditeur, partage) et les fonctions serveur (image Open Graph).
 * Aucun stockage : le dessin entier tient dans l'URL.
 *
 * Code = base64url( [version, taille, ...plages] )
 *   taille : 0 = 32x32, 1 = 64x64
 *   plage  : octet (couleur << 4 | min(longueur - 1, 15)), suivi d'un varint
 *            (longueur - 16) quand la longueur dépasse 15.
 */

export type TailleDessin = 32 | 64;

/** Palette LED : l'indice 0 est une LED éteinte (noir). */
export const PALETTE = [
  '#000000', // éteint
  '#ffffff',
  '#ff2e3e',
  '#ff7a1a',
  '#ffd23f',
  '#9cff3d',
  '#22d65a',
  '#2ee6e6',
  '#2f6bff',
  '#8b5cff',
  '#ff4fa8',
  '#ffd2a0',
  '#8a4b2a',
  '#7a7a8c',
  '#1b2a6b',
  '#4a1670',
] as const;

export const NOMS_COULEURS = [
  'Éteint (noir)',
  'Blanc',
  'Rouge',
  'Orange',
  'Jaune',
  'Vert clair',
  'Vert',
  'Cyan',
  'Bleu',
  'Violet',
  'Rose',
  'Beige',
  'Marron',
  'Gris',
  'Bleu nuit',
  'Prune',
] as const;

export interface Dessin {
  taille: TailleDessin;
  /** Indices de couleur, ligne par ligne (taille x taille). */
  pixels: Uint8Array;
}

const VERSION = 1;

export function dessinVide(taille: TailleDessin): Dessin {
  return { taille, pixels: new Uint8Array(taille * taille) };
}

export function estVide(d: Dessin): boolean {
  return d.pixels.every((p) => p === 0);
}

/** 32 → 64 : chaque pixel devient un carré de 2 x 2 (agrandissement sans perte). 64 → 32 : un pixel sur deux. */
export function redimensionner(d: Dessin, taille: TailleDessin): Dessin {
  if (d.taille === taille) return { taille, pixels: d.pixels.slice() };
  const sortie = dessinVide(taille);
  const f = d.taille / taille;
  for (let y = 0; y < taille; y++) {
    for (let x = 0; x < taille; x++) {
      sortie.pixels[y * taille + x] = d.pixels[Math.floor(y * f) * d.taille + Math.floor(x * f)]!;
    }
  }
  return sortie;
}

function versBase64url(octets: Uint8Array): string {
  let bin = '';
  for (const o of octets) bin += String.fromCharCode(o);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function depuisBase64url(texte: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(texte)) return null;
  try {
    const bin = atob(texte.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

export function encoderDessin(d: Dessin): string {
  const octets: number[] = [VERSION, d.taille === 64 ? 1 : 0];
  const p = d.pixels;
  for (let i = 0; i < p.length; ) {
    const c = p[i]!;
    let l = 1;
    while (i + l < p.length && p[i + l] === c) l++;
    octets.push((c << 4) | Math.min(l - 1, 15));
    if (l - 1 >= 15) {
      let reste = l - 16;
      do {
        let b = reste & 0x7f;
        reste >>>= 7;
        if (reste) b |= 0x80;
        octets.push(b);
      } while (reste);
    }
    i += l;
  }
  return versBase64url(Uint8Array.from(octets));
}

/** Décode un code de partage ; null si le code est invalide ou incomplet. */
export function decoderDessin(code: string): Dessin | null {
  if (code.length > 12000) return null;
  const o = depuisBase64url(code);
  if (!o || o.length < 3 || o[0] !== VERSION || (o[1] !== 0 && o[1] !== 1)) return null;
  const taille: TailleDessin = o[1] === 1 ? 64 : 32;
  const total = taille * taille;
  const pixels = new Uint8Array(total);
  let pos = 0;
  let i = 2;
  while (i < o.length) {
    const b = o[i++]!;
    const c = b >> 4;
    let l = (b & 15) + 1;
    if (l === 16) {
      let extra = 0;
      let decalage = 0;
      let suite: number;
      do {
        if (i >= o.length || decalage > 21) return null;
        suite = o[i++]!;
        extra |= (suite & 0x7f) << decalage;
        decalage += 7;
      } while (suite & 0x80);
      l += extra;
    }
    if (pos + l > total) return null;
    pixels.fill(c, pos, pos + l);
    pos += l;
  }
  return pos === total ? { taille, pixels } : null;
}
