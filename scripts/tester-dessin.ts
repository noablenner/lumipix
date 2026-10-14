/*
 * Tests du format de dessin, des modèles et des fonctions de partage.
 * Lancé à chaque build (npm run build) : node scripts/tester-dessin.ts
 */
import { decoderDessin, dessinVide, encoderDessin, redimensionner } from '../src/lib/pixel/dessin.ts';
import { dessinerModele, MODELES, type NomModele } from '../src/lib/pixel/modeles.ts';
import worker from '../src/worker.ts';

let echecs = 0;
const verifier = (ok: unknown, message: string) => {
  if (!ok) {
    echecs++;
    console.error(`  ✗ ${message}`);
  }
};

// Aller-retour encodage / décodage
for (const nom of Object.keys(MODELES) as NomModele[]) {
  for (const n of [32, 64] as const) {
    const d = dessinerModele(nom, n);
    const r = decoderDessin(encoderDessin(d));
    verifier(r && r.taille === n && r.pixels.every((p, i) => p === d.pixels[i]), `aller-retour ${nom} ${n}`);
    verifier(d.pixels.some((p) => p !== 0), `modèle ${nom} ${n} non vide`);
  }
}
const bruit = dessinVide(64);
bruit.pixels.forEach((_, i) => (bruit.pixels[i] = (i * 7) % 16));
verifier(decoderDessin(encoderDessin(bruit)), 'pire cas 64x64');

// Codes invalides
for (const code of ['', 'abc', '!!', 'AQ', encoderDessin(bruit).slice(0, -4), 'x'.repeat(13000)]) {
  verifier(decoderDessin(code) === null, `code invalide rejeté : « ${code.slice(0, 12)} »`);
}

// 32 -> 64 sans perte
const coeur = dessinerModele('coeur', 32);
const grand = redimensionner(coeur, 64);
verifier(grand.taille === 64 && redimensionner(grand, 32).pixels.every((p, i) => p === coeur.pixels[i]), '32 → 64 → 32 sans perte');

// Fonctions de partage
// Worker : routes de partage et repli sur les fichiers statiques
const code = encoderDessin(dessinerModele('fusee', 32));
const env = { ASSETS: { fetch: async (r: Request) => new Response(`statique:${new URL(r.url).pathname}`) } };
const ctx = { waitUntil() {} };
const appel = (chemin: string) => worker.fetch(new Request(`https://lumipix.shop${chemin}`), env, ctx);
const html = await (await appel(`/dessin/${code}`)).text();
verifier(html.includes(`/api/dessin/${code}.png`) && html.includes('og:image'), 'page de partage : og:image');
verifier(!/<script/i.test(html), 'page de partage : aucun script');
verifier((await appel('/dessin/zz')).status === 302, 'page de partage : code invalide redirigé');
verifier((await (await appel('/dessin/%22%3E%3Cscript%3E')).text()).startsWith('statique:'), 'page de partage : caractères interdits ignorés');
const png = await appel(`/api/dessin/${code}.png`);
const octets = new Uint8Array(await png.arrayBuffer());
verifier(png.status === 200 && octets[1] === 0x50 && octets[2] === 0x4e && octets[3] === 0x47, 'image de partage : PNG valide');
verifier((await appel('/api/dessin/zz.png')).status === 404, 'image de partage : code invalide');
verifier((await (await appel('/produits/cadre-pixel-art-led')).text()) === 'statique:/produits/cadre-pixel-art-led', 'repli sur les fichiers statiques');

if (echecs) {
  console.error(`\n✗ Tests du dessin : ${echecs} échec(s)`);
  process.exit(1);
}
console.log('✓ Tests du dessin : format, modèles et fonctions de partage');
