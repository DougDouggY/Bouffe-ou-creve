# Déployer le multijoueur depuis GitHub, avec le navigateur uniquement

Aucune installation de Node.js ou Git sur ton PC n’est nécessaire. Windows Smart App Control reste activé. **Cloudflare Workers Builds** récupère le dépôt GitHub, installe les outils sur ses serveurs, déploie le Worker puis vérifie les salons et les WebSockets.

**État actuel :** les fichiers sont préparés et les vérifications locales passent. La connexion GitHub à ton compte Cloudflare et le déploiement du Worker public ne sont pas effectués par cet environnement. Ce guide explique les étapes à faire dans ton navigateur.

## 1. Ouvrir le Worker existant

1. Ouvre <https://dash.cloudflare.com/> et connecte-toi au compte qui possède ton Worker.
2. Vérifie que tu utilises toujours **Workers Free**. Ce déploiement ne nécessite ni abonnement payant ni carte bancaire. Ne choisis aucune mise à niveau.
3. Ouvre **Workers & Pages**.
4. Clique sur le Worker existant **`bouffeoucrevemulti`**. C’est celui dont l’adresse est `bouffeoucrevemulti.jeferson-patry-sin.workers.dev`. Ne crée pas une application Pages ni un deuxième Worker.
5. Ouvre **Settings** / **Paramètres**, puis **Builds** / **Build**.
6. Dans la partie dépôt Git, clique sur **Connect** / **Connecter**.

## 2. Autoriser et choisir le dépôt GitHub

7. Choisis **GitHub**. Si Cloudflare ouvre GitHub pour une autorisation, connecte-toi à ton compte GitHub.
8. Pour l’application **Cloudflare Workers & Pages**, choisis **Only select repositories** / **Uniquement les dépôts sélectionnés**, puis sélectionne **`DougDouggY/Bouffe-ou-creve`**. Valide avec **Install & Authorize** / **Installer et autoriser** si demandé.
9. De retour sur Cloudflare, sélectionne le dépôt **`DougDouggY/Bouffe-ou-creve`**.

Aucune clé API ne doit être collée dans un fichier GitHub. Si Cloudflare propose un jeton de déploiement, laisse sa création et son stockage automatiques dans Cloudflare. Ce jeton sert au déploiement ; ce n’est pas un abonnement.

## 3. Renseigner les réglages du build

10. Saisis les valeurs suivantes. Les intitulés peuvent apparaître en anglais ou en français :

| Champ Cloudflare                            | Valeur exacte                                                                                  |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Worker / nom du projet                      | `bouffeoucrevemulti`                                                                           |
| Production branch / branche de production   | **`gh-pages`**                                                                                 |
| Root directory / répertoire racine          | **`/`** — la racine du dépôt ; laisser vide si le formulaire indique déjà la racine par défaut |
| Build command / commande de build           | `npm ci --prefix cloudflare --include=dev && npm run check --prefix cloudflare`                |
| Deploy command / commande de déploiement    | `npm run deploy:ci --prefix cloudflare`                                                        |
| Preview builds / builds des autres branches | **Désactivés**                                                                                 |

**La branche `gh-pages` est essentielle : c’est elle qui contient le jeu et le serveur complets. `main` ne convient pas pour ce déploiement.**

La racine `/` permet de trouver `wrangler.jsonc` et de conserver l’accès aux fichiers du moteur commun. Ne choisis pas `cloudflare` comme répertoire racine avec ces commandes. Le fichier Wrangler pointe explicitement vers `cloudflare/src/worker.js` : le build déploie uniquement le serveur, pas le site solo.

11. Dans **Build variables and secrets** / **Variables du build**, ajoute ces deux variables de type texte, non secrètes :

| Nom                       | Valeur |
| ------------------------- | ------ |
| `NODE_VERSION`            | `24`   |
| `SKIP_DEPENDENCY_INSTALL` | `1`    |

