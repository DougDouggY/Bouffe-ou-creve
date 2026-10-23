# La Face Cachée — modes, illustrations et trophées

## Accès et menu

Options → La face cachée du burger → mot de passe **Pologne**. Le retour au burger normal reste dans les options.

| Ingrédient     | Face normale         | Face cachée                |
| -------------- | -------------------- | -------------------------- |
| Pain supérieur | Trophées du gourmand | Trophées de La Face Cachée |
| Salade         | États-Unis           | Somalie                    |
| Tomates        | Classique            | La Plateforme              |
| Fromage        | Grand Banquet        | Le Festin Cannibale        |
| Steak          | Dressing du Glouton  | Le Marchand de Glaces      |
| Pain inférieur | Options              | Options                    |

Le dressing ne s’ouvre pas depuis l’univers caché. Les illustrations originales du burger normal et des trophées classiques sont conservées ; les nouvelles illustrations sont des fichiers séparés dans `assets/secrets/`.

La génération d’images, bloquée lors de la première tentative, a fonctionné à la reprise du 23 octobre 2026. Le burger secret conserve les silhouettes des six aliments et utilise ses propres textures d’interaction. Les personnages autour deviennent démoniaques ; les masques alpha et les contrôles clavier / tactiles restent ceux du menu existant.

## La Plateforme

Tournoi de seize participants, huit duels initiaux dans huit vrais mondes Matter. Les duels hors écran utilisent les mêmes méthodes `Game.step`, les mêmes IA, les mêmes aliments, les mêmes impulsions et les mêmes critères de chute. Le travail hors écran est réparti entre les images pour borner le coût par image ; aucun résultat n’est choisi par tirage au sort ou comparaison arbitraire des poids.

Chaque duel offre trois propulsions de festin. Le troisième tour affiche une alerte explicite. La plateforme descend ensuite pendant 1,1 seconde ; ses occupants tombent, les aliments repartent, le puits reste ouvert. Les survivants continuent le duel. Une chute est testée après chaque sous-pas physique, avec retrait du corps et animation visuelle ; la transition attend l’animation.

La prédation entre gourmands est désactivée uniquement dans ce mode. Le poids en kilogrammes est conservé chez tous les vainqueurs. La masse Matter du duel est `6 × (poids / 60)^0,45` : le poids rend plus résistant sans rendre un participant de 2 000 kg immobile. Les autres modes conservent leur conversion en masse habituelle.

Les nouveaux duels réinitialisent les positions et les aliments, mais pas les poids. Un étage aléatoire identifie chaque nouvelle cellule. Les IA cherchent la nourriture pendant le festin, sortent du puits au troisième tour, puis cherchent un angle de poussée vers le vide en pénalisant leurs propres trajectoires de chute. Après seize tours, le puits s’agrandit progressivement pour éviter les blocages ; le décor détaillé du puits est réutilisé pour cet agrandissement.

Si deux participants tombent, l’instant du sous-pas physique permet de distinguer les chutes. Une chute simultanée au même sous-pas rejoue le duel avec les poids conservés. Une victoire intermédiaire ne déclenche ni récompense finale ni victoire classique : elle mène au duel suivant lorsque les autres vainqueurs sont connus. Le bouton « Tableau du tournoi » permet de consulter les affrontements et leurs poids.

## Le Festin Cannibale

Village horrifique fictif, sans référence caricaturale à une population réelle. Les marmites et banquets bordent une clairière jouable délimitée dans le décor.

Les victimes sont des adultes fictifs illustrés, avec moustache, lunettes et vêtements d’adulte. Chaque victime donne **40 kg**. Avant la résolution d’un tir, elles préparent une courte fuite de 650 ms ; leur vitesse maximale limite le déplacement à 58,5 unités. Les collisions avec les obstacles sont vérifiées à chaque déplacement. La panique, le balancement de course, le trébuchement et le relevé utilisent le sprite détaillé détouré, pas une forme générique.

La prédation entre gourmands et la règle du dernier survivant restent celles du jeu classique.

## Le Marchand de Glaces

Le nom « Le Marchand de Cauchemars » est abandonné. Le joueur dirige une camionnette vivante illustrée, avec bouche, phares expressifs, carrosserie et pneus déformables. Le corps physique est rectangulaire à coins arrondis ; son orientation suit la propulsion. Les îlots plantés du quartier ont leurs propres obstacles solides.

