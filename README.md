# Bouffe ou Crève

Jeu statique, sans serveur applicatif ni clé secrète. Lancer un serveur HTTP depuis ce dossier (les modules JavaScript ne se chargent pas avec `file://`) :

```sh
npm run dev
```

Le serveur utilise le port 8000. Python 3 suffit pour jouer ; Node.js 20 ou supérieur sert aux outils de développement.

## Vérifications

```sh
npm ci
npm test
npm run test:browser
```

Les tests navigateur utilisent `/usr/bin/chromium` s’il existe. Sinon, installer Chromium avec `npx playwright install chromium`, ou fournir son chemin dans `CHROMIUM_EXECUTABLE`. Les captures sont générées dans `test-results/`.

Les vérifications couvrent les six ingrédients, les clics et le clavier, le toucher sur mobile, la réduction des animations, la lecture des deux fichiers M4A, le filtrage des événements audio et les collisions des rayons à 349, 350, 400, 500 et 2 000 kg sur les deux supermarchés.

## Menu et sons

- L’illustration originale est conservée octet pour octet dans `assets/burger-menu.webp`.
- Les six masques PNG à sa résolution native (1 536 × 1 024) ont été segmentés depuis ses pixels avec des régions de premier plan/arrière-plan et GrabCut. Les anciens chemins SVG ont servi de régions initiales, puis les frontières ont été affinées suivant les textures de l’image. Les masques sont des ressources préparées ; aucun outil de segmentation n’est nécessaire pour lancer le jeu.
- `burger-menu.js` partage ces mêmes masques entre l’éclairage et la détection des clics. Les chemins SVG historiques ne dessinent plus la surbrillance et ne capturent plus la souris.
- L’image étant aplatie, les ingrédients restent fixes : le reflet se déplace à l’intérieur de leur silhouette. Ce choix évite de révéler des pixels manquants ou de doubler un bord. Au repos, les calques lumineux sont invisibles.
- `audio.js` joue le jingle une seule fois par chargement. Si la lecture automatique est bloquée, il attend le premier geste sur le menu. Le bruitage gourmand joue pour les repas du joueur et lorsqu’il est dévoré, jamais pour les repas entre IA. Le bouton son coupe aussi les lectures en cours.
- Dès **350 kg**, un personnage peut manger les rayons au contact dans les deux supermarchés : **+15 kg par rayon**, suppression du dessin et de sa collision. La même règle s’applique aux IA.

## Origine et publication

La branche `main` ne contenait qu’un README. Cette version de travail a donc été récupérée depuis le jeu publié, commit `c27f69b5aa98c9f4e886ef995e68e9066aa2039d` de `gh-pages` (V16). Le document autonome a été séparé en HTML, CSS, JavaScript et ressources, sans remplacer les illustrations. `game.js` reste issu de ce code compilé, avec ses noms de variables historiques ; les nouveaux comportements sont isolés dans des modules lisibles.

Les modifications locales ne mettent pas le site public à jour. Pour publier, livrer ensemble `index.html`, `style.css`, les quatre fichiers JavaScript et le dossier `assets/` à la racine de la branche utilisée par GitHub Pages (actuellement `gh-pages`). Aucun build n’est nécessaire. Ne pas publier `node_modules/` ni `test-results/`. Ne pas écraser les autres fichiers déjà présents sur la branche publiée.
