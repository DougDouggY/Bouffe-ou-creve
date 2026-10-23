# Duo, trio et quatuor

La formule « Équipes » se choisit avant le départ, sur la page de choix des cartes en solo ou dans le salon privé en multijoueur. Le burger et ses modes de base restent inchangés. Les modes secrets gardent leurs règles individuelles.

Les duos acceptent 8, 24 ou 50 gourmands ; les trios 24 ; les quatuors 8 ou 24. Ces tailles assurent des équipes complètes et de même taille. Les IA complètent les sièges libres des équipes. En solo, le joueur commence dans l’équipe 1 ; les autres membres sont des IA. En multijoueur, l’hôte choisit la formule et chaque humain choisit une équipe disposant d’une place libre. Une équipe pleine est désactivée côté client et refusée côté serveur. Un changement de formule, de taille ou d’équipe demande une nouvelle confirmation de disponibilité.

Une couleur et un numéro distinguent chaque équipe sur les étiquettes et au sol, en conservant le texte bleu des humains. Les identifiants d’équipe sont attachés aux sièges du serveur et ne dépendent pas de l’ordre local des personnages. Les tenues continuent d’utiliser les ressources existantes.

Les alliés ne peuvent pas se dévorer, même à l’arrivée d’une téléportation ; leur bouclier n’est donc pas consommé par un allié. Les collisions, masses, impulsions et dangers du décor restent actifs. Les IA excluent les alliés de leurs cibles de chasse. La partie se termine lorsqu’une seule équipe survit, même s’il reste plusieurs personnages. Un joueur mort partage la victoire de ses alliés survivants. En solo, les tours suivants continuent automatiquement quand le joueur est mort ; il peut choisir la cible qu’il observe.

Le serveur conserve la composition pendant une reconnexion ou une revanche. Les nouveaux spectateurs reçoivent une place dans une équipe libre au retour au salon. La limite reste huit humains par salon.

Le protocole partagé passe à `multi-21` ; `/health` expose `teamSizes: [1,2,3,4]`. Il faut recharger les clients après le déploiement du Worker et créer un nouveau salon pour cette version. Les Durable Objects SQLite et leur migration ne changent pas.

Validation : règles réelles des trois tailles, alliés protégés et boucliers conservés, victoire avec plusieurs survivants et avec joueur local mort, IA sans chasse d’allié, quotas et autorisations serveur, sièges non contigus, checkpoints, revanche, contrôles du salon à quatre navigateurs et une manche synchronisée sur Trampoline Park. Les échanges Cloudflare sont testés en runtime local avec origine GitHub Pages conservée par relais ; cela ne constitue pas une confirmation de déploiement Internet.
