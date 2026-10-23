# Identités et Dressing partagés

Le client transmet uniquement les deux identifiants réels `hat` et `outfit` du Dressing. Le catalogue commun contient les 46 articles existants. Le serveur valide chaque identifiant dans son emplacement ; une valeur inconnue devient `none` / `plain`. Les ressources WebP existantes restent chargées en HTTP, jamais par WebSocket. Les humains utilisent le même dessin de personnage et les mêmes fonctions de placement que le solo.

L'apparence est actualisée au salon (y compris après un changement dans un autre onglet), ce qui retire l'état prêt. Elle est ensuite figée pour toute la partie et conservée après reconnexion. Une modification du Dressing pendant la partie prend effet au prochain salon. Les humains conservent un identifiant de membre et une place fixes ; le pseudo, normalisé et limité à 24 caractères Unicode par le serveur, reste associé à cette place. Les noms sont rendus avec `textContent`.

Les noms humains deviennent bleu clair et gras, avec une petite étoile. Le personnage local reçoit un contour bleu. Le style des IA reste inchangé. Les quinze chapeaux supplémentaires conservent leur position d’origine et sont dessinés derrière le crâne pour dégager le front, dans le Dressing et le jeu.

L'invitation multijoueur est intégrée en bas à droite de l'illustration, dans les deux menus. L'entrée du burger caché ouvre le même salon privé existant ; elle n'ajoute pas de règles secrètes au multijoueur. Le menu normal présente Classique sur la salade, Grand Banquet sur la tomate et États-Unis sur le fromage.

## Progression locale

La clé historique `bouffe-profile-v1` est conservée. Une sauvegarde secondaire `bouffe-profile-v1-backup` permet de récupérer une sauvegarde principale absente ou illisible. Les écritures fusionnent les trophées, achats et compteurs acquis dans plusieurs onglets, tout en appliquant les dépenses au solde courant. Un trophée de victoire Classique existant rétablit le déblocage du Grand Banquet ; une victoire États-Unis existante constitue également une preuve des étapes de progression antérieures. Aucune victoire n'est inventée en l'absence de preuve enregistrée.

Ces données restent propres au navigateur et à l'origine du site : pas de synchronisation de trophées entre ordinateurs, navigateurs, navigation privée ou domaines. Une mise à jour ou un paramètre d'URL ne change pas cette origine. Une suppression des données du site efface aussi la sauvegarde secondaire ; cette correction ne permet pas de récupérer des données déjà supprimées.

## Vérifications automatisées

- Tests unitaires : catalogue réel, validation des pseudonymes/identifiants, places stables, gel des apparences, checkpoint et reconnexion, physique identique avec ou sans costumes, fusion des sauvegardes sans restaurer l'argent dépensé.
- Quatre contextes Chromium indépendants : achats et équipement via le véritable Dressing, quatre apparences différentes, partage des pseudonymes et tenues, changement dans un second onglet, remise à zéro de l'état prêt, partie à quatre humains plus vingt IA, mouvements souris/tactiles, résultat identique, rechargement et reconnexion des quatre clients. Comparaison du dessin de chaque humain entre clients, avec une faible tolérance aux différences de rasterisation WebP de Chromium.
- Tests à deux navigateurs et véritable runtime Cloudflare local : salon, authentification WebSocket, tirs secrets, résolution autoritaire, reconnexion et retour au solo.
- Tests de l'interface solo, des modes secrets, du déblocage, de la récupération d'une sauvegarde principale endommagée, de l'entrée multijoueur cachée et des formats téléphone/ordinateur. Vérification visuelle du front dégagé avec les pancakes et la tenue royale.
- Construction Wrangler : Durable Objects SQLite et configuration existante inchangés.

Les tests de quatre clients conservent les URL et l'origine publiques, mais relaient les fichiers et WebSockets vers le runtime Cloudflare local : ils ne sont pas des tests Internet. L'accès direct à github.io / workers.dev est bloqué depuis cet environnement. Le script exécuté par Cloudflare Builds après déploiement vérifie séparément le Worker public, les cosmétiques et une partie à deux clients WebSocket. Le résultat de cette étape doit être contrôlé dans le build de la publication.

À confirmer avec 2 à 4 personnes sur des appareils et connexions Internet distincts : latence réelle, confort visuel et reconnexion après coupure réseau prolongée. Aucun test humain à distance n'est revendiqué.
