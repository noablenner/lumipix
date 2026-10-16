# Lumipix

Boutique e-commerce pixel art / rétro arcade ([lumipix.shop](https://lumipix.shop)). Le brief complet est dans `CLAUDE.md`.

**État actuel : phase 4 codée** (paiement Stripe, commandes dans D1), en attente des clés Stripe. Phases 1 à 3 terminées. Reprise du travail : [docs/REPRISE.md](docs/REPRISE.md). Démo du design system : `/design-system`.

## Installation

Prérequis : Node.js 22.18 ou plus (`.nvmrc`).

```bash
npm install
cp .env.example .env     # puis renseigner les valeurs utiles
npm run dev              # http://localhost:4321
```

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Vérification TypeScript, build statique dans `dist/`, puis garde-fous |
| `npm test` | Tests du dessin, du partage, du panier et du paiement (Stripe simulé, D1 simulée par SQLite) |
| `npm run catalogue` | Régénère le catalogue serveur (`src/serveur/catalogue.genere.ts`, fait automatiquement au build) |
| `npm run verifier` | Garde-fous seuls (sur un `dist/` existant) |
| `npm run preview` | Sert `dist/` en local |

### Garde-fous automatiques (`scripts/verifier-build.ts`)

Le build échoue si :

- une donnée du bloc `fournisseur` d'une fiche produit (URL, identifiants, libellés, nom) se retrouve dans `dist/` ;
- une marque ou un univers protégé est détecté dans `src/`, `dist/` ou un nom de fichier ;
- le nom du directeur de la publication sort de `/mentions-legales`, l'adresse du siège sort de `/mentions-legales` et `/cgv`, ou l'adresse de retour apparaît sur le site ;
- une paire de couleurs de `src/styles/contrastes.ts` passe sous le seuil WCAG AA.

## Structure

```
assets/produits/[slug]/     visuels HD des produits (fournis, jamais d'image fournisseur)
docs/                       documentation (ajout d'un produit)
src/styles/fonts/           police pixel auto-hébergée (Jersey 10, SIL OFL, licence dans public/licences/)
scripts/                    garde-fous du build
src/config/societe.ts       SOURCE UNIQUE des informations société
src/config/boutique.ts      paramètres commerciaux (seuil de livraison gratuite…)
src/content.config.ts       schémas Zod des produits et collections
src/content/produits/       une fiche Markdown par produit
src/content/collections/    une fiche Markdown par collection
src/lib/catalogue.ts        accès au catalogue (retire le bloc fournisseur)
src/styles/tokens.css       design tokens (couleurs, typo, espacements)
src/components/             composants de base
src/layouts/BaseLayout.astro  layout commun (SEO de base, en-tête, pied de page)
```

Choix techniques de la phase 1 :

- **Astro 7** en sortie statique, TypeScript strict.
- **CSS natif avec custom properties**, sans Tailwind : pas de dépendance de build, CSS par composant, poids minimal sur mobile.
- **Typographies** : Jersey 10 pour les titres (un fichier de 13 Ko, choisie pour la lisibilité des chiffres : « 32x32 » doit se lire sans hésitation), police système pour le texte (0 octet chargé).
- **Liens de navigation conditionnels** : un lien n'apparaît que si la page existe déjà, et une collection n'apparaît que si elle contient un produit actif.

## Rendu du cadre et scènes pixel art

Aucune image fournisseur : tant que `assets/produits/[slug]/` est vide, les visuels sont générés par le code.

- `src/lib/pixel/scenes.ts` : scènes originales (coucher de soleil rétro, ciel étoilé, horloge, cœur, chat, fusée, vagues néon, 404), dessinées en coordonnées unitaires pour sortir en 32x32 et en 64x64.
- `src/lib/pixel/svg.ts` : rendu façon écran LED (diodes rondes, LED éteintes visibles, léger halo), animations CSS coupées en mouvement réduit.
- `/scenes/[scene]-[32|64].svg` : fichiers statiques générés au build.
- `src/components/produit/CadreLed.astro` : le cadre noir mat en vue de face ou de trois quarts ; `SceneBureau.astro` : la mise en scène de bureau.
- `/og/[page].png` : images de partage générées au build avec sharp.

## Éditeur pixel art

Sur la page du cadre, section `#editeur` (`src/components/editeur/Editeur.astro`). Le HTML est rendu au build ; la logique (`src/scripts/editeur.ts`, environ 14 Ko) n'est téléchargée qu'à l'approche de la section.

- Grille 32x32 ou 64x64, synchronisée avec la variante choisie sur la page ; un dessin 32x32 passe en 64x64 sans perte.
- Crayon, gomme, remplissage, pipette, annuler / rétablir, tout effacer ; doigt, souris et clavier (flèches + Espace, Ctrl+Z / Ctrl+Y).
- Six modèles de départ originaux (`src/lib/pixel/modeles.ts`), palette de 16 couleurs adaptées aux LED.
- Rendu en direct sur le cadre allumé ; export PNG à la résolution exacte (32x32 ou 64x64) pour l'application iDotMatrix.
- Brouillon conservé dans le navigateur ; ajout au panier depuis l'éditeur.

### Partage sans stockage serveur

Le dessin entier est encodé dans l'URL (`src/lib/pixel/dessin.ts` : compression par plages + base64url, 80 à 450 caractères pour un dessin courant).

- Sur Cloudflare : lien `/dessin/<code>`, servi par le Worker (`src/serveur/partage.ts`) : balises Open Graph, puis redirection vers l'éditeur avec le dessin chargé. L'aperçu `/api/dessin/<code>.png` est un PNG 600 x 315 (encodeur maison sans dépendance), mis en cache sur le réseau Cloudflare.
- Sur la prévisualisation GitHub Pages (pas de fonctions serveur) : lien direct vers la page produit `?dessin=<code>`, sans image d'aperçu.

## Photos et vidéo produit

`assets/produits/cadre-pixel-art-led/` contient les visuels publiés : photos et vidéo du fournisseur retravaillées (texte marketing retiré, écrans remplacés par nos scènes originales, son supprimé). Les fichiers bruts sont dans `sources/fournisseur/`, qui n'est jamais servi par le site. La galerie précise que le contenu des écrans est simulé.

Tous les visuels du cadre sont produits par `node scripts/visuels/grilles.ts && python3 scripts/visuels/composer.py` (dépendances : `pip install opencv-python-headless numpy`) : photos fournisseur retouchées (01 à 04) et rendus de studio 100 % synthétiques (05, 06, via `scripts/visuels/studio.py`), chacun en version 64x64 et 32x32 (suffixe `-32`, affichée sur la page produit quand la variante 32x32 est choisie, champ `par_variante` de la fiche). L'écran est simulé comme une vraie photo d'écran LED : diodes carrées aux coins arrondis, cœur lumineux, halo, noirs profonds, reflet sur le plateau.

## Paiement et commandes (phase 4)

Tout passe par le Worker (`src/serveur/`), sans SDK ni dépendance :

| Route | Rôle |
| --- | --- |
| `POST /api/checkout` | Reçoit uniquement produit / variante / quantité, recalcule prix, port et délai depuis le catalogue serveur, crée la session Stripe Checkout |
| `POST /api/stripe/webhook` | Signature vérifiée (HMAC, 5 min max), idempotent, enregistre commande, lignes et commandes fournisseur dans D1 |
| `GET /api/commande/statut` | Numéro et total pour `/commande/merci` (email masqué, rien d'autre) |

- **Catalogue serveur** : `scripts/catalogue-serveur.ts` lit les fiches (prix ET bloc fournisseur) et écrit `src/serveur/catalogue.genere.ts`, embarqué dans le code du Worker, jamais dans `dist/`. Un produit est vendable s'il est `actif`, ou `brouillon` hors production.
- **Session Stripe** : livraison France uniquement, email et téléphone obligatoires, codes promo, case CGV obligatoire, TVA 20 % incluse (taux créé automatiquement dans le compte Stripe au premier paiement), facture générée par Stripe avec le numéro de TVA et les mentions société, numéro de commande `LPX-XXXXXXXX`, UTM en métadonnées.
- **UTM** : `src/scripts/origine.ts` garde 30 jours, dans le navigateur, la première visite qui a une source (UTM ou site référent).
- **D1** : schéma dans `src/serveur/schema.ts`, créé automatiquement au premier appel (aucune migration à lancer). Montants en centimes.
- **Événements webhook à cocher** : `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `invoice.paid`, `charge.refunded`.

### Brancher Stripe (à faire une fois)

1. Stripe > *Paramètres > Informations publiques* : renseigner l'URL des CGV (`https://<site>/cgv`), **sinon la création de session échoue** (la case CGV l'exige). Libellé de relevé : `LUMIPIX`.
2. Stripe > *Paramètres > E-mails clients* : activer les reçus de paiement et de remboursement.
3. Stripe > *Développeurs > Webhooks* : endpoint `https://<site>/api/stripe/webhook` avec les 5 événements ci-dessus, puis copier le secret de signature (`whsec_…`).
4. Cloudflare > Worker `lumipix` > *Settings > Variables and Secrets* : `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET`, type **Secret**.
5. Test : une commande réelle de bout en bout, vérifier la ligne dans D1 (`npx wrangler d1 execute lumipix --remote --command "SELECT numero, total, statut FROM commandes"`), puis la rembourser depuis Stripe.

Tester en local : `npm run build && npx wrangler dev` avec un fichier `.dev.vars` (voir `.env.example`), et `stripe listen --forward-to localhost:8787/api/stripe/webhook` pour recevoir les webhooks.

## Brouillons et prévisualisation

Un produit `brouillon` n'existe pas en production. En développement (`npm run dev`) et sur la prévisualisation GitHub Pages, il est publié avec un bandeau « Brouillon » et en noindex, pour voir le rendu avant de le passer en `actif`.

## Ajouter un produit

Voir [docs/AJOUTER-UN-PRODUIT.md](docs/AJOUTER-UN-PRODUIT.md).

## Variables d'environnement

Voir `.env.example`. En production, elles se renseignent dans le projet Cloudflare, sous *Settings > Variables and Secrets*. Aucun secret ne doit être commité. Les variables `PUBLIC_*` finissent dans le HTML.

| Variable | Phase | Rôle |
| --- | --- | --- |
| `PUBLIC_CF_WEB_ANALYTICS_TOKEN` | 1 | Cloudflare Web Analytics (sans cookie) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | 4 | Paiement |
| `RESEND_API_KEY`, `EMAIL_ADMIN` | 5 | Emails transactionnels |
| `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | 5 | Anti-spam du formulaire de contact |

## Déploiement (Cloudflare Workers)

Le site est déployé comme un **Worker Cloudflare avec fichiers statiques** (`wrangler.jsonc`) : Cloudflare sert `dist/`, et `src/worker.ts` ne reçoit que les routes serveur (partage de dessin aujourd'hui, Stripe et admin ensuite).

Réglages du projet dans Cloudflare (*Workers & Pages* > *Create* > *Import a repository* > `noablenner/lumipix`) :

| Champ | Valeur |
| --- | --- |
| Nom du projet | `lumipix` (doit correspondre à `name` dans `wrangler.jsonc`) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Variables de build | `NODE_VERSION=22`, `CIBLE_DEPLOIEMENT=preprod`, puis `URL_SITE=https://<adresse>.workers.dev` |

`CIBLE_DEPLOIEMENT` : `preprod` avant le lancement (brouillons visibles, tout en noindex), `production` au lancement (produits actifs uniquement, pages indexables).

Tester le Worker en local : `npm run build && npx wrangler dev`.

## Prévisualisation

La préproduction tourne sur le Worker Cloudflare (`CIBLE_DEPLOIEMENT=preprod`, adresse workers.dev), redéployé à chaque push sur `main`. L'ancienne prévisualisation GitHub Pages a été supprimée (dépôt privé). La cible `github-pages` reste disponible dans `astro.config.mjs` si besoin.

## DNS : domaine chez Hostinger, site chez Cloudflare

> À finaliser en phase 7. Ne rien modifier tant que le site n'est pas prêt.

**Point important** : Cloudflare n'accepte un domaine personnalisé sur un Worker (`lumipix.shop` sans `www`) que si les DNS du domaine sont gérés par Cloudflare. Il y a deux options.

### Option A (recommandée) : DNS chez Cloudflare, domaine et boîtes mail restent chez Hostinger

1. **Avant tout**, noter dans Hostinger (hPanel > *Domaines* > *DNS / Nameservers*) **tous** les enregistrements existants : `MX`, `TXT` (SPF `v=spf1 …`, DMARC `_dmarc`), `CNAME` ou `TXT` DKIM (`hostingermail-…._domainkey` ou équivalent), autodiscover, etc. Une capture d'écran suffit.
2. Cloudflare > *Add a site* > `lumipix.shop` > offre Free. Cloudflare importe les enregistrements : **les comparer un par un** avec la liste de l'étape 1 et recréer ceux qui manquent, à l'identique.
3. Les enregistrements mail (`MX`, SPF, DKIM, DMARC) doivent être en **DNS only (nuage gris)**, jamais proxifiés.
4. Dans Hostinger, remplacer les serveurs de noms par les deux fournis par Cloudflare. La propagation prend de quelques minutes à 24 h, et les mails continuent de fonctionner si l'étape 2 est exacte.
5. Cloudflare > Worker lumipix > *Settings > Domains & Routes* : ajouter `lumipix.shop` puis `www.lumipix.shop`, et rediriger `www` vers le domaine racine (règle de redirection Cloudflare).
6. Tester l'envoi et la réception d'un mail sur `contact@lumipix.shop`.

### Option B : DNS restent chez Hostinger

Possible uniquement pour `www.lumipix.shop` : un `CNAME www` vers l'adresse du Worker, puis une redirection du domaine racine vers `www` côté Hostinger. Les mails ne sont pas touchés, mais l'URL canonique devient `www.lumipix.shop`, ce qui demande une adaptation du code (`site` dans `astro.config.mjs` et `SOCIETE.urlSite`).

### Resend (phase 5)

Resend demande ses propres enregistrements (DKIM, et un `MX` + SPF sur un sous-domaine d'envoi du type `send.lumipix.shop`). Ils sont **ajoutés** sans toucher aux enregistrements Hostinger. Un nom de domaine ne doit avoir **qu'un seul** enregistrement SPF : si Resend demande un SPF sur la racine, il faut le **fusionner** avec celui de Hostinger, pas en créer un second.
