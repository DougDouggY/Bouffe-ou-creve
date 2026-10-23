# Salon privé : apparences, Dressing, cartes et revanche

Le salon affiche les personnages équipés avec le même dessin et les mêmes ressources que le jeu. Le bouton « Le Dressing du Glouton » ouvre la véritable boutique au-dessus du salon, sans quitter le groupe. Les achats utilisent les points locaux existants. Fermer le Dressing synchronise l'équipement ; une modification retire le statut prêt.

L'hôte choisit parmi les cartes normales disponibles. Les cartes retirées, secrètes et en travaux sont exclues. La sélection est validée par le serveur, partagée et persistée dans le Durable Object. Changer de carte retire tous les statuts prêts. Les tailles utilisent les dimensions normales correspondantes. Les acteurs mobiles, les événements et les obstacles consommés sont partagés dans les états et restaurés avec le checkpoint ; les clients ne simulent pas la physique.

Le bouton « Voter pour rejouer » apparaît dans le récapitulatif quand tous les humains sont éliminés, ou à la fin d'une partie. Le compteur de votes est partagé et chaque joueur peut annuler son vote. Tous les membres du salon doivent être connectés et voter pour revenir ensemble au même salon. Le code, les pseudos, les équipements, le nombre de gourmands et la carte sont conservés ; les statuts prêts et votes sont remis à zéro. L'hôte peut alors choisir une autre carte et lancer une nouvelle partie. Le terrain et la graine sont réinitialisés. Une déconnexion annule le vote ; un membre absent suit le délai de reconnexion existant avant son retrait.

## Validation

Les tests unitaires couvrent toutes les cartes proposées : autorisation de l'hôte, validation des identifiants, états partagés, simulation réelle d'un tour et récupération du checkpoint avec les acteurs mobiles. Les tests du vote couvrent le refus avant élimination, les votes partiels, l'annulation, la déconnexion, la persistance, l'unanimité et le lancement d'une nouvelle partie sans changer de salon.

Le test Chromium à quatre clients vérifie les aperçus, l'accès au véritable Dressing depuis le salon, les équipements synchronisés, le choix du Supermarché nocturne, une manche commune et les reconnexions. Pour vérifier le récapitulatif sans attendre une longue partie, son Worker de test dispose d'un scénario de fin contrôlé, uniquement dans `tests/fixtures/multiplayer-test-worker.js`. Il vérifie ensuite le compteur, l'absence de redémarrage avant unanimité, le retour des quatre clients dans le même salon et une nouvelle partie sur Volcan raclette. Le Worker de production ne référence pas cette fixture et n'expose aucune route de contrôle de test.

Ces tests utilisent des navigateurs indépendants et le runtime Cloudflare local, avec les URL et l'origine publiques relayées. Ils ne constituent pas un test entre quatre ordinateurs sur Internet. La publication GitHub Pages et le déploiement Cloudflare doivent être vérifiés séparément.
