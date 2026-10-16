# Reprise du travail (note pour la prochaine conversation)

Dernière mise à jour : 16/10/2026. À lire en premier, avant d'écrire du code.

## Où trouver les infos

1. `CLAUDE.md` : le brief complet (règles absolues : pas de marque protégée, pas de donnée inventée, bloc fournisseur jamais exposé, nom du président uniquement dans les mentions légales).
2. `TODO.md` : tout ce qui reste à faire ou à fournir, coché au fur et à mesure.
3. `README.md` : stack, scripts, garde-fous du build, déploiement Cloudflare, DNS.
4. `docs/AJOUTER-UN-PRODUIT.md` : procédure d'ajout d'un produit.
5. `src/config/societe.ts` (données société, placeholders `[...]`) et `src/config/boutique.ts`.

## État

- Phases 1, 2, 3 terminées (design system, rendu du cadre, accueil, page produit, collection, 404, éditeur pixel art, export PNG, partage par URL avec image OG).
- Phase 4 codée et testée (Stripe simulé + D1 simulée, puis workerd local) : `src/serveur/commandes.ts`, `stripe.ts`, `schema.ts`, catalogue serveur généré au build, `/commande/merci`, capture UTM. Pas encore testée contre le vrai Stripe (réseau bloqué depuis l'environnement de Claude).
- Fait en avance : pages légales (avec passages « À compléter »), page `/panier`.
- Hébergement : Worker Cloudflare avec fichiers statiques (`wrangler.jsonc`, `src/worker.ts`), redéployé à chaque push sur `main`, cible `CIBLE_DEPLOIEMENT=preprod` (brouillons visibles et achetables, tout en noindex).
- Base D1 `lumipix` reliée (binding `DB`) ; les tables se créent seules au premier appel.
- Le cadre est encore `statut: brouillon` : achetable en préprod seulement, absent en production.
- Dépôt public : décision définitive de Noa, ne plus en parler.
- Noa ne veut pas de détails administratifs : aller droit au but, listes courtes.

## Prochaine étape

1. Noa : clés Stripe live + webhook (README, « Brancher Stripe »), puis une vraie commande de test sur la préprod, remboursée ensuite.
2. Phase 5 : admin (Cloudflare Access), emails Resend (confirmation, expédition, alerte webhook), page /suivi, contact.

## En attente de Noa (bloquant pour vendre, pas pour coder)

Q1 nom du directeur de la publication, Q2 adresse des retours, Q3 qui paie le retour, Q4 contact@lumipix.shop fonctionne ?, adhésion médiateur (CM2C conseillé), identifiant REP DEEE (Ecosystem ou Ecologic) et REP emballages, quantité max par ligne (10 aujourd'hui, fournisseur limité à 3).
