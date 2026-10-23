# Trophées privés et équipes

La mise à jour ajoute 33 entrées : 32 trophées actifs et un trophée désactivé. Les sections « Multijoueur » et « En équipe » complètent les trophées classiques et ceux de La Face Cachée. Les nouveaux noms, conditions et illustrations sont masqués par « ??? » et une médaille mystérieuse avant déblocage. Aucun système de rareté supplémentaire n’est ajouté : les trophées existants n’ont pas d’échelons Bronze/Argent/Or.

## Conditions retenues

« Manche » signifie **partie complète**, conformément à la précision donnée par le joueur. Les quatre contributions aux salades ou aux éliminations humaines peuvent donc être réparties sur plusieurs tours de la même partie. « Dès le premier tour » reste le premier tir simultané.

- Les 11 trophées Multijoueur sont actifs. Les victoires d’équipe sont aussi des victoires multijoueurs.
- Les 21 trophées d’équipe sont actifs, avec les véritables sièges, équipes et conditions de victoire du moteur. Les membres IA d’une équipe doivent également contribuer aux conditions collectives ; ils ne reçoivent pas eux-mêmes de récompense de profil.
- « La famille, quelle famille ? » et « Buffet à volonté » sont actifs.
- **« Passe décisive » est désactivé.** Les alliés ne peuvent pas se dévorer. Une poussée peut indirectement exposer un allié à un danger, mais le moteur n’attribue pas cette causalité : aucune attribution n’est inventée.
- « Le plat de la vengeance » utilise le véritable meurtrier humain de la **partie précédente du même salon**. Un joueur mort ne revient pas au tour suivant. Le suivi utilise les identifiants de profil, jamais les pseudos.
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

Tests unitaires des 32 conditions actives, du trophée désactivé, des quotas humains, des alliés, des contributions IA, des victoires d’équipe avec joueur mort, des revanches et des cinq parties, des profils, des reçus et des sauvegardes. Tests de navigateur sur quatre clients indépendants, avec un invité spectateur : médailles masquées puis révélées, notification dans le vrai salon, séparation des profils, chat après élimination, reconnexion sans nouvelle notification, et requêtes de fraude refusées ou sans effet.

Les tests à quatre navigateurs utilisent le Worker SQLite local avec les origines GitHub Pages conservées par relais. Le script `cloudflare/scripts/verify-deployment.mjs`, exécuté par `deploy:ci`, vérifie également les profils authentifiés et une véritable attribution de chat sur le Worker ciblé. La validation locale ou un simple push ne constitue pas à elle seule une preuve de déploiement Internet. Il reste à confirmer le confort des notifications et les exploits collectifs avec plusieurs ordinateurs réels.

## Extension : records, rivalités et coopération

Les anciennes médailles acquises gardent leurs identifiants. « C’est pas toi, c’est moi », jamais activé, est retiré du catalogue. Les nouvelles entrées réutilisent les règles serveur, sans changer la physique : trio intact ; quatre équipiers ayant chacun mangé un adversaire IA ou humain ; duo ayant chacun mangé un humain puis gagné ; seul survivant de son équipe alors que la moitié des participants initiaux sont encore vivants puis victoire personnelle ; unique équipier sans repas adverse lors d’une victoire ; victoire personnelle sans repas adverse ; victoire personnelle sans burger. Les deux dernières conditions distinguent les aliments ordinaires des adversaires et des véritables burgers.

« Les habitués du buffet » exige dix parties complètes avec le même profil humain, même dans des salons différents. Les spectateurs tardifs et les copies d’un même profil ne gonflent pas ce compteur. Les conditions d’absence de repas ne sont pas attribuées à une partie commencée avant la mise à jour, faute d’historique complet.

« Passe décisive » reste désactivé : un contact suivi d’une élimination ne prouve pas qu’une poussée alliée a rendu le repas possible. Une attribution fiable nécessiterait une journalisation des contacts et une simulation serveur comparative sans la poussée, plutôt qu’un simple délai arbitraire.

Le salon affiche les victoires enregistrées par le serveur et le maximum de masse réellement observé pendant la simulation. Ces données se rafraîchissent sans quitter le salon. Le maximum est mesuré à chaque pas physique et événement, même si une salade réduit ensuite le poids. Une notification personnelle « NOUVEAU RECORD DE GRAISSE ! » attend la fin du replay et ne se répète pas pour un état déjà reçu.

Cliquer sur un autre joueur ouvre uniquement les statistiques de votre paire : parties terminées ensemble et repas humains directs dans chaque sens. Les identifiants de profil ne sont jamais diffusés dans le salon ; le serveur choisit la cible depuis les membres authentifiés. Les compteurs de rivalité restent dans le profil privé, pas dans les instantanés diffusés. Les anciens scores solo ne sont pas importés : ils ne peuvent pas être vérifiés. Les records de masse et rivalités commencent avec cette extension ; les victoires multijoueurs déjà enregistrées restent conservées. Changer de pseudo conserve l’historique ; changer de navigateur ou effacer le jeton anonyme ne reconnecte pas au même profil.

Les noms utilisent désormais tout le fond du cadre aux couleurs d’équipe, avec les mêmes couleurs dans les annonces de mort. Le survol, le focus clavier ou le toucher des statistiques de jeu affiche les membres de toutes les équipes, ou les poids de sa propre équipe. Les noms sont insérés comme texte, jamais interprétés en HTML.
