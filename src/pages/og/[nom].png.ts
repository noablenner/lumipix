import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { svgOg, type LigneOg } from '../../lib/pixel/og.ts';
import type { NomScene } from '../../lib/pixel/scenes.ts';
import { getCollection } from 'astro:content';

/* Images de partage /og/[nom].png, générées au build à partir du rendu du cadre. */
const BLANC = '#f4f3ff';
const ROSE = '#ff4fa8';
const CYAN = '#2ee6e6';
const JAUNE = '#ffd23f';

const IMAGES: Record<string, { scene: NomScene; lignes: LigneOg[] }> = {
  accueil: {
    scene: 'coucher-soleil',
    lignes: [
      { texte: 'LUMIPIX', couleur: BLANC, echelle: 10 },
      { texte: 'DECO PIXEL ART', couleur: ROSE, echelle: 6 },
      { texte: 'CADRE LED 32X32 ET 64X64', couleur: CYAN, echelle: 3 },
    ],
  },
  'cadre-pixel-art-led': {
    scene: 'ciel-etoile',
    lignes: [
      { texte: 'CADRE PIXEL', couleur: BLANC, echelle: 8 },
      { texte: 'ART LED', couleur: BLANC, echelle: 8 },
      { texte: '32X32 ET 64X64', couleur: CYAN, echelle: 5 },
      { texte: 'LIVRAISON OFFERTE', couleur: JAUNE, echelle: 4 },
    ],
  },
  'setup-gaming': {
    scene: 'vague-neon',
    lignes: [
      { texte: 'DECO SETUP', couleur: BLANC, echelle: 8 },
      { texte: 'GAMING', couleur: ROSE, echelle: 8 },
      { texte: 'LUMIPIX', couleur: CYAN, echelle: 5 },
    ],
  },
  'idees-cadeaux': {
    scene: 'coeur',
    lignes: [
      { texte: 'IDEE CADEAU', couleur: BLANC, echelle: 8 },
      { texte: 'GAMER', couleur: ROSE, echelle: 8 },
      { texte: 'CADRE PIXEL ART LED', couleur: CYAN, echelle: 3 },
    ],
  },
  defaut: {
    scene: 'chat',
    lignes: [
      { texte: 'LUMIPIX', couleur: BLANC, echelle: 10 },
      { texte: 'DECO PIXEL ART', couleur: ROSE, echelle: 6 },
    ],
  },
};

// Une image par guide, à partir de sa scène et de og_lignes
const COULEURS_GUIDE = [BLANC, ROSE, CYAN, JAUNE];
for (const g of await getCollection('guides')) {
  IMAGES[`guide-${g.data.slug}`] = {
    scene: g.data.scene,
    lignes: [
      ...g.data.og_lignes.map((texte, i) => ({ texte, couleur: COULEURS_GUIDE[i]!, echelle: i === g.data.og_lignes.length - 1 ? 4 : 7 })),
      { texte: 'LUMIPIX', couleur: JAUNE, echelle: 3 },
    ],
  };
}

export const getStaticPaths = (() => Object.keys(IMAGES).map((nom) => ({ params: { nom } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const { scene, lignes } = IMAGES[params.nom as string]!;
  const png = await sharp(Buffer.from(svgOg(scene, lignes))).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
