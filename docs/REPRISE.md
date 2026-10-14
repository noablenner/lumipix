# Reprise du travail (note pour la prochaine conversation)

Dernière mise à jour : 14/10/2026. À lire en premier, avant d'écrire du code.

## Où trouver les infos

1. `CLAUDE.md` : le brief complet (règles absolues : pas de marque protégée, pas de donnée inventée, bloc fournisseur jamais exposé, nom du président uniquement dans les mentions légales).
2. `TODO.md` : tout ce qui reste à faire ou à fournir, coché au fur et à mesure.
3. `README.md` : stack, scripts, garde-fous du build, déploiement Cloudflare, DNS.
4. `docs/AJOUTER-UN-PRODUIT.md` : procédure d'ajout d'un produit.
5. `src/config/societe.ts` (données société, placeholders `[...]`) et `src/config/boutique.ts`.

## État

- Phases 1, 2, 3 terminées (design system, rendu du cadre, accueil, page produit, collection, 404, éditeur pixel art, export PNG, partage par URL avec image OG).
- Fait en avance : pages légales (avec passages « À compléter »), page `/panier` (paiement inactif), calcul du panier partagé `src/lib/panier-calcul.ts`.
- Hébergement : Worker Cloudflare avec fichiers statiques (`wrangler.jsonc`, `src/worker.ts`), redéployé à chaque push sur `main`, cible `CIBLE_DEPLOIEMENT=preprod` (brouillons visibles, tout en noindex).
- Base D1 `lumipix` reliée (binding `DB`), aucune table.
- Le cadre est encore `statut: brouillon` : il n'existe pas en production.
- Dépôt public : décision définitive de Noa, ne plus en parler.
- Noa ne veut pas de détails administratifs : aller droit au but, listes courtes.

## Prochaine étape : phase 4 (Stripe)

1. Schéma D1 (migrations `migrations/`) : commandes, lignes, commandes fournisseur, avis, inscriptions.
2. Route Worker `POST /api/checkout` : recalcule les prix depuis les fiches produit (réutiliser `calculerPanier`), crée la session Stripe Checkout (adresse FR, email, téléphone obligatoires, codes promo, consentement CGV, facture auto, métadonnées UTM).
3. Capture UTM et référent de première visite côté client.
4. Route `POST /api/stripe/webhook` : signature vérifiée, idempotent, enregistre la commande dans D1.
5. Page `/commande/merci`, activer le bouton du panier.
6. Noa doit créer un compte Stripe (mode test) et mettre `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` dans Cloudflare (via un prompt pour Claude Cowork, qui pilote son ordinateur).

## En attente de Noa (bloquant pour vendre, pas pour coder)

Q1 nom du directeur de la publication, Q2 adresse des retours, Q3 qui paie le retour, Q4 contact@lumipix.shop fonctionne ?, adhésion médiateur (CM2C conseillé), identifiant REP DEEE (Ecosystem ou Ecologic) et REP emballages, quantité max par ligne (10 aujourd'hui, fournisseur limité à 3).
