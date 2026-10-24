# Burger Games et invitations — burger-43

## Modifications

- Terrain carré de 20 000 × 20 000 unités, décor de forêt détaillé, arbres décoratifs sans collision et deux rivières de raclette permanentes. La grande image reçoit une texture fine répétée pour conserver du détail au niveau du joueur. Les formes et chemins des rivières sont préparés une fois et partagés avec les zones de ralentissement.
- Départs à 1 180 unités du centre au lieu de 2 500 ; 96 burgers dispersés par le générateur aléatoire de la partie entre le monument et 980 unités. Le monument reste solide ; les aliments restent accessibles. Les objets spéciaux existants peuvent apparaître près du buffet, avec le tirage existant de 3 % par partie complète.
- Terrain initial visible en carré ; annonce au tour 5, puis cible de fermeture annoncée avant chaque réduction à partir du tour 6. Le cercle rouge en pointillés indique la limite à rejoindre ; l'élimination se vérifie en fin de mouvement. Le bandeau de fermeture reste visible en plein écran, contrairement aux annonces ordinaires volontairement masquées.
- Les zones `cheese` marquées `flow` ne se mangent plus : coulées du volcan et rivières. Les tas au sol, notamment les projections du volcan une fois actives, restent comestibles à partir de 2 000 kg. La sélection des cibles et la prévision des IA distinguent également coulées et tas.
- Les cinq modes secrets démarrent directement sur leur carte unique. Leurs nouveaux sous-titres et leurs descriptions sont présents sur la carte Solo ; « noir » est gras et souligné.
- Nouvelles invitations de quatre caractères (alphabet sans caractères ambigus). Invitations anciennes de douze caractères et tickets de reconnexion conservés. Une collision de code reçoit `EXISTS` du Durable Object et provoque un nouveau tirage, jusqu'à 16 tentatives ; aucun salon existant n'est écrasé. Limite de huit humains, jetons, validation de pseudo, admission et migrations SQLite inchangés.
- Correction d'un conflit observé en test : un état terminal autoritaire remplace un ancien replay non terminal, qui pouvait sinon remettre un client en phase de visée après la réception des résultats. Le replay de la véritable dernière résolution reste conservé.

## Vérification

`npm test`, `node tests/burger-games-browser.mjs`, `node tests/filmovore-browser.mjs`, `node tests/multiplayer-panel.mjs`, et vérification du Worker local avec `WORKER_BASE_URL=... node cloudflare/scripts/verify-deployment.mjs`.

Les tests ciblés utilisent le moteur réel pour les départs, la nourriture, les deux types de raclette, les annonces et les objets de décor ; le routage Worker réel est également testé avec deux collisions de codes simulées avant allocation. Les tests navigateur vérifient les cinq lancements directs, les libellés, le terrain carré et le bandeau visible. La vérification multijoueur utilise des clients locaux indépendants et un Worker SQLite local : elle ne représente pas quatre ordinateurs sur Internet.
