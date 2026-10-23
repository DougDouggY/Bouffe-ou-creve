# Panneau temporaire du multijoueur — vérifications

## Correction publiée

La branche `gh-pages` examinée partait du commit `1498166e965ebba7f9f1d38307cf9bc02c16f553`. Elle contenait déjà le bouton et le vrai client multijoueur. Le bouton était placé **après** le visuel du burger, dans le flux de la page : à 1366 × 768, son rectangle commençait à **y = 850,66 pixels**, sous la fenêtre. Le changement de cache ne pouvait pas modifier cette position.

Le même bouton `#multiplayer-entry` est maintenant un petit panneau fixé en haut à droite de l’accueil : **🍔 MULTIJOUEUR PRIVÉ / Jouer avec mes amis**. Il conserve l’ouverture du véritable `#multiplayer-dialog` par `setupMultiplayer`. Sur téléphone, un espace au-dessus de l’illustration évite de recouvrir les ingrédients. Le panneau se masque pendant une partie, sur le choix de carte et dans la Face Cachée, comme l’ancienne entrée.

Les versions de chargement de `game.js`, `style.css` et `multiplayer-client.js` passent à **`multi-panel-21`**. Le protocole reste **`multi-20`**, compatible avec le Worker déjà installé. Les règles, arènes, images du burger, moteur et serveur n’ont pas été modifiés. La seule modification de `game.js` est la version du chemin d’import du client multijoueur.

Lien de test après publication GitHub Pages :

<https://dougdouggy.github.io/Bouffe-ou-creve/?v=multi-panel-21>

## Essais réalisés dans cet environnement

- Reproduction de la position de l’ancien bouton à partir des fichiers de `gh-pages`.
- Visibilité sans défilement et clic possible sur le nouveau panneau : **1366 × 768**, **1280 × 720**, **390 × 844**, **844 × 390**. En portrait, il reste au-dessus du burger. Aucun élément ne masque sa zone de clic.
- Chargement de la page avec l’origine **`https://dougdouggy.github.io`** et le chemin **`/Bouffe-ou-creve/`**. Les ressources du dépôt sont relayées localement en conservant leurs URL et paramètres de version ; aucune réécriture du code client ne remplace l’adresse du serveur.
- Requêtes du vrai client vers **`https://bouffeoucrevemulti.jeferson-patry-sin.workers.dev`** ; origine GitHub Pages acceptée par le vrai code serveur, exécuté dans workerd local avec Durable Objects SQLite.
- Connexions WebSocket avec le vrai protocole d’authentification et les vrais messages, relayées vers workerd local. Les réponses ne sont pas des maquettes.
- **Quatre navigateurs isolés**, dont un téléphone tactile, rejoignent le même salon. Choix successif de **8, 50, 24** gourmands : **4/46/20 IA** respectivement. Chacun contrôle son propre gourmand, se déclare prêt et valide son tir. Le serveur attend les quatre tirs, puis les quatre clients reçoivent le même résultat. Positions, poids et éliminations affichés concordent.
- Le panneau se masque dans la partie et réapparaît au retour au menu.
- Aucun échec de chargement des fichiers du projet ni erreur JavaScript pendant ces essais.

Reproduire le contrôle du panneau avec `npm run test:multiplayer-panel`, après installation des dépendances de développement à la racine et dans `cloudflare`. La variable `PUBLISHED_TREE_DIR` permet de pointer le test vers une copie propre extraite du tree Git à publier. Ce contrôle n’est pas une vérification du réseau Internet public.

Le test existant `npm run test:multiplayer` couvre aussi le parcours à **2 humains + 22 IA**, la reconnexion et le retour au solo. Les tests moteur gardent la limite de **8 humains maximum**. Les réglages et la limite du serveur ne changent pas.

## Limites et essai à faire avec plusieurs ordinateurs

L’accès direct au domaine GitHub Pages et au domaine `workers.dev` est bloqué par le réseau de cet environnement (`CONNECT 403` / `ERR_TUNNEL_CONNECTION_FAILED`). Nous pouvons lire le dépôt public, vérifier le commit et le déploiement GitHub Pages, et exécuter les essais ci-dessus. Nous ne pouvons pas affirmer avoir chargé le CDN public et connecté directement les quatre navigateurs au Worker public depuis ici.

Le bon `/health` du Worker public a été signalé par le propriétaire. Il reste à ouvrir le lien de test sur **2 à 4 ordinateurs réels**, créer/rejoindre un salon, choisir 24 gourmands, vérifier le complément d’IA, se déclarer prêt et jouer un tour. Cet essai confirmera le trajet réseau réel GitHub Pages → Worker Cloudflare, les WebSockets sur chaque connexion et les conditions de latence.
