# Arènes et pouvoirs — version de test

Aucune carte accessible avant cette mise à jour n'est retirée. Fête foraine et Plage sont réintroduites dans les cartes validées, avec un nouveau Buffet du Roi distinct du Palais de Douggy existant.

## Physique et tours simultanés

`ArenaMechanics` s'appuie sur les vrais corps Matter du jeu. Les intentions des IA et du joueur restent calculées avant tout déplacement. Les agents annoncent leur direction avant le tir et ne réagissent pas à la direction secrète du joueur. Un parcours de grille évite les rayons lors de la préparation de leur petite propulsion (vitesse 3,2 contre 17 maximum pour un gourmand avant coefficient de poids).

Les cinq arènes modifiées utilisent quatre sous-pas physiques par image logique. Le même découpage s'active sur les autres cartes lorsqu'un piment brûle. Les trajectoires de feu sont vérifiées par distances entre segments réellement parcourus, et non par une trajectoire théorique. Les collisions secondaires des chariots sont résolues par Matter, avec une masse de 14, une faible friction et un plafond de vitesse 18. Les poussées restent physiques ; seuls les trampolines de la nouvelle arène de test téléportent en fin de tour.

Les bumpers restent fixes. Leur impulsion normale dépend de l'angle du contact, multiplie la vitesse incidente par 2,8, a un minimum de 23 et un plafond de 48. Un délai de 220 ms empêche les rebonds répétés sur un même contact.

Le roi aspire pendant 2,4 secondes après les déplacements, à des intervalles aléatoires de 2 ou 3 tours annoncés par le cône. La force varie avec la distance et la racine inverse du poids, avec des bornes. Les tours de digestion se terminent par un rot de 1,1 seconde, animé et sonorisé doucement. Le rot ne pousse personne dans cette première version. La bouche élimine indépendamment du poids uniquement pendant son ouverture d’aspiration, lorsque le centre du gourmand traverse l’ellipse intérieure visible. Les joues et le simple contact extérieur ne déclenchent pas de dévoration. Les IA évitent cette ouverture et évaluent leur position finale dans le cône annoncé. La fin du tour attend la fin de ces animations physiques.

La vague, espacée aléatoirement de 2 ou 3 manches, parcourt la plage de bas en haut en 2,6 à 6 secondes, selon la taille du terrain. Une bande mobile applique une poussée aux corps qui la rencontrent, avec une résistance accrue des gros poids. Les murs restent solides et regroupent les gourmands du côté opposé.

## Apparition et durée des pouvoirs

- Un tirage global unique à chaque début de manche, y compris la première : probabilité strictement de 1 %. En cas de réussite, un second tirage choisit à parts égales Burger Blindé ou Piment de l'Enfer. Aucun tirage par aliment. Aucun changement du calcul des burgers de Douggy.
- Burger Blindé : absorbe une dévoration entre gourmands et se brise. Aucun gain de poids, aucune protection contre le feu, la sécurité ou le roi. Pas de cumul de boucliers.
- Piment de l'Enfer : arme la prochaine propulsion. La traînée se crée pendant le déplacement et disparaît à la fin du tour ou de la partie. Son propriétaire peut mourir en la recroisant. La zone fraîche sous son propre corps est ignorée jusqu'à ce qu'il ait parcouru deux diamètres de sécurité environ : le personnage n'est pas tué instantanément par le feu qu'il vient de déposer.
- Lampe nocturne : halo multiplié par 1,8. Le tour de ramassage est offert, puis l'effet couvre deux tirs complets.
- Gant anti-sécurité : le tour de ramassage est offert, puis un tir complet. Les agents sont repoussés par une impulsion, sans déplacement instantané du gourmand. Ne protège pas contre les dévorations ou le feu.
- Trois lampes et un anti-sécurité sont servis dès la première manche, puis complétés au début de chaque manche s'ils manquent. Les exemplaires inutilisés restent au maximum quatre manches. Ces apparitions sont indépendantes du tirage global.
- Les IA ramassent et utilisent les mêmes objets. Les effets sont dans la partie en cours, jamais dans les sauvegardes du profil.

La fin secrète entre deux très gros gourmands reste disponible sur les autres cartes. Elle est suspendue dans les arènes du roi et des agents, ainsi que lorsqu'un piment est armé ou actif, pour ne pas annuler un danger mortel encore présent.

## Rendu

