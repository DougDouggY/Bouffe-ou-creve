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

Les vérifications couvrent les six ingrédients, les clics et le clavier, le toucher sur mobile, la réduction des animations, la lecture des deux fichiers M4A, le filtrage des événements audio et les collisions des rayons à 349, 350, 400, 500 et 2 000 kg sur les deux supermarchés. Elles vérifient aussi le tri des cartes, le lancement d’une carte en travaux, la visibilité à 360° et le fondu du halo dans le rendu réel du navigateur.

## Menu et sons

- L’illustration originale est conservée octet pour octet dans `assets/burger-menu.webp`.
- Les six masques PNG à sa résolution native (1 536 × 1 024) ont été segmentés depuis ses pixels avec des régions de premier plan/arrière-plan et GrabCut. Les anciens chemins SVG ont servi de régions initiales, puis les frontières ont été affinées suivant les textures de l’image. Les masques sont des ressources préparées ; aucun outil de segmentation n’est nécessaire pour lancer le jeu.
- `burger-menu.js` partage ces mêmes masques entre l’éclairage et la détection des clics. Les chemins SVG historiques ne dessinent plus la surbrillance et ne capturent plus la souris.
- L’image étant aplatie, les contours restent fixes : la texture originale de chaque ingrédient bouge de quelques pixels à l’intérieur de son masque, avec un retour souple au survol et un rebond de 220 ms à la sélection, avant la navigation. L’image intacte dessous évite les trous et les bords doubles. Au repos, tous les calques sont invisibles. Le clavier et le toucher déclenchent aussi la sélection ; le mode de réduction des animations supprime les mouvements et le délai.
- `audio.js` joue le jingle une seule fois par chargement. Si la lecture automatique est bloquée, il attend le premier geste sur le menu. Le bruitage gourmand joue pour les repas du joueur et lorsqu’il est dévoré, jamais pour les repas entre IA. Le bouton son coupe aussi les lectures en cours.
- Dans **Options → Musique d’ambiance**, un interrupteur active une boucle originale douce et ludique (marimba/pizzicato, basse et percussion discrète), dans le menu et en partie. Elle est désactivée par défaut, avec un volume initial de 15 %. Le curseur règle uniquement la musique, de 0 à 100 %, avec un niveau général adouci à 60 % pour laisser de la place aux effets. Activation et volume sont mémorisés dans ce navigateur ; les choix déjà enregistrés sont conservés. Le bouton général SON coupe aussi la musique. La lecture se met en pause quand l’onglet est masqué et reprend à son retour.
- `assets/ambiance-douce.mp3` est une composition originale de huit mesures à 84 BPM, sans échantillon externe, d’environ 23 secondes (88 Ko). Pour la régénérer : `python3 tools/generate-ambience.py` avec FFmpeg installé. Cet outil sert uniquement à la création de la ressource ; Python et FFmpeg ne sont pas nécessaires pour sa lecture dans le navigateur.
- Le jingle et le bruitage gourmand ont un volume de 35 % ; les petits effets synthétiques ont aussi été réduits. Le réglage musical reste indépendant des bruitages.

## Présentation et aide

Les joueurs sont appelés **gourmands** dans les modes, le menu burger et les messages de partie. Les écrans de choix et les dialogues reprennent une carte de bistrot : papier crème, filets doubles, titres bordeaux et typographie à empattements. L’illustration du burger et ses masques restent inchangés.

**Options → Comment jouer ?** ouvre un guide accessible à la souris, au clavier et sur mobile : choix du mode, visée au lance-pierre, nourriture, différence de poids et élan nécessaires pour dévorer, objectif de survie et rayons comestibles.
- Dès **350 kg**, un personnage peut manger les rayons au contact dans les deux supermarchés : **+15 kg par rayon**, suppression du dessin et de sa collision. La même règle s’applique aux IA.

## Cartes et essais

- Le supermarché nocturne utilise un petit halo à **360°** : rayon de 160 unités à 60 kg (au lieu de 470), lumineux autour du personnage puis progressivement sombre. Sa taille suit le corps des très gros personnages pour continuer à les entourer. La direction du dernier tir ne change plus la lumière ni la visibilité des IA. Les rayons restent solides et masquent les personnages et la nourriture placés derrière eux. Les étiquettes des personnages suivent le même fondu.
- Sushi-bar, Cinéma du goûter, Gymnase des gourmands, Cantine spatiale, Usine à bonbons et Train-restaurant sont retirés des choix, dans le menu et le sélecteur de partie.
- Chambre froide et Banquet pirate restent disponibles. Les quatorze cartes suivantes, de Plage des frites à Arène miroir, sont regroupées sous **En travaux** : elles sont jouables mais pas encore validées. Ce statut est distinct du drapeau historique `experimental`, qui contrôle leur dessin.
- La recherche et le mode Somalie conservent leurs filtres dans les deux catégories.
- Pistes pour la suite : une Chambre froide XL et une très grande arène qui rétrécit progressivement. Ces deux variantes ne sont pas encore ajoutées.

## Origine et publication

La branche `main` ne contenait qu’un README. Cette version de travail a donc été récupérée depuis le jeu publié, commit `c27f69b5aa98c9f4e886ef995e68e9066aa2039d` de `gh-pages` (V16). Le document autonome a été séparé en HTML, CSS, JavaScript et ressources, sans remplacer les illustrations. `game.js` reste issu de ce code compilé, avec ses noms de variables historiques ; les nouveaux comportements sont isolés dans des modules lisibles.

Les modifications locales ne mettent pas le site public à jour. Pour publier, livrer ensemble `index.html`, `style.css`, tous les modules `*.js` à la racine et le dossier `assets/` à la racine de la branche utilisée par GitHub Pages (actuellement `gh-pages`). Aucun build n’est nécessaire. Ne pas publier `node_modules/` ni `test-results/`. Ne pas écraser les autres fichiers déjà présents sur la branche publiée.
