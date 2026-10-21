/*
 * Garde-fous exécutés après chaque build (npm run build). Le build échoue si :
 * 1. une donnée fournisseur apparaît dans dist/ (brief §4.9) ;
 * 2. une marque ou un univers protégé apparaît dans src/ ou dist/ (brief §2) ;
 * 3. le nom du directeur de la publication ou l'adresse du siège sortent des
 *    pages autorisées (brief §10) ;
 * 4. une paire de couleurs passe sous le seuil WCAG AA (brief §5).
 *
 * Lancement : node scripts/verifier-build.ts (Node 22.18+, types effacés nativement).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { parse } from 'yaml';
import { SOCIETE, estPlaceholder } from '../src/config/societe.ts';
import { lireCouleurs, ratioContraste } from '../src/lib/contraste.ts';
import { PAIRES_CONTRASTE } from '../src/styles/contrastes.ts';

const RACINE = join(import.meta.dirname, '..');
const DIST = join(RACINE, 'dist');
const EXTENSIONS_TEXTE = new Set(['.html', '.js', '.mjs', '.css', '.xml', '.txt', '.json', '.svg', '.webmanifest', '.md', '.ts', '.astro', '.mdx']);

const erreurs: string[] = [];

function fichiers(dossier: string, exclus: string[] = []): string[] {
  if (!existsSync(dossier)) return [];
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (exclus.some((e) => chemin.startsWith(e))) return [];
    if (statSync(chemin).isDirectory()) return fichiers(chemin, exclus);
    return EXTENSIONS_TEXTE.has(extname(nom)) ? [chemin] : [];
  });
}

const normaliser = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

if (!existsSync(DIST)) {
  console.error('dist/ introuvable : lancer astro build avant la vérification.');
  process.exit(1);
}
const fichiersDist = fichiers(DIST).map((f) => ({ f, contenu: readFileSync(f, 'utf8') }));

// 1. Fuite de données fournisseur
const dossierProduits = join(RACINE, 'src/content/produits');
const secrets = new Set<string>(['aliexpress', 'aliexpress-media']);
for (const f of fichiers(dossierProduits).filter((f) => f.endsWith('.md'))) {
  const fm = readFileSync(f, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  const fournisseur = fm ? parse(fm[1]!)?.fournisseur : undefined;
  if (!fournisseur) continue;
  const ajouter = (v: unknown) => {
    if (typeof v === 'string' && v.length >= 6) secrets.add(v.toLowerCase());
  };
  ajouter(fournisseur.nom);
  ajouter(fournisseur.url);
  ajouter(fournisseur.id_produit);
  ajouter(fournisseur.note_vendeur);
  ajouter(fournisseur.limite_achat);
  for (const v of Object.values<Record<string, unknown>>(fournisseur.variantes ?? {})) {
    ajouter(v.libelle_fournisseur);
    ajouter(v.id_variante);
  }
  for (const g of fournisseur.medias_sources?.galerie ?? []) ajouter(g);
}
for (const { f, contenu } of fichiersDist) {
  const bas = contenu.toLowerCase();
  for (const s of secrets) {
    if (bas.includes(s)) erreurs.push(`Donnée fournisseur « ${s} » exposée dans ${relative(RACINE, f)}`);
  }
}

// 2. Marques et univers protégés
const MARQUES = [
  'minecraft', 'nintendo', 'mario', 'luigi', 'pac-man', 'pacman', 'space invaders', 'pokemon', 'pikachu',
  'playstation', 'xbox', 'divoom', 'tetris', 'zelda', 'sega', 'atari', 'game boy', 'gameboy', 'kirby',
];
const motif = new RegExp(`\\b(${MARQUES.map((m) => m.replace(/[-\s]/g, '[-\\s]?')).join('|')})\\b`, 'i');
const fichiersSource = fichiers(join(RACINE, 'src')).map((f) => ({ f, contenu: readFileSync(f, 'utf8') }));
for (const { f, contenu } of [...fichiersSource, ...fichiersDist]) {
  const m = normaliser(contenu).match(motif);
  if (m) erreurs.push(`Marque protégée « ${m[1]} » trouvée dans ${relative(RACINE, f)}`);
}
for (const f of [...fichiers(join(RACINE, 'public')), ...fichiers(join(RACINE, 'assets'))]) {
  const m = normaliser(relative(RACINE, f)).match(motif);
  if (m) erreurs.push(`Marque protégée « ${m[1]} » dans le nom de fichier ${relative(RACINE, f)}`);
}

// 3. Confidentialité des données société
const restreindre = (valeur: string, pagesAutorisees: string[], libelle: string) => {
  if (estPlaceholder(valeur)) return;
  for (const { f, contenu } of fichiersDist) {
    const page = relative(DIST, f);
    if (contenu.includes(valeur) && !pagesAutorisees.includes(page)) {
      erreurs.push(`${libelle} présent hors des pages autorisées : ${page}`);
    }
  }
};
restreindre(SOCIETE.directeurPublication, ['mentions-legales.html'], 'Nom du directeur de la publication');
restreindre(SOCIETE.adresseSiege, ['mentions-legales.html', 'cgv.html'], 'Adresse du siège');
restreindre(SOCIETE.adresseRetours, [], 'Adresse de retour');
// Email de contact : uniquement là où la loi l'impose (éditeur, vendeur, rétractation, droits RGPD)
restreindre(SOCIETE.emailContact, ['mentions-legales.html', 'cgv.html', 'retours.html', 'confidentialite.html'], 'Email de contact');

// 4. Contrastes
const couleurs = lireCouleurs(readFileSync(join(RACINE, 'src/styles/tokens.css'), 'utf8'));
for (const p of PAIRES_CONTRASTE) {
  const a = couleurs[p.texte];
  const b = couleurs[p.fond];
  if (!a || !b) {
    erreurs.push(`Contraste : couleur inconnue ${p.texte} ou ${p.fond}`);
    continue;
  }
  const r = ratioContraste(a, b);
  if (r < p.min) erreurs.push(`Contraste insuffisant ${p.texte} / ${p.fond} : ${r.toFixed(2)} < ${p.min}`);
}

if (erreurs.length) {
  console.error(`\n✗ Vérification du build : ${erreurs.length} problème(s)\n`);
  for (const e of erreurs) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ Vérification du build : ${fichiersDist.length} fichiers contrôlés (fournisseur, marques, confidentialité, contrastes).`);
