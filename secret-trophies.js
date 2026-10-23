export const SECRET_MODES = new Set([
  "survival",
  "platform",
  "cannibal",
  "icecream",
  "somalia",
]);
const groups = {
  platform: [
    [
      "first",
      "Bon appétit, connard",
      "Manger son premier aliment sur la plateforme.",
    ],
    ["win", "Dernier étage", "Remporter le tournoi de La Plateforme."],
    [
      "fast",
      "J’ai pas faim",
      "Remporter un duel sans manger pendant sa phase de festin.",
    ],
    [
      "giant",
      "Régime express",
      "Faire tomber un adversaire pesant au moins deux fois son propre poids.",
      true,
    ],
    [
      "departure",
      "Service compris",
      "Pousser l’adversaire sur la plateforme pendant le troisième tour et l’éliminer lors de sa descente.",
      true,
    ],
    [
      "fall",
      "Le vide me va si bien",
      "Tomber dans le trou dès le premier tour de combat.",
      true,
    ],
    ["1000", "Gros morceau", "Atteindre 1 000 kg pendant un tournoi."],
    [
      "starve",
      "Le dernier sera le premier",
      "Remporter le tournoi sans manger un seul aliment.",
      true,
    ],
    [
      "leftovers",
      "J’vous laisse les restes",
      "Remporter un duel après avoir mangé moins que son adversaire.",
    ],
    [
      "bank",
      "C’est pas tombé dans l’oreille d’un sourd",
      "Pousser un adversaire dans le trou après un rebond contre un mur.",
      true,
    ],
    [
      "2000",
      "Le poids de la victoire",
      "Remporter la finale avec au moins 2 000 kg.",
      true,
    ],
    [
      "escape",
      "Je finissais l’assiette !",
      "Quitter la plateforme au troisième et dernier tour avant sa descente.",
    ],
  ],
  cannibal: [
    ["first", "Ça a goût de poulet", "Dévorer sa première victime."],
    ["ten", "Viande fraîche", "Dévorer 10 victimes dans une même partie."],
    ["hundred", "Allô, la police ?", "Dévorer 100 victimes au total."],
    [
      "five",
      "Cinq fruits et légumes",
      "Dévorer cinq victimes pendant une seule propulsion.",
    ],
    [
      "personal",
      "C’était pas personnel",
      "Dévorer une victime après avoir dévoré un gourmand pendant la même propulsion.",
      true,
    ],
    [
      "clean",
      "Pas de gaspillage",
      "Dévorer trois victimes consécutives sans toucher un mur.",
    ],
    [
      "win",
      "À table, les enfants !",
      "Remporter une partie du Festin Cannibale.",
    ],
    ["wins10", "Le boucher du dimanche", "Remporter 10 parties dans ce mode."],
    [
      "flee",
      "C’est encore vivant !",
      "Dévorer une victime pendant qu’elle tente de s’enfuir.",
    ],
    [
      "fallen",
      "La règle des cinq secondes",
      "Dévorer une victime dans les cinq secondes suivant sa chute.",
      true,
    ],
    [
      "alone",
      "Le dernier survivant",
      "Remporter une partie sans dévorer aucun autre gourmand.",
      true,
    ],
  ],
  icecream: [
    ["first", "Vous voulez une glace ?", "Avaler son premier enfant."],
    ["ten", "La sortie des classes", "Avaler 10 enfants dans une même partie."],
    [
      "rival",
      "Je les ai vus en premier",
      "Dévorer une camionnette adverse ayant déjà avalé au moins un enfant.",
      true,
    ],
    [
      "three",
      "Livraison express",
      "Avaler trois enfants pendant une seule propulsion.",
    ],
    [
      "2000",
      "Plus de place dans le coffre",
      "Atteindre 2 000 kg avec sa camionnette.",
    ],
    ["fifty", "Tournée générale", "Avaler 50 enfants au total."],
    ["1000", "Contrôle technique", "Atteindre 1 000 kg avec sa camionnette."],
    ["wins10", "Cinq étoiles sur Google", "Remporter 10 parties dans ce mode."],
    ["win", "La camionnette blanche", "Remporter sa première partie."],
    [
      "eaten",
      "Faut pas parler aux inconnus",
      "Se faire dévorer par une camionnette plus grosse.",
      true,
    ],
    [
      "five",
      "Ramassage scolaire",
      "Avaler cinq enfants pendant une seule propulsion.",
    ],
    ["wins25", "Service de nuit", "Remporter 25 parties dans ce mode."],
  ],
  somalia: [
    ["first", "Un festin de roi", "Manger son premier steak de moustique."],
    [
      "ten",
      "Y’a pas de petites économies",
      "Manger 10 steaks de moustique dans une partie.",
    ],
    ["100", "Le poids des mots", "Atteindre 100 kg en commençant à 8 kg."],
    ["wins10", "La dalle internationale", "Remporter 10 parties dans ce mode."],
  ],
};
let index = 0;
export const SECRET_TROPHIES = Object.entries(groups).flatMap(([mode, rows]) =>
  rows.map(([key, name, condition, secret = false]) => ({
    id: `shadow-${mode}-${key}`,
    mode,
    name,
    condition,
    secret,
    art: index++,
    shadow: true,
  })),
);
const nonnegative = (n) => (Number.isSafeInteger(n) && n >= 0 ? n : 0);
export function secretProfile(value = {}) {
  const result = {
    trophies: {},
    totals: {
      victims: nonnegative(value.totals?.victims),
      children: nonnegative(value.totals?.children),
    },
    wins: {},
    legacy: {},
  };
  for (const mode of SECRET_MODES)
    result.wins[mode] = nonnegative(value.wins?.[mode]);
  for (const t of SECRET_TROPHIES)
    if (nonnegative(value.trophies?.[t.id]))
      result.trophies[t.id] = value.trophies[t.id];
  if (nonnegative(value.legacy?.somaliaWin))
    result.legacy.somaliaWin = value.legacy.somaliaWin;
  return result;
}
export function secretTrophyEvent(profile, event, actor, data, game) {
  if (!SECRET_MODES.has(game.mode) || game.chef) return [];
  const state = (profile.shadow ??= secretProfile());
  const run = (game.secretTrophyRun ??= {
    food: 0,
    shotFood: 0,
    clean: 0,
    gourmands: 0,
    shotGourmand: false,
    ended: false,
  });
  const earned = [];
  const unlock = (key) => {
    const id = `shadow-${game.mode}-${key}`;
    if (SECRET_TROPHIES.some((t) => t.id === id) && !state.trophies[id]) {
      state.trophies[id] = Date.now();
      earned.push(id);
    }
  };
  if (event === "launch") {
    run.shotFood = 0;
    run.shotGourmand = false;
  }
  if (event === "wall" && actor?.id === 0) run.clean = 0;
  if (event === "eat") {
    if (actor?.id === 0) {
      run.gourmands++;
      run.shotGourmand = true;
      if (game.mode === "icecream" && data?.capturedChildren > 0)
        unlock("rival");
    } else if (game.mode === "icecream" && data?.id === 0) unlock("eaten");
  }
  if (event === "food" && actor?.id === 0) {
    run.food++;
    run.shotFood++;
    run.clean++;
    if (game.mode === "platform") unlock("first");
    if (game.mode === "somalia" && data?.type === "mosquito") {
      unlock("first");
      if (run.food >= 10) unlock("ten");
    }
    if (game.mode === "cannibal" && data?.type === "victim") {
      state.totals.victims++;
      unlock("first");
      if (run.food >= 10) unlock("ten");
      if (state.totals.victims >= 100) unlock("hundred");
      if (run.shotFood >= 5) unlock("five");
      if (run.clean >= 3) unlock("clean");
      if (run.shotGourmand) unlock("personal");
      if (data.fleeing) unlock("flee");
      if (
        data.lastFallAt != null &&
        game.mechanics.clock - data.lastFallAt <= 5000
      )
        unlock("fallen");
    }
    if (game.mode === "icecream" && data?.type === "child") {
      state.totals.children++;
      unlock("first");
      if (run.food >= 10) unlock("ten");
      if (state.totals.children >= 50) unlock("fifty");
      if (run.shotFood >= 3) unlock("three");
      if (run.shotFood >= 5) unlock("five");
    }
  }
  const mass = game.people[0]?.mass || 0;
  if ((game.mode === "platform" || game.mode === "icecream") && mass >= 1000)
    unlock("1000");
  if (game.mode === "icecream" && mass >= 2000) unlock("2000");
  if (game.mode === "somalia" && mass >= 100) unlock("100");
  if (event === "platformExit" && actor?.id === 0 && data?.turn === 3)
    unlock("escape");
  if (event === "platformFall" && actor?.id === 0 && data?.combatTurn === 1)
    unlock("fall");
  if (event === "platformDuel" && data?.won) {
    if (data.playerFood === 0) unlock("fast");
    if (data.playerFood < data.opponentFood) unlock("leftovers");
    if (data.pushedByPlayer && data.opponentMass >= data.playerMass * 2)
      unlock("giant");
    if (data.pushedByPlayer && data.departure) unlock("departure");
    if (data.pushedByPlayer && data.bank) unlock("bank");
  }
  if (event === "end" && !run.ended) {
    run.ended = true;
    if (game.outcome === "win") {
      state.wins[game.mode] = (state.wins[game.mode] || 0) + 1;
      unlock("win");
      if (state.wins[game.mode] >= 10) unlock("wins10");
      if (state.wins[game.mode] >= 25) unlock("wins25");
      if (game.mode === "platform") {
        if (run.food === 0) unlock("starve");
        if (mass >= 2000) unlock("2000");
      }
      if (game.mode === "cannibal" && run.gourmands === 0) unlock("alone");
    }
  }
  return earned;
}
