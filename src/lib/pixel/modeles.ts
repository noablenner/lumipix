/*
 * Modèles de départ de l'éditeur (brief §5) : dessins originaux, sans aucune
 * référence à un univers protégé. Le champignon est une amanite naturelle
 * (pas de visage), la manette n'a ni symboles ni couleurs de marque.
 * Dessinés en coordonnées unitaires : nets en 32x32 comme en 64x64.
 */
import { dansEllipse, dansTriangle } from './toile.ts';
import { dessinVide, type Dessin, type TailleDessin } from './dessin.ts';

// Indices de PALETTE (dessin.ts)
const BLANC = 1, ROUGE = 2, ORANGE = 3, JAUNE = 4, VERT_CLAIR = 5, VERT = 6, CYAN = 7, VIOLET = 9, ROSE = 10, BEIGE = 11, MARRON = 12, GRIS = 13, PRUNE = 15;

type Peinture = (u: number, v: number, px: number) => number | undefined;

export const MODELES = {
  coeur: 'Cœur',
  champignon: 'Champignon',
  fusee: 'Fusée',
  chat: 'Chat',
  etoile: 'Étoile',
  manette: 'Manette',
} as const;
export type NomModele = keyof typeof MODELES;

function dansPolygone(u: number, v: number, pts: [number, number][]): boolean {
  let dedans = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]!;
    const [xj, yj] = pts[j]!;
    if (yi > v !== yj > v && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
}

const coeurDedans = (u: number, v: number) => {
  const x = (u - 0.5) * 2.7;
  const y = (0.5 - v) * 2.7 + 0.12;
  return (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0;
};

const etoile: [number, number][] = Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 5;
  const r = i % 2 === 0 ? 0.42 : 0.18;
  return [0.5 + r * Math.cos(a), 0.54 + r * Math.sin(a)];
});

