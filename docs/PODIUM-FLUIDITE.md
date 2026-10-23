# Podium, fluidité et cosmétiques — version podium-35

Le titre demandé est **LE BURGER DU JOUR**, jamais « Le premier au tapis ». Il distingue le premier gourmand réellement éliminé de la partie complète, IA comprise. Son arrivée reprend un burger servi sur une assiette, sans modifier le résultat.

## Diagnostic reproductible et limites

Le lecteur multijoueur utilisait directement l’heure serveur pour choisir une image, même pendant la réception d’un enregistrement incomplet. Si le navigateur accumulait du retard ou recevait les paquets suivants tardivement, l’index sautait les images devenues « anciennes ». Le premier tour est particulièrement exposé : nombreux personnages et aliments, premières allocations et caches d’images froids. Ce défaut de lecture est reproductible ; sans trace de l’appareil du joueur, ce n’est pas une preuve qu’il explique tous ses ralentissements.

Le nouveau lecteur attend la fin du chargement des images, démarre à l’image zéro et utilise une horloge locale monotone. Une tâche de rendu dépassant 100 ms suspend une partie du temps visuel au lieu de sauter des positions. Les enregistrements, trajectoires, collisions et résultats restent ceux du serveur, avec les positions finales exactes. Il n’y a aucune accélération de rattrapage. La contrepartie est une attente de chargement et, si l’appareil peine durablement, un affichage retardé. Le navigateur ne peut pas tirer pendant son replay. Les déconnexions/reconnexions continuent à utiliser le dernier état officiel.

`window.__bouffeReplayMetrics` expose uniquement des mesures : tour, temps de simulation/encodage serveur, décodage navigateur, attente du tampon, temps visuel et longues pauses. Les identifiants privés et jetons ne sont pas inclus. Les mesures ne sont pas envoyées à un service de télémétrie.

Le test de navigateur retarde de **5,5 secondes** les paquets suivant le premier lot d’images d’un des quatre clients, tout en conservant leur ordre. Il vérifie un démarrage à zéro après chargement et le même résultat final sur les quatre clients. Les tests de l’horloge couvrent aussi les longues tâches et le départ serveur programmé dans le futur.

### Mesures locales de stress

`node tests/podium-performance.mjs` place 8, 24 ou 50 personnages, dont quatre humains, près de 80 burgers et les fait se percuter. Sur la machine de test, ce scénario a produit respectivement **1, 12 et 26 éliminations**, et 80 repas dans chaque cas. Les enregistrements durent 2 683 / 2 767 / 3 200 ms. Une réception simulée à durée + 1 200 ms faisait sélectionner 3 883 / 3 967 / 4 400 ms par l’ancienne horloge ; le nouveau lecteur commence à zéro dans les trois cas.

Les durées CPU varient avec le démarrage à froid et la charge concurrente des navigateurs. Les premières mesures de simulation étaient 163 / 59 / 143 ms ; une autre passe instrumentée a mesuré 407 / 101 / 183 ms. Ce n’est **pas un gain de vitesse de simulation** : la physique n’a pas été optimisée ni remplacée. Dans la seconde passe, le pas physique maximal était 11,6 / 6,9 / 10,9 ms et les redimensionnements cumulés 4,2 / 1,2 / 2,0 ms. Le calcul des IA, les instantanés et les allocations contribuent au reste. Le décodage peut également subir une pause du ramasse-miettes.

`tests/podium-network.mjs`, contre le vrai runtime local SQLite, a ouvert quatre WebSockets pour chacune des tailles. Les quatre clients obtiennent les mêmes états et les mêmes derniers points de trajectoire, avec 4 / 20 / 46 IA. Les durées de simulation observées lors de cette passe chargée étaient 135 / 405 / 963 ms ; elles décrivent ce runtime local, pas une mesure Cloudflare publique ni un débit garanti.

Les benchmarks de dessin sont séparés de la physique et du fond de carte : ils utilisent le véritable rendu des personnages, avec et sans aura. Ils ne sont pas une mesure des FPS du jeu complet. Une passe finale a mesuré 0,16 / 0,44 / 0,94 ms par dessin de 8 / 24 / 50 avatars sans aura, contre 0,22 / 0,50 / 1,22 ms avec les auras. Ces mesures portent sur 60 dessins à chaud, pas sur le chargement ni tout le rendu de l’arène. Une passe couvrant les cinq types d’aura a ensuite mesuré entre 1,04 et 1,48 ms pour 50 avatars, contre 0,93 ms sans aura. Le confort sur téléphone peu puissant, de vrais réseaux instables et plusieurs ordinateurs reste à confirmer.

## Chapeaux et corps

