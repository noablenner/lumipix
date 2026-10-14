/*
 * Logique de l'éditeur pixel art, chargée à la demande par Editeur.astro.
 * Sans framework : canvas 2D, événements pointeur (doigt et souris), clavier.
 */
import {
  PALETTE,
  NOMS_COULEURS,
  decoderDessin,
  dessinVide,
  encoderDessin,
  estVide,
  redimensionner,
  type Dessin,
  type TailleDessin,
} from '../lib/pixel/dessin';
import { MODELES, dessinerModele, type NomModele } from '../lib/pixel/modeles';
import { encoderPng } from '../lib/pixel/png';
import { ajouterAuPanier, nombreArticles } from './panier';

type Outil = 'crayon' | 'gomme' | 'remplir' | 'pipette';

const CLE_BROUILLON = 'lumipix:dessin';
const LIMITE_HISTORIQUE = 60;

export function demarrer(racine: HTMLElement) {
  const $ = <T extends Element>(sel: string) => racine.querySelector<T>(sel);
  const $$ = <T extends Element>(sel: string) => [...racine.querySelectorAll<T>(sel)];

  const toile = $<HTMLCanvasElement>('[data-toile]')!;
  const led = $<HTMLCanvasElement>('[data-led]')!;
  const ctx = toile.getContext('2d')!;
  const ctxLed = led.getContext('2d')!;
  const mini = $<HTMLCanvasElement>('[data-led-mini]');
  const ctxMini = mini?.getContext('2d');
  const statut = $<HTMLElement>('[data-statut]')!;
  const produit = racine.dataset.produit!;
  const formAchat = document.querySelector<HTMLFormElement>('[data-form-achat]');
  const radiosVariante = formAchat ? [...formAchat.querySelectorAll<HTMLInputElement>('input[name="variante"]')] : [];

  let dessin: Dessin = dessinVide(racine.dataset.taille === '32' ? 32 : 64);
  let outil: Outil = 'crayon';
  let couleur = 2;
  const annuler: Dessin[] = [];
  const retablir: Dessin[] = [];
  let curseur = { x: 0, y: 0, visible: false };

  const copie = (d: Dessin): Dessin => ({ taille: d.taille, pixels: d.pixels.slice() });
  const dire = (texte: string) => (statut.textContent = texte);

  // ---------- Historique ----------
  function memoriser() {
    annuler.push(copie(dessin));
    if (annuler.length > LIMITE_HISTORIQUE) annuler.shift();
    retablir.length = 0;
    majBoutons();
  }
  function majBoutons() {
    $<HTMLButtonElement>('[data-action="annuler"]')!.disabled = annuler.length === 0;
    $<HTMLButtonElement>('[data-action="retablir"]')!.disabled = retablir.length === 0;
  }
  function revenir(depuis: Dessin[], vers: Dessin[]) {
    const etat = depuis.pop();
    if (!etat) return;
    vers.push(copie(dessin));
    remplacer(etat); // resynchronise la variante si la taille change
    majBoutons();
  }

  // ---------- Rendu ----------
  let demande = 0;
  function redessiner() {
    if (demande) return;
    demande = requestAnimationFrame(() => {
      demande = 0;
      peindreGrille();
      peindreLed();
      sauvegarder();
    });
  }

  // Grille : une tuile par pixel, séparées par un fin joint (comme les LED du cadre)
  function peindreGrille() {
    const n = dessin.taille;
    const W = toile.width;
    const c = W / n;
    const joint = n === 32 ? 2 : 1;
    ctx.fillStyle = '#040407';
    ctx.fillRect(0, 0, W, W);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const i = dessin.pixels[y * n + x]!;
        ctx.fillStyle = i ? PALETTE[i]! : (x + y) % 2 ? '#14141c' : '#17171f';
        const x0 = Math.round(x * c) + joint / 2;
        const y0 = Math.round(y * c) + joint / 2;
        ctx.fillRect(x0, y0, Math.round((x + 1) * c) - Math.round(x * c) - joint, Math.round((y + 1) * c) - Math.round(y * c) - joint);
      }
    }
    // repères tous les 8 pixels, très discrets
    ctx.fillStyle = 'rgba(46, 230, 230, 0.22)';
    for (let k = 8; k < n; k += 8) {
      const p = Math.round(k * c) - 1;
      ctx.fillRect(p, 0, 1, W);
      ctx.fillRect(0, p, W, 1);
    }
    if (curseur.visible) {
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 3;
      ctx.strokeRect(curseur.x * c + 1.5, curseur.y * c + 1.5, c - 3, c - 3);
    }
  }

  // Écran LED : diodes carrées arrondies et halo obtenu par réduction / agrandissement (aucun filtre requis).
  const nette = document.createElement('canvas');
  const halo = document.createElement('canvas');
  function peindreLed() {
    const n = dessin.taille;
    const W = led.width;
    nette.width = nette.height = W;
    const cn = nette.getContext('2d')!;
    const c = W / n;
    const t = c * 0.78;
    const r = c * 0.18;
    cn.fillStyle = '#030306';
    cn.fillRect(0, 0, W, W);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const i = dessin.pixels[y * n + x]!;
        cn.fillStyle = i ? PALETTE[i]! : '#101016';
        cn.beginPath();
        cn.roundRect(x * c + (c - t) / 2, y * c + (c - t) / 2, t, t, r);
        cn.fill();
      }
    }
    halo.width = halo.height = Math.max(16, Math.round(W / 10));
    const ch = halo.getContext('2d')!;
    ch.imageSmoothingEnabled = true;
    ch.drawImage(nette, 0, 0, halo.width, halo.height);
    ctxLed.globalCompositeOperation = 'source-over';
    ctxLed.drawImage(nette, 0, 0);
    ctxLed.globalCompositeOperation = 'lighter';
    ctxLed.globalAlpha = 0.55;
    ctxLed.imageSmoothingEnabled = true;
    ctxLed.drawImage(halo, 0, 0, W, W);
    ctxLed.globalAlpha = 1;
    ctxLed.globalCompositeOperation = 'source-over';
    if (mini && ctxMini && mini.offsetParent) {
      ctxMini.imageSmoothingEnabled = true;
      ctxMini.drawImage(led, 0, 0, mini.width, mini.height);
    }
  }

  // ---------- Dessin ----------
  function poser(x: number, y: number) {
    const n = dessin.taille;
    if (x < 0 || y < 0 || x >= n || y >= n) return;
    dessin.pixels[y * n + x] = outil === 'gomme' ? 0 : couleur;
  }
  function ligne(x0: number, y0: number, x1: number, y1: number) {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      poser(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }
  function remplir(x: number, y: number) {
    const n = dessin.taille;
    const p = dessin.pixels;
    const cible = p[y * n + x]!;
    if (cible === couleur) return;
    const pile = [y * n + x];
    while (pile.length) {
      const i = pile.pop()!;
      if (p[i] !== cible) continue;
      p[i] = couleur;
      const cx = i % n;
      if (cx > 0) pile.push(i - 1);
      if (cx < n - 1) pile.push(i + 1);
      if (i >= n) pile.push(i - n);
      if (i < n * (n - 1)) pile.push(i + n);
    }
  }
  function appliquer(x: number, y: number, debut: boolean, precedent?: { x: number; y: number }) {
    if (outil === 'pipette') {
      if (debut) choisirCouleur(dessin.pixels[y * dessin.taille + x]!);
      return;
    }
    if (outil === 'remplir') {
      if (debut) remplir(x, y);
    } else if (precedent) ligne(precedent.x, precedent.y, x, y);
    else poser(x, y);
    redessiner();
  }

  function cellule(e: PointerEvent) {
    const r = toile.getBoundingClientRect();
    const n = dessin.taille;
    return {
      x: Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n))),
      y: Math.min(n - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * n))),
    };
  }

  let trace: { x: number; y: number } | null = null;
  toile.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    try {
      toile.setPointerCapture(e.pointerId);
    } catch {
      // pointeur déjà relâché : le tracé continue sans capture
    }
    const c = cellule(e);
    if (outil !== 'pipette') memoriser();
    appliquer(c.x, c.y, true);
    trace = c;
  });
  toile.addEventListener('pointermove', (e) => {
    if (!trace || (outil !== 'crayon' && outil !== 'gomme')) return;
    const c = cellule(e);
    if (c.x === trace.x && c.y === trace.y) return;
    appliquer(c.x, c.y, false, trace);
    trace = c;
  });
  const finTrace = () => (trace = null);
  toile.addEventListener('pointerup', finTrace);
  toile.addEventListener('pointercancel', finTrace);

  // Clavier : flèches + Espace, raccourcis d'outils et d'historique
  toile.addEventListener('focus', () => {
    curseur.visible = true;
    redessiner();
  });
  toile.addEventListener('blur', () => {
    curseur.visible = false;
    redessiner();
  });
  toile.addEventListener('keydown', (e) => {
    const n = dessin.taille;
    const deplacements: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const d = deplacements[e.key];
    if (d) {
      e.preventDefault();
      const avant = { ...curseur };
      curseur.x = Math.min(n - 1, Math.max(0, curseur.x + d[0]));
      curseur.y = Math.min(n - 1, Math.max(0, curseur.y + d[1]));
      if (e.shiftKey && (outil === 'crayon' || outil === 'gomme')) appliquer(curseur.x, curseur.y, false, avant);
      redessiner();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (outil !== 'pipette') memoriser();
      appliquer(curseur.x, curseur.y, true);
    }
  });
  racine.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) revenir(retablir, annuler);
      else revenir(annuler, retablir);
    } else if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      revenir(retablir, annuler);
    } else if (!mod && document.activeElement === toile) {
      const raccourcis: Record<string, Outil> = { b: 'crayon', e: 'gomme', g: 'remplir', i: 'pipette' };
      const o = raccourcis[e.key.toLowerCase()];
      if (o) choisirOutil(o);
    }
  });

  // ---------- Outils, couleurs, modèles ----------
  function choisirOutil(o: Outil) {
    outil = o;
    $$<HTMLButtonElement>('[data-outil]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.outil === o)));
  }
  function choisirCouleur(i: number) {
    couleur = i;
    $$<HTMLButtonElement>('[data-couleur]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.couleur) === i)));
    if (outil === 'pipette' || outil === 'gomme') choisirOutil('crayon');
    dire(`Couleur : ${NOMS_COULEURS[i]}`);
  }
  $$<HTMLButtonElement>('[data-outil]').forEach((b) => b.addEventListener('click', () => choisirOutil(b.dataset.outil as Outil)));
  $$<HTMLButtonElement>('[data-couleur]').forEach((b) => b.addEventListener('click', () => choisirCouleur(Number(b.dataset.couleur))));

  $$<HTMLCanvasElement>('[data-apercu-modele]').forEach((c) => {
    const m = dessinerModele(c.dataset.apercuModele as NomModele, 32);
    const cc = c.getContext('2d')!;
    const img = cc.createImageData(32, 32);
    m.pixels.forEach((i, k) => {
      const hex = PALETTE[i]!;
      img.data.set([parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255], k * 4);
    });
    cc.putImageData(img, 0, 0);
  });
  $$<HTMLButtonElement>('[data-modele]').forEach((b) =>
    b.addEventListener('click', () => {
      const nom = b.dataset.modele as NomModele;
      memoriser();
      remplacer(dessinerModele(nom, dessin.taille), false);
      dire(`Modèle chargé : ${MODELES[nom]}. Tu peux le modifier.`);
    }),
  );

  $<HTMLButtonElement>('[data-action="annuler"]')!.addEventListener('click', () => revenir(annuler, retablir));
  $<HTMLButtonElement>('[data-action="retablir"]')!.addEventListener('click', () => revenir(retablir, annuler));
  $<HTMLButtonElement>('[data-action="effacer"]')!.addEventListener('click', () => {
    if (estVide(dessin)) return;
    memoriser();
    remplacer(dessinVide(dessin.taille), false);
    dire('Grille effacée. « Annuler » permet de revenir en arrière.');
  });

  // ---------- Taille (synchronisée avec la variante choisie sur la page) ----------
  const radiosTaille = $$<HTMLInputElement>('input[name="editeur-taille"]');
  function remplacer(d: Dessin, synchroniser = true) {
    const changementTaille = d.taille !== dessin.taille;
    dessin = copie(d);
    radiosTaille.forEach((r) => (r.checked = Number(r.value) === d.taille));
    $<HTMLElement>('[data-dim]')!.textContent = `${d.taille}x${d.taille}`;
    if (changementTaille && synchroniser) synchroniserVariante(d.taille);
    curseur.x = Math.min(curseur.x, d.taille - 1);
    curseur.y = Math.min(curseur.y, d.taille - 1);
    majPrix();
    redessiner();
  }
  function changerTaille(taille: TailleDessin, depuisPage: boolean) {
    if (taille === dessin.taille) return;
    memoriser();
    remplacer(redimensionner(dessin, taille), !depuisPage);
    dire(taille === 64 ? 'Grille 64x64 : ton dessin a été agrandi sans perte.' : 'Grille 32x32 : ton dessin a été réduit. « Annuler » pour revenir.');
  }
  radiosTaille.forEach((r) => r.addEventListener('change', () => changerTaille(Number(r.value) as TailleDessin, false)));

  const tailleVariante = (r: HTMLInputElement): TailleDessin => (r.dataset.taille === '32' ? 32 : 64);
  function synchroniserVariante(taille: TailleDessin) {
    const r = radiosVariante.find((v) => tailleVariante(v) === taille && !v.disabled);
    if (r && !r.checked) {
      r.checked = true;
      r.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  radiosVariante.forEach((r) => r.addEventListener('change', () => r.checked && changerTaille(tailleVariante(r), true)));

  function varianteActive() {
    return radiosVariante.find((r) => r.checked && tailleVariante(r) === dessin.taille) ?? radiosVariante.find((r) => tailleVariante(r) === dessin.taille);
  }
  function majPrix() {
    const v = varianteActive();
    const prix = $<HTMLElement>('[data-prix-editeur]');
    if (prix) prix.textContent = v?.dataset.prixTexte ? `${v.dataset.nom?.replace(' pixels', '')} · ${v.dataset.prixTexte}` : '';
  }

  // ---------- Export, partage, panier ----------
  $<HTMLButtonElement>('[data-action="exporter"]')!.addEventListener('click', async () => {
    const png = await encoderPng(dessin.taille, dessin.taille, dessin.pixels, PALETTE);
    const url = URL.createObjectURL(new Blob([png as BlobPart], { type: 'image/png' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumipix-pixel-art-${dessin.taille}x${dessin.taille}.png`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    dire(`Image ${dessin.taille}x${dessin.taille} exportée. Importe-la dans l’application iDotMatrix.`);
  });

  function lienPartage(): string {
    const code = encoderDessin(dessin);
    if ('partageServeur' in racine.dataset) return `${location.origin}/dessin/${code}`;
    return `${location.origin}${racine.dataset.lienProduit}?dessin=${code}#editeur`;
  }
  $<HTMLButtonElement>('[data-action="partager"]')!.addEventListener('click', async () => {
    if (estVide(dessin)) return dire('Dessine quelque chose avant de partager.');
    const url = lienPartage();
    const zone = $<HTMLElement>('[data-zone-partage]')!;
    const champ = $<HTMLInputElement>('[data-lien-partage]')!;
    champ.value = url;
    zone.hidden = false;
    const tactile = matchMedia('(pointer: coarse)').matches;
    if (tactile && navigator.share) {
      try {
        await navigator.share({ title: 'Mon pixel art Lumipix', url });
        return dire('Dessin partagé.');
      } catch {
        // partage annulé : le lien reste affiché
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      dire('Lien copié : colle-le où tu veux pour partager ton dessin.');
    } catch {
      champ.select();
      dire('Copie le lien ci-dessus pour partager ton dessin.');
    }
  });

  $<HTMLButtonElement>('[data-action="panier"]')!.addEventListener('click', () => {
    const v = varianteActive();
    if (!v) return;
    const lignes = ajouterAuPanier(produit, v.value);
    const n = nombreArticles(lignes);
    dire(`Ajouté au panier : cadre ${v.dataset.nom} (${n} article${n > 1 ? 's' : ''}). Pense à exporter ton dessin.`);
  });

  // ---------- Brouillon et dessin partagé ----------
  let minuterie = 0;
  function sauvegarder() {
    clearTimeout(minuterie);
    minuterie = window.setTimeout(() => {
      try {
        if (estVide(dessin)) localStorage.removeItem(CLE_BROUILLON);
        else localStorage.setItem(CLE_BROUILLON, encoderDessin(dessin));
      } catch {
        // stockage indisponible : pas de brouillon
      }
    }, 400);
  }

  const partage = new URLSearchParams(location.search).get('dessin');
  let initial = partage ? decoderDessin(partage) : null;
  if (partage && !initial) dire('Ce lien de dessin est incomplet : grille vide.');
  if (partage && initial) dire('Dessin partagé chargé. Modifie-le à ta guise.');
  if (!initial) {
    try {
      const brouillon = localStorage.getItem(CLE_BROUILLON);
      initial = brouillon ? decoderDessin(brouillon) : null;
    } catch {
      initial = null;
    }
  }
  const varianteDepart = radiosVariante.find((r) => r.checked);
  if (initial) {
    remplacer(initial, Boolean(partage));
    if (!partage && varianteDepart && tailleVariante(varianteDepart) !== initial.taille) remplacer(redimensionner(initial, tailleVariante(varianteDepart)), false);
  } else {
    const taille = varianteDepart ? tailleVariante(varianteDepart) : dessin.taille;
    remplacer(dessinerModele('coeur', taille), false);
  }
  if (partage) racine.scrollIntoView({ block: 'start' });

  $<HTMLElement>('[data-chargement]')?.remove();
  majBoutons();
  redessiner();
}