const DESSINS: Record<NomModele, Peinture> = {
  coeur(u, v, px) {
    if (!coeurDedans(u, v)) return undefined;
    if (dansEllipse(u, v, 0.36, 0.34, 0.06, 0.05)) return BLANC;
    const bord = !coeurDedans(u - px, v) || !coeurDedans(u + px, v) || !coeurDedans(u, v + px);
    return bord ? ROSE : ROUGE;
  },
  champignon(u, v) {
    // herbe
    if (v > 0.86 + 0.03 * Math.sin(u * 40)) return v > 0.93 ? VERT : VERT_CLAIR;
    // pied fin avec anneau
    if (Math.abs(u - 0.5) < 0.06 + (v > 0.78 ? 0.02 : 0) && v > 0.5 && v < 0.9) {
      if (v > 0.6 && v < 0.64) return BLANC;
      return BEIGE;
    }
    // lamelles sous le chapeau
    if (v > 0.47 && v < 0.52 && Math.abs(u - 0.5) < 0.3) return BEIGE;
    // chapeau large et plat, taches blanches
    if (v < 0.5 && dansEllipse(u, v, 0.5, 0.5, 0.36, 0.28)) {
      const taches: [number, number, number][] = [[0.38, 0.34, 0.045], [0.56, 0.28, 0.05], [0.68, 0.4, 0.04], [0.47, 0.43, 0.035], [0.27, 0.44, 0.03]];
      if (taches.some(([x, y, r]) => dansEllipse(u, v, x, y, r, r))) return BLANC;
      return v > 0.44 ? MARRON : ROUGE;
    }
    return undefined;
  },
  fusee(u, v) {
    const cx = 0.5;
    if (v > 0.73 && v < 0.93) {
      const p = (v - 0.73) / 0.2;
      const d = Math.abs(u - cx);
      if (d < 0.055 * (1 - p)) return d < 0.025 && p < 0.6 ? JAUNE : ORANGE;
    }
    if (dansTriangle(u, v, [cx - 0.08, 0.52], [cx - 0.18, 0.74], [cx - 0.08, 0.7])) return ROUGE;
    if (dansTriangle(u, v, [cx + 0.08, 0.52], [cx + 0.18, 0.74], [cx + 0.08, 0.7])) return ROUGE;
    if (v > 0.1 && v < 0.7) {
      const demi = v < 0.3 ? 0.09 * Math.sqrt((v - 0.1) / 0.2) : 0.09;
      if (Math.abs(u - cx) < demi) {
        if (dansEllipse(u, v, cx, 0.4, 0.05, 0.05)) return dansEllipse(u, v, cx, 0.4, 0.032, 0.032) ? CYAN : GRIS;
        if (v < 0.24) return ROUGE;
        return BLANC;
      }
    }
    if (v >= 0.7 && v < 0.74 && Math.abs(u - cx) < 0.06) return GRIS;
    return undefined;
  },
  chat(u, v, px) {
    const dq = Math.hypot(u - 0.73, v - 0.8);
    if (v < 0.86 && u > 0.7 && Math.abs(dq - 0.11) < 0.03) return MARRON;
    if (dansEllipse(u, v, 0.43, 0.41, 0.035, 0.04) || dansEllipse(u, v, 0.57, 0.41, 0.035, 0.04)) return VERT;
    if (dansEllipse(u, v, 0.5, 0.74, 0.21, 0.2)) return dansEllipse(u, v, 0.5, 0.76, 0.1, 0.13) ? BEIGE : ORANGE;
    if (dansEllipse(u, v, 0.42, 0.92, 0.06, 0.04) || dansEllipse(u, v, 0.58, 0.92, 0.06, 0.04)) return BEIGE;
    if (dansTriangle(u, v, [0.36, 0.32], [0.38, 0.2], [0.44, 0.29]) || dansTriangle(u, v, [0.64, 0.32], [0.62, 0.2], [0.56, 0.29])) return ROSE;
    if (dansTriangle(u, v, [0.33, 0.36], [0.37, 0.15], [0.47, 0.29]) || dansTriangle(u, v, [0.67, 0.36], [0.63, 0.15], [0.53, 0.29])) return ORANGE;
    if (dansEllipse(u, v, 0.5, 0.43, 0.18, 0.16)) {
      if (dansTriangle(u, v, [0.47, 0.47], [0.53, 0.47], [0.5, 0.5])) return ROSE;
      if (Math.abs(u - 0.5) < px * 0.6 && v > 0.28 && v < 0.34) return MARRON;
      return ORANGE;
    }
    return undefined;
  },
  etoile(u, v, px) {
    if (!dansPolygone(u, v, etoile)) return undefined;
    const bord = !dansPolygone(u - px, v, etoile) || !dansPolygone(u + px, v, etoile) || !dansPolygone(u, v - px, etoile) || !dansPolygone(u, v + px, etoile);
    if (bord) return ORANGE;
    if (dansEllipse(u, v, 0.44, 0.44, 0.05, 0.04)) return BLANC;
    return JAUNE;
  },
  manette(u, v) {
    // silhouette moderne : corps arrondi et poignées qui descendent
    const poignee = (cx: number, sens: number) =>
      dansEllipse(u, v, cx, 0.6, 0.12, 0.17) || dansTriangle(u, v, [cx - 0.1 * sens, 0.45], [cx + 0.12 * sens, 0.45], [cx + 0.02 * sens, 0.74]);
    const corps = dansEllipse(u, v, 0.5, 0.47, 0.36, 0.15) || poignee(0.27, 1) || poignee(0.73, -1);
    if (!corps) return undefined;
    // croix directionnelle
    const cx = 0.29, cy = 0.47;
    if ((Math.abs(u - cx) < 0.022 && Math.abs(v - cy) < 0.07) || (Math.abs(v - cy) < 0.022 && Math.abs(u - cx) < 0.07)) return BLANC;
    // deux boutons ronds en diagonale
    if (dansEllipse(u, v, 0.68, 0.5, 0.04, 0.04)) return ROSE;
    if (dansEllipse(u, v, 0.76, 0.42, 0.04, 0.04)) return JAUNE;
    // bouton central
    if (dansEllipse(u, v, 0.5, 0.42, 0.03, 0.03)) return CYAN;
    return v > 0.62 ? PRUNE : VIOLET;
  },
};

export function dessinerModele(nom: NomModele, taille: TailleDessin): Dessin {
  const d = dessinVide(taille);
  const px = 1 / taille;
  for (let y = 0; y < taille; y++) {
    for (let x = 0; x < taille; x++) {
      const c = DESSINS[nom]((x + 0.5) / taille, (y + 0.5) / taille, px);
      if (c !== undefined) d.pixels[y * taille + x] = c;
    }
  }
  return d;
}
