# TODO Lumipix

## Placeholders à fournir (brief §10)

Tous dans `src/config/societe.ts` (source unique), sauf mention contraire.

- [ ] `[DIRECTEUR_PUBLICATION]` : nom du président (affiché uniquement dans les mentions légales)
- [ ] `[ADRESSE_RETOURS]` : adresse de retour (jamais publiée, communiquée après validation d'un retour)
- [ ] `[EMAIL_CONTACT]` : confirmer `contact@lumipix.shop` (boîte à créer chez Hostinger si besoin)
- [ ] `[MEDIATEUR_CONSO]` : médiateur de la consommation (adhésion obligatoire avant la vente)
- [ ] `[IDENTIFIANT_UNIQUE_REP]` : identifiant unique REP pour les équipements électriques et électroniques (cadre LED)
- [ ] `[SEUIL_LIVRAISON_GRATUITE]` : `src/config/boutique.ts`, pour les futurs produits (null = aucun seuil)
- [ ] `[SOCIETE_ADRESSE_SIEGE]` : à mettre à jour en cas de domiciliation

## Fiche du cadre (`src/content/produits/cadre-pixel-art-led.md`)

- [ ] `Dimensions (version 32)` : [A MESURER SUR ECHANTILLON]
- [ ] Contenu de la boîte : adaptateur secteur 5 V / 2 A fourni ou non (A VERIFIER SUR ECHANTILLON)
- [ ] Conformité CE, FCC, RoHS : documents à obtenir du fabricant
- [ ] Délai de livraison 5 à 10 jours ouvrés : à reconfirmer après la commande test
- [ ] Identifiant de variante fournisseur (SKU) : champ `id_variante` vide pour l'instant, seul le libellé est connu
- [x] `description_courte`, FAQ structurée et description longue rédigées (phase 2), à relire
- [ ] Spécifications masquées côté client tant qu'elles ne sont pas vérifiées : « Dimensions (version 32) » et « Conformité » (documents à obtenir)
- [ ] Rendu SVG : la version 32x32 utilise le même gabarit que la 64x64 tant que ses dimensions ne sont pas mesurées
- [ ] Vidéo du cadre en fonctionnement : à déposer dans `assets/produits/cadre-pixel-art-led/` et à déclarer dans `videos` (l'accueil affiche une boucle de scènes en attendant)
- [ ] Passer `statut: actif` quand la fiche est complète (tant qu'il est en brouillon, la collection setup-gaming reste masquée)
- [x] Visuels : 4 photos et 1 vidéo retravaillées depuis les médias fournisseur (texte retiré, écrans remplacés par nos scènes)
- [ ] **Droits sur les photos** : elles restent la propriété du vendeur. Lui demander par écrit l'autorisation de les utiliser (et garder la réponse), ou les remplacer par nos propres photos dès réception de l'échantillon
- [ ] Photos de la version 32x32 : aucune pour l'instant (la galerie précise « version 64x64 »)
- [ ] Marque « iDM / Pixel 64 » imprimée sur le carton d'origine : le client la verra à la réception, à prendre en compte (packaging neutre ou mention sur la fiche)
- [ ] Sources brutes du fournisseur dans `sources/fournisseur/` : jamais publiées, mais visibles dans le dépôt public (et dans son historique)

## Collection setup-gaming

- [x] Texte SEO rédigé (phase 2), à relire

## Technique (phases suivantes)

- [ ] Curseur pixel optionnel (non fait : effet facultatif du brief, à décider)
- [ ] Inscription email en double opt-in sur l'accueil : phase 5 (nécessite Resend et D1)
- [x] Éditeur pixel art (phase 3)
- [ ] Tester le lien de partage `/dessin/<code>` et son aperçu sur un vrai déploiement Cloudflare Pages (impossible sur GitHub Pages)
- [ ] Vérifier sur un vrai cadre que l'import d'un PNG 32x32 / 64x64 exporté par l'éditeur fonctionne dans l'application iDotMatrix
- [ ] Page /panier et paiement : phase 4 (le bouton d'ajout enregistre déjà le panier dans le navigateur)
- [ ] Politique de retour : qui paie les frais de retour ? (à préciser pour les CGV et les données structurées)
- [ ] Choix DNS : passer les serveurs de noms chez Cloudflare (recommandé, voir README) ou rester sur Hostinger avec `www`

## Avant Stripe (phase 4)

- [ ] Vérifier que le Worker Cloudflare de préproduction répond (adresse workers.dev) avec `CIBLE_DEPLOIEMENT=preprod` et `URL_SITE`
- [ ] Une fois Cloudflare validé : supprimer la prévisualisation GitHub Pages (`.github/workflows/github-pages.yml`), surtout si le dépôt passe en privé (le workflow échouerait)
- [ ] Passer le dépôt GitHub en privé
- [ ] Pages légales (CGV, mentions légales, confidentialité, livraison, retours et formulaire de rétractation) : Stripe demande l'URL des CGV pour la case de consentement, et la loi impose les informations précontractuelles avant le paiement. Placeholders à fournir : directeur de la publication, médiateur, adresse de retour, qui paie le retour
- [ ] Créer une base Cloudflare D1 (commandes, avis, inscriptions)
- [ ] Créer un compte Stripe (mode test suffit pour développer), activer les factures et la TVA
