# Lumipix

Boutique e-commerce pixel art / rétro arcade ([lumipix.shop](https://lumipix.shop)). Le brief complet est dans `CLAUDE.md`.

**État actuel : phase 1 terminée** (socle, schémas, design system). Démo : `/design-system`.

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
public/fonts/               police pixel auto-hébergée (Pixelify Sans, SIL OFL)
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
- **Typographies** : Pixelify Sans pour les titres (2 graisses, environ 15 Ko), police système pour le texte (0 octet chargé).
- **Liens de navigation conditionnels** : un lien n'apparaît que si la page existe déjà, et une collection n'apparaît que si elle contient un produit actif.

## Ajouter un produit

Voir [docs/AJOUTER-UN-PRODUIT.md](docs/AJOUTER-UN-PRODUIT.md).

## Variables d'environnement

Voir `.env.example`. En production, elles se renseignent dans Cloudflare Pages, sous *Settings > Environment variables*. Aucun secret ne doit être commité. Les variables `PUBLIC_*` finissent dans le HTML.

| Variable | Phase | Rôle |
| --- | --- | --- |
| `PUBLIC_CF_WEB_ANALYTICS_TOKEN` | 1 | Cloudflare Web Analytics (sans cookie) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | 4 | Paiement |
| `RESEND_API_KEY`, `EMAIL_ADMIN` | 5 | Emails transactionnels |
| `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | 5 | Anti-spam du formulaire de contact |

## Déploiement (Cloudflare Pages)

1. Cloudflare > *Workers & Pages* > *Create* > *Pages* > *Connect to Git*, puis choisir le dépôt `lumipix`.
2. Réglages de build : preset **Astro**, commande `npm run build`, dossier de sortie `dist`, variable `NODE_VERSION=22`.
3. Branche de production : `main`. Chaque push sur `main` déploie la production, et chaque autre branche obtient une URL de prévisualisation.

## Prévisualisation GitHub Pages

Chaque push sur `main` publie aussi le site sur **https://noablenner.github.io/lumipix/** (workflow `.github/workflows/github-pages.yml`), pour voir le rendu sans attendre Cloudflare.

- Prérequis (une seule fois) : *Settings > Pages > Build and deployment > Source : GitHub Actions*.
- Le build est lancé avec `CIBLE_DEPLOIEMENT=github-pages`, qui sert le site sous `/lumipix` et passe **toutes les pages en noindex**. Le canonique pointe toujours vers `lumipix.shop`.
- Dans le code, tout lien interne passe par `lien('/chemin')` (`src/lib/routes.ts`) pour rester compatible avec ce préfixe.
- Limite : GitHub Pages ne sert que des fichiers statiques. Le panier, Stripe, D1 et les emails (phases 4 et 5) ne fonctionneront que sur Cloudflare Pages.

## DNS : domaine chez Hostinger, site chez Cloudflare Pages

> À finaliser en phase 7. Ne rien modifier tant que le site n'est pas prêt.

**Point important** : Cloudflare Pages n'accepte un domaine racine (`lumipix.shop` sans `www`) que si les DNS du domaine sont gérés par Cloudflare. Il y a deux options.

### Option A (recommandée) : DNS chez Cloudflare, domaine et boîtes mail restent chez Hostinger

1. **Avant tout**, noter dans Hostinger (hPanel > *Domaines* > *DNS / Nameservers*) **tous** les enregistrements existants : `MX`, `TXT` (SPF `v=spf1 …`, DMARC `_dmarc`), `CNAME` ou `TXT` DKIM (`hostingermail-…._domainkey` ou équivalent), autodiscover, etc. Une capture d'écran suffit.
2. Cloudflare > *Add a site* > `lumipix.shop` > offre Free. Cloudflare importe les enregistrements : **les comparer un par un** avec la liste de l'étape 1 et recréer ceux qui manquent, à l'identique.
3. Les enregistrements mail (`MX`, SPF, DKIM, DMARC) doivent être en **DNS only (nuage gris)**, jamais proxifiés.
4. Dans Hostinger, remplacer les serveurs de noms par les deux fournis par Cloudflare. La propagation prend de quelques minutes à 24 h, et les mails continuent de fonctionner si l'étape 2 est exacte.
5. Cloudflare Pages > projet > *Custom domains* : ajouter `lumipix.shop` puis `www.lumipix.shop`, et rediriger `www` vers le domaine racine (règle de redirection Cloudflare).
6. Tester l'envoi et la réception d'un mail sur `contact@lumipix.shop`.

### Option B : DNS restent chez Hostinger

Possible uniquement pour `www.lumipix.shop` : un `CNAME www` vers `lumipix.pages.dev`, puis une redirection du domaine racine vers `www` côté Hostinger. Les mails ne sont pas touchés, mais l'URL canonique devient `www.lumipix.shop`, ce qui demande une adaptation du code (`site` dans `astro.config.mjs` et `SOCIETE.urlSite`).

### Resend (phase 5)

Resend demande ses propres enregistrements (DKIM, et un `MX` + SPF sur un sous-domaine d'envoi du type `send.lumipix.shop`). Ils sont **ajoutés** sans toucher aux enregistrements Hostinger. Un nom de domaine ne doit avoir **qu'un seul** enregistrement SPF : si Resend demande un SPF sur la racine, il faut le **fusionner** avec celui de Hostinger, pas en créer un second.
