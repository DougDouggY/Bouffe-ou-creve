# FILMOVORE — validation dans Chromium / Matter

Exécution du 23 octobre 2026. Les chiffres ci-dessous viennent de `npm run test:filmovore`, dans le vrai moteur du jeu ; aucun gagnant n’est choisi par une formule de poids. Le joueur est piloté par la même IA pour terminer les parties en mode spectateur. Les temps CPU sont ceux de cet environnement, sans rendu de chaque image, et ne constituent pas une mesure de fréquence d’images sur téléphone.

## La Plateforme

| Poids  | Distance sans choc | Rapport au 60 kg |
| ------ | -----------------: | ---------------: |
| 60kg   |             685.05 |          100.00% |
| 500kg  |             616.55 |           90.00% |
| 1000kg |             582.29 |           85.00% |
| 2000kg |             548.04 |           80.00% |

Même tir initial de norme 17, 150 pas moteur, aucun aliment ni obstacle rencontré. La friction reste identique. La conversion de masse de collision est indépendante : `6 × √(poids / 60)`.

| Collision       | Pic de vitesse transmis | Déplacement de la cible |
| --------------- | ----------------------: | ----------------------: |
| 60 vs 60 kg     |                   14.29 |                  488.89 |
| 60 vs 500 kg    |                    7.38 |                  253.16 |
| 100 vs 1000 kg  |                    6.82 |                  232.73 |
| 500 vs 2000 kg  |                    8.37 |                  288.56 |
| 1000 vs 1000 kg |                   12.15 |                  409.47 |
| 2000 vs 2000 kg |                   11.43 |                  383.03 |

Les déplacements mesurés comprennent le choc et sa décélération, pas une téléportation. Le scénario vérifie aussi les valeurs finies. Le test des secrets couvre séparément les murs, les chutes, la vraie poussée au troisième tour, les poids conservés et deux tournois physiques complets. Avec cette physique et ces graines, au moins un champion dépasse 2 000 kg.

## Hunger Games secret — 24 gourmands

| Graine | Survivants après les tirs 1 / 2 / 3 | Tour final | Parachutages                                               | Résolution physique simulée | Temps CPU | Issue       |
| ------ | ----------------------------------- | ---------: | ---------------------------------------------------------- | --------------------------: | --------: | ----------- |
| 17     | 24 / 24 / 24                        |         64 | Tours 5, 9, 13, 17, 25, 29, 33, 37, 41, 45, 49, 53, 57, 61 |                       162 s |   3427 ms | 1 survivant |
| 71     | 24 / 24 / 24                        |         57 | Tours 5, 13, 17, 21, 25, 29, 33, 41, 49, 53                |                       141 s |   2722 ms | 1 survivant |
| 190    | 24 / 24 / 24                        |         39 | Tours 5, 9, 17, 21, 25, 29, 33, 37                         |                       100 s |   2564 ms | 1 survivant |

Chaque partie commence avec 96 aliments accessibles en trois anneaux, puis le moteur refuse `addFood`. Les baisses de stock, les colis et les effectifs sont enregistrés à chaque tour. Les contrôles retrouvent des comportements de recherche de nourriture, chasse, fuite, recherche de territoire et repli dans la zone. Des approches de colis sont également observées selon les parties. Aucun tir futur du joueur n’est accessible aux IA.

La durée physique ci-dessus exclut le temps humain de visée : elle ne prédit pas la durée réelle d’une partie jouée. La zone est annoncée avant la résolution et contrôlée en fin de tir à partir du tour 6 ; le rayon ne descend pas sous 990. Si les derniers gourmands restent tous hors zone dans le même contrôle, ils sont tous éliminés : aucun gagnant artificiel n’est sauvé, et le résultat indique explicitement qu’il n’y a aucun survivant.

## Régressions et limites

