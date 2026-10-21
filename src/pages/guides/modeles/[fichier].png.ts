import type { APIRoute, GetStaticPaths } from 'astro';
import { MODELES, dessinerModele, type NomModele } from '../../../lib/pixel/modeles.ts';
import { PALETTE } from '../../../lib/pixel/dessin.ts';
import { encoderPng } from '../../../lib/pixel/png.ts';

/*
 * Modèles de pixel art téléchargeables (guide pixel art 32x32) :
 * /guides/modeles/coeur-32.png, /guides/modeles/coeur-64.png…
 * PNG à la résolution exacte du cadre, prêts à importer dans l'application.
 */
export const getStaticPaths = (() =>
  (Object.keys(MODELES) as NomModele[]).flatMap((nom) =>
    ([32, 64] as const).map((taille) => ({ params: { fichier: `${nom}-${taille}` }, props: { nom, taille } })),
  )) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { nom, taille } = props as { nom: NomModele; taille: 32 | 64 };
  const d = dessinerModele(nom, taille);
  const png = await encoderPng(taille, taille, d.pixels, PALETTE);
  return new Response(png as BodyInit, { headers: { 'Content-Type': 'image/png' } });
};
