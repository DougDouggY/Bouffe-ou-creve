# Rejoindre une partie commencée

Le même code d’invitation accepte maintenant un nouvel humain pendant la partie ou son récapitulatif. Il reste spectateur : aucun personnage ni IA n’est ajouté ou remplacé. La limite reste huit humains connectés au salon, spectateurs compris. Un siège nul est conservé à travers les reconnexions et les restaurations du Durable Object ; le nombre d’IA affiché compte uniquement les vrais sièges attribués.

Le spectateur voit le jeu et les tenues, choisit le gourmand suivi, peut discuter et participer au vote de revanche. Le serveur refuse ses tirs. Il reçoit un véritable siège au prochain lancement depuis le salon. L’interface n’affiche ni faux décès ni poids personnel, et les repas d’autres personnages ne déclenchent pas les sons réservés au joueur local.

Tests : arrivée d’un cinquième onglet pendant une partie de quatre humains, changement de cible, reconnexion avec le même ticket, chat reçu par l’hôte, départ du spectateur ; tests serveur des tirs interdits, du plafond de huit, de la restauration sans remplacement de personnage et du passage spectateur → joueur après une revanche unanime. Les tests de navigateur utilisent un Worker SQLite local et des relais HTTP/WebSocket aux origines publiques, pas plusieurs ordinateurs distants.
