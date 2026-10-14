/*
 * Image de partage d'un dessin (600 x 315) : le dessin affiché sur le cadre
 * LED, et le nom de la marque en police bitmap. Rendu volontairement simple
 * et rapide pour tenir dans le budget CPU d'une fonction Cloudflare gratuite.
 */
import { PALETTE, type Dessin } from './dessin.ts';
import { encoderPng } from './png.ts';
import { pixelsTexte } from './police.ts';

const L = 600;
const H = 315;
// Couleurs de décor ajoutées après les 16 couleurs du dessin
const FOND = 16, CADRE = 17, LED_OFF = 18, TEXTE = 19, ROSE = 20, CYAN = 21;
const PALETTE_OG = [...PALETTE, '#0a0a18', '#16161d', '#121218', '#f4f3ff', '#ff4fa8', '#2ee6e6'];

export async function pngPartage(d: Dessin): Promise<Uint8Array> {
  const img = new Uint8Array(L * H).fill(FOND);
  const rect = (x0: number, y0: number, l: number, h: number, c: number) => {
    for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++) img.fill(c, y * L + Math.max(0, x0), y * L + Math.min(L, x0 + l));
  };

  // Cadre et écran
  const ecran = 256;
  const x0 = 40;
  const y0 = Math.round((H - ecran) / 2);
  rect(x0 - 12, y0 - 12, ecran + 24, ecran + 24, CADRE);
  rect(x0, y0, ecran, ecran, 0);
  const pas = ecran / d.taille;
  const r = pas * 0.4;
  for (let gy = 0; gy < d.taille; gy++) {
    for (let gx = 0; gx < d.taille; gx++) {
      const c = d.pixels[gy * d.taille + gx]!;
      const coul = c === 0 ? LED_OFF : c;
      const cx = x0 + (gx + 0.5) * pas;
      const cy = y0 + (gy + 0.5) * pas;
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
        for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
          if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) img[y * L + x] = coul;
        }
      }
    }
  }

  // Textes
  const ecrire = (texte: string, x: number, y: number, e: number, c: number) => {
    for (const [px, py] of pixelsTexte(texte).points) rect(x + px * e, y + py * e, e, e, c);
  };
  ecrire('MON PIXEL ART', 336, 100, 3, TEXTE);
  ecrire(`EN ${d.taille}X${d.taille}`, 336, 138, 3, CYAN);
  ecrire('LUMIPIX', 336, 190, 6, ROSE);
  rect(0, H - 6, L, 6, CYAN);

  return encoderPng(L, H, img, PALETTE_OG);
}
