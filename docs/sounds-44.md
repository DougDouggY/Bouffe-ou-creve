# Sons fournis — sounds-44

Quinze enregistrements fournis pour intégration au jeu. Leur provenance, empreinte SHA-256 originale, durée originale et durée après traitement figurent dans `assets/audio/USER-SOUNDS-44.json`. Ils ne sont pas présentés comme appartenant aux collections CC0 ou CC BY existantes.

## Répartition

- Glissades : En contresens, Agent spécial Doofy, Le Prout (`Pet.m4a`), J’ai la dalle, Sous les néons, Youhouu, Bonnie and Clyde, Kisscount.
- Collisions : Hello, Arrêteuh, Smack, Gros bidou, Wouf.
- Jingles : menu normal et Face Cachée remplacés par les nouveaux fichiers.

## Traitement et comportement

Les silences extérieurs sont retirés, sans couper les pauses intérieures ni raccourcir les phrases. Conversion MP3 mono 44,1 kHz / 112 kb/s, normalisation modérée avec cible −23 LUFS / crête maximale −8 dB et très court fondu d'entrée. Pas de synthèse ni de modification de hauteur. Tous les enregistrements restent disponibles dans leur longueur utile ; Sous les néons dure environ 2,35 s après décodage navigateur.

Le Prout est désormais achetable et équipable sous son identifiant existant `slide_prout`. Sept autres entrées s'ajoutent au Dressing, sans modifier les achats précédents. Les anciens sons restent disponibles. Chaque glissade possède une préécoute et utilise la synchronisation des identifiants cosmétiques existante. Les IA restent silencieuses, même avec le son standard.

Les cinq collisions sont des effets automatiques, sans achat ni équipement supplémentaire. Les chocs non dévorants entre gourmands et les impacts contre les murs déclenchent ces voix lorsqu'au moins un humain est concerné. Les rebonds des bumpers gardent leur « boing ». Une cadence globale de 400 ms, une limite de 900 ms pour la même paire et le budget commun de trois voix évitent les rafales. Le second gourmand du choc est conservé dans l'événement partagé afin de reconnaître un humain quel que soit l'ordre des corps physiques. Les événements d'impact ne modifient aucune impulsion, collision ou règle de consommation.

Les jingles ne bouclent pas : une lecture du menu normal par chargement et une lecture à chaque entrée sur la Face Cachée, avec reprise après un geste si le navigateur bloque l'autoplay. Le volume des effets et la coupure générale s'appliquent ; les sons distants respectent l'option locale correspondante. Fichiers servis par le site, identifiants uniquement sur WebSocket.

## Vérifications

- Tests unitaires : catégories et ressources, préécoute des huit fichiers, absence de glissades IA, déduplication des lancements, cadence des collisions, volume et sourdine, ainsi que vrais événements de collision du moteur.
- Chromium : décodage des quinze fichiers fournis et des seize glissades disponibles ; achat, équipement, écoute et sauvegarde de Le Prout ; régression du Dressing, têtes et auras.
- Worker local de production : SQLite, deux clients WebSocket authentifiés, 2 humains + 22 IA et transmission de `slide_prout` dans le salon et l'état partagé.
- Le test à quatre contextes indépendants équipe des sons fournis via le vrai Dressing et vérifie la synchronisation, la reconnexion et le retour au salon. Un test local ne remplace pas une écoute sur plusieurs ordinateurs et haut-parleurs réels.
