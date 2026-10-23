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
    "Trahison calorique",
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
    "team-betrayal",
    "C’est pas toi, c’est moi",
    "Désactivé : les alliés ne peuvent pas se dévorer et les poussées ne sont pas attribuées.",
    false,
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
].map(([id, name, condition, enabled = true], art) => ({
  id,
  name,
  condition,
  enabled,
  art,
  online: true,
  secret: true,
  section: art < 10 ? "multiplayer" : "teams",
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
    teamWins: { 2: 0, 3: 0, 4: 0 },
  };
  for (const key of ["revision", "wins"])
    if (Number.isSafeInteger(value[key]) && value[key] >= 0)
      result[key] = value[key];
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