Les enfants représentés sont explicitement des êtres fantastiques non humains : peau turquoise / violette, antennes et anatomie monstrueuse. Les descriptions utilisent le mot « enfant », conformément à la demande. Ils donnent 40 kg et partagent les déplacements courts et réactions des victimes. Aucune représentation réaliste de violence envers des mineurs n’est utilisée.

La croissance et les impacts suivent les règles du jeu. L’absorption d’une camionnette adverse transmet **55 % de son poids actuel**, conformément au moteur existant ; cela inclut le poids déjà gagné grâce aux captures. Il ne s’agit pas d’un transfert de 100 %.

## Trophées et sauvegardes

La Face Cachée possède **39 trophées** : 12 pour La Plateforme, 11 pour le Festin Cannibale, 12 pour le Marchand de Glaces et 4 pour Somalie. Le catalogue et les conditions sont dans `secret-trophies.js` ; les illustrations reprennent la même organisation 7 × 6 et la même direction artistique sculpturale dorée que l’atlas classique.

Les trophées masqués montrent leur nom et une silhouette tant qu’ils ne sont pas débloqués. Leur description est cachée. Les déblocages réutilisent le toast animé, les médailles, les descriptions au survol et la fiche de fin de partie existants.

La progression cachée est enregistrée dans `profile.shadow` : trophées horodatés, compteurs de victimes / enfants, victoires par mode et traces historiques migrées. Elle ne se mélange pas à `profile.trophies` ou aux victoires nécessaires pour débloquer le Grand Banquet / les États-Unis. Les points, les achats, l’équipement et les sauvegardes existants restent conservés.

L’ancien succès « Survivant de Somalie » quitte la salle normale. Son horodatage est conservé dans `shadow.legacy.somaliaWin`, sans inventer un déblocage dont la condition diffère. Les anciennes victoires Somalie sont reprises dans la progression cachée ; dix victoires historiques donnent « La dalle internationale ». Le trophée normal « Le buffet est fermé » concerne désormais Classique, Grand Banquet et États-Unis.

### Conditions clarifiées

- **C’était pas personnel** : dévorer une victime après un gourmand pendant la même propulsion.
- **La règle des cinq secondes** : dévorer une victime dans les cinq secondes suivant sa chute.
- **Service compris** : une vraie poussée du joueur pendant le troisième tour doit envoyer l’adversaire sur la plateforme, où son départ l’élimine.
- **Je finissais l’assiette !** : avoir été sur la plateforme pendant le troisième tour et être sorti avant sa descente ; une sortie au premier ou au deuxième tour ne suffit pas.
- **Le poids de la victoire** est intégré après vérification de finales physiques avec un champion de plus de 2 000 kg.

« Descente aux enfers », « Rien dans l’assiette » et les doublons écartés ne figurent pas dans le catalogue caché.

### Laboratoire isolé

Le bouton de la salle cachée ouvre un laboratoire de déclenchement. Chaque essai crée un profil neuf en mémoire et passe par le même évaluateur de conditions. Aucun point ni trophée réel n’est sauvegardé. Ce laboratoire sert à vérifier les événements et seuils ; il ne prétend pas remplacer les tests de physique ou démontrer à lui seul qu’une condition est réalisable en jouant.

## Validation exécutée

- `npm test` : catalogue, absence de doublons dans un même mode, isolation des événements IA / classiques, normalisation des sauvegardes, événements de victoire idempotents, laboratoire sans état partagé, masse physique monotone, ainsi que les tests existants.
- `npm run test:secrets` : déclenchements des 39 trophées, migration des sauvegardes, collisions et croissance, impact réel de 60 kg sur 2 000 kg, descente / chute / conservation des poids, deux tournois complets à seize participants et vainqueurs réels de plus de 2 000 kg.
- Le même test vérifie physiquement cinq captures dans une propulsion et la réalisation de « Service compris », puis contrôle les quatre emplacements, les trois lancements, les trophées séparés, un vrai déblocage sauvegardé et rechargé, le laboratoire sans écriture, le tableau des huit duels et les trois propulsions sur viewport mobile.
- `npm run test:browser` et `npm run test:arenas` : régression des menus, modes classiques, progression et arènes existantes.

Les captures générées sont dans `test-results/` : `face-cachee-burger.png`, `face-cachee-mobile.png`, `trophees-face-cachee.png`, `secret-platform.png`, `secret-platform-descente.png`, `secret-cannibal.png`, `secret-icecream.png` et les trois `secret-mobile-*.png`.

Ces contrôles ne constituent pas une session complète de validation humaine des 39 succès. Le rythme des duels, l’agrandissement tardif du puits et la densité des victimes restent à apprécier en jouant.
