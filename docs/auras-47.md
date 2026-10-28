# Portrait, glissades et auras — 47

Le démarrage d’une partie sur téléphone ne demande plus de plein écran, ne verrouille plus l’orientation et n’affiche plus de panneau bloquant de rotation. Portrait et paysage fonctionnent librement ; le plein écran reste une action volontaire dans les Options.

Les collisions retrouvent le comportement de showtime-45 à la demande du joueur : fichiers 44 à leur niveau initial, deux voix humaines équipées possibles par choc, délai global 400 ms et délai de 900 ms par duo/tour. Les IA seules restent silencieuses. Les achats et équipements ne changent pas.

L’atténuation de 65 % s’applique désormais aux 16 sons de glissade, dans les fichiers eux-mêmes pour couvrir les téléphones qui ignorent HTMLAudio.volume. Les fichiers 47 dérivent des fichiers précédemment utilisés ; les huit voix utilisateur conservent donc aussi leur réduction initiale de 50 %. Les fondus et le ralentissement léger existants sont conservés. Les fichiers de référence ne sont pas supprimés, et les sons des bumpers ne sont pas modifiés.

Cinq nouvelles auras générées utilisent vingt images transparentes : ketchup, mayonnaise, fromage doré, braises et slime. Leurs bords sont plus épais et en relief, avec éclaboussures, bulles et flammes. Leur emprise au sol passe de 3 à 4,5 unités (50 % plus large), avec une légère respiration de largeur et une interpolation complète entre les quatre images. L’échelle reste liée au gourmand. Le Dressing, les parties et la cérémonie réutilisent ces ressources ; les modes simplifié et sans effets restent respectés.

Vérifications : 114 tests unitaires ; démarrage réel d’une partie en portrait émulé sans panneau ni plein écran forcé, puis rotation libre ; 96 rendus de chapeaux/poids, auras animées, préécoute et durée des 16 glissades ; tests de cérémonie et d’effets dans Chromium. Téléphone physique et niveau perçu à l’oreille restent à confirmer. Aucun changement à la physique ou aux règles.
