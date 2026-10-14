/*
 * Scènes de pixel art originales affichées sur l'écran du cadre.
 * Aucune référence à un univers protégé : formes génériques uniquement.
 * Chaque scène se dessine en 32 x 32 et en 64 x 64 à partir des mêmes formes.
 */
import { HAUTEUR_POLICE, pixelsTexte } from './police.ts';
import { Toile, aleatoire, bandes, dansEllipse, dansTriangle, type Taille } from './toile.ts';

export const SCENES = {
  'coucher-soleil': 'Coucher de soleil rétro avec une route et une voiture',
  'ciel-etoile': 'Ciel étoilé avec un croissant de lune au-dessus des collines',
  horloge: 'Horloge pixel affichant 21:42',
  coeur: 'Cœur rouge qui bat sur fond scintillant',
  chat: 'Chat roux assis qui cligne des yeux',
  fusee: 'Fusée qui décolle dans l’espace',
  'vague-neon': 'Vagues néon qui ondulent',
  'erreur-404': 'Écran affichant 404',
} as const;

export type NomScene = keyof typeof SCENES;
export const NOMS_SCENES = Object.keys(SCENES) as NomScene[];
/** Scènes montrées dans la galerie et sur l'accueil (la 404 est réservée à la page d'erreur). */
export const SCENES_VITRINE = NOMS_SCENES.filter((s) => s !== 'erreur-404');

function etoiles(t: Toile, graine: number, densite: number, vMax: number, couleurs: string[]) {
  const r = aleatoire(graine);
  const total = Math.round(t.n * t.n * densite);
  for (let i = 0; i < total; i++) {
    const x = Math.floor(r() * t.n);
    const y = Math.floor(r() * t.n * vMax);
    const c = couleurs[Math.floor(r() * couleurs.length)]!;
    const tirage = r();
    const anim = tirage < 0.2 ? 'scint-1' : tirage < 0.4 ? 'scint-2' : tirage < 0.55 ? 'scint-3' : undefined;
    t.set(x, y, c, anim);
  }
}

function texte(t: Toile, chaine: string, cy: number, couleur: string, anim?: Parameters<Toile['set']>[3]) {
  const echelle = t.n === 64 ? 2 : 1;
  const { points, largeur } = pixelsTexte(chaine);
  const x0 = Math.round((t.n - largeur * echelle) / 2);
  const y0 = Math.round(cy * t.n - (HAUTEUR_POLICE * echelle) / 2);
  for (const [px, py] of points) {
    for (let dy = 0; dy < echelle; dy++) {
      for (let dx = 0; dx < echelle; dx++) t.set(x0 + px * echelle + dx, y0 + py * echelle + dy, couleur, anim);
    }
  }
}

