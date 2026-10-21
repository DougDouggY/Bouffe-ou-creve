# Les Convaincants

Prototype indépendant de « Bouffe ou Crève ». Aucun fichier du site existant ni de la branche `gh-pages` n'est remplacé.

Depuis la racine du dépôt :

```sh
python -m http.server 8000
```

Ouvrir `/duel-des-clochers/` sur ce serveur. Aucun paquet, compilation, compte ou service externe requis. Les fichiers utilisent des modules JavaScript : passer par HTTP plutôt qu'ouvrir directement le fichier HTML.

## Règles du prototype

- Choix entre un prêtre catholique et un imam musulman ; capacités identiques.
- 40 habitants, manche de 90 secondes, adversaire IA.
- Contact avec un habitant : conversion, puis protection de 3 secondes. Après cette protection, l'autre camp peut le récupérer.
- Seuls les deux meneurs convertissent. Les habitants se promènent dans la place.
- Le plus grand groupe gagne à la fin ; égalité possible. Les 40 habitants dans le même camp déclenchent une victoire immédiate.
- Flèches, ZQSD ou WASD ; Espace pour un élan (recharge 4 secondes), P pour la pause. Joystick et élan tactiles sur mobile.
- Le jeu se met en pause quand la fenêtre perd le focus.

## Publication séparée

Le prototype n'est pas publié automatiquement. Pour l'ajouter au site existant, copier **uniquement ce dossier** à la racine des fichiers servis par GitHub Pages, en conservant l'`index.html` existant. L'adresse résultante serait `https://dougdouggy.github.io/Test/duel-des-clochers/`.

Les règles et la simulation sont dans `engine.js`, l'affichage et les contrôles dans `game.js`. Le gameplay constitue une première proposition à ajuster après essai.
