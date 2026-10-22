# Arènes et pouvoirs — version de test

Aucune carte accessible avant cette mise à jour n'est retirée. Fête foraine et Plage sont réintroduites dans les cartes validées, avec un nouveau Buffet du Roi distinct du Palais de Douggy existant.

## Physique et tours simultanés

`ArenaMechanics` s'appuie sur les vrais corps Matter du jeu. Les intentions des IA et du joueur restent calculées avant tout déplacement. Les agents annoncent leur direction avant le tir et ne réagissent pas à la direction secrète du joueur. Un parcours de grille évite les rayons lors de la préparation de leur petite propulsion (vitesse 3,2 contre 17 maximum pour un gourmand avant coefficient de poids).

Les cinq arènes modifiées utilisent quatre sous-pas physiques par image logique. Le même découpage s'active sur les autres cartes lorsqu'un piment brûle. Les trajectoires de feu sont vérifiées par distances entre segments réellement parcourus, et non par une trajectoire théorique. Les collisions secondaires des chariots sont résolues par Matter, avec une masse de 3,5, une faible friction et un plafond de vitesse 18. Les gourmands ne sont jamais déplacés directement par ces nouvelles mécaniques.

Les bumpers restent fixes. Leur impulsion normale dépend de l'angle du contact, amplifie la vitesse incidente de 28 %, a un minimum de 6 et un plafond de 20. Un délai de 220 ms empêche les rebonds répétés sur un même contact.

Le roi aspire pendant 2,4 secondes après la résolution des déplacements des manches impaires. La force varie avec la distance et la racine inverse du poids, avec des bornes. Les manches paires se terminent par un rot de 1,1 seconde, animé et sonorisé doucement. Le rot ne pousse personne dans cette première version. La bouche tue indépendamment du poids. La fin du tour attend la fin de ces animations physiques.

La vague des manches multiples de trois parcourt la plage de bas en haut en 2,6 à 6 secondes, selon la taille du terrain. Une bande mobile applique une poussée aux corps qui la rencontrent, avec une résistance accrue des gros poids. Les murs restent solides et regroupent les gourmands du côté opposé.

## Apparition et durée des pouvoirs

- Un tirage global unique à chaque début de manche, y compris la première : probabilité strictement de 1 %. En cas de réussite, un second tirage choisit à parts égales Burger Blindé ou Piment de l'Enfer. Aucun tirage par aliment. Aucun changement du calcul des burgers de Douggy.
- Burger Blindé : absorbe une dévoration entre gourmands et se brise. Aucun gain de poids, aucune protection contre le feu, la sécurité ou le roi. Pas de cumul de boucliers.
- Piment de l'Enfer : arme la prochaine propulsion. La traînée se crée pendant le déplacement et disparaît à la fin du tour ou de la partie. Son propriétaire peut mourir en la recroisant. La zone fraîche sous son propre corps est ignorée jusqu'à ce qu'il ait parcouru deux diamètres de sécurité environ : le personnage n'est pas tué instantanément par le feu qu'il vient de déposer.
- Lampe nocturne : halo multiplié par 1,8. Le tour de ramassage est offert, puis l'effet couvre deux tirs complets.
- Gant anti-sécurité : le tour de ramassage est offert, puis un tir complet. Les agents sont repoussés par une impulsion, sans déplacement instantané du gourmand. Ne protège pas contre les dévorations ou le feu.
- Les deux objets nocturnes sont servis dès la première manche, puis réapprovisionnés toutes les deux manches s'ils manquent. Les exemplaires inutilisés restent au maximum quatre manches. Ces apparitions sont indépendantes du tirage global.
- Les IA ramassent et utilisent les mêmes objets. Les effets sont dans la partie en cours, jamais dans les sauvegardes du profil.

La fin secrète entre deux très gros gourmands reste disponible sur les autres cartes. Elle est suspendue dans les arènes du roi et des agents, ainsi que lorsqu'un piment est armé ou actif, pour ne pas annuler un danger mortel encore présent.

## Rendu

Le Supermarché en Folie est éclairé. Les étalages sont désormais périphériques et décoratifs. Sa version nocturne partage exactement le même fichier de fond et le même terrain ouvert sans rayons centraux ; seul l'éclairage et les personnages mobiles changent. Le halo nocturne reste petit, radial et en fondu. Les rayons centraux ont été retirés à la demande du joueur.

Les quatre nouveaux décors et les huit sprites ont été générés pour ce jeu, puis extraits d'atlas en WebP. La version nocturne réutilise le fond du jour. Les miniatures, les animations et le jeu partagent les mêmes ressources. Le roi est une caricature originale, sans lien avec Douggy. Les dessins existants du menu, des gourmands et des cosmétiques restent conservés.

## Validation et points à tester en partie

`npm test` : probabilité exacte, choix égal, géométrie des segments, lumière, audio, rayons et musique.

`npm run test:arenas` : véritables collisions Matter, transmission et collisions secondaires des chariots, murs et rayons, agents mortels / repoussés, durées des objets, bumpers, aspiration, poids, bouche, rot, vague, blindage, feu adverse et propre feu, nettoyage et fin des tours simultanés. Captures des cinq cartes et des animations dans `test-results/`.

`npm run test:browser` : vérifications du jeu complet, des anciennes mécaniques, des menus clavier / tactile, des achats et sauvegardes, de la musique et des 14 aperçus de cartes.

À évaluer avec le joueur : pression des deux agents, force et fréquence des vagues, ampleur du cône et force du roi. Le rot demeure volontairement sans poussée et les bumpers demeurent fixes. Les clients sont des personnages décoratifs animés associés à de vrais chariots physiques ; les clients eux-mêmes n'ont pas un second corps bloquant.

## Menu, progression et direction visuelle

Le mode normal comporte Classique (8), Grand Banquet (24) et États-Unis (50). Une victoire Classique ouvre le Grand Banquet ; une victoire sur le mode 24 ouvre le mode 50. Les victoires anciennes conservées dans `modeWins` restent reconnues. Aucun achat de carte en points n’est encore activé : cette partie est reportée à une mise à jour ultérieure.

Somalie passe derrière Options → La face cachée du burger → mot de passe Pologne. Le message de confidentialité mène à un burger alternatif, avec Somalie et deux entrées en travaux. Le retour au burger classique est dans les options. Le secret n’altère pas les sauvegardes.

Deux cartes de restaurant séparent les cartes validées des essais ; l’autre couverture est écartée lors de l’ouverture. Une liste de noms et des pages avec un seul titre et aperçu remplacent les descriptions du sélecteur. Les règles apparaissent dans la fenêtre à l’entrée de l’arène.

L’arène occupe le viewport, sans demander l’autorisation de masquer l’interface du navigateur. Seuls Menu, survivants et poids restent affichés en surimpression. La taille du monde ne dépend pas des redimensionnements de la fenêtre ; la caméra suit le joueur. Les terrains classiques commencent à 1 900 × 1 400, le mode 24 utilise 2 800 × 2 000 et le mode 50 3 600 × 2 600.

Nouveaux fonds réalistes pour le supermarché partagé jour / nuit, la plage, la fête foraine et le roi. Le roi utilise deux illustrations alignées, bouche fermée et ouverte, avec fondu pendant l’aspiration et le rot. Aucune bouche géométrique n’est dessinée par-dessus le visage. La mer borde tout le bas de la plage et la vague pousse vers le haut.
