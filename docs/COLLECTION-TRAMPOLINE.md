# Collections illustrées et Trampoline Park

## Dressing

Les cinq auras ont désormais un double contour contrasté, une légère teinte au sol et une épaisseur minimale de 1,8 pixel pour rester visibles avec la vue téléphone élargie. Le contour suit le rayon du gourmand, sans particules ni flou coûteux. Le mode simplifié conserve l’anneau fixe ; le mode désactivé le masque localement.

Un atlas WebP d’environ 440 Ko fournit **21 illustrations peintes** : cinq auras, cinq animations et onze surnoms. Les miniatures n’utilisent plus de glyphes emoji. Les trois choix « sans… » ou « pose naturelle » montrent une assiette vide. Les images restent des illustrations de collection ; les personnages en jeu conservent leurs véritables images et cosmétiques. Le bouton « Voir mon animation de podium » anime le véritable aperçu du gourmand avec l’animation équipée.

`title_6` garde son identifiant et ses achats existants, mais s’appelle maintenant **L’Abonné du buffet**. Les nouvelles entrées sont `title_8` **La Boule**, `title_9` **Produit par MVP** et `title_10` **Celui qui a accepté les cookies**. Elles utilisent l’économie, les sauvegardes et la synchronisation des surnoms existantes. Aucun compte, jeton ou portefeuille n’est réinitialisé.

## Trampoline Park validé

La carte figure dans les cartes validées en solo et dans la liste multijoueur, sans mention « En travaux ».

Les 22 anciens bumpers ronds en périphérie sont remplacés par **quatre murs continus rebondissants** suivant les vraies limites physiques. Les quatre bumpers du milieu et les cinq trampolines restent présents. La vitesse de rebond des murs est orientée vers l’intérieur ; la composante tangentielle est conservée et la vitesse totale est plafonnée à 48, comme les bumpers existants. Les contacts dans les coins combinent les deux normales. Le comportement des bumpers de Fête foraine reste inchangé.

Les murs sont peints comme des bandes capitonnées continues, avec une réaction lumineuse au contact. Les tapis centraux ondulent légèrement ; leurs ressorts et leur cercle lumineux bougent davantage lorsqu’un gourmand est dessus. Ces animations sont calculées par le navigateur, sans changer les zones ni le déclenchement de la téléportation de fin de tour. Elles respectent le réglage local de réduction des animations.

Les anciennes parties déjà enregistrées gardent leurs obstacles depuis leur checkpoint ; le nouveau pourtour s’applique aux nouveaux départs. Les identifiants de carte et le protocole existant sont conservés.

## Vérification

- Tests physiques sur les quatre murs, à trois positions le long de chaque côté et dans un coin ; vérification du rebond intérieur, du plafond de vitesse et des téléportations.
- Tests unitaires des titres et du catalogue, de la sauvegarde, des trophées, du podium et des règles existantes.
- Navigateur : chargement des 21 illustrations, visibilité de l’aura à la taille d’un avatar sur téléphone, aperçu de l’animation équipée, tapis réellement différents entre deux instants, tapis fixes en mode simplifié, tenues à quatre poids et présentation mobile.
- Trois configurations SQLite/WebSocket locales avec quatre clients et 8, 24 ou 50 gourmands sur Trampoline Park : mêmes états finaux et cosmétiques sur tous les clients.
- Parcours complet du vrai salon à quatre navigateurs, avec reconnexions, chat, replay retardé, podium et revanche.

Ces essais locaux ne mesurent pas les FPS sur tous les téléphones ni le confort de quatre ordinateurs sur de vrais réseaux. Le déploiement public se confirme séparément avec GitHub Pages et le contrôle Cloudflare après publication.
