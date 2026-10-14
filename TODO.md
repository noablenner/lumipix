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
- [ ] Visuels : `assets/produits/cadre-pixel-art-led/` est vide, le rendu SVG/CSS (phase 2) sert en attendant

## Collection setup-gaming

- [x] Texte SEO rédigé (phase 2), à relire

## Technique (phases suivantes)

- [ ] Curseur pixel optionnel (non fait : effet facultatif du brief, à décider)
- [ ] Inscription email en double opt-in sur l'accueil : phase 5 (nécessite Resend et D1)
- [ ] Éditeur pixel art : phase 3 (l'accueil y renvoie déjà via la page produit)
- [ ] Page /panier et paiement : phase 4 (le bouton d'ajout enregistre déjà le panier dans le navigateur)
- [ ] Politique de retour : qui paie les frais de retour ? (à préciser pour les CGV et les données structurées)
- [ ] Choix DNS : passer les serveurs de noms chez Cloudflare (recommandé, voir README) ou rester sur Hostinger avec `www`
