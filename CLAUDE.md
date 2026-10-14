# Brief Claude Code : boutique e-commerce thème pixel art / rétro arcade

Tu vas construire avec moi une boutique e-commerce en dropshipping, en français, pour le marché France. Lis ce brief en entier avant d'écrire du code. Avance par phases, montre-moi le résultat à la fin de chaque phase et attends ma validation avant de passer à la suivante. Si une info manque, utilise le placeholder indiqué et liste-le dans TODO.md. N'invente jamais de données : prix, specs, avis clients, mentions légales, chiffres.

## 1. Contexte et positionnement

La marque s'appelle Lumipix, sur le domaine lumipix.shop. Boutique de niche dans l'univers pixel art et rétro arcade, qui vend de la déco et des objets pour le setup gaming et la chambre. Le produit phare au lancement est le cadre LED pixel art connecté (Bluetooth, appli iDotMatrix), en deux variantes sur une seule page produit : 32x32 à 79 € TTC et 64x64 à 149 € TTC, livraison offerte sur les deux. Sa fiche complète est fournie dans a-integrer/cadre-pixel-art-led.md, à déplacer dans src/content/produits/ dès que les schémas existent.

Priorité de lancement : tout le site, de l'accueil à la navigation en passant par les textes, le SEO et les visuels, est centré sur l'univers pixel art / rétro arcade, sur les mots-clés de la section 8 et sur le cadre pixel art comme produit phare. L'architecture reste prête à accueillir d'autres produits sans refonte, mais on ne crée aucune page vide ni catégorie fantôme pour des produits qui n'existent pas encore : une collection n'apparaît dans la navigation que si elle contient au moins un produit actif.

La cible principale, ce sont les 18-28 ans qui soignent leur setup gaming et achètent pour eux-mêmes. La cible secondaire, en novembre et décembre, ce sont les parents qui cherchent un cadeau geek pour un ado.

L'acquisition passe d'abord par l'organique (TikTok, Instagram, YouTube Shorts), puis par le SEO. Pas de publicité au lancement.

Le site est uniquement en français, les prix sont en euros TTC, et la livraison se fait en France métropolitaine uniquement au lancement.

## 2. Contrainte absolue : propriété intellectuelle

Le site ne doit contenir aucune référence à une marque ou un univers protégé : pas de Minecraft, Nintendo, Mario, Pac-Man, Space Invaders, Pokémon, PlayStation, Xbox, Divoom, ni aucun personnage, logo, nom ou forme reconnaissable de ces univers. Ça vaut pour les textes, les visuels, les exemples de pixel art, les noms de fichiers, les métadonnées et les mots-clés. Toute l'identité pixel / voxel / arcade doit être originale. Si tu as un doute sur un élément, tu ne l'utilises pas et tu me le signales.

## 3. Stack technique et hébergement

1. Astro (dernière version stable) en TypeScript, sortie statique pour toutes les pages publiques.
2. Code sur GitHub : le dépôt existe déjà et contient ce fichier CLAUDE.md et le dossier a-integrer. Tu travailles dedans et tu pousses tes commits sur main.
3. Hébergement sur Cloudflare Pages connecté au dépôt GitHub, avec déploiement automatique à chaque push sur main et prévisualisation sur les autres branches.
4. Le domaine et les boîtes mail sont chez Hostinger. Documente dans le README la configuration DNS pour faire pointer le domaine vers Cloudflare Pages sans casser les enregistrements mail (MX, SPF, DKIM).
5. Les fonctions serveur passent par les Cloudflare Pages Functions : création de session Stripe, webhook Stripe, API admin, formulaire de contact.
6. La base de données est Cloudflare D1 : commandes, avis, inscriptions email.
7. Le paiement passe par Stripe Checkout en mode hébergé, avec webhooks signés et clés uniquement en variables d'environnement.
8. Les emails transactionnels passent par Resend (offre gratuite), envoyés depuis le domaine de la marque, avec des templates HTML aux couleurs de la marque.
9. L'anti-spam du formulaire de contact passe par Cloudflare Turnstile.
10. L'analytics passe par Cloudflare Web Analytics, qui fonctionne sans cookie et ne nécessite pas de consentement.
11. Pour le CSS, tu choisis entre CSS natif avec custom properties ou Tailwind, mais la performance mobile est prioritaire.
12. Les animations utilisent d'abord CSS et du JavaScript léger. Une librairie d'animation n'est autorisée que chargée uniquement là où elle sert. Aucun framework lourd chargé sur toutes les pages.
13. L'admin est protégé par Cloudflare Access, pas par un système d'authentification maison.

