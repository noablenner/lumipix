/*
 * Toile de pixels pour dessiner les scènes de l'écran LED.
 * Les formes sont décrites en coordonnées unitaires (0 à 1) et évaluées au
 * centre de chaque pixel : une même scène gagne en détail en 64 x 64.
 */
export type Taille = 32 | 64;
/** Couleur hexadécimale, ou null pour une LED éteinte. */
export type Couleur = string | null;

/** Classes d'animation reconnues par le rendu SVG (voir svg.ts). */
export type Animation = 'alt-a' | 'alt-b' | 'scint-1' | 'scint-2' | 'scint-3' | 'clign' | 'oeil-o' | 'oeil-f';

export class Toile {
  readonly n: Taille;
  readonly base: Couleur[][];
  readonly calques = new Map<Animation, Map<number, string>>();

  constructor(n: Taille) {
    this.n = n;
    this.base = Array.from({ length: n }, () => Array<Couleur>(n).fill(null));
  }

  set(x: number, y: number, c: Couleur, anim?: Animation) {
    if (x < 0 || y < 0 || x >= this.n || y >= this.n) return;
    if (!anim) {
      this.base[y]![x] = c;
      return;
    }
    if (c === null) return;
    let calque = this.calques.get(anim);
    if (!calque) this.calques.set(anim, (calque = new Map()));
    calque.set(y * this.n + x, c);
  }

  /** Applique fn au centre de chaque pixel ; undefined = pixel inchangé. */
  peindre(fn: (u: number, v: number, x: number, y: number) => Couleur | undefined, anim?: Animation) {
    const n = this.n;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const c = fn((x + 0.5) / n, (y + 0.5) / n, x, y);
        if (c !== undefined) this.set(x, y, c, anim);
      }
    }
  }

  /** Taille d'un pixel en coordonnées unitaires. */
  get px() {
    return 1 / this.n;
  }
}

/** Générateur pseudo-aléatoire déterministe (mêmes étoiles à chaque build). */
export function aleatoire(graine: number) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Choisit la couleur de la bande correspondant à t (dégradé en paliers, effet LED). */
export function bandes(t: number, couleurs: string[]): string {
  const i = Math.min(couleurs.length - 1, Math.max(0, Math.floor(t * couleurs.length)));
  return couleurs[i]!;
}

/** Vrai si (u, v) est dans le triangle abc. */
export function dansTriangle(u: number, v: number, a: [number, number], b: [number, number], c: [number, number]) {
  const s = (p: [number, number], q: [number, number]) => (u - q[0]) * (p[1] - q[1]) - (p[0] - q[0]) * (v - q[1]);
  const d1 = s(a, b);
  const d2 = s(b, c);
  const d3 = s(c, a);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

export const dansEllipse = (u: number, v: number, cx: number, cy: number, rx: number, ry: number) =>
  ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2 <= 1;
