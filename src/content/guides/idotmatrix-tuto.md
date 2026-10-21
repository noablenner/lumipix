---
slug: idotmatrix-tuto
titre: "iDotMatrix tuto : bien démarrer avec l'application et ton cadre pixel art"
chapo: "Ce iDotMatrix tuto t'accompagne de la première connexion à ta première animation : brancher le cadre, le relier à l'application iDotMatrix en Bluetooth, dessiner, importer une image, afficher l'heure ou un texte, et régler les petits soucis du quotidien."
publie_le: "2026-10-21"
ordre: 1
scene: horloge
og_lignes: ["IDOTMATRIX", "LE TUTO", "EN FRANCAIS"]
visuel:
  src: "cadre-pixel-art-led/05-demo-poster.jpg"
  alt: "iDotMatrix tuto : cadre pixel art LED affichant un dégradé arc-en-ciel, piloté depuis l'application sur un téléphone"
seo:
  mot_cle_principal: "iDotMatrix tuto"
  mots_cles_secondaires: ["application iDotMatrix"]
  title: "iDotMatrix tuto : connexion, dessin, images et horloge | Lumipix"
  meta_description: "iDotMatrix tuto en français : connecter ton cadre pixel art en Bluetooth, dessiner, importer une image ou un GIF, afficher l'heure et régler les problèmes courants."
---

## Avant de commencer

L'application iDotMatrix se télécharge sur l'App Store (iPhone, iPad) et sur Google Play (Android). C'est elle qui pilote le cadre : tout se fait depuis ton téléphone, le cadre n'a que deux boutons sur le côté, pour l'allumer et accéder au menu.

Prépare trois choses :

- **Une bonne alimentation.** Le cadre se branche en USB sur un adaptateur secteur **5 V / 2 A minimum**. Un port USB d'ordinateur ou un vieux chargeur de 1 A ne suffit pas toujours : l'écran peut clignoter, s'éteindre ou refuser la connexion.
- **Le Bluetooth activé** sur ton téléphone. Sur Android, l'application peut aussi demander l'accès à la localisation : c'est le système qui l'exige pour rechercher des appareils Bluetooth à proximité, accepte-le sinon le cadre n'apparaîtra pas.
- **Ton téléphone à côté du cadre** pour la première connexion, à un ou deux mètres.

Le nom exact des menus peut changer d'une version de l'application à l'autre. Les étapes restent les mêmes.

<!-- CAPTURE : écran d'accueil de l'application iDotMatrix -->

## Connecter le cadre à l'application iDotMatrix

1. Branche le cadre et allume-le avec le bouton situé sur le côté.
2. Ouvre l'application iDotMatrix et accepte les autorisations demandées (Bluetooth, et localisation sur Android).
3. Lance la recherche d'appareils depuis l'application : le cadre apparaît dans la liste. Touche-le pour te connecter.
4. Une fois connecté, l'application affiche les différents modes : dessin, images et animations, horloge, texte, effets.

Inutile de passer par les réglages Bluetooth du téléphone : la connexion se fait depuis l'application. Si le cadre a déjà été associé dans les réglages du téléphone et que la connexion échoue, supprime-le de la liste des appareils Bluetooth, puis recommence depuis l'application.

<!-- CAPTURE : recherche et connexion du cadre -->

## Dessiner directement dans l'application

Le mode dessin (parfois appelé « graffiti ») affiche une grille de la taille de ton écran : 32 x 32 ou 64 x 64 cases. Tu choisis une couleur, tu touches les cases, et le dessin apparaît sur le cadre au fur et à mesure.

Quelques conseils pour un rendu propre :

- **Commence par la silhouette**, d'une seule couleur, puis remplis l'intérieur. C'est beaucoup plus simple que de dessiner le détail tout de suite.
- **Limite-toi à quatre ou cinq couleurs.** Sur un écran LED, les couleurs vives et franches ressortent bien mieux que les dégradés subtils.
- **Évite le noir pour le fond.** Un écran LED n'affiche pas le noir : un pixel noir est une LED éteinte. Pour que tout l'écran s'allume, choisis un fond coloré, même très sombre.

Sur un téléphone, le dessin au doigt sur une grille de 64 x 64 demande de zoomer souvent. Si tu préfères dessiner sur un grand écran, l'[éditeur pixel art Lumipix](/produits/cadre-pixel-art-led#editeur) fonctionne dans le navigateur, à la souris comme au doigt, puis tu importes le résultat dans l'application (voir plus bas).