Aucun abonnement payant ne doit être nécessaire pour faire tourner le site au lancement.

## 4. Architecture catalogue

Les produits forment une collection de contenu Astro, avec un fichier par produit et un schéma validé par Zod. Ajouter un produit revient à ajouter un fichier, sans toucher au code. Crée aussi docs/AJOUTER-UN-PRODUIT.md avec un modèle de fiche commenté et la procédure pas à pas.

Le schéma produit contient au minimum :
1. id, slug, nom, sous-titre, statut (brouillon, actif, archivé)
2. prix de vente TTC, prix barré optionnel
3. variantes (nom, options, prix spécifique optionnel, disponible oui/non)
4. collection(s) d'appartenance
5. photos et vidéos (chemins locaux, texte alternatif obligatoire)
6. description courte, description longue en Markdown, specs techniques (clé / valeur), contenu de la boîte
7. FAQ propre au produit
8. délai de livraison estimé (min et max en jours ouvrés)
9. un bloc fournisseur, jamais exposé côté client ni dans le HTML ou le JS généré : nom du fournisseur, URL produit AliExpress, identifiant produit, identifiant de chaque variante côté fournisseur, prix d'achat, frais de port d'achat
10. SEO : mot-clé principal, mots-clés secondaires, title, meta description
11. produits liés, et type (simple ou bundle ; un bundle référence des produits existants)

Les collections forment une collection de contenu séparée : slug, nom, description, visuel, texte SEO, mot-clé principal.

Les URLs sont définitives et ne doivent jamais changer ensuite :
/ (accueil)
/produits/[slug]
/collections/[slug]
/guides/[slug] (blog et tutoriels SEO)
/idees-cadeaux (page saisonnière)
/panier
/commande/merci
/suivi (suivi de commande par numéro de commande et email)
/faq
/livraison, /retours, /cgv, /mentions-legales, /confidentialite, /contact
404 personnalisée dans l'univers pixel, avec liens vers le produit phare et l'accueil.

## 5. Pages et expérience

L'identité visuelle relève d'un univers pixel / voxel / arcade original. Les titres utilisent une typographie pixel (police libre de droits, auto-hébergée), et le corps de texte une typographie lisible. La palette est sombre, type écran d'arcade avec des couleurs néon, et les contrastes sont accessibles (WCAG AA). Effets possibles : transitions de page en blocs qui se construisent, survols en pixels, micro-sons 8 bits désactivés par défaut avec un bouton pour les activer, curseur pixel optionnel. prefers-reduced-motion doit être respecté.

La règle d'or : l'immersion est sur l'accueil et les collections, l'efficacité sur la page produit, le panier et le checkout. Rien ne doit ralentir l'ajout au panier. Tout est pensé mobile d'abord, avec des zones tactiles confortables.

Accueil : héro immersif avec le produit phare, vidéo courte du cadre en fonctionnement (placeholder), arguments, aperçu de l'éditeur pixel art, collections, FAQ courte, réassurance (paiement sécurisé, délais, retours 14 jours), et inscription email avec double opt-in.

Page produit : galerie, prix, variantes, bouton d'ajout au panier toujours visible sur mobile, délai de livraison affiché, specs, contenu de la boîte, FAQ, avis clients, produits liés. Pour le cadre pixel art, on ajoute l'éditeur pixel art.

