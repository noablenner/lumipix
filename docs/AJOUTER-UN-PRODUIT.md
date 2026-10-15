# Ajouter un produit

Ajouter un produit revient à ajouter **un fichier** : aucun code à toucher.
Le schéma de la fiche est validé au build (`src/content.config.ts`) : une faute de saisie fait échouer le build avec un message qui indique le champ en cause.

## Procédure pas à pas

1. **Créer la fiche** : copier le modèle ci-dessous dans `src/content/produits/[slug].md`. Le nom du fichier, `id` et `slug` doivent être identiques. Le slug devient l'URL `/produits/[slug]`, qui ne doit **plus jamais changer** une fois en ligne.
2. **Déposer les visuels** dans `assets/produits/[slug]/`, nommés `01-hero.jpg`, `02-ambiance.jpg`, `03-detail.jpg`… et les vidéos dans le même dossier. Jamais d'image fournisseur. Tant que le dossier est vide, laisser `photos: []`.
3. **Vérifier la collection** : chaque valeur de `collections` doit correspondre à un fichier de `src/content/collections/`. Pour une nouvelle collection, créer `src/content/collections/[slug].md` (même structure que `setup-gaming.md`).
4. **Laisser `statut: brouillon`** tant que la fiche n'est pas complète. Un brouillon n'est visible nulle part sur le site.
5. **Lancer `npm run build`** en local. Il valide la fiche, construit le site et contrôle qu'aucune donnée fournisseur ni marque protégée ne se retrouve dans le site généré.
6. **Passer en `statut: actif`** : le produit apparaît, ainsi que ses collections dans la navigation (une collection sans produit actif reste masquée). Pour un produit actif, `sous_titre` et `description_courte` deviennent obligatoires.
7. **Commit et push sur `main`** : Cloudflare Pages déploie automatiquement.

Pour retirer un produit sans casser les liens : `statut: archive`.

## Règles à respecter

- **Aucune marque ni univers protégé** dans les textes, les noms de fichiers ou les mots-clés (voir CLAUDE.md §2). Le build échoue si une marque connue est détectée.
- **Aucune donnée inventée** : prix, specs, contenu de la boîte, délais viennent de la vérification réelle du produit. Ce qui reste à vérifier est écrit `[A MESURER SUR ECHANTILLON]` ou `A VERIFIER` et listé dans `TODO.md`.
- **Prix TTC en euros, au centime près** (`79.00`).
- **Mot-clé principal unique** : deux pages ne visent jamais le même mot-clé principal.
- **Le bloc `fournisseur` n'est jamais affiché** : il sert à l'admin et aux fonctions serveur. Les pages passent par `src/lib/catalogue.ts`, qui le retire.

## Modèle de fiche commenté

```markdown
---
# Identifiants : identiques au nom du fichier, minuscules et tirets
id: mon-produit
slug: mon-produit
# brouillon (invisible) | actif (en vente) | archive (retiré)
statut: brouillon
nom: "Nom du produit"
sous_titre: "Accroche courte"            # obligatoire si actif
description_courte: "Une ou deux phrases pour les cartes produit."   # obligatoire si actif
collections: ["setup-gaming"]            # slugs de src/content/collections/
type: simple                             # simple | bundle

# Prix TTC du produit. Facultatif si chaque variante a son propre prix.
prix_ttc: 29.00
# prix_barre_ttc: 39.00                  # facultatif, uniquement si c'est un vrai ancien prix

variantes:
  - id: noir                             # sans espace ni accent
    nom: "Noir"
    options: { couleur: "noir" }         # facultatif
    # prix_ttc: 31.00                    # facultatif, remplace le prix du produit
    disponible: true

frais_de_port: 0                         # euros TTC facturés au client

delai_livraison:
  min_jours_ouvres: 5
  max_jours_ouvres: 10

photos:                                  # fichiers de assets/produits/mon-produit/
  - src: "01-hero.jpg"
    alt: "Description précise de l'image, avec le mot-clé principal pour la première"
#   par_variante: { "petit": "01-hero-petit.jpg" }  # facultatif : autre fichier quand cette variante est choisie
#   variantes: ["grand"]                           # facultatif : photo montrée seulement pour ces variantes
videos: []
#  - src: "demo.mp4"
#    alt: "Ce que montre la vidéo"
#    poster: "demo-poster.jpg"

specs:                                   # clé : valeur, affichées dans l'ordre
  "Dimensions": "10 x 10 x 2 cm"
contenu_boite:
  - "Le produit"
faq:
  - question: "Question fréquente ?"
    reponse: "Réponse factuelle."

seo:
  mot_cle_principal: "mot-clé principal"
  mots_cles_secondaires: ["secondaire 1", "secondaire 2"]
  title: "Title de 70 caractères maximum | Lumipix"
  meta_description: "Entre 50 et 170 caractères, avec le mot-clé principal."

produits_lies: []                        # slugs d'autres produits
# Pour un bundle (type: bundle) :
# composants:
#   - { produit: autre-produit, quantite: 1 }

# NE JAMAIS EXPOSER COTE CLIENT
fournisseur:
  nom: "Nom de la boutique fournisseur"
  url: "https://..."
  id_produit: "123456"
  variantes:                             # une entrée par id de variante ci-dessus, ni plus ni moins
    noir:
      id_variante: "SKU fournisseur"     # facultatif tant qu'il n'est pas connu
      libelle_fournisseur: "Libellé exact de la variante chez le fournisseur"
      prix_achat_ttc: 12.34
      # prix_achat_ttc_des_2: 11.50      # facultatif, prix dégressif
      port_achat: 0
  limite_achat: "facultatif"
  note_vendeur: "facultatif"
  releve_le: "2026-10-14"                # date du relevé des prix
---

Description longue en Markdown : titres, listes, paragraphes.
```