Les 23 chapeaux équipables utilisent leurs images originales et leurs coordonnées existantes. Ils sont répartis entre une couche arrière et une couche avant dont l’ouverture épouse le véritable cercle de la tête. L’auréole conserve sa position volontairement flottante. Les nouveaux chapeaux ne sont plus simplement tronqués par une ligne horizontale. Aucun déplacement global de leur hauteur n’est introduit.

Le vêtement complet constitue le corps : aucun bras ni ventre de base n’est dessiné derrière. Le chargement d’une tenue ne dessine plus temporairement le corps d’origine en secours. Le morphing du costume suit le poids et la tête séparément. Les textures supplémentaires sont copiées une seule fois à leur résolution native, ce qui évite les différences de décodage/redimensionnement observées entre clients.

Les tests de navigateur dessinent les 24 choix de chapeau, dont « aucun », à 8, 60, 500 et 4 000 kg. Les 21 tenues complètes sont également vérifiées à ces quatre poids : changer la peau du corps de base ne doit modifier aucun pixel du vêtement sous la tête. Le curseur du Dressing utilise le même `Se` que le jeu. Les tests à quatre clients comparent aussi les images des tenues réellement synchronisées, avec une petite tolérance aux bords anticrénelés.

## Résultats autoritaires

Le serveur enregistre les événements d’élimination dans leur ordre réel, une seule fois par victime. Le plus gros prédateur compte les gourmands humains et IA dévorés, sans compter les dangers ni les alliés. En cas d’égalité, un humain est affiché en priorité parmi les ex æquo et les autres noms sont indiqués. Une IA avec un score supérieur conserve la distinction. Aucun repas signifie aucun prédateur, une égalité finale signifie aucun champion.

En chacun pour soi, le survivant gagne. En Duo/Trio/Quatuor, tous les membres de l’équipe gagnante, y compris ceux éliminés plus tôt, apparaissent ensemble. Les distinctions individuelles restent indépendantes : un gourmand peut être champion et prédateur. Le premier éliminé est réellement le premier, même si c’est une IA. Les résultats et les cosmétiques de cette partie sont conservés dans le checkpoint, donc identiques après reconnexion. Une ancienne partie commencée avant la mise à jour n’a pas d’historique fiable : aucun podium inventé ne lui est attribué.

Le podium apparaît après le replay terminé. La fenêtre provisoire « tous les humains sont éliminés » garde la possibilité de regarder les IA ; si elles terminent ensuite, le véritable résultat final est affiché. Le retour au même salon, le vote unanime et la prochaine partie restent inchangés.

## Personnalisation et économie

- Cinq animations : danse du ventre, petit rot visuel, saut de joie, pose de champion, désespoir du plat du jour. Transformations CSS locales, sans nouveau son fort. Si un joueur figure deux fois, une seule de ses représentations joue son animation équipée.
- Cinq auras : ketchup, mayonnaise, dorée, flammes stylisées, toxique. Anneaux sous les pieds, au plus quelques arcs, sans système de particules. Elles suivent le rayon du véritable personnage.
- Huit surnoms : Le Glouton, Sac à calories, Le Dernier Repas, Roi du Ketchup, Estomac sur pattes, La Faim du Monde, Le Buffet Humain, Gros Dossier. Un seul est équipé. Le salon l’affiche sous le pseudo ; la partie conserve le pseudo et réserve le surnom au détail du cadre pour ne pas surcharger la carte.

Les 18 achats et les trois choix gratuits de remise à zéro réutilisent le portefeuille, les sauvegardes, le filtre par catégorie et la validation par identifiants du catalogue. Le serveur transmet seulement les IDs ; les fichiers graphiques, particules ou positions d’animation ne transitent pas par WebSocket. L’apparence d’une partie en cours reste celle du départ ; une modification au Dressing s’applique au prochain salon/départ, comme auparavant. Le réglage local du Dressing propose complet, simplifié (aura fixe) ou désactivé. La préférence système de réduction des animations est respectée par défaut.

## Aliments rares

Le seul seuil changé est `GLOBAL_SPECIAL_CHANCE` : **0,03** au lieu de 0,01. Il s’agit d’un tirage global par tour, pas d’une chance de 3 % pour chacun des aliments ordinaires. Le choix conditionnel entre les deux aliments rares reste à parts égales. Les effets du piment et de sa traînée de feu restent intacts. Solo et Worker importent le même module. Le test de 10 000 valeurs uniformes dénombre exactement 300 apparitions, 150 pour chaque rareté.

Aucune nouvelle traînée, aucun compagnon et aucun effet cosmétique de collision ou d’élimination ne sont ajoutés. Aucun changement de liaison Cloudflare, migration SQLite, secret ou activation de facturation n’est nécessaire.
