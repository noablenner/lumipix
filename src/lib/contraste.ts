/* Ratio de contraste WCAG 2.x entre deux couleurs hexadécimales. */

function canal(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return 0.2126 * canal(r!) + 0.7152 * canal(g!) + 0.0722 * canal(b!);
}

export function ratioContraste(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1! + 0.05) / (l2! + 0.05);
}

/** Extrait les couleurs `--c-xxx: #hex;` d'une feuille CSS. */
export function lireCouleurs(css: string): Record<string, string> {
  const res: Record<string, string> = {};
  for (const m of css.matchAll(/--(c-[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g)) {
    res[m[1]!] = m[2]!;
  }
  return res;
}
