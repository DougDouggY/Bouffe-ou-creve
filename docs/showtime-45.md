# Showtime 45 — cérémonie, auras et voix équipées

La cérémonie WebGL utilise des marches en relief et une entrée articulée : jambes et bras marchent, puis les personnages montent sur leurs socles. Huit expressions générées animent les visages. Le rot gonfle les joues, ouvre la bouche et émet un nuage animé ; la danse lève les bras et déforme le ventre. Les cosmétiques réels restent équipés. Les têtes sont des maillages en relief texturés, pas des sculptures intégrales à 360°. L’aperçu du Dressing utilise également les gestes articulés. Une solution Canvas reste disponible.

Les cinq auras utilisent chacune quatre images transparentes générées, placées sous les pieds. Les flammes et la fumée utilisent deux séries de six images. Les ressources sont préchargées après la première interaction, partagées et mises en cache. Le cache des têtes est limité à 32 entrées ; les contextes WebGL sont libérés à la fermeture. Une horloge visuelle plafonne l’avancement à 80 ms par image pour éviter de sauter toute l’introduction après un blocage graphique.

## Audio

Le Dressing propose cinq sons de collision achetables : Hello, Arreteuh, Smack, Gros bidou et Wouf, ainsi qu’un choix silencieux gratuit. Seuls les humains équipés émettent ces voix lors d’un choc entre personnages sans consommation. Les murs et les IA ne déclenchent pas ces cosmétiques. Les identifiants sont synchronisés, jamais les fichiers audio. L’option locale des voix des autres s’applique aux collisions et aux glissades.

Les huit glissades fournies sont réencodées dans des fichiers version 45 avec une atténuation intégrée de 50 %, également efficace lorsque le téléphone ignore le volume HTMLAudio. Le rapport RMS mesuré face aux fichiers précédents varie de 0,456 à 0,492 (voir assets/audio/PROCESSING-45.json). Un fondu intégré de 45 ms à l’entrée et de 120 ms en fin accompagne les fondus de lecture de 60/120 ms. Une queue silencieuse conserve la fin des enregistrements. Selon la vitesse de lancement existante, la lecture varie de 1 à 0,86, en conservant la hauteur lorsque le navigateur le permet. Aucune vitesse physique, masse ou trajectoire n’est modifiée. La préécoute reste à vitesse normale.

Kisscount reprend la totalité du fichier original fourni : son conteneur dure environ 1,216 s ; aucune seconde supplémentaire n’est présente dans la source. Le nouveau décodage dure environ 1,328 s avec sa queue. Le rot du podium est un véritable échantillon Oculus CC BY 4.0, documenté dans assets/audio/SOURCES.json. Les voix sont limitées à trois lectures simultanées ; le minuteur de fondu n’existe que pendant la lecture.

## Vérifications

- 114 tests unitaires, notamment gestes, achats, fusion des profils, synchronisation des identifiants, voix humaines seules, volume et ralentissement.
- Navigateur Chromium : achats, équipement, préécoute native et persistance des collisions ; Kisscount complet et atténué ; glissade ralentie ; cérémonie WebGL, marche, bouche, fumée, ventre, relecture, fermeture et affichage mobile émulé.
- Quatre clients locaux : salon, tenues et sons équipés, reconnexion, équipes, résultats et revanche. Un client utilise les animations complètes et les trois autres le mode simplifié pour éviter la saturation du GPU logiciel du banc de test ; le rendu complet est testé séparément.
- Worker de production exécuté localement : SQLite, CORS avec origine GitHub Pages, WebSockets authentifiés, identités/cosmétiques et tour autoritaire identiques pour deux humains avec 22 IA. Construction Wrangler vérifiée.

Les téléphones physiques, plusieurs ordinateurs distants et le niveau sonore perçu sur leurs haut-parleurs restent à confirmer. Les domaines publics Pages/Worker sont bloqués par le proxy de cet environnement ; leur accès direct ne constitue donc pas un test effectué ici. Le statut de déploiement GitHub/Cloudflare est contrôlé séparément lors de la publication.
