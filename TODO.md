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
- [ ] `description_courte` et FAQ structurée : à rédiger en phase 2 (obligatoires avant de passer le produit en `actif`)
- [ ] Description longue : à rédiger en phase 2
- [ ] Passer `statut: actif` quand la fiche est complète (tant qu'il est en brouillon, la collection setup-gaming reste masquée)
- [ ] Visuels : `assets/produits/cadre-pixel-art-led/` est vide, le rendu SVG/CSS (phase 2) sert en attendant

## Collection setup-gaming

- [ ] Texte SEO à rédiger (phase 2)

## Technique (phases suivantes)

- [ ] Curseur pixel optionnel (phase 2)
- [ ] Transitions de page en blocs (phase 2, sur l'accueil et les collections)
- [ ] Image Open Graph par défaut (phase 2, à partir du rendu du cadre)
- [ ] Accueil provisoire `src/pages/index.astro` (noindex) à remplacer en phase 2
- [ ] Choix DNS : passer les serveurs de noms chez Cloudflare (recommandé, voir README) ou rester sur Hostinger avec `www`
