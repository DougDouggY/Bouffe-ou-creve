# Chapeaux, flaques, audio et progression — wardrobe-41

Les deux pains du burger de menu et du burger de Douggy sont désormais sans
sésame. Les géométries et les quatre masques du menu restent en place.

## Têtes et auras

Les 23 chapeaux du catalogue et la tête nue ont chacun un portrait complet.
Le menton et la largeur des oreilles ont été normalisés dans 24 cases d'un atlas
transparent. Le renderer remplace la tête entière par un seul sprite déjà équipé,
sans dessiner un chapeau à l'arrière ou à l'avant d'une autre tête. Les IDs,
achats, tenues et sauvegardes sont conservés. Le même renderer dessert Dressing,
solo, portraits du salon, multijoueur et podium. Les articulations du corps et
les rotations de tête du podium restent actives.

Les auras sont des flaques remplies, basses, sous les semelles, avec ondulation
et petite vague en mode animé. Le mode simplifié garde une flaque fixe ; le mode
sans effets la masque. Aucun contour d'aura ne remonte autour du corps.

## Audio

Aucun son de glissade n'est lancé pour une IA, y compris le standard. Le joueur
solo est explicitement identifié ; les humains en ligne utilisent les IDs de
leurs vrais cosmétiques. Les sons de rebond sont aussi filtrés sur les humains.
Les sons simultanés restent limités à trois et chaque propulsion est dédoublonnée.

Pixabay et sa page de licence sont inaccessibles depuis cet environnement (403).
Quatre enregistrements du **Oculus Audio Pack 01**, distribué par Meta, ont été
intégrés sous **CC BY 4.0** : froissement naturel pour le standard gratuit,
canard, cochon, rot. Les trois nouveaux choix ont une illustration et une
préécoute. Ils sont gratuits à réutiliser avec attribution, pas du domaine public.
Le crédit accessible dans le Dressing/options, le texte de licence et les sources
avec empreintes des originaux se trouvent dans assets/audio/. Les extraits sont
raccourcis à 1,25 s maximum, normalisés et convertis en MP3. Les anciens sons
achetés restent disponibles. Le Prout reste indisponible : la provenance exacte
d'un échantillon naturel satisfaisant n'a pas pu être vérifiée, aucun faux son
électronique n'a été créé.

## Cartes et options

La création d'un salon propose trois formules sur des cartes de restaurant. Le
choix de la formule est réellement envoyé au salon à son ouverture ; rejoindre
un salon conserve la formule de l'hôte. Le salon et ses fonctions restent réels.
Les options regroupent volume, musique et affichage avec moins de texte. La
coupure générale est dans le coin du bloc effets ; plein écran est dans Affichage.
La musique se règle par choix de piste et volume, sans case d'activation visible.
Un ancien réglage désactivé est migré vers un volume nul pour respecter ce choix.

## Trophées et compteurs

- Nouveau trophée **Le Grand Banqueteur** (victoire en Grand Banquet), rétroactif
  lorsque la sauvegarde contient déjà une victoire de ce mode.
- Classique, Grand Banquet et États-Unis ont chacun leur victoire et alimentent
  « Le buffet est fermé ». Les anciens IDs/dates sont conservés.
- Au survol/focus des trophées de cumul, la progression réelle apparaît : parties
  gagnées, burgers, raclettes, victimes, burgers de Douggy et trois modes.
- En multijoueur, les cumuls viennent des statistiques du moteur autoritaire.
  Des deltas par profil et les reçus durables évitent les doublons après
  reconnexion, redémarrage ou répétition des messages. Deux sièges du même profil
  ne doublent pas le cumul d'une même partie. Les snapshots en ligne ne sont pas
  additionnés par les onglets ; le solo et le cumul en ligne restent séparés.
- L'événement fondue manquait dans le relevé de replay multijoueur. Il est
  maintenant transmis et compté. Un test fait réellement consommer une raclette
  par le moteur puis vérifie le delta de profil exact et l'absence de répétition.
  La règle existante reste **2 000 kg** pour avaler le fromage ; traverser une
  coulée à faible poids ne constitue pas une consommation. Les conditions des
  trophées le précisent. Les anciennes consommations non enregistrées ne sont
  pas reconstituées arbitrairement.

Tests : 103 tests unitaires, 96 rendus de têtes à quatre poids, flaque limitée au
sol et animée, achats conservés après rechargement, progression visible, curseur
musique effectif, décodage des huit sons disponibles et parcours général du menu.
Le Worker local conserve SQLite, WebSockets et huit humains maximum. Tests de
salon indépendants et vérification de déploiement complètent les contrôles.
Le ressenti des sons et les performances sur appareils physiques restent à tester.
