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

| Graine | Survivants après les tirs 1 / 2 / 3 | Tour final | Parachutages   | Résolution physique simulée | Temps CPU | Issue                              |
| ------ | ----------------------------------- | ---------: | -------------- | --------------------------: | --------: | ---------------------------------- |
| 17     | 22 / 21 / 19                        |         17 | Tours 5, 9, 13 |                        45 s |    627 ms | aucun survivant, égalité explicite |
| 71     | 18 / 17 / 16                        |         16 | Tours 5, 9, 13 |                        42 s |    483 ms | 1 survivant                        |
| 190    | 20 / 16 / 15                        |         16 | Tours 5, 13    |                        43 s |    469 ms | 1 survivant                        |

Chaque partie commence avec 32 aliments accessibles, puis le moteur refuse `addFood`. Les baisses de stock, les colis et les effectifs sont enregistrés à chaque tour. Les contrôles retrouvent des comportements de recherche de nourriture, chasse, fuite, recherche de territoire et repli dans la zone. Des approches de colis sont également observées selon les parties. Aucun tir futur du joueur n’est accessible aux IA.

La durée physique ci-dessus exclut le temps humain de visée : elle ne prédit pas la durée réelle d’une partie jouée. La zone est annoncée avant la résolution et contrôlée en fin de tir à partir du tour 6. Si les derniers gourmands restent tous hors zone dans le même contrôle, ils sont tous éliminés : aucun gagnant artificiel n’est sauvé, et le résultat indique explicitement qu’il n’y a aucun survivant.

## Régressions et limites

- `npm test` : 26 tests unitaires.
- `npm run test:browser` : 21 contrôles menus (dont un écran de 3 440 pixels),, progression et plein écran.
- `npm run test:arenas` : 77 contrôles réels du moteur et 2 contrôles mobiles.
- `npm run test:secrets` : 68 contrôles moteur / profil / trophées sur cette exécution, puis 10 contrôles de menu, sauvegarde et propulsion ordinateur / mobile.
- `npm run test:filmovore` : mesures ci-dessus, positions du festin, gardes à 500 kg, renforts et trois parties complètes.

Les illustrations et captures réelles sont vérifiées visuellement. Les captures de jeu sont dans `test-results/secret-*.png`, dont `secret-survival.png` et les quatre versions mobiles. La carte Hunger Games classique reste disponible dans son carnet initial.

La dissimulation sous les arbres n’est pas ajoutée. Le rot reste synthétique ; aucun enregistrement authentique n’est inclus. L’appréciation du rythme et du niveau de difficulté reste à tester en partie humaine.