<!-- CAPTURE : mode dessin -->

## Importer une image ou un dessin déjà fait

L'application permet d'envoyer au cadre une image de ta galerie photo. Pour un résultat net :

- **Prépare l'image à la bonne taille** : exactement 32 x 32 pixels pour le cadre 32x32, 64 x 64 pixels pour le 64x64. Une photo classique, réduite à 64 pixels de large, devient une bouillie de couleurs : le pixel art dessiné pour cette taille rend toujours mieux.
- **Utilise un format sans perte** comme le PNG. Le JPEG ajoute des petites taches de couleur autour des contours, très visibles sur un écran LED.
- **Garde l'image carrée.** Sinon l'application la recadre ou la déforme.

C'est exactement ce que fait le bouton d'export de l'éditeur Lumipix : il produit un PNG à la résolution exacte de ton cadre, prêt à importer.

### Depuis l'éditeur pixel art Lumipix

1. Ouvre l'[éditeur pixel art](/produits/cadre-pixel-art-led#editeur) et choisis la taille de ton cadre (32x32 ou 64x64).
2. Dessine, ou pars d'un des modèles proposés.
3. Touche **Exporter en PNG** : le fichier est enregistré sur ton téléphone ou ton ordinateur.
4. Dans l'application iDotMatrix, choisis l'import d'image et sélectionne ce fichier.

Tu cherches des idées ? Le guide [pixel art 32x32](/guides/pixel-art-32x32) propose des modèles faciles à télécharger.

<!-- CAPTURE : import d'une image -->

## Animations et GIF

Le cadre affiche aussi des animations. L'application propose une bibliothèque d'images et d'animations toutes prêtes, et tu peux créer les tiennes image par image dans le mode dessin.

Pour importer un GIF trouvé ou créé ailleurs, deux règles évitent la plupart des déceptions :

- **Redimensionne-le avant de l'importer** à 32 x 32 ou 64 x 64 pixels, avec un outil de retouche ou un convertisseur de GIF en ligne.
- **Garde-le court.** Un GIF avec beaucoup d'images est long à transférer en Bluetooth et peut être refusé. Quelques images suffisent pour une animation qui boucle bien.

Une fois envoyées, les images et animations sont enregistrées dans le cadre, qui continue de les afficher sans le téléphone.

## Horloge, texte défilant et effets

- **Horloge** : le mode horloge affiche l'heure, avec plusieurs styles et couleurs au choix, et parfois la date. L'heure se règle depuis l'application.
- **Texte** : tape un message, choisis la couleur et la vitesse de défilement. Pratique pour un pseudo, un message d'anniversaire ou un « en live » pendant un stream.
- **Effets et musique** : l'application propose des effets lumineux, dont un mode qui réagit au son.

<!-- CAPTURE : mode horloge -->

## Problèmes fréquents et solutions

**Le cadre n'apparaît pas dans l'application.**
Vérifie que le Bluetooth est activé et, sur Android, que l'application a bien l'autorisation de localisation. Rapproche le téléphone, ferme complètement l'application puis rouvre-la. Si le cadre est encore connecté à un autre téléphone, déconnecte-le d'abord.

**L'écran clignote, redémarre ou s'éteint.**
C'est presque toujours l'alimentation. Utilise un adaptateur secteur de 5 V / 2 A minimum et le câble fourni, plutôt qu'un port USB d'ordinateur ou une multiprise USB déjà chargée.

**Les couleurs ne sont pas celles de l'aperçu.**
Un écran LED n'a pas le même rendu qu'un écran de téléphone. Sur la version 32x32, l'orange et le jaune peuvent légèrement différer de l'aperçu, comme le précise le fabricant. Choisis des couleurs franches et vérifie le rendu directement sur le cadre.

**Une partie de mon image reste noire.**
Ce sont des pixels noirs ou très sombres : les LED correspondantes sont éteintes. Remplace le noir par une couleur sombre si tu veux que toute la surface s'allume.

**Mon image importée est floue.**
Elle n'était pas à la bonne taille. Recommence avec un fichier de 32 x 32 ou 64 x 64 pixels exactement, en PNG.

## Et maintenant ?

Le plus amusant reste à faire : créer tes propres images. Va chercher l'inspiration dans le guide [pixel art 32x32](/guides/pixel-art-32x32), ou découvre [comment décorer ton setup gaming](/guides/decorer-setup-gaming) autour de ton cadre.
