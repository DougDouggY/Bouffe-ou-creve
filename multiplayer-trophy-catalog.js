export const MULTIPLAYER_TROPHIES = [
  [
    "mp-human1",
    "Dîner entre amis",
    "Manger un joueur humain pour la première fois.",
  ],
  [
    "mp-human3",
    "L’amitié, ça se digère",
    "Éliminer trois adversaires humains dans une même partie.",
  ],
  ["mp-win1", "Le roi du buffet", "Remporter sa première partie multijoueur."],
  [
    "mp-revenge",
    "Le plat de la vengeance",
    "Éliminer l’humain qui nous a éliminé lors de la partie précédente du même salon.",
  ],
  [
    "mp-first-out",
    "J’aurais dû prendre une salade",
    "Être le premier humain éliminé d’une partie.",
  ],
  [
    "mp-chat",
    "La bouche pleine",
    "Envoyer son premier message dans le chat multijoueur.",
  ],
  [
    "mp-ghost-chat",
    "Même mort, je parle",
    "Écrire dans le chat après son élimination, en spectateur.",
  ],
  [
    "mp-full-table",
    "La tablée est complète",
    "Participer à une partie avec huit joueurs humains.",
  ],
  [
    "mp-five-servings",
    "On remet le couvert",
    "Terminer cinq parties dans le même salon privé.",
  ],
  ["mp-wins5", "Service cinq étoiles", "Remporter cinq parties multijoueurs."],
  ["team-duo-win", "Mariés pour le pire", "Remporter une partie en Duo."],
  [
    "team-duo-alone",
    "Jusqu’à ce que la mort nous sépare",
    "Gagner en Duo alors que son partenaire a été éliminé.",
  ],
  [
    "team-trio-win",
    "Un pour tous, tous pour la bouffe",
    "Remporter une partie en Trio.",
  ],
  [
    "team-trio-last",
    "Le troisième de trop",
    "Être le seul survivant de son Trio pendant une partie.",
  ],
  [
    "team-quad-win",
    "Les quatre fantastiques",
    "Remporter une partie en Quatuor.",
  ],
  [
    "team-quad-out",
    "Quatre à la morgue",
    "Voir les quatre membres de son équipe éliminés dans une même partie.",
  ],
  [
    "team-shared-bill",
    "On partage l’addition",
    "Chaque membre de son équipe élimine au moins un adversaire humain pendant la même partie.",
  ],
  [
    "team-avenge",
    "Touche pas à mon gros",
    "Éliminer un humain dont la dernière victime est un de ses coéquipiers.",
  ],
  [
    "team-last-win",
    "Le dernier des gros",
    "Être le dernier survivant de son équipe et remporter la partie.",
  ],
  [
    "team-salads",
    "Régime collectif",
    "Tous les membres de son équipe mangent une salade pendant la même partie.",
  ],
  [
    "team-first-out",
    "L’union fait la défaite",
    "Toute son équipe est éliminée dès le premier tour.",
  ],
  [
    "team-family",
    "Service en famille",
    "Remporter au moins une partie en Duo, en Trio et en Quatuor.",
  ],
  [
    "team-quad-last",
    "La famille, quelle famille ?",
    "Remporter une partie en Quatuor en étant le seul survivant de son équipe.",
  ],
  [
    "team-quad-intact",
    "Buffet à volonté",
    "Remporter une partie en Quatuor sans perdre un membre de son équipe.",
  ],
  [
    "mp-regulars",
    "Les habitués du buffet",
    "Disputer dix parties avec au moins un même humain, même sur plusieurs sessions.",
  ],
  [
    "team-trio-intact",
    "Les trois mousquetaires",
    "Remporter une partie en Trio avec les trois coéquipiers encore vivants.",
  ],
  [
    "team-quad-meals",
    "Les quatre à table !",
    "En Quatuor, chaque coéquipier mange un adversaire pendant la même partie, humain ou IA.",
  ],
  [
    "team-duo-human-win",
    "À deux, c’est mieux",
    "En Duo, chaque partenaire mange un adversaire humain et l’équipe remporte la partie.",
  ],
  [
    "team-assist",
    "Passe décisive",
    "Désactivé : le lien causal entre une poussée alliée et une dévoration n’est pas encore vérifiable.",
    false,
  ],
  [
    "team-against-all",
    "Seul contre tous",
    "Gagner en équipe après être devenu seul survivant de son équipe alors qu’au moins la moitié des participants étaient encore vivants.",
  ],
  [
    "team-weak-link",
    "Le maillon faible",
    "Gagner en équipe en étant le seul membre n’ayant mangé aucun adversaire ; tous les autres en ont mangé au moins un.",
  ],
  [
    "team-stowaway",
    "Le passager clandestin",
    "Gagner en équipe, vivant, sans avoir personnellement mangé un seul gourmand ou joueur. Burgers et salades autorisés.",
  ],
  [
    "team-no-burger",
    "Sans supplément",
    "Gagner en équipe, vivant, sans avoir mangé le moindre burger pendant la partie.",
  ],
].map(([id, name, condition, enabled = true], index) => ({
  id,
  name,
  condition,
  enabled,
  art: index < 22 ? index : index < 24 ? index + 1 : index - 24,
  extraArt: index >= 24,
  online: true,
  secret: true,
  section: id.startsWith("mp-") ? "multiplayer" : "teams",
}));
export const ONLINE_TROPHY_IDS = new Set(
  MULTIPLAYER_TROPHIES.filter((t) => t.enabled).map((t) => t.id),
);
export function onlineProfile(value = {}) {
  const result = {
    profileId: typeof value.profileId === "string" ? value.profileId : "",
    revision: 0,
    trophies: {},
    wins: 0,
    maxMass: 0,
    rivals: {},
    teamWins: { 2: 0, 3: 0, 4: 0 },
  };
  for (const key of ["revision", "wins"])
    if (Number.isSafeInteger(value[key]) && value[key] >= 0)
      result[key] = value[key];
  if (Number.isFinite(value.maxMass) && value.maxMass >= 0)
    result.maxMass = value.maxMass;
  for (const [id, rival] of Object.entries(value.rivals || {})) {
    if (!/^[a-f0-9-]{36}$/.test(id) || !rival || typeof rival !== "object")
      continue;
    result.rivals[id] = {
      name:
        typeof rival.name === "string"
          ? Array.from(rival.name).slice(0, 24).join("")
          : "Gourmand",
      together: 0,
      eaten: 0,
      wasEaten: 0,
    };
    for (const key of ["together", "eaten", "wasEaten"])
      if (Number.isSafeInteger(rival[key]) && rival[key] >= 0)
        result.rivals[id][key] = rival[key];
  }
  for (const id of ONLINE_TROPHY_IDS)
    if (Number.isSafeInteger(value.trophies?.[id]) && value.trophies[id] > 0)
      result.trophies[id] = value.trophies[id];
  for (const size of [2, 3, 4])
    if (
      Number.isSafeInteger(value.teamWins?.[size]) &&
      value.teamWins[size] >= 0
    )
      result.teamWins[size] = value.teamWins[size];
  return result;
}

export function clientProfile(state) {
  const { rivals, ...publicState } = state;
  return publicState;
}
