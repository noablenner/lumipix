/*
 * Images Open Graph 1200 x 630 composées en SVG puis converties en PNG au build.
 * Textes dessinés avec la police bitmap : aucune police système requise.
 */
import { HAUTEUR_POLICE, pixelsTexte } from './police.ts';
import { dessinerScene, type NomScene } from './scenes.ts';
import { toileVersSvg } from './svg.ts';

export interface LigneOg {
  texte: string;
  couleur: string;
  echelle: number;
}

function texteSvg({ texte, couleur, echelle }: LigneOg, x: number, y: number): string {
  const { points } = pixelsTexte(texte);
  let d = '';
  for (const [px, py] of points) d += `M${x + px * echelle} ${y + py * echelle}h${echelle}v${echelle}h-${echelle}z`;
  return `<path fill="${couleur}" d="${d}"/>`;
}

export function svgOg(scene: NomScene, lignes: LigneOg[]): string {
  const ecran = toileVersSvg(dessinerScene(scene, 64), { id: 'og', anime: false, autonome: false, largeur: 400, x: 96, y: 115 });
  let y = 160;
  let textes = '';
  for (const l of lignes) {
    textes += texteSvg(l, 590, y);
    y += HAUTEUR_POLICE * l.echelle + Math.max(18, l.echelle * 4);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
<pattern id="grille" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="#ffffff" stroke-opacity=".04"/></pattern>
<radialGradient id="halo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff4fa8" stop-opacity=".35"/><stop offset="1" stop-color="#ff4fa8" stop-opacity="0"/></radialGradient>
<linearGradient id="bord" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#23232c"/><stop offset=".6" stop-color="#0b0b0f"/></linearGradient>
</defs>
<rect width="1200" height="630" fill="#0a0a18"/>
<rect width="1200" height="630" fill="url(#grille)"/>
<circle cx="296" cy="315" r="330" fill="url(#halo)"/>
<rect x="76" y="95" width="440" height="440" rx="14" fill="url(#bord)"/>
${ecran}
${textes}
<rect x="0" y="618" width="1200" height="12" fill="#2ee6e6"/>
</svg>`;
}