Cloudflare installe Node.js sur son serveur de build. La deuxième variable évite d’installer automatiquement les dépendances du jeu à la racine ; la commande de build installe elle-même les dépendances du serveur, depuis son fichier de verrouillage. `--include=dev` inclut Wrangler et le vérificateur, même si un environnement de build est configuré en production.

12. Pour **API token**, conserve la gestion automatique de Cloudflare si ce champ est affiché. Ne crée pas de secret dans le dépôt ni dans le code du jeu.
13. Si le formulaire n’affiche pas les réglages de branches, termine la connexion, puis ouvre **Settings → Builds → Branch control** : sélectionne **`gh-pages`** et décoche **Enable Preview Builds**. Ne lance pas de build sur `main`.
14. Laisse les chemins surveillés du build à leur valeur par défaut : le serveur importe aussi le moteur situé à la racine du dépôt. Un filtre limité à `cloudflare/**` manquerait les modifications de ce moteur.
15. Clique sur **Save and Deploy** / **Enregistrer et déployer** si ce bouton est proposé. Sinon, enregistre les réglages puis déclenche **Build / Deploy / Retry build** depuis l’historique des builds. Si aucun premier build n’est proposé, ouvre le [guide dans GitHub sur `gh-pages`](https://github.com/DougDouggY/Bouffe-ou-creve/blob/gh-pages/docs/DEPLOIEMENT-CLOUDFLARE-GITHUB.md), clique sur le crayon, ajoute à la fin `<!-- Premier build Cloudflare -->` et fais **Commit changes** directement sur **`gh-pages`** : ce commit déclenche le build automatiquement, depuis le navigateur.

Les prochains commits sur `gh-pages` déclencheront automatiquement le déploiement du serveur. GitHub Pages continue de servir le jeu à son adresse actuelle.

## 4. Ce que le déploiement configure

`wrangler.jsonc`, à la racine, conserve :

- le nom exact **`bouffeoucrevemulti`**, donc le Worker existant et son adresse ;
- le point d’entrée **`cloudflare/src/worker.js`**, sans configuration d’assets pour publier le jeu sur Cloudflare ;
- le binding **`ROOMS`**, relié à la classe exportée **`PrivateRoom`** ;
- la migration **`v1-private-rooms`**, avec **`new_sqlite_classes: ["PrivateRoom"]`** ;
- l’origine autorisée **`https://dougdouggy.github.io`**, utilisée par le jeu GitHub Pages ;
- les WebSockets sécurisés du serveur, avec authentification et hibernation dans le Durable Object.

**Il n’y a pas de base D1 ni de namespace KV à créer manuellement.** Le stockage SQLite des Durable Objects est créé par la migration Wrangler. Le tag existant est conservé pour éviter de répéter la création lors des déploiements suivants. Le code public n’a pas besoin de clé secrète Cloudflare.

## 5. Vérifier le résultat réel

16. Ouvre **Deployments → View build history**, puis le dernier build. Vérifie qu’il utilise bien **`gh-pages`** et le bon commit.
17. Le build doit finir avec succès. Après la sortie de Wrangler, le contrôle automatique doit afficher les lignes suivantes :

```text
OK : /health, version et origine GitHub Pages.
OK : salon SQLite, deux invités et deux WebSockets authentifiés.
OK : 2 humains + 22 IA, tirs secrets, tour autoritaire et résultats identiques.
Vérification réussie du Worker cible ; salon de test quitté.
```

Ce contrôle utilise l’adresse publique du Worker. Il ne se contente pas d’afficher un menu : il crée un salon temporaire, rejoint avec deux clients, vérifie le démarrage et le résultat d’un vrai tour serveur, puis quitte le salon. Il consomme une création de salon et un petit volume des quotas gratuits à chaque déploiement. Les codes d’invitation et tickets privés ne sont pas imprimés dans les journaux.

18. Dans un nouvel onglet, ouvre :

<https://bouffeoucrevemulti.jeferson-patry-sin.workers.dev/health>

La réponse doit être un objet JSON contenant :

```json
{
  "service": "bouffe-private-rooms",
  "version": "multi-20",
  "roomLimit": 8,
  "sizes": [8, 24, 50]
}
```

19. Ouvre ensuite le [jeu](https://dougdouggy.github.io/Bouffe-ou-creve/), recharge la page et clique sur **Multijoueur**. Crée un salon. Tony rejoint avec son code, vous choisissez **24 gourmands**, chacun clique sur **Je suis prêt**, puis l’hôte lance la partie. Le salon doit indiquer **2 humains + 22 IA**.

Ce n’est qu’après le contrôle du Worker public et cet essai dans le jeu que la connexion Internet est vérifiée. Les essais effectués ici sur workerd local ne prouvent pas à eux seuls le déploiement sur ton compte.

## Si une étape échoue

- **`Hello World!` sur `/health`** : l’ancien code tourne encore. Vérifie le Worker choisi, la branche `gh-pages`, la commande de déploiement et les journaux. Un build réussi sans déploiement actif ne suffit pas.
- **Configuration Wrangler introuvable ou nom différent** : choisir la racine `/`, la branche `gh-pages` et le Worker **`bouffeoucrevemulti`**. La configuration est désormais dans **`wrangler.jsonc` à la racine**, et non dans `cloudflare/wrangler.jsonc`.
- **Erreur d’import du moteur / fichier absent** : vérifier la branche et ne pas réduire la copie du projet au sous-dossier `cloudflare`.
- **`wrangler` introuvable ou Node trop ancien** : vérifier la commande de build, `NODE_VERSION=24` et `SKIP_DEPENDENCY_INSTALL=1`. Cloudflare doit exécuter `npm ci --prefix cloudflare` avant le déploiement.
- **Erreur d’autorisation Cloudflare** : vérifier que le Worker est dans le compte sélectionné et que le jeton géré par Workers Builds a accès au déploiement des Workers de ce compte. Ne change pas d’offre et ne publie pas le jeton.
- **Erreur liée aux Durable Objects sur Free** : vérifier la migration **`new_sqlite_classes`**, et non `new_classes`. Ne pas créer de stockage KV pour contourner l’erreur ; copier le message du build pour diagnostiquer.
- **Échec de la vérification après la sortie de Wrangler** : le nouveau code peut déjà être actif, mais le déploiement n’est pas validé. Lire la dernière ligne `ÉCHEC de vérification`, vérifier `/health` et les logs du Worker. Le script ne fait pas de retour arrière automatique.
- **Quota Free épuisé** : attendre la réinitialisation du quota concerné. Les quotas de requêtes sont quotidiens ; les minutes de build sont mensuelles. Aucune mise à niveau payante n’est nécessaire pour ce prototype.

## Gratuité et sources officielles

Documentation consultée le **23 octobre 2026**. Les sources du dépôt officiel Cloudflare ont été lues lorsque l’accès direct au site de documentation était filtré dans l’environnement.

- [Connecter un Worker existant à GitHub](https://developers.cloudflare.com/workers/ci-cd/builds/#connect-an-existing-worker).
- [Réglages Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) et [versions Node / installation des dépendances](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/).
- [Branches de production et désactivation des previews](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/).
- [Workers Builds Free](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/) : **3 000 minutes de build par mois**, un build à la fois, délai maximal de 20 minutes par build. Les builds tournent sur Cloudflare, pas sur Windows.
- [Durable Objects Free](https://developers.cloudflare.com/durable-objects/platform/pricing/) : stockage **SQLite** disponible ; quotas notamment de 100 000 requêtes/jour, 13 000 GB-s/jour et 5 Go de stockage au total. Les limites sont partagées avec les autres usages du compte. Sur Free, les opérations qui dépassent les quotas sont bloquées, sans passage automatique en payant.

Aucun paramètre de facturation, abonnement ou moyen de paiement n’a été modifié. La configuration de ce dépôt n’active aucun service payant. La vérification de l’état **Workers Free** du compte reste à faire dans ton tableau de bord, auquel cet environnement n’est pas connecté.
