# Trophées privés et équipes

La mise à jour ajoute 25 entrées : 24 trophées actifs et un trophée désactivé. Les sections « Multijoueur » et « En équipe » complètent les trophées classiques et ceux de La Face Cachée. Les nouveaux noms, conditions et illustrations sont masqués par « ??? » et une médaille mystérieuse avant déblocage. Aucun système de rareté supplémentaire n’est ajouté : les trophées existants n’ont pas d’échelons Bronze/Argent/Or.

## Conditions retenues

« Manche » signifie **partie complète**, conformément à la précision donnée par le joueur. Les quatre contributions aux salades ou aux éliminations humaines peuvent donc être réparties sur plusieurs tours de la même partie. « Dès le premier tour » reste le premier tir simultané.

- Les 10 trophées Multijoueur sont actifs. Les victoires d’équipe sont aussi des victoires multijoueurs.
- Les 12 trophées Duo/Trio/Quatuor sont actifs, avec les véritables sièges, équipes et conditions de victoire du moteur. Les membres IA d’une équipe doivent également contribuer aux conditions collectives ; ils ne reçoivent pas eux-mêmes de récompense de profil.
- « La famille, quelle famille ? » et « Buffet à volonté » sont actifs.
- **« C’est pas toi, c’est moi » est désactivé.** Les alliés ne peuvent pas se dévorer. Une poussée peut indirectement exposer un allié à un danger, mais le moteur n’attribue pas cette causalité : aucune attribution n’est inventée.
- « Trahison calorique » utilise le véritable meurtrier humain de la **partie précédente du même salon**. Un joueur mort ne revient pas au tour suivant. Le suivi utilise les identifiants de profil, jamais les pseudos.
- « Touche pas à mon gros » vérifie que la dernière victime de l’adversaire humain était un coéquipier. Une victime plus récente d’une autre équipe rompt cette condition.
- « On remet le couvert » compte cinq parties terminées dans un même salon, défaites et égalités comprises. Une revanche unanime après la mort de tous les humains clôt aussi leur participation si les IA jouent encore ; elle n’attribue aucune victoire anticipée.
- Un invité arrivé après le départ peut obtenir le premier trophée de chat, mais pas « Même mort, je parle » : il doit avoir réellement joué puis avoir été éliminé. Il n’est pas compté parmi les huit humains du départ.

## Attribution et sauvegarde

Les règles sont exécutées dans `Room` à partir des événements du véritable moteur autoritaire, du chat accepté et des résultats. Les éliminations sont enregistrées au moment réel des événements pour déterminer correctement le premier humain éliminé. Les victimes IA et les alliés sont exclus des adversaires humains.

Un profil anonyme Cloudflare est créé avec un identifiant et un jeton privé aléatoires. Les créations et arrivées au salon font vérifier ce jeton côté serveur. Le profil est attaché au membre du salon et reste associé à son siège après reconnexion. Son jeton n’est jamais diffusé aux autres joueurs. Aucun message du navigateur ne permet de déclarer un trophée gagné ; les routes publiques de profil sont limitées à la création et à la lecture authentifiée.

Les profils utilisent la liaison Durable Objects SQLite `ROOMS` déjà en place, dans des instances dont les noms commencent par `profile:` ; les salons restent dans des instances `room:`. Il n’y a ni nouvelle liaison, ni migration supplémentaire, ni secret à configurer, ni activation de facturation. Les attributions sont envoyées uniquement par les salons, avec une boîte d’envoi durable et des reçus transactionnels pour éviter les doubles victoires après reprise. Les compteurs de cinq victoires et de victoires en Duo/Trio/Quatuor continuent entre salons et sessions.

Le navigateur conserve son jeton privé et une copie des progrès dans la sauvegarde existante et sa copie de secours. Les compteurs serveur sont des instantanés : les onglets ne les additionnent pas. Les notifications réutilisent le composant animé existant, sont visibles dans le salon comme en jeu, et attendent la fin du replay pour ne pas annoncer un événement à l’avance. Un nouvel état déjà connu ne produit pas de doublon.

La conservation entre sessions suppose que le navigateur conserve ce jeton. Sans compte utilisateur, effacer ses données ou changer de navigateur ne reconnecte pas automatiquement au même profil ; la sauvegarde classique existante garde ses limites habituelles.

## Validation

Tests unitaires des 24 conditions actives, du trophée désactivé, des quotas humains, des alliés, des contributions IA, des victoires d’équipe avec joueur mort, des revanches et des cinq parties, des profils, des reçus et des sauvegardes. Tests de navigateur sur quatre clients indépendants, avec un invité spectateur : médailles masquées puis révélées, notification dans le vrai salon, séparation des profils, chat après élimination, reconnexion sans nouvelle notification, et requêtes de fraude refusées ou sans effet.

Les tests à quatre navigateurs utilisent le Worker SQLite local avec les origines GitHub Pages conservées par relais. Le script `cloudflare/scripts/verify-deployment.mjs`, exécuté par `deploy:ci`, vérifie également les profils authentifiés et une véritable attribution de chat sur le Worker ciblé. La validation locale ou un simple push ne constitue pas à elle seule une preuve de déploiement Internet. Il reste à confirmer le confort des notifications et les exploits collectifs avec plusieurs ordinateurs réels.