Le Supermarché en Folie est éclairé. Les étalages sont désormais périphériques et décoratifs. Sa version nocturne partage exactement le même fichier de fond et le même terrain ouvert sans rayons centraux ; seul l'éclairage et les personnages mobiles changent. Le halo nocturne reste petit, radial et en fondu. Les rayons centraux ont été retirés à la demande du joueur.

Les quatre nouveaux décors et les huit sprites ont été générés pour ce jeu, puis extraits d'atlas en WebP. La version nocturne réutilise le fond du jour. Les miniatures, les animations et le jeu partagent les mêmes ressources. Le roi est une caricature originale, sans lien avec Douggy. Les dessins existants du menu, des gourmands et des cosmétiques restent conservés.

## Validation et points à tester en partie

`npm test` : probabilité exacte, choix égal, géométrie des segments, lumière, audio, rayons et musique.

`npm run test:arenas` : véritables collisions Matter, transmission et collisions secondaires des chariots, murs et rayons, agents mortels / repoussés, durées des objets, bumpers, aspiration, poids, bouche, rot, vague, blindage, feu adverse et propre feu, nettoyage et fin des tours simultanés. Captures des cinq cartes et des animations dans `test-results/`.

`npm run test:browser` : vérifications du jeu complet, des anciennes mécaniques, des menus clavier / tactile, des achats et sauvegardes, de la musique et des 20 aperçus de cartes.

À évaluer avec le joueur : pression des deux agents, force et fréquence des vagues, ampleur du cône et force du roi. Le rot demeure volontairement sans poussée et les bumpers demeurent fixes. Les clients sont des personnages décoratifs animés associés à de vrais chariots physiques ; les clients eux-mêmes n'ont pas un second corps bloquant.

## Menu, progression et direction visuelle

Le mode normal comporte Classique (8), Grand Banquet (24) et États-Unis (50). Une victoire Classique ouvre le Grand Banquet ; une victoire sur le mode 24 ouvre le mode 50. Les victoires anciennes conservées dans `modeWins` restent reconnues. Aucun achat de carte en points n’est encore activé : cette partie est reportée à une mise à jour ultérieure.

Somalie passe derrière Options → La face cachée du burger → mot de passe Pologne. Le message de confidentialité mène à un burger alternatif, avec Somalie et deux entrées en travaux. Le retour au burger classique est dans les options. Le secret n’altère pas les sauvegardes.

Deux cartes de restaurant séparent les cartes validées des essais ; l’autre couverture est écartée lors de l’ouverture. Une liste de noms et des pages avec un seul titre et aperçu remplacent les descriptions du sélecteur. Les règles apparaissent dans la fenêtre à l’entrée de l’arène.

L’arène occupe le viewport, sans demander l’autorisation de masquer l’interface du navigateur. Seuls Menu, survivants et poids restent affichés en surimpression. La taille du monde ne dépend pas des redimensionnements de la fenêtre ; la caméra suit le joueur. Tous les terrains normaux utilisent désormais 3 600 × 2 700, en Classique comme à 24 et à 50 gourmands. Le mode secret Somalie conserve son terrain spécifique.

Nouveaux fonds réalistes pour le supermarché partagé jour / nuit, la plage, la fête foraine et le roi. Le roi utilise deux illustrations alignées, bouche fermée et ouverte, avec fondu pendant l’aspiration et le rot. Aucune bouche géométrique n’est dessinée par-dessus le visage. La mer borde tout le bas de la plage et la vague pousse vers le haut.

## Périmètres et aperçus complets

Cuisine en zigzag et Food court sont retirés du catalogue et des choix de partie. Les aperçus passent tous par le véritable rendu de l’arène : cratère du volcan, bumpers, obstacles et bordures sont inclus. Le supermarché nocturne reçoit un voile sombre dans son aperçu, tout en partageant toujours le fond du jour en jeu.

`arena-bounds.js` fournit le contour visible et les solides Matter du pourtour. Les mêmes obstacles servent au placement des personnages, de la nourriture et des objets, au calcul des déplacements et à la croissance des personnages. Les bordures ne sont pas comestibles. Le bateau est un polygone de pont fermé, avec mer inaccessible ; le roi conserve une ouverture dans la bordure supérieure vers sa bouche. Les coins et bords sont testés avec 50 départs puis avec de vraies propulsions contre chaque côté. La chambre froide garde son sol glissant et ses deux obstacles centraux.

Les bumpers de fête foraine passent d’un rayon de 5,5 % à 8,5 % de la petite dimension du terrain. La densité de nourriture du Classique agrandi est maintenue avec une cible de 64 aliments et un plafond de 96.