L'éditeur pixel art est le composant clé pour la conversion :
1. grille 32x32 ou 64x64 selon la variante sélectionnée sur la page (bascule entre les deux, le dessin 32x32 s'agrandit proprement en 64x64), dessinable au doigt et à la souris, palette de couleurs, gomme, remplissage, effacer tout, annuler et rétablir
2. rendu en direct sur une maquette du cadre allumé (effet LED avec léger glow), dans une mise en scène de bureau
3. modèles de départ originaux (cœur, champignon générique, fusée, chat, étoile, manette générique), sans aucune référence à un univers protégé
4. export du dessin en PNG à la résolution de la variante (32x32 ou 64x64), pour que le client puisse l'importer dans l'appli du cadre
5. partage du dessin via une URL encodée (pas de stockage serveur), avec une image Open Graph générée par une fonction serveur pour que le lien partagé affiche le dessin en aperçu sur les réseaux
6. bouton d'ajout au panier intégré à l'éditeur
7. chargé en îlot Astro uniquement sur la page produit concernée, après le contenu principal, pour ne pas dégrader la vitesse

Le panier est multi-produits et multi-variantes, stocké côté client, avec un récapitulatif clair. Les frais de port et le délai sont affichés avant le paiement.

Pour les avis clients : on n'affiche que des avis réels, collectés via l'email post-achat et liés à une commande vérifiée. Ils sont stockés dans D1 et modérés depuis l'admin. Au lancement, sans avis, la section est masquée. Le balisage AggregateRating n'est généré que s'il existe de vrais avis. Aucun faux avis, jamais, même en exemple visible.

## 6. Paiement, commandes et suivi

1. Le panier appelle une fonction serveur qui recalcule les prix à partir des données produit (ne jamais faire confiance aux prix envoyés par le navigateur) et crée une session Stripe Checkout. L'adresse de livraison en France est obligatoire, ainsi que l'email et le téléphone. Les codes promo sont activés, l'acceptation des CGV est obligatoire via la collecte de consentement de Stripe, et la facture est générée automatiquement par Stripe.
2. Les frais de port viennent de la fiche produit et du fichier de configuration (0 € sur le cadre), avec un seuil de livraison gratuite [SEUIL_LIVRAISON_GRATUITE] optionnel pour les futurs produits.
3. Les paramètres UTM et le référent de la première visite sont conservés côté client et transmis dans les métadonnées de la session Stripe, pour savoir quelle vidéo ou quel réseau a généré chaque vente.
4. Le webhook Stripe (checkout.session.completed, signature vérifiée, traitement idempotent) enregistre la commande dans D1 : client, adresse, lignes, montants, source UTM, statut.
5. Chaque ligne de commande est rattachée à son fournisseur et à l'identifiant de variante fournisseur. Une commande peut générer plusieurs commandes fournisseur distinctes, chacune avec son propre statut et son propre numéro de suivi.

Les statuts de commande fournisseur sont : à passer, passée, expédiée (avec suivi), livrée, problème, remboursée.

La transmission des commandes au fournisseur se fait en deux temps.

Phase manuelle (lancement) : la page /admin liste les commandes à passer. Pour chaque ligne, elle affiche le lien direct vers le produit AliExpress, la variante exacte, la quantité, et l'adresse du client formatée prête à copier. Des boutons permettent de marquer la commande comme passée et de saisir le numéro de suivi, ce qui déclenche l'email d'expédition. Un bouton de remboursement total ou partiel appelle l'API Stripe. L'admin permet aussi de modérer les avis et d'afficher un tableau simple : chiffre d'affaires, nombre de commandes, marge estimée (prix de vente moins prix d'achat), ventes par source UTM. Une notification email part vers l'admin à chaque nouvelle commande.

Phase automatisée (plus tard) : via l'API Dropshipping de l'AliExpress Open Platform. Prépare dès maintenant une interface SupplierAdapter (createOrder, getOrderStatus, getTracking) avec une implémentation "manual" pour le lancement. N'implémente pas l'adaptateur AliExpress maintenant : la documentation officielle sera vérifiée le moment venu, ne devine aucun nom de méthode.

La page /suivi permet au client de retrouver le statut et le ou les numéros de suivi de sa commande avec son numéro de commande et son email.

## 7. Emails

1. confirmation de commande avec récapitulatif et lien vers la facture Stripe
2. expédition avec numéro et lien de suivi (un email par colis si plusieurs fournisseurs)
3. livraison estimée atteinte : lien vers le guide de démarrage en français
4. demande d'avis environ 10 jours après expédition, avec lien unique lié à la commande
5. confirmation d'inscription email (double opt-in)
6. notification admin à chaque commande, à chaque message de contact et à chaque erreur de webhook

## 8. SEO

