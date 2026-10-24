# Cérémonie, sons et fluidité — version ceremony-38

Les changements de collection restés en attente sont inclus : auras renforcées,
illustrations du Dressing, nouveaux titres, Trampoline Park validé, quatre murs
rebondissants continus et animation des trampolines centraux.

## Cérémonie et interface

La cérémonie utilise les résultats du moteur autoritaire : Roi du Buffet
(équipe entière en équipe), Estomac sans fond (égalités conservées) et Burger du
jour (première élimination chronologique, ordre stable en cas de simultanéité).
Un même gourmand peut recevoir plusieurs distinctions. Les vrais vêtements,
chapeaux et auras restent équipés. Les bras, jambes, visage et tête sont animés
séparément ; les animations achetées compatibles remplacent celles par défaut.
Introduction courte, bouton Passer, clic pour relancer, projecteurs et attente
animés. Le rendu de l'arène et la simulation locale cessent derrière la cérémonie.
Le mode de mouvements simplifiés reste respecté.

Options agrandies, fermeture par croix, effets et musique réglables en partie.
Les guides longs des objets/arènes ont été retirés des options, pas du jeu.
L’accès multijoueur utilise les personnages des deux côtés de l’illustration.
Une pancarte « Multijoueur ! » descend sous le titre au survol ou au focus clavier.
Le clic sur les personnages ouvre le salon ; aucun libellé fixe en bas ni steak
supplémentaire. L’image originale est conservée.
Les invités peuvent demander une carte ; seul l'hôte applique le choix.

## Sons et économie

Cinq véritables MP3 courts CC0 de Wyzowl : glissade standard gratuite,
Le Ressort, La Savonnette, La Toupie, Décollage express. Sources, empreintes des
originaux et licence dans assets/audio/SOURCES.json et LICENSE-CC0.txt.
Le Ressort sert aussi au boing. Aucun flux audio n'est envoyé par WebSocket.
L'identifiant slide est sauvegardé et synchronisé avec les cosmétiques.
Une lecture par propulsion, trois voix maximum ; huit sons humains et une seule
voix IA représentative par tour. Préécoute, volume local et coupure des sons
cosmétiques des autres joueurs (y compris ceux déjà en lecture).

**Le Prout reste indisponible**, en attente d'un véritable fichier satisfaisant et
utilisable légalement. Aucun faux pet synthétique n'a été créé.

Récompenses générales divisées par deux et plafonnées à 80 points par partie.
En ligne, seuls les événements du serveur attribuent les gains ; les reçus
existants empêchent les doublons et le portefeuille ne crédite qu'une fois un
compteur serveur, même avec plusieurs onglets ou une reconnexion. Les points
et achats déjà acquis sont conservés.
Salade normale : −12 kg ; XL : −30 kg ; quantité inchangée.
Objet rare : un seul tirage de 3 % par partie complète, pas à chaque tour de tir.

## Mesures et limites

Causes vérifiées :

- Le profil était sauvegardé et l'aperçu du Dressing redessiné pour chaque
  consommation, même lorsque le Dressing était fermé. Regroupement des sauvegardes
  d'événements dans une microtâche ; achats et fin de partie sauvegardés immédiatement.
- L'IA recalculait les mêmes projections pour chaque trajectoire, même lorsque
  deux poids égaux rendaient le calcul inutilisé. Réutilisation par décision.
  Comparaison avant/après : **984 plans strictement identiques**, 36 configurations
  (8/24/50, quatre arènes, trois graines). Médianes de planification mesurées sur
  cette machine : 105→81 ms, 298→276 ms et 658→477 ms respectivement. Ce sont des
  mesures locales, pas une garantie de fréquence d'affichage.
- L'extraction de silhouettes allouait un tableau de voisins par pixel ; buffers
  réutilisés et voisins parcourus directement, sans modifier la transparence.
- Les bouchées utilisent un pool audio plutôt qu'un nouvel élément par événement.

Le test navigateur performance-browser.mjs place réellement 80 burgers au même
endroit et appelle le moteur. La variante avant/après conserve exactement poids,
statistiques et points : **80 écritures de profil contre une**. Lors de ce stress
avec d'autres navigateurs de test actifs, le pas mesuré passe de 36,45 s à 678 ms.
Ce cas volontairement extrême démontre l'effet des écritures/aperçus répétés ; ce
n'est pas une mesure représentative d'une partie normale, et 678 ms reste long.
Les masques RGBA comparés conservent les trous et éliminent les mêmes îlots.

Mesures indépendantes d'un tour avec 80 aliments, 4 humains et 8/24/50 gourmands :
les tests podium-performance.mjs enregistrent durée de simulation, croissance,
pas maximal, encodage/décodage et taille réseau. Les tests réseau comparent les
états finaux et décodent tous les paquets. Aucun saut d'images ou changement de
physique n'a été ajouté. L'IA autoritaire à 50 reste un coût à surveiller.
window.__gourmandsPerf.snapshot() expose des mesures bornées (60 échantillons).

Tests automatisés : sauvegardes concurrentes/reconnexion/achats, validation de
récompenses, demandes de cartes, sons dédoublonnés/limités/coupés, trois parties
consécutives calculées par le moteur avec huit sièges humains, rendu des costumes
et chapeaux à quatre poids, auras et présentation mobile simulée.
Les tests locaux WebSocket utilisent le Worker de production avec SQLite ; les
tests navigateur utilisent un relais conservant l'origine GitHub Pages.
À confirmer sur plusieurs ordinateurs et téléphones physiques : ressenti audio,
fluidité au premier tour, décodage/autoplay iOS et réseau Internet réel. Ne pas
considérer tous les freezes résolus sur la seule base de ces tests.
