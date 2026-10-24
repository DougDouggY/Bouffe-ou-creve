# Burger poulet, quatre entrées et téléphone — chicken-menu-40

Le nom **Les Gourmands** figure dans l'en-tête, hors de l'illustration. Le burger
ne porte que les quatre accès : Mon Gourmand (pain supérieur), Solo (frites et
raclette/crème fraîche), Multijoueur (poulet pané), Options (pain inférieur).
Les personnages latéraux restent décoratifs : l'accès multijoueur ne dépend plus
de leur visibilité en portrait. L'image est conservée à pleine qualité au repos.

L'illustration burger-chicken-menu.webp et le petit douggy-chicken.webp utilisent
la même recette sans légumes : poulet pané, frites, raclette/crème fraîche, pain
au sésame. Le petit burger de Douggy conserve ses valeurs, son taux et sa hitbox.
Un dessin de secours de la même recette s'affiche si son image n'est pas prête.
Quatre PNG alpha indépendants proviennent d'une segmentation colorée du nouveau
visuel (générée à partir de l'image), avec extraction des couleurs pleines sans
le halo. Ils servent au survol, au reflet et aux clics ; aucune ellipse ou zone
rectangulaire CSS ne remplace les silhouettes. Les anciens fichiers restent
présents pour compatibilité, sans être les cibles du nouveau menu.

Mon Gourmand présente deux pages réelles, Mon style et Mes trophées, avec une
navigation commune et un changement de page animé. Achats, sauvegardes et
calculs de trophées sont ceux du jeu existant. Sur la face cachée, les trophées
et les quatre jeux restent accessibles ; la restriction du Dressing y reste
respectée. Le bouton Solo ouvre les formules Classique (8), Grand Banquet (24),
États-Unis (50), avec les déblocages conservés, puis la carte d'arènes existante.
Le multijoueur ouvre le vrai formulaire de création/invitation puis le salon
restaurant déjà opérationnel. Les formules en ligne portent les mêmes noms.

Sur téléphone, les quatre cibles restent au centre du burger en portrait.
Au départ d'une partie, le jeu tente le plein écran depuis le geste utilisateur,
puis le verrouillage paysage uniquement si le navigateur le propose. Les invités
reçoivent aussi l'indication de rotation quand leur partie commence. En portrait,
un écran recommande de tourner le téléphone et permet de rester en portrait.
Le refus ou l'absence d'API fullscreen/orientation n'empêche pas de jouer.
Le solo attend la rotation/choix ; le multijoueur continue de recevoir ses états.
Retour au menu : verrouillage libéré et plein écran ouvert par cette fonction
refermé. Les coordonnées, dimensions du monde et règles restent inchangées.

Vérifications : tests/chicken-menu.mjs couvre les quatre silhouettes et les
vrais dialogues, un achat conservé après passage aux trophées et retour, les
modes déverrouillés, les quatre modes cachés, les quatre cibles tactiles en
390×844 et une partie affichée en 844×390. Les helpers des tests navigateur
naviguent maintenant par les vraies nouvelles cartes. Les tests unitaires du
moteur et des sauvegardes restent inchangés.
La rotation physique et le comportement de Safari/iOS restent à confirmer sur
appareil réel : aucun navigateur ne peut garantir de tourner l'appareil de force.
