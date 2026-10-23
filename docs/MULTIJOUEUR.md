# Multijoueur privé — prototype Cloudflare

Le site reste sur <https://dougdouggy.github.io/Bouffe-ou-creve/>. Le serveur est prévu pour le Worker existant **bouffeoucrevemulti**, à l’adresse <https://bouffeoucrevemulti.jeferson-patry-sin.workers.dev/>. Les invités utilisent uniquement le jeu.

## Ce qui est développé

- Entrée **Une table entre amis · Multijoueur** sous le burger classique, dans le style de la carte de restaurant. Aucune entrée multijoueur dans la Face Cachée.
- Création et saisie d’un code privé de 12 caractères (60 bits aléatoires), sans compte. Le code se présente en trois groupes de quatre caractères.
- Jusqu’à **8 humains**, places restantes complétées par les IA existantes. Tailles 8, **24 par défaut**, 50. Le premier décor compatible est **Cantine du chaos** ; les autres cartes et modes secrets ne sont pas proposés dans ce prototype.
- Liste des invités, état prêt, choix de taille par l’hôte, lancement et départ du salon.
- Un Durable Object SQLite par salon. Le Worker principal contrôle les origines et les admissions, puis transmet au salon.
- **Une seule simulation autoritaire** : `simulation-core.js` contient le moteur Matter.js, les collisions, consommations et IA extraits du jeu solo. `launch` accepte en plus une table de tirs humains. Le solo continue à utiliser ce même moteur sans cette table.
- Les tirs sont secrets pendant la préparation. Chaque humain vivant a un tir immuable par tour. Les doublons identiques sont idempotents ; les changements, tours périmés, spectateurs, puissances illégales et commandes non autorisées sont refusés.
- Quand tous ont joué, ou après 45 secondes, le serveur choisit les actions des IA et résout le tour à 60 Hz. Une personne absente utilise l’IA pour ce tour. Une série d’images d’état à 10 Hz est envoyée aux navigateurs, qui interpolent l’affichage **sans simuler le résultat**. Les positions de début et de fin restent exactes ; les positions intermédiaires transmises sont arrondies à 0,01 pixel.
- Pas de timer d’animation permanent dans le Durable Object : WebSocket Hibernation API, état sauvegardé et alarmes pour les délais. Les données alimentaires inchangées et attributs statiques ne sont pas répétés à chaque image.
- Reconnexion automatique pendant **90 secondes**, y compris après rechargement du même onglet. Le ticket privé reste dans `sessionStorage`, jamais dans le code source ni dans le code d’invitation. Une nouvelle connexion au même siège remplace l’ancienne.
- Après une longue absence, le siège devient une IA et le ticket expire. L’hôte est transféré si nécessaire. Un éliminé suit automatiquement un gourmand vivant jusqu’à la victoire finale. Le retour au menu quitte le salon.
- Salons expirés après 30 minutes sans activité ou 4 heures au maximum ; état supprimé automatiquement. Limites d’admission : 6 créations/minute/IP, 30 tentatives de jonction/minute/IP et 100 créations/jour pour ce prototype. Une limite de commandes est aussi appliquée aux sockets.
- Sauvegarde du salon et d’un état complet aux limites des tours, avec état du générateur aléatoire. Après hibernation/redémarrage, le moteur reprend depuis ce point. Une reconnexion pendant une animation peut afficher directement son résultat ; elle attend néanmoins la fin du délai d’animation commun avant de tirer.
- Les parties privées ne distribuent pas de points de graisse, déblocages ou trophées solo dans cette première version. Les comptes et la boutique en ligne ne sont pas nécessaires.

## Offre gratuite vérifiée

Documentation officielle consultée le **23 octobre 2026**, via les sources publiques du site Cloudflare, car l’accès direct à `developers.cloudflare.com` est filtré dans cet environnement :

