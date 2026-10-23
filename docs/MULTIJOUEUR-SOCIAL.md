# Spectateur, élimination et chat privé

Après son élimination, un humain reçoit son propre récapitulatif avec « Continuer en spectateur ». Le gourmand qui l'a mangé est identifié par le serveur depuis l'événement réel du moteur ; cette information passe dans les images du replay et le checkpoint, puis reste visible après reconnexion. Sans événement de dévoration enregistré, le jeu affiche simplement une élimination, sans inventer de responsable.

En spectateur, les flèches et la liste des survivants permettent de suivre un humain ou une IA. La caméra et la visibilité nocturne suivent ce personnage. S'il est éliminé, un autre survivant est choisi automatiquement. Le bouton « Récapitulatif · Rejouer » permet de rouvrir la fenêtre après l'avoir quittée. Quand tous les humains sont éliminés, chacun reçoit le récapitulatif commun et peut soit voter pour retourner au salon, soit observer les IA restantes. Après la fin définitive du match, il n'y a plus de partie à observer.

Les éliminations produisent une annonce commune, par exemple « Tony a été dévoré par Doug », ou une annonce générique en l’absence de responsable. Les annonces suivent le temps du replay, affichent au maximum trois lignes et disparaissent après huit secondes.

La synchronisation du récapitulatif utilise aussi une horloge indépendante du rendu et le retour de visibilité de la page : elle ne dépend plus uniquement des animations qui s'arrêtent dans un onglet masqué ou un menu en pause. Une reconnexion remplace aussi un éventuel replay incomplet par le nouvel état officiel.

Le chat appartient au salon privé et reste commun au salon d'attente, à la partie et à la revanche. Le serveur attache l'identité réelle de l'auteur, valide 1 à 200 caractères, retire les caractères de contrôle, limite chaque membre à un message par seconde et conserve les 40 derniers messages. L'historique est restauré avec le salon après reconnexion. Les textes et pseudos sont insérés avec `textContent`, jamais interprétés comme du HTML. Les deux panneaux sont repliables ; celui du jeu reste discret en bas à gauche.

Validation : tests unitaires du vrai responsable d'une dévoration, de sa persistance, du chat, de la validation et du débit. Quatre contextes Chromium et le runtime Cloudflare local vérifient les échanges entre salon et partie, l'affichage littéral d'un message contenant du HTML, le choix du spectateur, la poursuite après fermeture du récapitulatif, la reconnexion avec attribution et historique, puis le récapitulatif commun avec un client dont le rendu est suspendu. Les scénarios d'élimination et de fin contrôlées sont exclus du Worker de production. Les tests du solo et des salons à deux navigateurs sont également exécutés.

Ces tests locaux ne remplacent pas une validation entre plusieurs ordinateurs sur Internet. La mise à jour du Worker est nécessaire pour le chat et l'attribution serveur.
