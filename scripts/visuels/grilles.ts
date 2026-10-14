/* Exporte les couleurs LED de chaque scène (image fixe) pour scripts/visuels/led.py. */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dessinerScene, NOMS_SCENES } from '../../src/lib/pixel/scenes.ts';

const visibles = new Set(['alt-a', 'scint-1', 'scint-2', 'scint-3', 'clign', 'oeil-o']);
const sortie: Record<string, (string | null)[][]> = {};
for (const nom of NOMS_SCENES) {
  for (const n of [32, 64] as const) {
    const t = dessinerScene(nom, n);
    const g = t.base.map((l) => [...l]);
    for (const [anim, px] of t.calques) if (visibles.has(anim)) for (const [i, c] of px) g[Math.floor(i / n)]![i % n] = c;
    sortie[`${nom}-${n}`] = g;
  }
}
writeFileSync(join(import.meta.dirname, 'grilles.json'), JSON.stringify(sortie));
