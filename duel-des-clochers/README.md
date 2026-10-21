# Les Convaincants — laboratoire version 5

Souris ou doigt : tirer son meneur en arrière pour régler axe et puissance, relâcher pour lancer simultanément les deux meneurs et les habitants. Le tour suivant attend l'arrêt de tous. Ni chrono ni limite de tours.

Les neutres se déplacent peu et au hasard. Les convertis rejoignent leur camp à partir du tour suivant, en contournant les obstacles. Ils peuvent être volés sur la place ; la conversion protège pour le tour courant. Une fois dans leur église ou mosquée, ils sont définitivement acquis et quittent le terrain. Quand les 40 sont à l'abri, le camp le plus peuplé gagne (égalité possible).

Le laboratoire permet d'activer indépendamment les obstacles et trois catégories de collisions : habitants entre eux, meneurs entre eux, meneurs/habitants. Préréglages : aucune, habitants seulement, meneurs seulement, meneurs/habitants seulement, toutes. Les murs et les obstacles activés restent solides. La conversion au contact reste possible même sans collision physique. « Appliquer et recommencer » relance avec les réglages sélectionnés ; la disposition initiale est identique pour comparer les essais.

## Développement

Depuis la racine : `python -m http.server 8000`, ouvrir `/duel-des-clochers/`.
Tests : `node --test duel-des-clochers/tests/engine.test.mjs`.

## Publication

Copier uniquement ce dossier sur la DERNIÈRE version distante de `gh-pages`, préserver l'index racine, `.nojekyll`, AGENTS.md et tous les autres sites. Ne jamais vider la branche. Attendre la fin du déploiement et vérifier les deux sites publics.

Adresse : https://dougdouggy.github.io/Test/duel-des-clochers/?v=camps5