## Décors verticaux et Hunger Games

Les seize nouveaux fonds sont générés individuellement en vue strictement verticale, puis encodés en WebP. Les étals du supermarché occupent la périphérie : aucun rail dessiné en surimpression. Les murs physiques restent présents. Le pont pirate se prolonge hors champ en haut et en bas ; sa limite physique et son rail sont conservés. Sur la plage, la zone physique s’arrête à 67 % de la hauteur, avant la mer décorative. Les apparitions et la nourriture utilisent les mêmes murs. Le jardin utilise une limite arrondie intégrée à la lisière de la forêt ; le wok et la salle sous-marine suivent aussi leurs parois arrondies.

Hunger Games se trouve dans « En travaux ». Les 8, 24 ou 50 gourmands commencent à distance égale autour du centre, sur un cercle de rayon 16 % du petit côté. Douze burgers de Douggy garnissent un petit cercle central. Le rayon de la zone sûre est de 44 % du petit côté pendant les trois premières manches ; dès la quatrième, il est multiplié par 0,86 à chaque manche. La limite rouge est affichée dès la visée : il faut être entièrement dedans à la fin du mouvement, sans toucher la bordure. L’élimination se résout une seule fois par manche et déclenche immédiatement la victoire ou la défaite. Les IA menacées visent le centre. Les nouveaux aliments et objets apparaissent dans la zone sûre.

Contrôles ajoutés : placement circulaire de 50 participants, festin central, absence d’élimination aux manches 1–3, élimination extérieure à la manche 4, résolution unique, victoire/défaite immédiates et rebonds renforcés.

## Ajustements du 23 octobre 2026 — retours en partie

- Classique à huit : terrains de 2 400 × 1 800, sauf Volcan Raclette qui garde 3 600 × 2 700. Grand Banquet / États-Unis conservent leurs grandes dimensions.
- Le volcan reçoit une bordure montagneuse illustrée ; la collision suit son bord intérieur.
- Banquet pirate : limites latérales évasées suivant bâbord / tribord, rangées de tonneaux et cordages en haut / bas ; suppression de l’ancien rail polygonal intérieur.
- Supermarché de jour : huit clients avec caddie, masse des caddies augmentée de 3,5 à 14 et restitution à 0,86. Les impacts restent calculés par Matter.
- Supermarché nocturne : six gardes et halos rouges radiaux visibles dans le noir. À partir de 500 kg, un garde ordinaire donne 55 kg et est remplacé par un soldat plus grand (coque ×1,8, masse 36), toujours inmangeable. Il arrive sur un point libre pour éviter une élimination instantanée à l’emplacement de la capture.
- Trois lampes et un anti-sécurité sont disponibles au début de chaque tour s’ils manquent. Les exemplaires expirent toujours après quatre tours.
- Sable : frottement ramené de 0,065 à 0,030, proche du sol normal à 0,024.
- Le rot du roi reste le son synthétique discret existant. Aucun enregistrement authentique n’a été ajouté ; l’accès à la source audio externe testée est bloqué depuis cet environnement.

## Trampoline Park (en travaux)

Nouvelle arène de test disponible en solo dans le carnet « En travaux » et dans le choix des cartes du salon privé, avec ce même libellé. Vingt-deux bumpers bordent le terrain et quatre autres occupent le milieu ; ils réutilisent l’impulsion physique de Fête foraine. Cinq trampolines ont une surface jouable circulaire correspondant à leur bord orange.

Une fois tous les mouvements terminés, chaque gourmand dont le centre est sur un trampoline est téléporté une seule fois. La destination est tirée avec le générateur du jeu, à distance des murs et des obstacles, mais elle peut être occupée : le rapport de poids habituel détermine qui mange qui, avec conservation des protections existantes. Un trampoline d’arrivée ne déclenche pas une seconde téléportation pendant ce même tour. Les IA suivent exactement ces mêmes règles. Le fond est une nouvelle illustration de sol rembourré ; les trampolines et les bumpers sont dessinés aux coordonnées de leurs vrais volumes physiques.

La plage a désormais un sable uniforme avec la résistance ordinaire du sol. Les deux anciennes bandes invisibles de glace sont supprimées. La vague est annoncée et revient aléatoirement tous les deux ou trois tours ; le calendrier est conservé dans l’état partagé et les checkpoints, comme celui du roi.