- `npm test` : 26 tests unitaires.
- `npm run test:browser` : 21 contrôles menus (dont un écran de 3 440 pixels),, progression et plein écran.
- `npm run test:arenas` : 77 contrôles réels du moteur et 2 contrôles mobiles.
- `npm run test:secrets` : 69 contrôles moteur / profil / trophées sur cette exécution, puis 10 contrôles de menu, sauvegarde et propulsion ordinateur / mobile.
- `npm run test:filmovore` : mesures ci-dessus, positions du festin, gardes à 500 kg, renforts et trois parties complètes.

Les illustrations et captures réelles sont vérifiées visuellement. Les captures de jeu sont dans `test-results/secret-*.png`, dont `secret-survival.png` et les quatre versions mobiles. La carte Hunger Games classique reste disponible dans son carnet initial.

La dissimulation sous les arbres n’est pas ajoutée. Le rot reste synthétique ; aucun enregistrement authentique n’est inclus. L’appréciation du rythme et du niveau de difficulté reste à tester en partie humaine.

## Retours du joueur — grande arène et fluidité

Hunger Games utilise désormais un monde de 18 000 × 13 500, avec rayon de départ des gourmands de 2 500 (espacement voisin mesuré : 652,63) et 96 aliments sur trois anneaux de rayons 620 / 740 / 860. Chaque gourmand a une route directe sans obstacle vers le festin. Une approche de trois tirs du joueur attrape les trois aliments en face de lui : poids de 60 à 235 kg, stock de 96 à 93.

Le cercle sûr part d’un rayon de 5 940 et termine à 990, sans réduction supplémentaire : le duel final conserve la taille de l’ancienne zone initiale. Les trois parties complètes ci-dessus terminent avec un vainqueur. Le sol, les groupes d’arbres et la structure centrale sont rendus séparément pour préserver leur détail et éviter d’étirer un fond sur toute la nouvelle étendue.

La Plateforme réutilise son décor rasterisé : une image par rendu, au lieu de recalculer neuf morceaux. Pendant un mouvement, un seul duel hors écran avance ; la visée et le tableau permettent le rattrapage, sous budget. Les sous-pas physiques restent bornés à 8,34 ms.

Mesure comparative `node tests/platform-performance.mjs`, 1 800 pas dans le même Chromium, graine 17 : temps de calcul cumulé de 252,6 à 179,5 ms ; 95e percentile de 0,4 à 0,2 ms ; maximum de 10,3 à 9,2 ms. Aucun dépassement de 16 ms dans ces mesures. Ce sont des durées de calcul dans cet environnement, sans simulation d’un téléphone ni mesure de rendu GPU : elles ne permettent pas de promettre l’absence de ralentissements sur tous les appareils.

Le Marchand emploie maintenant un camion de glaces décoré sur le toit et vu verticalement ; sa coque et sa rotation sont conservées. Les captures ordinateur et mobile vérifient le nouveau visuel.

## Disposition suivant le schéma du joueur

Le décor central est désormais un disque circulaire plein de rayon 420, avec sa propre illustration vue du dessus. Ses anciennes parois rectangulaires et ses fausses ouvertures sont retirées. Les 96 aliments sont disposés sur les trois anneaux de rayons 620 / 740 / 860 ; les 24 départs restent sur le cercle de rayon 2 500. La surface initiale agrandie laisse beaucoup de terrain au-delà des départs.

La navigation traite ce décor comme un vrai cercle : une ligne passant par son centre est refusée, et le graphe trouve un contournement sans collision. Dans le test de propulsion contre le monument, la plus courte distance du centre du gourmand au centre du décor est de 435,65, pour un monument de rayon 420 et un gourmand de rayon 19 : le corps ne traverse pas le disque. Les bumpers du jeu normal ne sont pas modifiés ; le disque n’est pas un bumper.

Le festin est plus éloigné des départs pour suivre le schéma : il s’atteint après l’approche, et non en une seule propulsion. Une petite indication « FESTIN » pointe vers les aliments initiaux lorsqu’ils sont hors de vue. La miniature est générée aux vraies dimensions du niveau, avec les aliments et départs repérés à leurs positions réelles.