Mots-clés cibles par page (un mot-clé principal par page, jamais deux pages sur le même) :
1. Accueil : "déco pixel art", secondaires "déco gaming pixel" et "Lumipix".
2. Page produit du cadre : "cadre pixel art LED", secondaires "écran pixel art", "cadre LED pixel", "écran LED 32x32", "cadre pixel art connecté".
3. Collection setup : "déco setup gaming", secondaire "accessoires setup gaming".
4. Collection chambre (créée quand les produits existeront) : "déco chambre gamer".
5. Page /idees-cadeaux : "cadeau gamer moins de 50 euros", secondaire "cadeau geek original".
6. Guide prioritaire 1 : "iDotMatrix tuto", secondaire "application iDotMatrix" (tutoriel complet en français, captures en placeholder).
7. Guide prioritaire 2 : "pixel art 32x32", secondaire "idée pixel art facile" (modèles originaux téléchargeables et lien vers l'éditeur).
8. Guide 3 : "comment décorer son setup gaming".

Mots-clés interdits : toute requête contenant une marque ou un univers protégé (voir section 2).

Le mot-clé principal de chaque page apparaît dans le title, le H1, l'URL quand c'est possible, le premier paragraphe et le texte alternatif de l'image principale, sans bourrage. Les guides renvoient vers la page produit et entre eux (maillage interne). Rédige les contenus des trois guides prioritaires en français naturel, utiles pour de vrai, sans remplissage.

SEO technique :
1. title et meta description uniques par page, balises Open Graph et Twitter, image de partage par page
2. données structurées JSON-LD : Organization, WebSite, Product avec Offer (prix, disponibilité, délai, frais de port, politique de retour), BreadcrumbList, FAQPage, Article pour les guides
3. sitemap.xml et robots.txt générés automatiquement, URL canoniques, admin et pages de commande en noindex
4. images en AVIF ou WebP, dimensions explicites, lazy loading sauf au-dessus de la ligne de flottaison
5. objectif Lighthouse mobile : 90 ou plus en performance, accessibilité, bonnes pratiques et SEO
6. langue fr-FR partout

## 9. Pages légales et conformité

Crée les pages avec une structure complète mais des placeholders clairs, sans inventer de contenu juridique : mentions légales, CGV, droit de rétractation de 14 jours avec formulaire type, politique de confidentialité (durées de conservation, droits RGPD), médiateur de la consommation, politique de livraison et de retours. Les informations précontractuelles (prix TTC, frais de port, délais, droit de rétractation) doivent être visibles avant le paiement. La TVA suit le régime normal à 20 % (voir section 10), avec les prix TTC affichés partout et le détail HT / TVA / TTC sur les factures. Il n'y a aucun cookie ni traceur non essentiel au lancement, donc pas de bandeau nécessaire. Si un pixel publicitaire est ajouté plus tard, il passera derrière un bandeau de consentement conforme : prévois l'emplacement, mais ne l'active pas. Toutes les données de la société viennent d'un seul fichier de configuration.

## 10. Informations connues et placeholders

Informations validées, à utiliser telles quelles :
Nom de marque : Lumipix
Domaine : lumipix.shop
Société éditrice et vendeuse : EROS, SASU (société par actions simplifiée unipersonnelle) au capital de 100 €
Siège social : 53 avenue de Colmar, 68200 Mulhouse (via [SOCIETE_ADRESSE_SIEGE] dans le fichier de configuration, car l'adresse peut changer en cas de domiciliation)
SIREN : 898 741 640
SIRET du siège : 898 741 640 00038
RCS : 898 741 640 R.C.S. Mulhouse
Numéro de TVA intracommunautaire : FR31898741640
Code APE : 47.91A

Règle de confidentialité : le site n'affiche que le strict minimum légal sur la société. Le nom du président n'apparaît qu'à un seul endroit, la ligne "directeur de la publication" des mentions légales, parce que la loi l'impose pour un site édité par une société. Il n'apparaît nulle part ailleurs : pas dans les CGV, pas dans la page contact, pas dans les emails, pas dans les données structurées, pas dans les métadonnées. Aucune date de naissance, aucun téléphone personnel. L'adresse du siège n'apparaît que dans les mentions légales, les CGV et les factures, là où la loi l'exige, et jamais comme adresse de retour : les retours utilisent [ADRESSE_RETOURS], communiquée au client uniquement après validation de sa demande de retour. Le contact client passe uniquement par l'email de la marque et le formulaire.

Placeholders restants (à lister dans TODO.md) :
[DIRECTEUR_PUBLICATION], [ADRESSE_RETOURS], [EMAIL_CONTACT] (par défaut contact@lumipix.shop), [MEDIATEUR_CONSO], [IDENTIFIANT_UNIQUE_REP], [SEUIL_LIVRAISON_GRATUITE] (pour les futurs produits), et les champs marqués [A MESURER SUR ECHANTILLON] ou A VERIFIER dans la fiche du cadre.
Frais de port : 0 € sur le cadre (livraison offerte sur les deux variantes).

TVA : la société est assujettie à la TVA au régime normal, taux de 20 %. Tous les prix affichés sont TTC. Les factures Stripe font apparaître le HT, la TVA à 20 % et le TTC, ainsi que le numéro de TVA intracommunautaire. Le tableau de bord admin calcule la marge sur le prix HT, pas sur le TTC.

Les mentions légales contiennent : raison sociale, forme et capital, adresse du siège, SIREN et RCS, numéro de TVA intracommunautaire s'il existe, email de contact, directeur de la publication, et l'hébergeur (Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, États-Unis, à vérifier au moment de la mise en ligne).

## 10 bis. Médias produit

Tu ne vas jamais chercher toi-même les produits ni les images sur AliExpress. Les données et les médias de chaque produit te sont fournis prêts à l'emploi, selon cette convention :
1. src/content/produits/[slug].md : la fiche produit remplie (specs, prix, variantes, bloc fournisseur)
2. assets/produits/[slug]/ : les visuels finaux en haute définition, nommés 01-hero, 02-ambiance, 03-detail, etc., et les vidéos
3. tu génères les déclinaisons optimisées (AVIF, WebP, plusieurs tailles, srcset), sans recadrer de manière destructive
4. tant qu'un dossier est vide, tu utilises le composant de rendu produit décrit ci-dessous, jamais une image de fournisseur

Composant de rendu produit (à créer en phase 2, aucun outil externe ni service payant) : un rendu du cadre entièrement en SVG / CSS, fidèle au vrai produit. Cadre carré noir mat aux bords légèrement arrondis, écran de LED RGB avec un léger glow, proportions réelles (la version 64x64 mesure 26 x 26 x 1,7 cm, la version 32x32 est plus petite, tu prendras sa taille dans la fiche quand elle sera mesurée), en vue de face et en vue de trois quarts. L'écran affiche nos propres scènes de pixel art originales, en 32x32 et en 64x64 : coucher de soleil rétro avec route et voiture, ciel étoilé, horloge pixel, cœur, chat, fusée, vague néon, sans aucune référence à un univers protégé. Les scènes peuvent être animées (scintillement, défilement), avec respect de prefers-reduced-motion. Ce composant sert au héro de l'accueil, aux visuels de la galerie produit en attendant les vraies photos, aux images Open Graph et à la maquette de l'éditeur pixel art. Il doit être assez propre pour rester en production même quand les vraies photos arriveront, parce qu'il montre ce que le client peut créer.

## 11. Phases de travail

Phase 1 : initialisation du projet Astro et de git, structure des dossiers, schémas de contenu, fichier de configuration société, design system (couleurs, typos, composants de base), layout et navigation. Livrable : une page de démonstration du design system.
Phase 2 : composant de rendu produit et scènes de pixel art originales, puis accueil, page produit du cadre (deux variantes), page collection, 404, à partir de la vraie fiche du cadre.
Phase 3 : éditeur pixel art, export PNG, partage par URL avec image Open Graph.
Phase 4 : panier, Stripe Checkout en mode test, webhook, D1, capture des UTM.
Phase 5 : admin des commandes, remboursements, avis, tableau de bord, emails transactionnels, page de suivi, formulaire de contact.
Phase 6 : SEO technique, contenus des trois guides prioritaires, page idées cadeaux, pages légales, FAQ, optimisation des performances.
Phase 7 : recette complète en mode test Stripe (commande simple, commande multi-fournisseurs, remboursement, avis, webhook rejoué), puis checklist de mise en production (DNS, variables d'environnement, passage de Stripe en mode live, test d'une vraie commande).

À chaque phase : commits clairs et fréquents, README tenu à jour (installation, variables d'environnement, déploiement, DNS, ajout d'un produit), et une explication courte de ce qui a été fait et de ce qui reste.

Ne mets jamais de secret dans le dépôt. Utilise un fichier .env.example documenté.