- [Disponibilité des Durable Objects sur Free](https://developers.cloudflare.com/durable-objects/platform/pricing/) : seuls les objets avec stockage **SQLite** sont disponibles sur Free. La migration utilise `new_sqlite_classes`.
- [Tarifs et quotas Durable Objects](https://developers.cloudflare.com/durable-objects/platform/pricing/) : **100 000 requêtes/jour**, **13 000 GB-s/jour**, **5 millions de lignes lues/jour**, **100 000 lignes écrites/jour**, **5 Go** de stockage au total. Les messages WebSocket entrants ont un ratio de facturation de 20:1 ; les messages sortants ne sont pas facturés comme requêtes.
- [Limites Durable Objects](https://developers.cloudflare.com/durable-objects/platform/limits/) : allocation mémoire partagée de l’isolate, CPU par événement documenté à **30 secondes** par défaut ; le calcul physique s’effectue dans l’objet, pas dans le routeur Worker.
- [Limites Workers](https://developers.cloudflare.com/workers/platform/limits/) : sur Free, **100 000 requêtes/jour** et **10 ms CPU** pour le Worker d’entrée.
- Sur Free, le dépassement bloque les opérations concernées ; il ne déclenche pas automatiquement un abonnement payant. Les compteurs quotidiens repartent à zéro à minuit UTC. Les quotas sont partagés avec les autres usages du compte.

Sources lues : [note Free/SQLite](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/partials/durable-objects/do-plans-note.mdx), [tableaux de quotas](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/partials/durable-objects/durable-objects-pricing.mdx), [tarifs](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/durable-objects/platform/pricing.mdx), [limites DO](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/durable-objects/platform/limits.mdx), [limites Worker](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/platform/limits.mdx).

La configuration n’active ni offre payante, ni service tiers payant, ni modification de facturation. Conserver le compte sur **Workers Free**. Les quotas réels du compte restent à contrôler dans le tableau Cloudflare. La configuration ne fixe aucun budget CPU réservé au plan payant.

## Installer le serveur sur ton compte

**Cette opération remplace le code « Hello World » du Worker existant et crée son espace de salons SQLite.** Elle ne déplace pas le site GitHub Pages et ne change pas le plan Cloudflare. Aucun secret ne doit être ajouté aux fichiers publics.

Sur ton ordinateur, installer Node.js **22 ou plus récent** et Git, puis ouvrir un terminal :

```bash
git clone --branch gh-pages --single-branch https://github.com/DougDouggY/Bouffe-ou-creve.git
cd Bouffe-ou-creve/cloudflare
npm ci
npx wrangler login
npx wrangler whoami
npm run check
npm run deploy
```

`wrangler login` ouvre Cloudflare dans ton navigateur : se connecter au compte qui possède **bouffeoucrevemulti**. `whoami` permet de vérifier le compte sélectionné. Si Wrangler demande quel compte utiliser, choisir celui du Worker existant. Ne pas activer d’abonnement ni ajouter de clé API dans le dépôt.

`npm run check` produit le bundle localement sans le publier. `npm run deploy` utilise le nom et les migrations de `wrangler.jsonc`. Le nom de domaine attendu est celui indiqué en tête de ce guide. Si le dossier du jeu existe déjà, récupérer la branche `gh-pages` dans un dossier séparé pour éviter d’écraser des modifications locales.

Vérifier ensuite dans un navigateur :

<https://bouffeoucrevemulti.jeferson-patry-sin.workers.dev/health>

Le résultat doit contenir :

```json
{
  "service": "bouffe-private-rooms",
  "version": "multi-20",
  "roomLimit": 8,
  "sizes": [8, 24, 50]
}
```

Le site utilise automatiquement ce serveur en HTTPS/WSS. L’origine autorisée est **https://dougdouggy.github.io**, sans chemin : c’est ainsi que les navigateurs transmettent l’origine de GitHub Pages. Le fichier autorise également `http://localhost:8000` et `http://127.0.0.1:8000` pour les essais locaux. Aucun `*` n’est utilisé.

## Tester avec Tony sur deux appareils

1. Après installation du serveur, ouvrir tous les deux le [jeu](https://dougdouggy.github.io/Bouffe-ou-creve/). Recharger la page si elle était déjà ouverte.
2. Choisir **Multijoueur** sous le burger classique. Saisir ton nom et **Créer un salon privé**.
3. Copier le code et l’envoyer à Tony par le moyen de ton choix. Tony saisit son nom et le code, puis **Rejoindre le salon**.
4. Vérifier les deux noms, **24 gourmands**, **2 humains + 22 IA**. Chacun appuie sur **Je suis prêt** ; l’hôte clique sur **Servir le festin · Lancer**.
5. Chacun vise et relâche depuis son propre gourmand. Le premier tir attend secrètement le second. Quand les deux sont verrouillés, les deux appareils affichent le même mouvement, chacun avec sa caméra.
6. Vérifier poids, survivants et résultat. Si un ami ne tire pas, attendre 45 secondes : l’IA joue pour lui. Recharger un onglet pour essayer la reconnexion ; un gourmand éliminé reste spectateur.
7. **Menu** quitte le salon. Le mode solo reste accessible normalement.

Si le bouton indique que le service est indisponible, consulter d’abord `/health`. Un Worker qui répond encore `Hello World!` n’a pas reçu ce code. Si `/health` est correct mais que le navigateur refuse la connexion, vérifier l’origine dans `wrangler.jsonc`, puis redéployer. Un quota Free épuisé nécessite d’attendre sa réinitialisation, pas de passer en payant.

## Développement et vérifications reproductibles

Depuis la racine :

```bash
npm ci
npm ci --prefix cloudflare
npm test
npm run test:browser
npm run test:arenas
npm run test:secrets
npm run test:filmovore
npm run test:multiplayer
```

Pour jouer localement, ouvrir deux terminaux : `npm run dev` à la racine et `npm run dev --prefix cloudflare`. Ouvrir <http://127.0.0.1:8000/>. Le client local choisit automatiquement le serveur sur `127.0.0.1:8787`.

Le test multijoueur démarre un véritable runtime Cloudflare **workerd** local avec SQLite et deux contextes Chromium indépendants, dont un téléphone tactile simulé. Il remplace uniquement les adresses locales de test et utilise le vrai client, la vraie interface, les WebSockets et le moteur partagé. Chromium doit être installé (`/usr/bin/chromium`, ou variable `CHROMIUM_EXECUTABLE`).

Les tests moteur couvrent aussi les collisions/dévorations, les poids, la poursuite après élimination du siège zéro, les IA, les tailles 8/24/50, le secret et le verrouillage des tirs, les délais/déconnexions, l’expiration, la reprise de l’état persistant et la compression des animations.

## État de livraison et limites du test

- **Développé** : client intégré, serveur, configuration SQLite, protocole, sauvegarde, tests et guide de déploiement.
- **Testé localement** : deux navigateurs distincts (ordinateur et téléphone tactile), création/saisie de code, état identique au départ et après un vrai tour, 2 humains + 22 IA, tirs séparés et secrets, mouvements/poids partagés, reconnexion par rechargement, refus d’un tour périmé par le vrai Worker, départ puis relance solo et filtrage des origines. Les collisions/éliminations et la prise de relais à l’échéance sont aussi testées dans le moteur réel côté serveur.
- **Mesures locales** : sur un échantillon à 24 gourmands, trois tours serveur ont pris environ 824 ms CPU au total sous Node ; un enregistrement de tour passe d’environ 606 Ko à 205 Ko avec le protocole compact. Ces mesures locales ne garantissent pas les performances Cloudflare. La sauvegarde d’un salon représentait environ 31 Ko.
- **Publication du site** : le bouton n’active le service que si le serveur répond au contrôle de version `/health`. Le solo reste disponible si le Worker est encore en « Hello World ».
- **Pas déployé ici sur Cloudflare** : aucun accès à ton compte n’est connecté dans cet environnement. Aucune facturation modifiée. La procédure ci-dessus reste à exécuter par le propriétaire du compte.
- **Pas encore vérifié sur Internet avec Tony** : les deux navigateurs testés communiquent avec workerd localement. La latence réelle, les quotas et les performances du compte Cloudflare gratuit devront être vérifiés après déploiement. La compatibilité du bundle a été contrôlée avec Wrangler, sans prétendre remplacer cet essai réel.
