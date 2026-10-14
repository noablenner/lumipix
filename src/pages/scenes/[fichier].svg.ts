import type { APIRoute, GetStaticPaths } from 'astro';
import { NOMS_SCENES, type NomScene } from '../../lib/pixel/scenes.ts';
import { dessinerScene } from '../../lib/pixel/scenes.ts';
import { toileVersSvg } from '../../lib/pixel/svg.ts';

/* Fichiers statiques /scenes/[scene]-32.svg et /scenes/[scene]-64.svg */
export const getStaticPaths = (() =>
  NOMS_SCENES.flatMap((scene) =>
    ([32, 64] as const).map((n) => ({ params: { fichier: `${scene}-${n}` }, props: { scene, n } })),
  )) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const { scene, n } = props as { scene: NomScene; n: 32 | 64 };
  return new Response(toileVersSvg(dessinerScene(scene, n), { id: `${scene}-${n}` }), {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });
};
