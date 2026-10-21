# TODO Lumipix

## Placeholders à fournir (brief §10)

Tous dans `src/config/societe.ts` (source unique), sauf mention contraire.

- [ ] `[DIRECTEUR_PUBLICATION]` : nom du président (affiché uniquement dans les mentions légales)
- [ ] `[ADRESSE_RETOURS]` : adresse de retour (jamais publiée, communiquée après validation d'un retour)
- [ ] `[EMAIL_CONTACT]` : confirmer `contact@lumipix.shop` (boîte à créer chez Hostinger si besoin)
- [ ] `[MEDIATEUR_CONSO]` : médiateur de la consommation (adhésion obligatoire avant la vente). Recommandé : CM2C (48 € pour 3 ans, 36 € par médiation). Vérifier sa présence pour « commerce électronique » sur economie.gouv.fr avant de signer. Exclure Médicys (agrément retiré en 2021)
- [ ] `[IDENTIFIANT_UNIQUE_REP]` : identifiant unique REP pour les équipements électriques et électroniques (cadre LED). EROS est importateur donc producteur. Adhérer à Ecosystem ou Ecologic (devis aux deux, faire trancher la catégorie du 64x64 : écran de plus de 100 cm² ?)
- [ ] Identifiant unique REP emballages (filière séparée, second identifiant)
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
- [x] Cadre passé en `statut: actif` (21/10/2026)
- [x] Visuels : 4 photos et 1 vidéo retravaillées depuis les médias fournisseur (texte retiré, écrans remplacés par nos scènes)
- [ ] **Droits sur les photos** : elles restent la propriété du vendeur. Lui demander par écrit l'autorisation de les utiliser (et garder la réponse), ou les remplacer par nos propres photos dès réception de l'échantillon
- [ ] Photos de la version 32x32 : aucune pour l'instant (la galerie précise « version 64x64 »)
- [ ] Marque « iDM / Pixel 64 » imprimée sur le carton d'origine : le client la verra à la réception, à prendre en compte (packaging neutre ou mention sur la fiche)
- [ ] Sources brutes du fournisseur dans `sources/fournisseur/` : jamais publiées, mais visibles dans le dépôt public (et dans son historique)

## SEO (phase 6, fait le 21/10/2026)

- [x] Guides : /guides, /guides/idotmatrix-tuto, /guides/pixel-art-32x32 (6 modèles PNG téléchargeables), /guides/decorer-setup-gaming
- [x] /idees-cadeaux (mot-clé « idée cadeau gamer », secondaire « cadeau geek original ») et /faq (données FAQPage)
- [ ] « Cadeau gamer moins de 50 euros » (brief) non visé : aucun produit sous 50 €. À reprendre quand un produit à moins de 50 € existera
- [ ] Captures d'écran de l'application à ajouter dans le tuto iDotMatrix : emplacements marqués `<!-- CAPTURE : … -->` dans src/content/guides/idotmatrix-tuto.md
- [ ] Passer le build Cloudflare en `CIBLE_DEPLOIEMENT=production` UNIQUEMENT quand lumipix.shop pointe vers le Worker (sinon les URL canoniques visent un domaine vide). Jusque-là, tout reste en noindex
- [ ] Search Console : à faire par Noa au lancement (envoyer https://lumipix.shop/sitemap.xml)

## Collection setup-gaming

- [x] Texte SEO rédigé (phase 2), à relire

## Technique (phases suivantes)

- [ ] Collections masquées (menu et accueil) tant qu'il n'y a qu'un produit : repasser `collectionsEnAvant: true` dans `src/config/boutique.ts` au deuxième produit
- [x] Bouton son retiré du menu (20/10/2026, inutile). Les sons restent codés (`BoutonSon.astro`, visible sur /design-system) si on veut le remettre

- [ ] Curseur pixel optionnel (non fait : effet facultatif du brief, à décider)
- [ ] Inscription email en double opt-in sur l'accueil : phase 5 (nécessite Resend et D1)
- [x] Éditeur pixel art (phase 3)
- [ ] Tester le lien de partage `/dessin/<code>` et son aperçu sur un vrai déploiement Cloudflare Pages (impossible sur GitHub Pages)
- [ ] Vérifier sur un vrai cadre que l'import d'un PNG 32x32 / 64x64 exporté par l'éditeur fonctionne dans l'application iDotMatrix
- [x] Page /panier : quantités, retrait, frais de port, délai, informations précontractuelles, lien CGV
- [x] Paiement Stripe codé (phase 4) : checkout, webhook, D1, page merci, UTM. Reste : brancher les clés (README, « Brancher Stripe »)
- [ ] Frais de port payants (futurs produits) : la TVA sur le port n'est pas ventilée sur la facture Stripe (taux de TVA manuel). À traiter avant le premier produit avec port payant
- [ ] Alerte email admin en cas d'erreur webhook et notification de commande : phase 5 (Resend). D'ici là, erreurs visibles dans les logs du Worker et dans Stripe > Webhooks
- [x] Source de la visite (UTM, 30 jours) mentionnée dans la politique de confidentialité
- [x] Google Analytics 4 (G-946R13FWHX) : chargé seulement après accord dans le bandeau cookies (choix gardé 6 mois, cookies 13 mois max)
- [ ] Google Analytics : dans l'interface GA, régler la conservation des données à 14 mois maximum et désactiver Google Signals (recommandations CNIL)
- [ ] Google Analytics : suivi des achats (événement purchase) non branché
- [ ] Quantité maximale par ligne : 10 aujourd'hui, alors que la fiche fournisseur limite à 3 pièces par acheteur. À trancher avant le lancement
- [ ] Politique de retour : qui paie les frais de retour ? (à préciser pour les CGV et les données structurées)
- [ ] Choix DNS : passer les serveurs de noms chez Cloudflare (recommandé, voir README) ou rester sur Hostinger avec `www`

## Avant Stripe (phase 4)

- [x] Worker Cloudflare de préproduction vérifié (7 vérifications sur 8, lien /dessin corrigé par run_worker_first)
- [x] Prévisualisation GitHub Pages supprimée
- [x] Base D1 « lumipix » créée (Western Europe) et reliée au Worker (`DB` dans wrangler.jsonc). Tables : phase 4
- [x] Dépôt GitHub : reste public (décision du 14/10/2026). Conséquence : le bloc fournisseur des fiches et `sources/fournisseur/` sont lisibles par tous sur GitHub
- [x] Pages légales créées (structure complète, passages « À compléter » visibles)
- [ ] Pages légales à compléter avant la vente : Stripe demande l'URL des CGV pour la case de consentement, et la loi impose les informations précontractuelles avant le paiement. Placeholders à fournir : directeur de la publication, médiateur, adresse de retour, qui paie le retour
- [ ] Compte Stripe activé (identité, SIREN, IBAN), puis étapes « Brancher Stripe » du README
- [ ] Coût des factures Stripe (Stripe Invoicing, facturé par facture) : vérifier la grille tarifaire Stripe