const DESSINS: Record<NomScene, (t: Toile) => void> = {
  'coucher-soleil'(t) {
    const H = 0.6; // ligne d'horizon
    const ciel = ['#1a0b3d', '#33106a', '#5e1590', '#a01c8c', '#e0367a', '#ff6a45'];
    t.peindre((_, v) => (v < H ? bandes(v / H, ciel) : '#13062b'));
    etoiles(t, 7, 0.025, 0.28, ['#f4f3ff', '#ffd2f0']);

    // Soleil rayé
    const cx = 0.5;
    const cy = 0.44;
    const r = 0.21;
    t.peindre((u, v) => {
      if (v >= H || (u - cx) ** 2 + (v - cy) ** 2 > r * r) return undefined;
      const k = (v - cy) / r;
      if (k > 0.1 && [0.14, 0.4, 0.64, 0.86].some((s) => k > s && k < s + 0.11)) return undefined;
      return bandes((v - (cy - r)) / (2 * r), ['#ffe066', '#ffd23f', '#ffab3d', '#ff7a3d', '#ff4f6d']);
    });

    // Montagnes en deux plans
    t.peindre((u, v) => {
      const loin = H - 0.06 - 0.06 * Math.abs(Math.sin(u * 7.1 + 0.6)) - 0.03 * Math.sin(u * 17);
      const pres = H - 0.02 - 0.05 * Math.abs(Math.sin(u * 4.3 + 2.1));
      if (v < H && v > pres && (u < 0.3 || u > 0.7)) return '#1b0838';
      if (v < H && v > loin) return '#3a1260';
      return undefined;
    });

    // Sol quadrillé en perspective
    t.peindre((u, v) => {
      if (v < H) return undefined;
      const p = (v - H) / (1 - H);
      const lignes = [0.04, 0.13, 0.27, 0.47, 0.74];
      if (lignes.some((l) => Math.abs(p - l) < 0.5 / (t.n * (1 - H)))) return '#c21f9a';
      for (let i = -6; i <= 6; i++) {
        const xb = 0.5 + i * 0.16;
        const xl = 0.5 + (xb - 0.5) * p;
        if (Math.abs(u - xl) < 0.45 / t.n && Math.abs(i) > 1) return '#c21f9a';
      }
      return undefined;
    });

    // Route
    t.peindre((u, v) => {
      if (v < H) return undefined;
      const p = (v - H) / (1 - H);
      const demi = 0.03 + 0.3 * p;
      const d = Math.abs(u - 0.5);
      if (d > demi) return undefined;
      if (d > demi - 0.9 / t.n) return '#f4f3ff';
      return '#211a3a';
    });
    // Pointillés centraux qui défilent (deux images alternées)
    for (const [anim, phase] of [['alt-a', 0], ['alt-b', 0.5]] as const) {
      t.peindre((u, v) => {
        if (v < H) return undefined;
        const p = (v - H) / (1 - H);
        if (Math.abs(u - 0.5) > 0.5 / t.n + 0.012 * p) return undefined;
        const z = 1 / (p + 0.08);
        return (z * 0.55 + phase) % 1 < 0.5 ? '#ffd23f' : undefined;
      }, anim);
    }

    // Voiture vue de l'arrière
    t.peindre((u, v) => {
      if (u > 0.4 && u < 0.6 && v > 0.73 && v < 0.8) return u > 0.43 && u < 0.57 && v > 0.745 ? '#6a6aae' : '#2e2e52';
      if (u > 0.36 && u < 0.64 && v >= 0.8 && v < 0.9) {
        if (v > 0.82 && v < 0.86 && (u < 0.41 || u > 0.59)) return '#ff2e4f';
        if (v > 0.865 && v < 0.885 && u > 0.46 && u < 0.54) return '#f4f3ff';
        return '#3b3b6b';
      }
      if (v >= 0.9 && v < 0.95 && ((u > 0.37 && u < 0.44) || (u > 0.56 && u < 0.63))) return '#0b0b14';
      return undefined;
    });
  },

  'ciel-etoile'(t) {
    t.peindre((_, v) => bandes(v / 0.8, ['#03031a', '#070726', '#0c0c38', '#13134a', '#1c1c5c']));
    etoiles(t, 21, 0.05, 0.72, ['#f4f3ff', '#f4f3ff', '#2ee6e6', '#ffd23f', '#a98bff']);
    // Croissant de lune
    t.peindre((u, v) =>
      dansEllipse(u, v, 0.74, 0.24, 0.12, 0.12) && !dansEllipse(u, v, 0.79, 0.2, 0.11, 0.11)
        ? '#fff3c4'
        : undefined,
    );
    // Étoile filante
    t.peindre((u, v) => (Math.abs(v - (0.12 + (u - 0.12) * 0.45)) < 0.5 / t.n && u > 0.12 && u < 0.3 ? '#f4f3ff' : undefined), 'clign');
    // Collines et petite cabane éclairée
    t.peindre((u, v) => {
      const loin = 0.74 + 0.05 * Math.sin(u * 5 + 1);
      const pres = 0.84 + 0.04 * Math.sin(u * 8 + 3);
      if (v > pres) return '#05050f';
      if (v > loin) return '#0a0a22';
      return undefined;
    });
    t.peindre((u, v) => {
      if (dansTriangle(u, v, [0.2, 0.7], [0.3, 0.78], [0.1, 0.78])) return '#2a1a10';
      if (u > 0.12 && u < 0.28 && v >= 0.78 && v < 0.88) {
        return u > 0.15 && u < 0.2 && v > 0.8 && v < 0.85 ? '#ffd23f' : '#3d2614';
      }
      return undefined;
    });
  },

  horloge(t) {
    t.peindre(() => '#05050c');
    // Les groupes de chiffres sont posés séparément pour faire clignoter les deux-points.
    const e = t.n === 64 ? 2 : 1;
    const l2 = pixelsTexte('21').largeur;
    const gauche = Math.round((t.n - pixelsTexte('21:42').largeur * e) / 2);
    const y0 = Math.round(0.42 * t.n - (HAUTEUR_POLICE * e) / 2);
    const poser = (s: string, x0: number, anim?: 'clign') => {
      for (const [px, py] of pixelsTexte(s).points) {
        for (let dy = 0; dy < e; dy++) for (let dx = 0; dx < e; dx++) t.set(x0 + px * e + dx, y0 + py * e + dy, '#2ee6e6', anim);
      }
    };
    poser('21', gauche);
    poser(':', gauche + (l2 + 1) * e, 'clign');
    poser('42', gauche + (l2 + 3) * e);
    // Barre des secondes et jours de la semaine
    t.peindre((u, v) => {
      if (v > 0.66 && v < 0.66 + 1.5 / t.n && u > 0.16 && u < 0.84) return u < 0.6 ? '#ff4fa8' : '#3a1630';
      return undefined;
    });
    for (let j = 0; j < 7; j++) {
      const x = Math.round(t.n * (0.2 + j * 0.1));
      const y = Math.round(t.n * 0.78);
      for (let d = 0; d < e; d++) for (let d2 = 0; d2 < e; d2++) t.set(x + d, y + d2, j === 2 ? '#ffd23f' : '#3a3a72');
    }
    // Cadre décoratif
    t.peindre((u, v) => (u < 1 / t.n || u > 1 - 1 / t.n || v < 1 / t.n || v > 1 - 1 / t.n ? '#1d1d48' : undefined));
  },

  coeur(t) {
    t.peindre((_, v) => bandes(v, ['#160022', '#1d0430', '#24063a']));
    etoiles(t, 5, 0.03, 1, ['#ff8fc1', '#ffd2f0', '#a98bff']);
    const dedans = (u: number, v: number, s: number) => {
      const x = ((u - 0.5) * 2.8) / s;
      const y = ((0.5 - v) * 2.8) / s + 0.1;
      return (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0;
    };
    for (const [anim, s] of [['alt-a', 1], ['alt-b', 0.88]] as const) {
      const p = t.px;
      t.peindre((u, v) => {
        if (!dedans(u, v, s)) return undefined;
        const bord = !dedans(u - p, v, s) || !dedans(u + p, v, s) || !dedans(u, v - p, s) || !dedans(u, v + p, s);
        if (bord) return '#a3123d';
        if (dansEllipse(u, v, 0.37, 0.36, 0.06 * s, 0.05 * s)) return '#ffc2d6';
        return v > 0.55 ? '#e01e55' : '#ff2e5f';
      }, anim);
    }
  },

  chat(t) {
    t.peindre((_, v) => bandes(v, ['#1f0f45', '#2a1450', '#38195f', '#4a1f6e']));
    etoiles(t, 11, 0.02, 0.35, ['#f4f3ff', '#ffd23f']);
    const roux = '#ff9a3c';
    const fonce = '#d0641a';
    const clair = '#ffcf8f';
    t.peindre((u, v) => {
      // queue
      const dq = Math.hypot(u - 0.73, v - 0.8);
      if (v < 0.86 && u > 0.7 && Math.abs(dq - 0.11) < 0.03) return fonce;
      // corps
      if (dansEllipse(u, v, 0.5, 0.74, 0.21, 0.2)) {
        if (dansEllipse(u, v, 0.5, 0.76, 0.1, 0.13)) return clair;
        return roux;
      }
      // pattes
      if (dansEllipse(u, v, 0.42, 0.92, 0.06, 0.04) || dansEllipse(u, v, 0.58, 0.92, 0.06, 0.04)) return clair;
      // oreilles
      if (dansTriangle(u, v, [0.33, 0.36], [0.37, 0.15], [0.47, 0.29]) || dansTriangle(u, v, [0.67, 0.36], [0.63, 0.15], [0.53, 0.29])) {
        if (dansTriangle(u, v, [0.36, 0.32], [0.38, 0.2], [0.44, 0.29]) || dansTriangle(u, v, [0.64, 0.32], [0.62, 0.2], [0.56, 0.29])) return '#ff7aa8';
        return roux;
      }
      // tête
      if (dansEllipse(u, v, 0.5, 0.43, 0.18, 0.16)) {
        if (Math.abs(u - 0.5) < 0.6 / t.n && v > 0.28 && v < 0.34) return fonce;
        if (Math.abs(u - 0.44) < 0.5 / t.n && v > 0.29 && v < 0.33 && t.n === 64) return fonce;
        if (Math.abs(u - 0.56) < 0.5 / t.n && v > 0.29 && v < 0.33 && t.n === 64) return fonce;
        if (dansTriangle(u, v, [0.47, 0.47], [0.53, 0.47], [0.5, 0.5])) return '#ff7aa8';
        if (dansEllipse(u, v, 0.5, 0.52, 0.07, 0.03)) return clair;
        return roux;
      }
      return undefined;
    });
    // yeux : ouverts la plupart du temps, fermés un court instant
    t.peindre((u, v) => {
      for (const cx of [0.43, 0.57]) {
        if (dansEllipse(u, v, cx, 0.41, 0.035, 0.04)) return Math.abs(u - cx) < 0.5 / t.n && t.n === 64 ? '#0b0b14' : '#46f28c';
      }
      return undefined;
    }, 'oeil-o');
    t.peindre((u, v) => {
      for (const cx of [0.43, 0.57]) {
        if (Math.abs(v - 0.42) < 0.5 / t.n && Math.abs(u - cx) < 0.04) return fonce;
      }
      return undefined;
    }, 'oeil-f');
  },

  fusee(t) {
    t.peindre((_, v) => bandes(v, ['#04040f', '#070718', '#0b0b24']));
    etoiles(t, 33, 0.04, 1, ['#f4f3ff', '#2ee6e6', '#ffd23f']);
    // Planète à anneau
    t.peindre((u, v) => {
      const anneau = dansEllipse(u, v, 0.2, 0.76, 0.17, 0.035) && !dansEllipse(u, v, 0.2, 0.76, 0.13, 0.02);
      if (anneau && v > 0.76) return '#ffd23f';
      if (dansEllipse(u, v, 0.2, 0.76, 0.09, 0.09)) return v < 0.74 ? '#a98bff' : '#7a5cd6';
      if (anneau) return '#ffd23f';
      return undefined;
    });
    const cx = 0.58;
    t.peindre((u, v) => {
      // ailerons
      if (dansTriangle(u, v, [cx - 0.08, 0.52], [cx - 0.17, 0.72], [cx - 0.08, 0.68])) return '#ff4f5f';
      if (dansTriangle(u, v, [cx + 0.08, 0.52], [cx + 0.17, 0.72], [cx + 0.08, 0.68])) return '#ff4f5f';
      // corps et ogive
      if (v > 0.12 && v < 0.69) {
        const demi = v < 0.3 ? 0.09 * Math.sqrt((v - 0.12) / 0.18) : 0.09;
        if (Math.abs(u - cx) < demi) {
          if (dansEllipse(u, v, cx, 0.4, 0.05, 0.05)) return dansEllipse(u, v, cx, 0.4, 0.033, 0.033) ? '#2ee6e6' : '#3a3a72';
          if (v < 0.25) return '#ff4f5f';
          return Math.abs(u - cx) > 0.06 ? '#c9c8e6' : '#f4f3ff';
        }
      }
      // tuyère
      if (v >= 0.69 && v < 0.73 && Math.abs(u - cx) < 0.06) return '#6a6aae';
      return undefined;
    });
    // flamme en deux images
    for (const [anim, longueur] of [['alt-a', 0.2], ['alt-b', 0.13]] as const) {
      t.peindre((u, v) => {
        if (v < 0.73 || v > 0.73 + longueur) return undefined;
        const p = (v - 0.73) / longueur;
        const demi = 0.055 * (1 - p);
        const d = Math.abs(u - cx);
        if (d > demi) return undefined;
        return d < demi * 0.45 && p < 0.6 ? '#fff3c4' : p < 0.5 ? '#ffd23f' : '#ff7a3d';
      }, anim);
    }
  },

  'vague-neon'(t) {
    t.peindre((_, v) => bandes(v, ['#050518', '#08081f', '#0b0927', '#0e0830']));
    const vagues: [number, string][] = [
      [0.26, '#2ee6e6'],
      [0.42, '#ff4fa8'],
      [0.58, '#a98bff'],
      [0.74, '#ffd23f'],
    ];
    for (const [anim, phase] of [['alt-a', 0], ['alt-b', 0.25]] as const) {
      t.peindre((u, v) => {
        for (const [i, [y, c]] of vagues.entries()) {
          const yc = y + 0.06 * Math.sin(2 * Math.PI * (u * 1.3 + phase + i * 0.17));
          if (Math.abs(v - yc) < 0.75 / t.n) return c;
        }
        return undefined;
      }, anim);
    }
  },

  'erreur-404'(t) {
    t.peindre((_, v) => bandes(v, ['#08080f', '#0b0b16']));
    etoiles(t, 404, 0.02, 1, ['#3a3a72', '#ff4fa8', '#2ee6e6']);
    texte(t, '404', 0.36, '#ff4fa8');
    texte(t, 'OUPS', 0.66, '#2ee6e6', 'clign');
  },
};

export function dessinerScene(nom: NomScene, n: Taille): Toile {
  const t = new Toile(n);
  DESSINS[nom](t);
  return t;
}
