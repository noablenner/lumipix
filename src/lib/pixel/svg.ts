/*
 * Rendu d'une toile en SVG façon écran LED : chaque pixel devient une diode
 * ronde, les diodes éteintes restent visibles en gris très sombre, et un
 * léger halo diffuse la lumière. Les animations sont en CSS et coupées si
 * l'utilisateur demande moins d'animations.
 */
import type { Animation, Couleur, Toile } from './toile.ts';

const STYLE_STATIQUE = '.alt-b,.oeil-f{opacity:0}';

const STYLE_ANIME = `
.alt-a{animation:la 1s steps(1,end) infinite}
.alt-b{animation:lb 1s steps(1,end) infinite}
.clign{animation:la 1.2s steps(1,end) infinite}
.scint-1{animation:sc 2.6s steps(1,end) infinite}
.scint-2{animation:sc 3.4s steps(1,end) infinite -1.1s}
.scint-3{animation:sc 4.2s steps(1,end) infinite -2.3s}
.oeil-o{animation:yo 4.5s steps(1,end) infinite}
.oeil-f{animation:yf 4.5s steps(1,end) infinite}
@keyframes la{0%{opacity:1}50%{opacity:0}}
@keyframes lb{0%{opacity:0}50%{opacity:1}}
@keyframes sc{0%{opacity:1}70%{opacity:.25}80%{opacity:1}}
@keyframes yo{0%{opacity:1}92%{opacity:0}97%{opacity:1}}
@keyframes yf{0%{opacity:0}92%{opacity:1}97%{opacity:0}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

/** Regroupe les pixels d'une même couleur en un seul tracé, ligne par ligne. */
function traces(pixels: Iterable<[number, number, string]>): string {
  const parCouleur = new Map<string, string[]>();
  for (const [x, y, c] of pixels) {
    let liste = parCouleur.get(c);
    if (!liste) parCouleur.set(c, (liste = []));
    liste.push(`${x},${y}`);
  }
  let sortie = '';
  for (const [couleur, cles] of parCouleur) {
    const points = cles
      .map((k) => k.split(',').map(Number) as [number, number])
      .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    let d = '';
    for (let i = 0; i < points.length; ) {
      const [x, y] = points[i]!;
      let l = 1;
      while (points[i + l] && points[i + l]![1] === y && points[i + l]![0] === x + l) l++;
      d += `M${x} ${y}h${l}v1h-${l}z`;
      i += l;
    }
    sortie += `<path fill="${couleur}" d="${d}"/>`;
  }
  return sortie;
}

function* pixelsBase(base: Couleur[][]): Generator<[number, number, string]> {
  for (let y = 0; y < base.length; y++) {
    const ligne = base[y]!;
    for (let x = 0; x < ligne.length; x++) {
      const c = ligne[x];
      if (c) yield [x, y, c];
    }
  }
}

export interface OptionsSvg {
  /** Préfixe des identifiants, unique par SVG d'une même page. */
  id?: string;
  anime?: boolean;
  /** Ajoute xmlns (fichier autonome) ; à false pour imbriquer dans un autre SVG. */
  autonome?: boolean;
  largeur?: number;
  x?: number;
  y?: number;
}

export function toileVersSvg(t: Toile, o: OptionsSvg = {}): string {
  const { id = 'led', anime = true, autonome = true, largeur, x, y } = o;
  const n = t.n;
  let calques = '';
  for (const [anim, pixels] of t.calques as Map<Animation, Map<number, string>>) {
    const liste = [...pixels].map(([i, c]) => [i % n, Math.floor(i / n), c] as [number, number, string]);
    calques += `<g class="${anim}">${traces(liste)}</g>`;
  }
  const attrs = [
    autonome ? 'xmlns="http://www.w3.org/2000/svg"' : '',
    `viewBox="0 0 ${n} ${n}"`,
    largeur ? `width="${largeur}" height="${largeur}"` : '',
    x !== undefined ? `x="${x}"` : '',
    y !== undefined ? `y="${y}"` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    `<svg ${attrs}>` +
    `<style>${STYLE_STATIQUE}${anime ? STYLE_ANIME : ''}</style>` +
    `<defs>` +
    `<pattern id="${id}-d" width="1" height="1" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="#000"/><circle cx=".5" cy=".5" r=".44" fill="#fff"/></pattern>` +
    `<mask id="${id}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="${n}" height="${n}"><rect width="${n}" height="${n}" fill="url(#${id}-d)"/></mask>` +
    `<filter id="${id}-g" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${n === 64 ? 0.9 : 0.55}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
    `</defs>` +
    `<rect width="${n}" height="${n}" fill="#030306"/>` +
    `<g filter="url(#${id}-g)"><g mask="url(#${id}-m)">` +
    `<rect width="${n}" height="${n}" fill="#15151f"/>` +
    traces(pixelsBase(t.base)) +
    calques +
    `</g></g></svg>`
  );
}
