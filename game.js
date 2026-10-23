import { mergeProfileProgress } from "./profile-storage.js?v=identity-22";
import { COSMETIC_CATALOG as KA } from "./cosmetic-catalog.js?v=identity-22";
import { setupMultiplayer } from "./multiplayer-client.js?v=identity-22";
import {
  CA,
  Ee,
  bA,
  RA,
  ne,
  NA,
  he,
  yA,
  eA,
  XA,
  zt,
} from "./simulation-core.js?v=multi-20";
import { drawSurvivalFloor } from "./survival.js?v=hunger-18";
import { setupSecretTrophyLab } from "./secret-trophy-lab.js?v=filmovore-15";
import {
  SECRET_GAME_MODES,
  propulsionFactor,
  drawSecretFloor,
  drawSecretPerson,
  drawSecretFood,
  drawSecretFalls,
} from "./secret-modes.js?v=arena-17";
import {
  SECRET_MODES,
  SECRET_TROPHIES,
  secretProfile,
  secretTrophyEvent,
} from "./secret-trophies.js?v=filmovore-15";

import { arenaSize, drawArenaBorders } from "./arena-bounds.js?v=hunger-18";
import {
  createRestaurantMenu,
  setupSecretBurger,
  modeUnlocked,
} from "./restaurant-menu.js?v=identity-22";

import {
  drawArenaFloor,
  drawArenaActors,
  drawArenaPowers,
} from "./arena-render.js?v=filmovore-15";
import {
  EXTRA_HAT_BOUNDS,
  drawExtraCosmetic,
  extraCosmeticImage,
} from "./cosmetics.js?v=hat-mask-25";
import { drawMapArt, mapArtURL } from "./map-art.js?v=hunger-18";
import {
  WORK_IN_PROGRESS_MAPS,
  mapGroups,
} from "./map-catalog.js?v=filmovore-15";
import {
  isVisible as xA,
  drawMarketFog as nt,
  lightOpacity,
} from "./visibility.js?v=filmovore-15";
import { setupBurgerMenu } from "./burger-menu.js?v=burger-16";
import { createGameAudio } from "./audio.js?v=filmovore-15";
import { setupMusicControls } from "./music.js?v=filmovore-15";

const L = (e) => document.querySelector(e);

(function () {
  const g = document.createElement("link").relList;
  if (g && g.supports && g.supports("modulepreload")) return;
  for (const E of document.querySelectorAll('link[rel="modulepreload"]')) u(E);
  new MutationObserver((E) => {
    for (const A of E)
      if (A.type === "childList")
        for (const n of A.addedNodes)
          n.tagName === "LINK" && n.rel === "modulepreload" && u(n);
  }).observe(document, { childList: !0, subtree: !0 });
  function o(E) {
    const A = {};
    return (
      E.integrity && (A.integrity = E.integrity),
      E.referrerPolicy && (A.referrerPolicy = E.referrerPolicy),
      E.crossOrigin === "use-credentials"
        ? (A.credentials = "include")
        : E.crossOrigin === "anonymous"
          ? (A.credentials = "omit")
          : (A.credentials = "same-origin"),
      A
    );
  }
  function u(E) {
    if (E.ep) return;
    E.ep = !0;
    const A = o(E);
    fetch(E.href, A);
  }
})();
let fe = !1;
async function fI(e) {
  if (!fe) {
    fe = !0;
    try {
      for (const u of document.querySelectorAll("dialog[open]")) u.close();
      const g = e.id === "app" ? document.body : e,
        o = e.id === "app" ? "app-expanded" : "expanded-game";
      if (document.fullscreenElement === e) {
        (g.classList.remove(o), await document.exitFullscreen());
        return;
      }
      if (g.classList.contains(o)) {
        g.classList.remove(o);
        return;
      }
      try {
        if (!e.requestFullscreen) throw new Error("API unavailable");
        await e.requestFullscreen({ navigationUI: "hide" });
      } catch {
        g.classList.add(o);
      }
    } finally {
      fe = !1;
    }
  }
}
const SECRET_MAP_MODE = (mode) => Object.hasOwn(SECRET_GAME_MODES, mode);
const me = {
  ...SECRET_GAME_MODES,
  classic: { name: "Classique", count: 8 },
  gros: { name: "Grand Banquet", count: 24 },
  usa: { name: "États-Unis", count: 50 },
  somalia: { name: "Somalie", count: 50, onlyMap: "savanna" },
  chef: { name: "Chef", count: 1 },
};
function GI(mode, mapId) {
  return arenaSize(mode, mapId);
}

const We = (e, g, o) => Math.max(g, Math.min(o, e));
function Ze(e = 60) {
  const g = We(Math.log2(Math.max(60, e) / 60) / 5, 0, 1),
    o = We((60 - e) / 52, 0, 1);
  return {
    fullness: g,
    lean: o,
    bodyWidth: 0.84 + 0.12 * g - 0.4 * o,
    bodyHeight: 0.78 + 0.04 * g,
    headScale: 1 - 0.25 * g - 0.1 * o,
    headY: -0.28 - 0.1 * g - 0.1 * o,
  };
}
const ZI = {
  chef: { width: 1.38, height: 1.1 },
  cap: { width: 1.24, height: 1.28 },
  crown: { width: 1.27, height: 1.11 },
  pirate: { width: 1.55, height: 1.02 },
  burger: { width: 1.3, height: 1.02 },
  tender: { width: 1.28, height: 0.96 },
  beanie: { width: 1.2, height: 1.02 },
  halo: { width: 1.38, height: 0.94, lift: 0.48 },
};
Object.assign(ZI, EXTRA_HAT_BOUNDS);
function dI(e, g = 1) {
  const o = ZI[e];
  return o
    ? {
        x: (-o.width * g) / 2,
        y: (-0.56 - o.height - (o.lift || 0)) * g,
        w: o.width * g,
        h: o.height * g,
        front: o.front ?? e !== "halo",
      }
    : null;
}
function xI(e = 1, g = 60) {
  const { fullness: o, lean: u } = Ze(g),
    E = 1.98 + 0.32 * o - 1 * u;
  return { x: (-E * e) / 2, y: -0.4 * e, w: E * e, h: (1.44 + 0.1 * o) * e };
}
function FI(e, g = 1, o = 60) {
  const u = dI(e),
    E = Ze(o);
  return u ? Math.min(-g, (u.y * E.headScale + E.headY) * g) : -1.22 * g;
}
const zI = "./assets/avatars.webp",
  DI = "./assets/volcano.webp",
  bI = "./assets/savanna.webp";
function Be(e, g) {
  const [o, u, E, A] = g,
    n = document.createElement("canvas");
  ((n.width = E - o), (n.height = A - u));
  const i = n.getContext("2d", { willReadFrequently: !0 });
  i.drawImage(e, o, u, n.width, n.height, 0, 0, n.width, n.height);
  const I = i.getImageData(0, 0, n.width, n.height),
    C = I.data,
    Q = n.width,
    B = n.height,
    k = Q * B,
    t = new Uint32Array(k),
    a = new Uint32Array(k);
  let s = 0,
    r = 0,
    d = 0;
  for (let M = 0; M < k; M++) {
    if (t[M] || C[M * 4 + 3] <= 40) continue;
    const S = ++s;
    let v = 0,
      f = 1;
    for (a[0] = M, t[M] = S; v < f;) {
      const l = a[v++],
        R = l % Q,
        h = Math.floor(l / Q);
      for (const c of [
        R > 0 ? l - 1 : -1,
        R < Q - 1 ? l + 1 : -1,
        h > 0 ? l - Q : -1,
        h < B - 1 ? l + Q : -1,
      ])
        c >= 0 && !t[c] && C[c * 4 + 3] > 40 && ((t[c] = S), (a[f++] = c));
    }
    f > d && ((r = S), (d = f));
  }
  for (let M = 0; M < k; M++) {
    if (t[M] === r) continue;
    let S = !1;
    if (C[M * 4 + 3] <= 40 && C[M * 4 + 3] > 0) {
      const v = M % Q,
        f = Math.floor(M / Q);
      for (let l = -2; l <= 2 && !S; l++)
        for (let R = -2; R <= 2; R++)
          if (
            v + R >= 0 &&
            v + R < Q &&
            f + l >= 0 &&
            f + l < B &&
            t[M + l * Q + R] === r
          ) {
            S = !0;
            break;
          }
    }
    S || (C[M * 4 + 3] = 0);
  }
  return (i.putImageData(I, 0, 0), n);
}
const GA = [
    ["somalia-win", "Survivant de Somalie", "Remporter une partie en Somalie."],
    ["classic-win", "Poids moyen", "Remporter une partie en Classique."],
    ["us-win", "American Dream", "Remporter une partie aux États-Unis."],
    [
      "all-modes",
      "Le buffet est fermé",
      "Remporter au moins une partie dans chacun des trois modes.",
    ],
    ["wins50", "Le roi des gros", "Remporter 50 parties."],
    ["express10", "Service express I", "Gagner en 10 tours maximum."],
    ["express7", "Service express II", "Gagner en 7 tours maximum."],
    ["express5", "Service express III", "Gagner en 5 tours maximum."],
    ["burger1", "Première bouchée", "Manger son premier burger."],
    ["burger10", "Une petite faim", "Manger 10 burgers au total."],
    ["burger100", "J’ai encore de la place", "Manger 100 burgers au total."],
    [
      "burger1000",
      "C’est une maladie à ce stade",
      "Manger 1 000 burgers au total.",
    ],
    ["turn3", "Menu Maxi", "Manger 3 burgers en un tour."],
    ["turn5", "Buffet à volonté", "Manger 5 burgers en un tour."],
    ["turn7", "L’estomac sans fond", "Manger 7 burgers en un tour."],
    ["douggy1", "La recette secrète", "Manger 1 burger de DOUGGY."],
    ["douggy10", "Client fidèle", "Manger 10 burgers de DOUGGY."],
    ["douggy100", "Actionnaire chez Douggy", "Manger 100 burgers de DOUGGY."],
    ["fondue1", "Ça fond dans la bouche", "Manger 1 fromage à raclette."],
    ["fondue10", "Raclette Party", "Manger 10 fromages à raclette."],
    ["fondue100", "La meule humaine", "Manger 100 fromages à raclette."],
    ["eat1", "Première victime", "Dévorer son premier gourmand."],
    ["eat10", "Prédateur", "Dévorer 10 gourmands."],
    ["eat100", "Espèce invasive", "Dévorer 100 gourmands."],
    ["eat1000", "Extinction de masse", "Dévorer 1 000 gourmands."],
    ["weight500", "Poids lourd", "Dévorer un gourmand d’au moins 500 kg.", !0],
    [
      "weight1000",
      "Poids très lourd",
      "Dévorer un gourmand d’au moins 1 000 kg.",
      !0,
    ],
    [
      "weight2000",
      "Poids super lourd",
      "Dévorer un gourmand d’au moins 2 000 kg.",
      !0,
    ],
    [
      "tray",
      "J’me goure de plateau",
      "Se faire dévorer dès le premier tour.",
      !0,
    ],
    [
      "chain",
      "La chaîne alimentaire",
      "Dévorer un gourmand qui en a dévoré un autre pendant le même tour.",
      !0,
    ],
    ["salad20", "Cinq fruits et légumes", "Manger 20 salades au total."],
    [
      "summer",
      "Summer Body",
      "Manger un burger et une salade pendant le même tour.",
      !0,
    ],
    ["salad5", "Régime forcé", "Manger 5 salades en un tour."],
    ["eat3", "Sans mâcher", "Dévorer 3 gourmands en un tour."],
    [
      "propulsion2",
      "J’avais tout prévu",
      "Dévorer 2 gourmands au cours d’une même propulsion.",
    ],
    [
      "early",
      "J’avais trop la dalle",
      "Dévorer un gourmand dès le premier tour.",
    ],
    [
      "small",
      "Fuite digestive",
      "Survivre à un tour en étant le plus petit gourmand encore présent.",
    ],
    [
      "last",
      "Le dernier repas",
      "Dévorer le dernier gourmand adverse et remporter la partie.",
    ],
    [
      "friendship",
      "Une table pour deux",
      "Partager le buffet de l’amitié.",
      !0,
    ],
  ].map(([e, g, o, u = !1], E) => ({
    id: e,
    name: g,
    condition: o,
    secret: u,
    art: E,
  })),
  MI = ["burgers", "salads", "douggy", "fondue", "eaten"];
function UI(e, g, o, u, E) {
  if (E.chef) return [];
  if (SECRET_MODES.has(E.mode)) return secretTrophyEvent(e, g, o, u, E);
  const A = E.stats.people[0],
    n = e.trophyTotals,
    i = {};
  o?.id === 0 &&
    (g === "food" &&
      (u.type === "burger" && (n.burgers++, u.size === "chef" && n.douggy++),
      u.type === "salad" && n.salads++),
    g === "fondue" && n.fondue++,
    g === "eat" && n.eaten++);
  const I = g === "end" && ["win", "truce"].includes(E.outcome);
  (I &&
    e.modeWins[
      E.mode === "usa"
        ? "usa"
        : E.mode === "somalia"
          ? "somalia"
          : E.count > 8
            ? "gros"
            : "classic"
    ]++,
    (i["somalia-win"] = e.modeWins.somalia > 0),
    (i["classic-win"] = e.modeWins.classic > 0),
    (i["us-win"] = e.modeWins.usa > 0),
    (i["all-modes"] = ["classic", "gros", "usa"].every(
      (mode) => e.modeWins[mode] > 0,
    )),
    (i.wins50 = e.wins >= 50));
  for (const Q of [10, 7, 5]) i["express" + Q] = I && E.round <= Q;
  for (const Q of [1, 10, 100, 1e3])
    ((i["burger" + Q] = n.burgers >= Q), (i["eat" + Q] = n.eaten >= Q));
  for (const Q of [1, 10, 100])
    ((i["douggy" + Q] = n.douggy >= Q), (i["fondue" + Q] = n.fondue >= Q));
  for (const Q of [3, 5, 7]) i["turn" + Q] = A.maxBurgers >= Q;
  for (const Q of [500, 1e3, 2e3]) i["weight" + Q] = A.heaviestVictim >= Q;
  Object.assign(i, {
    tray: A.firstTurnDeath,
    chain: A.chains > 0,
    salad20: n.salads >= 20,
    summer: A.summer,
    salad5: A.maxSalads >= 5,
    eat3: A.maxEaten >= 3,
    propulsion2: A.maxPropulsion >= 2,
    early: A.firstTurnKills > 0,
    small: A.smallestSurvivals > 0,
    last: I && A.lastMeal,
    friendship: g === "end" && E.outcome === "truce",
  });
  const C = [];
  for (const Q of GA)
    Q.id !== "somalia-win" &&
      i[Q.id] &&
      !e.trophies[Q.id] &&
      ((e.trophies[Q.id] = Date.now()), C.push(Q.id));
  return C;
}
const Oe = "bouffe-profile-v1";
function Te() {
  return {
    trophies: {},
    shadow: secretProfile(),
    trophyTotals: Object.fromEntries(MI.map((e) => [e, 0])),
    modeWins: { classic: 0, gros: 0, usa: 0, somalia: 0 },
    points: 0,
    earned: 0,
    wins: 0,
    owned: ["plain", "none"],
    equipped: { hat: "none", outfit: "plain" },
  };
}
function Xe(e) {
  try {
    const g = JSON.parse(e),
      o = Te();
    if (!g || typeof g != "object") return o;
    for (const u of ["points", "earned", "wins"])
      o[u] = Number.isSafeInteger(g[u]) && g[u] >= 0 ? g[u] : 0;
    for (const u of GA)
      Number.isSafeInteger(g.trophies?.[u.id]) &&
        g.trophies[u.id] > 0 &&
        (o.trophies[u.id] = g.trophies[u.id]);
    for (const u of MI)
      Number.isSafeInteger(g.trophyTotals?.[u]) &&
        g.trophyTotals[u] >= 0 &&
        (o.trophyTotals[u] = g.trophyTotals[u]);
    for (const u of ["classic", "gros", "usa", "somalia"])
      Number.isSafeInteger(g.modeWins?.[u]) &&
        g.modeWins[u] >= 0 &&
        (o.modeWins[u] = g.modeWins[u]);
    if (o.trophies["classic-win"])
      o.modeWins.classic = Math.max(1, o.modeWins.classic);
    if (o.trophies["us-win"]) o.modeWins.usa = Math.max(1, o.modeWins.usa);
    if (o.modeWins.usa > 0 || o.trophies["all-modes"]) {
      o.modeWins.classic = Math.max(1, o.modeWins.classic);
      o.modeWins.gros = Math.max(1, o.modeWins.gros);
    }
    o.shadow = secretProfile(g.shadow);
    o.shadow.wins.somalia = Math.max(o.shadow.wins.somalia, o.modeWins.somalia);
    if (o.trophies["somalia-win"]) {
      o.shadow.legacy.somaliaWin = o.trophies["somalia-win"];
      delete o.trophies["somalia-win"];
    }
    if (
      o.shadow.wins.somalia >= 10 &&
      !o.shadow.trophies["shadow-somalia-wins10"]
    )
      o.shadow.trophies["shadow-somalia-wins10"] = Date.now();
    o.owned = [
      ...new Set([
        ...o.owned,
        ...(Array.isArray(g.owned) ? g.owned : []).filter((u) =>
          KA.some((E) => E.id === u),
        ),
      ]),
    ];
    for (const u of ["hat", "outfit"])
      o.owned.includes(g.equipped?.[u]) &&
        KA.some((E) => E.id === g.equipped[u] && E.slot === u) &&
        (o.equipped[u] = g.equipped[u]);
    return o;
  } catch {
    return Te();
  }
}
function LI(e, g) {
  const o = KA.find((u) => u.id === g);
  if (!o) return !1;
  if (!e.owned.includes(g)) {
    if (e.points < o.price) return !1;
    ((e.points -= o.price), e.owned.push(g));
  }
  return ((e.equipped[o.slot] = g), !0);
}
function je(e, g, o = "classic") {
  return e === "food"
    ? g?.type === "salad"
      ? 0
      : g?.size === "chef"
        ? 12
        : g?.size === "xl"
          ? 4
          : 2
    : e === "eat"
      ? 20
      : e === "fondue"
        ? 15
        : e === "win"
          ? o === "somalia"
            ? 250
            : o === "gros"
              ? 150
              : 100
          : e === "truce"
            ? o === "somalia"
              ? 200
              : o === "gros"
                ? 120
                : 80
            : 0;
}
function wI(e, g) {
  !Number.isSafeInteger(g) || g < 0 || ((e.points += g), (e.earned += g));
}
const KI = "./assets/wearables.webp",
  Pe = "./assets/burger-menu.webp",
  NI = "./assets/hats.webp",
  WI = "./assets/outfits.webp",
  lA = new Image();
lA.src = NI;
const ee = new Image();
ee.src = WI;
const OI = {
    chef: [0, 0],
    cap: [1, 0],
    crown: [2, 0],
    pirate: [3, 0],
    burger: [0, 1],
    halo: [1, 1],
    tender: [2, 1],
    beanie: [3, 1],
    cook: [0, 2],
    diag: [1, 2],
    tux: [2, 2],
    cosmic: [3, 2],
    candy: [0, 3],
    sport: [1, 3],
    plain: [2, 3],
  },
  DA = new Image();
DA.src = zI;
const He = {
    chef: [10, 166, 431, 500],
    cap: [417, 146, 755, 500],
    crown: [757, 168, 1132, 501],
    pirate: [1117, 239, 1535, 506],
    burger: [12, 574, 402, 874],
    halo: [407, 610, 766, 866],
    tender: [768, 595, 1137, 866],
    beanie: [1139, 566, 1515, 877],
  },
  qe = new Map(),
  Ve = new Map(),
  $e = {
    chef: [10, 43, 307, 317],
    cap: [349, 10, 586, 318],
    crown: [625, 87, 941, 320],
    pirate: [937, 120, 1252, 308],
    burger: [5, 368, 314, 608],
    halo: [319, 404, 617, 560],
    tender: [609, 393, 951, 572],
    beanie: [954, 349, 1246, 601],
    cook: [4, 650, 313, 900],
    diag: [312, 652, 625, 897],
    tux: [620, 648, 945, 899],
    cosmic: [941, 640, 1249, 900],
    candy: [5, 929, 313, 1200],
    sport: [308, 929, 629, 1200],
    plain: [625, 937, 943, 1198],
  };
function Ie(e, g, o, u, E, A) {
  const extra = drawExtraCosmetic(e, g, o, u, E, A);
  if (extra !== null) return extra;
  if (He[g] && g !== "halo") {
    if (!DA.complete || !DA.naturalWidth) return !1;
    let C = qe.get(g);
    return (
      C || ((C = Be(DA, He[g])), qe.set(g, C)),
      e.drawImage(C, o, u, E, A),
      !0
    );
  }
  const n = OI[g];
  if (!n || !lA.complete || !lA.naturalWidth) return !1;
  const i = lA.naturalWidth / 4,
    I = lA.naturalHeight / 4;
  if ($e[g]) {
    const C = lA.naturalWidth / 1254,
      Q = $e[g].map((k) => Math.round(k * C));
    let B = Ve.get(g);
    (B || ((B = Be(lA, Q)), Ve.set(g, B)),
      e.drawImage(
        B,
        o + ((Q[0] - n[0] * i) / i) * E,
        u + ((Q[1] - n[1] * I) / I) * A,
        (B.width / i) * E,
        (B.height / I) * A,
      ));
  } else e.drawImage(lA, n[0] * i, n[1] * I, i, I, o, u, E, A);
  return !0;
}
function TI(e, g) {
  const o = () => {
    const u = e.getContext("2d");
    if ((u.clearRect(0, 0, e.width, e.height), g === "none")) {
      ((u.fillStyle = "#b9ac8d"),
        u.beginPath(),
        u.ellipse(70, 56, 26, 30, 0, 0, 7),
        u.fill(),
        (u.fillStyle = "#edd0a9"),
        u.beginPath(),
        u.ellipse(70, 60, 24, 26, 0, 0, 7),
        u.fill());
      return;
    }
    Ie(u, g, 9, 0, 122, 122);
  };
  const extra = extraCosmeticImage(g);
  if (extra && !extra.complete)
    extra.addEventListener("load", o, { once: true });
  (o(),
    lA.complete || lA.addEventListener("load", o, { once: !0 }),
    DA.complete || DA.addEventListener("load", o, { once: !0 }));
}
function Se(e, g, o = 0, u = { hat: "none", outfit: "plain" }) {
  const { x: E, y: A } = g.body.position,
    n = g.body.circleRadius,
    i = g.skin || "#efc5a0",
    I = Ze(g.mass ?? 60);
  (e.save(), e.translate(E, A));
  const C =
    1 +
    Math.sin(o * 0.012 + (g.networkSeat ?? g.id)) *
      Math.min(0.035, (g.body.speed || 0) * 0.006) +
    (g.pop || 0) * 0.05;
  e.scale(n * C, n / C);
  const Q = (r, d, M, S, v) => {
    ((e.fillStyle = v),
      e.beginPath(),
      e.ellipse(r, d, M, S, 0, 0, Math.PI * 2),
      e.fill());
  };
  (Q(0.03, 0.85, 1.08, 0.27, "#172b3035"),
    g.id === 0 &&
      ((e.strokeStyle = g.human ? "#a6e4ff" : "#f0b75c"),
      (e.lineWidth = (g.human ? 2.8 : 2) / n),
      e.beginPath(),
      e.arc(0, 0, 1 + 5 / n, 0, 7),
      e.stroke()),
    Q(
      -0.37 - I.fullness * 0.07 + I.lean * 0.17,
      0.83,
      0.25 - 0.11 * I.lean,
      0.23,
      "#303c3e",
    ),
    Q(
      0.37 + I.fullness * 0.07 - I.lean * 0.17,
      0.83,
      0.25 - 0.11 * I.lean,
      0.23,
      "#303c3e",
    ),
    Q(-I.bodyWidth * 0.91, 0.22, 0.17 - 0.06 * I.lean, 0.27, i),
    Q(I.bodyWidth * 0.91, 0.22, 0.17 - 0.06 * I.lean, 0.27, i));
  const B =
      (g.id === 0 || g.cosmetics
        ? KA.find((r) => r.id === u.outfit)?.color
        : null) ||
      g.color ||
      "#eda052",
    k =
      "#" +
      B.slice(1)
        .match(/../g)
        .map((r) =>
          Math.round(parseInt(r, 16) * 0.72)
            .toString(16)
            .padStart(2, "0"),
        )
        .join(""),
    t = e.createRadialGradient(-0.3, -0.1, 0, 0, 0.2, 1);
  (t.addColorStop(0, B),
    t.addColorStop(1, k),
    g.id !== 0 &&
      !g.cosmetics &&
      u.outfit === "plain" &&
      Q(0, 0.2, I.bodyWidth, I.bodyHeight, t));
  const a = xI(1, g.mass ?? 60);
  ((g.id === 0 || g.cosmetics || u.outfit !== "plain") &&
    Ie(e, u.outfit, a.x, a.y, a.w, a.h),
    e.save(),
    e.translate(0, I.headY),
    e.scale(I.headScale, I.headScale));
  const s = dI(u.hat);
  (s && !s.front && Ie(e, u.hat, s.x, s.y, s.w, s.h),
    Q(0, -0.39, 0.52, 0.51, "#724831"),
    Q(0, -0.38, 0.49, 0.49, i),
    Q(-0.42, -0.37, 0.13, 0.17, i),
    Q(0.42, -0.37, 0.13, 0.17, i),
    (s && u.hat !== "halo") ||
      ((e.fillStyle = "#6b4632"),
      e.beginPath(),
      e.ellipse(0, -0.67, 0.48, 0.24, 0, Math.PI, Math.PI * 2),
      e.fill()),
    s?.front && Ie(e, u.hat, s.x, s.y, s.w, s.h),
    Q(-0.17, -0.43, 0.055, 0.068, "#2c3028"),
    Q(0.17, -0.43, 0.055, 0.068, "#2c3028"),
    Q(0, -0.27, 0.12, 0.09, g.skin ? "#9a694b" : "#dca27b"),
    (e.strokeStyle = g.skin ? "#36251e" : "#804e3a"),
    (e.lineWidth = Math.max(1 / n, 0.04)),
    e.beginPath(),
    e.arc(0, -0.24, 0.16, 0.1, Math.PI - 0.1),
    e.stroke(),
    e.restore(),
    e.restore());
}
const jA = new Image();
jA.src = KI;
function de(e, g, o, u, E, A) {
  if (!jA.complete || !jA.naturalWidth) return;
  const n = jA.naturalWidth / 4;
  e.drawImage(jA, (g % 4) * n, Math.floor(g / 4) * n, n, n, o, u, E, A);
}
const lI = new Image();
lI.src = bI;
const te = new Image();
te.src = DI;
const XI = "./assets/map-art.webp",
  ie = new Image();
ie.src = XI;
let vA = null,
  TA = null;
function jI(e, g, o, u) {
  if (!(!g.complete || !g.naturalWidth || !ie.complete || !ie.naturalWidth)) {
    if (
      (TA ||
        (TA = [
          [0, 0, 768, 528],
          [790, 0, 1536, 512],
          [42, 544, 738, 1009],
          [780, 520, 1536, 1017],
        ].map((E) => Be(ie, E))),
      !vA || vA.width !== o || vA.height !== u)
    ) {
      ((vA = document.createElement("canvas")),
        (vA.width = o),
        (vA.height = u));
      const E = vA.getContext("2d"),
        A = E.createPattern(g, "repeat");
      (A.setTransform(new DOMMatrix().scale(0.32)),
        (E.fillStyle = A),
        E.fillRect(0, 0, o, u));
      const n = (C) => {
          const Q = Math.sin(C * 127.1 + 19.31) * 43758.5453;
          return Q - Math.floor(Q);
        },
        i = (C, Q, B, k, t) => {
          ((E.fillStyle = t),
            E.beginPath(),
            E.ellipse(C, Q, B, k, 0, 0, 7),
            E.fill());
        };
      E.drawImage(TA[3], o * 0.84 - 160, u * 0.2 - 110, 320, 220);
      for (let C = 0; C < 1450; C++) {
        const Q = n(C * 2 + 1) * o,
          B = n(C * 2 + 2) * u;
        Math.hypot((Q - o * 0.84) / 170, (B - u * 0.2) / 125) < 1 ||
          ((E.strokeStyle = C % 3 ? "#947239aa" : "#f4d77fbb"),
          (E.lineWidth = 0.9),
          E.beginPath(),
          E.moveTo(Q - 3, B + 3),
          E.quadraticCurveTo(Q - 4, B - 2, Q - 6, B - 4),
          E.moveTo(Q, B + 3),
          E.quadraticCurveTo(Q - 1, B - 3, Q + 1, B - 7),
          E.moveTo(Q + 1, B + 3),
          E.lineTo(Q + 5, B - 2),
          E.stroke(),
          C % 7 === 0 &&
            (i(Q + 9, B + 3, 3, 1.8, "#795b3c55"),
            i(Q + 8, B + 1, 2.8, 1.6, "#d0b481")));
      }
      for (let C = 0; C < 15; C++) {
        const Q = n(C + 410) * o,
          B = n(C + 510) * u,
          k = 32 + (C % 4) * 9;
        E.drawImage(TA[2], Q - k / 2, B - k * 0.34, k, k * 0.67);
      }
      const I = [
        [0.04, 0.08],
        [0.21, 0.04],
        [0.45, 0.05],
        [0.69, 0.04],
        [0.95, 0.08],
        [0.04, 0.3],
        [0.96, 0.43],
        [0.05, 0.62],
        [0.94, 0.7],
        [0.03, 0.91],
        [0.24, 0.96],
        [0.5, 0.94],
        [0.72, 0.96],
        [0.94, 0.93],
        [0.27, 0.34],
        [0.65, 0.62],
        [0.36, 0.73],
      ];
      for (const [C, [Q, B]] of I.entries()) {
        const k = 90 + (C % 4) * 20;
        E.drawImage(TA[C % 2], Q * o - k / 2, B * u - k * 0.35, k, k * 0.7);
      }
    }
    e.drawImage(vA, 0, 0);
  }
}
const iA = (e, g, o, u, E, A) => {
  ((e.fillStyle = A), e.fillRect(g, o, u, E));
};
function HI(e, g, o, u) {
  if (!o.experimental) return;
  const { w: E, h: A, mapId: n } = g;
  if ((e.save(), n === "savanna" && jI(e, lI, E, A), n === "volcan")) {
    te.complete && te.naturalWidth && e.drawImage(te, 0, 0, E, A);
    const I = Math.min(E, A) * 0.9;
    ee.complete &&
      ee.naturalWidth &&
      e.drawImage(ee, E / 2 - I / 2, A / 2 - I * 0.46, I, I);
    const C = g.eruption;
    if (
      (C?.state === "warning" &&
        ((e.strokeStyle = "#ffe491"),
        (e.lineWidth = 3),
        e.setLineDash([9, 7]),
        e.beginPath(),
        e.arc(E / 2, A / 2, Math.min(E, A) * 0.13, 0, Math.PI * 2),
        e.stroke(),
        e.setLineDash([])),
      C?.state === "active" && C.elapsed < 1300)
    ) {
      const B = C.elapsed / 1300;
      for (const [k, t] of C.targets.entries()) {
        const a = Math.min(1, B * 1.8 + k * 0.025),
          s = E / 2 + (t.x - E / 2) * a,
          r = A / 2 + (t.y - A / 2) * a - Math.sin(a * Math.PI) * 80;
        ((e.fillStyle = "#ffdc76"),
          (e.strokeStyle = "#bb812a"),
          (e.lineWidth = 2),
          e.beginPath(),
          e.ellipse(s, r, 8, 11, B * 5 + k, 0, Math.PI * 2),
          e.fill(),
          e.stroke());
      }
    }
    const Q = Ee("volcan", E, A);
    for (let B = 0; B < 3; B++)
      if (!g.zones.some((k) => k.flow && k.arm === B)) {
        const k = Q.filter((t) => t.arm === B);
        (e.beginPath(),
          k.forEach((t, a) => (a ? e.lineTo(t.x, t.y) : e.moveTo(t.x, t.y))),
          (e.lineWidth = k[0].r * 1.6),
          (e.lineCap = "round"),
          (e.strokeStyle = "#71624bcc"),
          e.stroke(),
          (e.lineCap = "butt"));
      }
  }
  if (["market", "nightmarket"].includes(n)) {
    for (let I = 30; I < A; I += 80)
      (iA(e, 12, I, 40, 25, "#718770"), iA(e, E - 52, I, 40, 25, "#bb9962"));
    ((e.fillStyle = "#51684f"),
      (e.font = "bold 22px sans-serif"),
      (e.textAlign = "center"),
      e.fillText(
        "CAISSES  ←                         FRUITS & LÉGUMES →",
        E / 2,
        35,
      ));
  }
  if (n === "cold") {
    ((e.strokeStyle = "#eefaff88"), (e.lineWidth = 2));
    for (let I = 0; I < E; I += 90)
      (e.beginPath(), e.moveTo(I, 0), e.lineTo(I + 65, A), e.stroke());
    e.font = "32px sans-serif";
    for (let I = 50; I < E; I += 190) e.fillText("❄", I, 55);
  }
  if (n === "space" || n === "crepe") {
    for (let I = 0; I < 110; I++) {
      const C = (I * 173.17) % E,
        Q = (I * 97.29) % A;
      iA(e, C, Q, I % 4 ? 2 : 4, I % 4 ? 2 : 4, "#e8e7ff99");
    }
    ((e.fillStyle = "#7f91b44d"),
      e.beginPath(),
      e.arc(E * 0.8, A * 0.2, 60, 0, 7),
      e.fill(),
      (e.strokeStyle = "#a5aad8"),
      e.beginPath(),
      e.ellipse(E * 0.8, A * 0.2, 85, 20, -0.4, 0, 7),
      e.stroke());
  }
  if (
    (n === "gym" &&
      ((e.strokeStyle = "#f8ebc4aa"),
      (e.lineWidth = 3),
      e.strokeRect(35, 35, E - 70, A - 70),
      e.beginPath(),
      e.moveTo(E / 2, 35),
      e.lineTo(E / 2, A - 35),
      e.stroke(),
      e.beginPath(),
      e.arc(E / 2, A / 2, 75, 0, 7),
      e.stroke()),
    ["pirate", "train", "sushi"].includes(n))
  )
    for (let I = 0; I < A; I += 24) {
      iA(e, 0, I, E, 2, "#69482b44");
      for (let C = (I % 48) * 5; C < E; C += 140)
        iA(e, C, I, 2, 24, "#69482b44");
    }
  if (
    (n === "pirate" &&
      ((e.font = "45px sans-serif"),
      e.fillText("⚓", 25, 70),
      e.fillText("☠", E - 75, A - 20)),
    n === "train")
  )
    for (let I = 40; I < E; I += 120)
      (iA(e, I, 8, 75, 30, "#567e92"), iA(e, I, A - 38, 75, 30, "#567e92"));
  if (
    (n === "cinema" &&
      (iA(e, E * 0.15, 8, E * 0.7, 24, "#eee7d0"),
      (e.fillStyle = "#f2d88b"),
      (e.font = "bold 17px sans-serif"),
      (e.textAlign = "center"),
      e.fillText("LE DERNIER REPAS • SÉANCE EN COURS", E / 2, 55),
      (e.font = "38px sans-serif"),
      e.fillText("🍿", E / 2, A - 20)),
    n === "candy")
  )
    for (let I = 25; I < E; I += 110)
      ((e.fillStyle = "#fff0da88"),
        e.beginPath(),
        e.arc(I, 35, 18, 0, 7),
        e.fill(),
        (e.strokeStyle = "#cf7191"),
        (e.lineWidth = 5),
        e.beginPath(),
        e.arc(I, 35, 11, 0, Math.PI * 1.7),
        e.stroke());
  if (n === "beach") {
    (iA(e, 0, A - 26, E, 26, "#6daab2"), (e.font = "36px sans-serif"));
    for (let I = 40; I < E; I += 210) e.fillText("☂", I, 60);
  }
  if (n === "picnic" || n === "garden") {
    for (let I = 0; I < 120; I++) {
      const C = (I * 83.7) % E,
        Q = (I * 57.1) % A;
      iA(e, C, Q, 2, 7, n === "garden" ? "#48683b" : "#55754a");
    }
    if (n === "garden") {
      ((e.strokeStyle = "#5a453666"), (e.lineWidth = 4));
      for (let I = 50; I < A; I += 75)
        (e.beginPath(), e.moveTo(0, I), e.lineTo(E, I), e.stroke());
    }
  }
  if (
    (n === "palace" &&
      ((e.strokeStyle = "#ad8b47"),
      (e.lineWidth = 5),
      e.strokeRect(25, 25, E - 50, A - 50),
      (e.font = "50px sans-serif"),
      (e.textAlign = "center"),
      e.fillText("♛", E / 2, 70),
      (e.fillStyle = "#b0484140"),
      e.fillRect(E * 0.4, 80, E * 0.2, A - 160)),
    n === "underwater")
  ) {
    e.strokeStyle = "#abd4cf33";
    for (let I = 0; I < 30; I++)
      (e.beginPath(),
        e.arc(
          (I * 137) % E,
          (I * 81 - u * 0.015 + A * 100) % A,
          4 + (I % 5),
          0,
          7,
        ),
        e.stroke());
    ((e.font = "30px sans-serif"), e.fillText("🪸", 30, A - 15));
  }
  if (n === "wok") {
    ((e.strokeStyle = "#d5c6a133"), (e.lineWidth = 3));
    for (let I = 70; I < Math.min(E, A) / 2; I += 45)
      (e.beginPath(),
        e.ellipse(E / 2, A / 2, I * 1.4, I * 0.9, 0, 0, 7),
        e.stroke());
  }
  if (n === "rooftop") {
    for (let I = 0; I < E; I += 80) iA(e, I, A - 20, 60, 20, "#607079");
    ((e.font = "bold 17px sans-serif"),
      (e.fillStyle = "#3d5654"),
      e.fillText(`VENT ${g.round % 2 ? "→ EST" : "← OUEST"}`, 30, 35));
  }
  (n === "haunted" &&
    ((e.font = "36px sans-serif"),
    e.fillText("👻", 30, 60),
    e.fillText("🕯", E - 65, A - 20)),
    n === "fair" &&
      ((e.font = "40px sans-serif"), e.fillText("🎪", E / 2 - 20, 60)),
    n === "mirror" &&
      ((e.strokeStyle = "#ffffffaa"),
      e.setLineDash([12, 12]),
      e.beginPath(),
      e.moveTo(E / 2, 10),
      e.lineTo(E / 2, A - 10),
      e.stroke(),
      e.setLineDash([])));
  const i = {
    space: 4,
    sushi: 5,
    candy: 6,
    train: 7,
    pirate: 8,
    beach: 9,
    underwater: 10,
    picnic: 11,
    garden: 12,
    palace: 13,
    works: 14,
    fair: 15,
    gym: 15,
    market: 0,
    nightmarket: 0,
    cold: 1,
    cinema: 3,
    parking: 2,
    station: 2,
    rooftop: 13,
    haunted: 8,
    crepe: 5,
    mirror: 13,
    cuisine: 1,
    foodcourt: 5,
  }[n];
  if (i !== void 0 && g.obstacles.length === 0) {
    const I = Math.min(E, A) * 0.14;
    for (const C of [I * 0.6, E - I * 0.6])
      de(e, i, C - I / 2, A * 0.1 - I / 2, I, I);
  }
  for (const I of g.obstacles) {
    if (n === "volcan" || I.boundary) continue;
    if (
      (e.save(),
      e.translate(I.x, I.y),
      e.rotate(I.angle),
      iA(e, -I.w / 2 + 4, -I.h / 2 + 6, I.w, I.h, "#152b3044"),
      iA(
        e,
        -I.w / 2,
        -I.h / 2,
        I.w,
        I.h,
        I.shelf
          ? "#667659"
          : I.truck
            ? "#b8624e"
            : I.vending
              ? "#ad4346"
              : n === "cinema"
                ? "#9d5862"
                : n === "volcan"
                  ? "#4c392f"
                  : "#6b7780",
      ),
      I.bumper &&
        ((e.fillStyle = "#f1cd6b"),
        e.beginPath(),
        e.arc(0, 0, Math.min(I.w, I.h) * 0.4, 0, 7),
        e.fill(),
        (e.strokeStyle = "#ed785c"),
        (e.lineWidth = 4),
        e.stroke()),
      I.shelf)
    )
      for (let Q = -I.w / 2 + 3; Q < I.w / 2 - 3; Q += 8)
        for (let B = -I.h / 2 + 4; B < I.h / 2 - 3; B += 16)
          iA(
            e,
            Q,
            B,
            5,
            10,
            ["#e9bd69", "#b7cb7d", "#dc8e6d"][
              Math.floor((B + I.h / 2) / 16) % 3
            ],
          );
    if (
      (I.truck &&
        (iA(e, -I.w * 0.35, -I.h * 0.4, I.w * 0.45, I.h * 0.45, "#e7dbb0"),
        iA(e, I.w * 0.2, -I.h * 0.4, I.w * 0.2, I.h * 0.8, "#96bdc0")),
      I.vending &&
        (iA(e, -I.w * 0.3, -I.h * 0.35, I.w * 0.6, I.h * 0.45, "#abc5ba"),
        (e.fillStyle = "#fff0d4"),
        (e.font = "12px sans-serif"),
        (e.textAlign = "center"),
        e.fillText("BURGER", 0, I.h * 0.35)),
      ["works", "candy", "fair"].includes(n))
    )
      for (let Q = -I.w / 2; Q < I.w / 2; Q += 22)
        iA(e, Q, -I.h / 2, 10, I.h, "#efc563");
    const C = I.shelf
      ? 0
      : I.truck
        ? 2
        : n === "cold"
          ? 1
          : n === "cinema"
            ? 3
            : I.bumper
              ? 15
              : n === "candy"
                ? 6
                : n === "train"
                  ? 7
                  : n === "works"
                    ? 14
                    : n === "haunted"
                      ? 8
                      : null;
    (C !== null &&
      (I.truck
        ? (e.rotate(Math.PI / 2),
          de(e, C, -I.h * 0.65, -I.w * 0.65, I.h * 1.3, I.w * 1.3))
        : de(e, C, -I.w * 0.61, -I.h * 0.61, I.w * 1.22, I.h * 1.22)),
      e.restore());
  }
  e.restore();
}
function qI(e, g) {
  if (!["ice", "sand", "wok", "sushi", "portal"].includes(g.kind)) return !1;
  if (g.kind === "portal")
    return (
      (e.strokeStyle = "#b5a0ff"),
      (e.lineWidth = 8),
      e.beginPath(),
      e.arc(0, 0, g.r, 0, 7),
      e.stroke(),
      (e.strokeStyle = "#f0d0ff"),
      (e.lineWidth = 2),
      e.stroke(),
      (e.fillStyle = "#654da677"),
      e.fill(),
      (e.fillStyle = "#f3e5ff"),
      (e.font = "bold 16px sans-serif"),
      (e.textAlign = "center"),
      e.fillText("↔", 0, 6),
      !0
    );
  if (g.kind === "wok") return !0;
  if (g.kind === "sushi") {
    (iA(e, -g.w / 2, -g.h / 2, g.w, g.h, "#4c665d"),
      (e.strokeStyle = "#c8cfad"),
      (e.lineWidth = 2));
    for (let o = -g.w / 2; o < g.w / 2; o += 25)
      (e.beginPath(), e.moveTo(o, -g.h / 2), e.lineTo(o, g.h / 2), e.stroke());
    return (
      (e.fillStyle = "#fff2cd"),
      (e.font = "bold 15px sans-serif"),
      (e.textAlign = "center"),
      e.fillText(g.ax > 0 ? "→ FIN DE MANCHE →" : "← FIN DE MANCHE ←", 0, 5),
      !0
    );
  }
  return (
    g.w &&
      g.w < 2e3 &&
      g.h < 180 &&
      iA(
        e,
        -g.w / 2,
        -g.h / 2,
        g.w,
        g.h,
        g.kind === "ice" ? "#dcc6a67a" : "#c6a35d55",
      ),
    !0
  );
}
function VI(e, g, o, u, E, A) {
  const n = g.meal === "mosquito" ? 0.55 : 1;
  ((e.fillStyle = "#26352f"),
    e.fillRect(0, 0, o + E * 2, u + A + 36),
    (e.fillStyle = g.floor),
    (e.globalAlpha = 0.18),
    e.fillRect(8, 8, o + E * 2 - 16, u + A + 20),
    (e.globalAlpha = 1),
    (e.textAlign = "center"),
    (e.fillStyle = "#f1e9cf"),
    (e.font = `800 ${23 * n}px sans-serif`),
    e.fillText(`${g.icon}  ${g.name.toUpperCase()}`, E + o / 2, 42 * n),
    (e.fillStyle = "#bdc8ae"),
    (e.font = `${11 * n}px sans-serif`),
    e.fillText("UNE NOUVELLE FAÇON DE SE REMPLIR LE VENTRE", E + o / 2, 66 * n),
    (e.strokeStyle = "#a7aa86"),
    (e.lineWidth = 3),
    e.strokeRect(E - 4, A - 4, o + 8, u + 8));
}
const _I = "./assets/trophies.webp",
  eI = new Map(),
  FA = new Image(),
  SHADOW_TROPHY_IMAGE = new Image();
setupSecretTrophyLab(xe);
FA.src = _I;
SHADOW_TROPHY_IMAGE.src = "./assets/secrets/trophies.webp";
const trophyById = (id) => [...GA, ...SECRET_TROPHIES].find((t) => t.id === id);
function xe(e, g = !1, o = !1) {
  const source = e.shadow ? SHADOW_TROPHY_IMAGE : FA;
  const u = document.createElement("canvas");
  ((u.width = u.height = 180),
    (u.className = "trophy-medal"),
    u.setAttribute("aria-label", o ? "Trophée secret" : e.name));
  const E = () => {
    const A = u.getContext("2d");
    A.clearRect(0, 0, 180, 180);
    const n = source.naturalWidth / 7,
      i = source.naturalHeight / 6;
    const cacheKey = `${e.shadow ? "shadow" : "normal"}-${e.art}`;
    let I = eI.get(cacheKey);
    (I ||
      ((I = Be(source, [
        Math.round((e.art % 7) * n),
        Math.round(Math.floor(e.art / 7) * i),
        Math.round(((e.art % 7) + 1) * n),
        Math.round((Math.floor(e.art / 7) + 1) * i),
      ])),
      eI.set(cacheKey, I)),
      A.drawImage(I, 6, 6, 168, 168),
      o &&
        ((A.globalCompositeOperation = "source-in"),
        (A.fillStyle = "#342c25"),
        A.fillRect(0, 0, 180, 180),
        (A.globalCompositeOperation = "source-over")));
  };
  return (
    source.complete && source.naturalWidth
      ? E()
      : source.addEventListener("load", E, { once: !0 }),
    g && u.classList.add("locked-medal"),
    u
  );
}
function At(e, g) {
  const o = document.createElement("article");
  o.className = "trophy-card" + (g ? " unlocked" : "");
  o.title = e.secret && !g ? e.name : `${e.name} — ${e.condition}`;
  o.dataset.trophy = e.id;
  const u = e.secret && !g;
  o.append(xe(e, !g, u));
  const E = document.createElement("h3");
  E.textContent = e.name;
  const A = document.createElement("p");
  A.textContent = u ? "Condition : ???" : e.condition;
  const n = document.createElement("small");
  return (
    (n.textContent = g ? "DÉBLOQUÉ" : u ? "RECETTE SECRÈTE" : "À DÉBLOQUER"),
    o.append(n, E, A),
    o
  );
}
function et(e) {
  const shadow = document.body.classList.contains("shadow-realm");
  const catalog = shadow
    ? SECRET_TROPHIES
    : GA.filter((t) => t.id !== "somalia-win");
  const unlocked = shadow ? e.shadow.trophies : e.trophies;
  document.querySelector("#trophies-dialog h2").textContent = shadow
    ? "LES TROPHÉES DE LA FACE CACHÉE"
    : "LES TROPHÉES DU GOURMAND";
  document.querySelector("#trophies-dialog .trophy-intro").textContent = shadow
    ? "Quatre modes, une autre faim. Les recettes masquées se révèlent après leur déblocage."
    : "Chaque assiette raconte un exploit. Certaines recettes restent secrètes…";
  document
    .querySelector("#trophy-grid")
    .replaceChildren(...catalog.map((t) => At(t, !!unlocked[t.id])));
  const count = catalog.filter((t) => unlocked[t.id]).length;
  document.querySelector("#trophy-count").textContent =
    `Trophées débloqués : ${count} / ${catalog.length}`;
  const progress = document.querySelector("#trophy-progress");
  progress.max = catalog.length;
  progress.value = count;
  document.querySelector("#trophy-lab-open").hidden = !shadow;
}
function It(e, g) {
  if ((e.replaceChildren(), !g.length)) {
    const o = document.createElement("p");
    ((o.className = "no-trophy"),
      (o.textContent =
        "Pas de nouveau trophée cette fois. La prochaine bouchée sera la bonne."),
      e.append(o));
    return;
  }
  g.forEach((o, u) => {
    const E = trophyById(o),
      A = document.createElement("button");
    ((A.className = "earned-medal"),
      (A.style.animationDelay = `${Math.min(u, 5) * 0.09}s`),
      A.append(xe(E)),
      A.setAttribute("aria-label", `${E.name} : ${E.condition}`));
    const n = document.createElement("span");
    ((n.className = "medal-tooltip"),
      (n.textContent = `${E.name} — ${E.condition}`),
      A.append(n),
      e.append(A));
  });
}
let Ye;
function tt(e) {
  if (!e.length) return;
  const g = trophyById(e[0]),
    o = document.querySelector("#trophy-toast");
  o.replaceChildren(xe(g));
  const u = document.createElement("div"),
    E = document.createElement("small");
  E.textContent =
    e.length > 1 ? `${e.length} TROPHÉES DÉBLOQUÉS` : "TROPHÉE DÉBLOQUÉ";
  const A = document.createElement("strong");
  ((A.textContent = g.name),
    u.append(E, A),
    o.append(u),
    (o.hidden = !1),
    clearTimeout(Ye),
    (Ye = setTimeout(() => (o.hidden = !0), 4500)));
}
function II() {
  (clearTimeout(Ye), (document.querySelector("#trophy-toast").hidden = !0));
}
function Qt({ start: e, appearance: g }) {
  let o, journey;
  function storedProfile(fallback = Te()) {
    let primary, backup;
    try {
      primary = JSON.parse(localStorage.getItem(Oe));
    } catch {}
    try {
      backup = JSON.parse(localStorage.getItem(Oe + "-backup"));
    } catch {}
    const valid = (value) =>
      value && typeof value === "object" && !Array.isArray(value);
    const active = valid(primary) ? primary : valid(backup) ? backup : fallback;
    return Xe(
      JSON.stringify(
        mergeProfileProgress(
          Xe(JSON.stringify(active)),
          null,
          Xe(JSON.stringify(valid(backup) ? backup : active)),
        ),
      ),
    );
  }
  try {
    o = storedProfile();
  } catch {
    o = Xe(null);
  }
  let savedProfile = structuredClone(o);
  let u = "cantine",
    E = "classic",
    A = 0,
    n = !1,
    i = !0,
    I = !1,
    C = null,
    Q = [];
  ((L("#title-screen").style.backgroundImage = `url("${Pe}")`),
    setupBurgerMenu().catch((error) =>
      console.error("Masques du burger indisponibles", error),
    ));
  const B = () => (I ? C : o.equipped);
  function k() {
    const l = L("#avatar-preview"),
      R = l.getContext("2d");
    (R.clearRect(0, 0, 320, 320),
      Se(
        R,
        {
          id: 0,
          mass: (I && Number(L("#chef-weight").value)) || 60,
          color: "#ed9a41",
          pop: 0,
          body: { position: { x: 160, y: 191 }, circleRadius: 65, speed: 0 },
        },
        0,
        B(),
      ));
    const h = L("#growth-preview"),
      c = h.getContext("2d");
    c.clearRect(0, 0, 520, 320);
    for (const [m, Y] of [60, 500, 2e3].entries()) {
      const J = [65, 200, 390][m];
      (Se(
        c,
        {
          id: 0,
          mass: Y,
          color: "#ed9a41",
          pop: 0,
          body: {
            position: { x: J, y: 205 },
            circleRadius: ne(Y) * 0.78,
            speed: 0,
          },
        },
        0,
        B(),
      ),
        (c.fillStyle = "#65573e"),
        (c.font = "bold 15px sans-serif"),
        (c.textAlign = "center"),
        c.fillText(Y.toLocaleString("fr-FR") + " kg", J, 310));
    }
  }
  (lA.addEventListener("load", k), DA.addEventListener("load", k));
  document.addEventListener("extra-cosmetics-loaded", k);
  function t() {
    journey?.refresh();
    (document
      .querySelectorAll("[data-wallet]")
      .forEach((l) => (l.textContent = o.points.toLocaleString("fr-FR"))),
      (L("#run-points").textContent = A),
      g(B()),
      (L("#menu-record").textContent =
        `${o.wins} victoire${o.wins > 1 ? "s" : ""}`),
      k());
  }
  function a() {
    try {
      const merged = Xe(
        JSON.stringify(
          mergeProfileProgress(o, savedProfile, storedProfile(savedProfile)),
        ),
      );
      Object.assign(o, merged);
      const serialized = JSON.stringify(o);
      localStorage.setItem(Oe, serialized);
      savedProfile = structuredClone(o);
      try {
        localStorage.setItem(Oe + "-backup", serialized);
      } catch {}
      L("#save-status").textContent =
        "Progression enregistrée dans ce navigateur.";
    } catch {
      L("#save-status").textContent =
        "Sauvegarde indisponible : progression conservée pendant cette session.";
    }
    t();
  }
  function s(l) {
    if (!I) {
      try {
        Object.assign(
          o,
          Xe(
            JSON.stringify(
              mergeProfileProgress(
                o,
                savedProfile,
                storedProfile(savedProfile),
              ),
            ),
          ),
        );
        savedProfile = structuredClone(o);
      } catch {}
    }
    const R = KA.find((h) => h.id === l);
    R && (I ? ((C[R.slot] = l), t(), r()) : LI(o, l) && (a(), r()));
  }
  let cosmeticFilter = "all";
  document.querySelectorAll("[data-cosmetics-filter]").forEach((button) => {
    button.onclick = () => {
      cosmeticFilter = button.dataset.cosmeticsFilter;
      r();
    };
  });
  function r() {
    L("#shop-context").textContent = I
      ? "Atelier solo : tout essayer librement. Tes achats et ton solde restent inchangés."
      : "Les miniatures et les équipements en jeu utilisent exactement les mêmes images.";
    const l = L("#shop-items");
    document
      .querySelectorAll("[data-cosmetics-filter]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.cosmeticsFilter === cosmeticFilter),
        ),
      );
    l.replaceChildren();
    for (const R of KA) {
      const h = o.owned.includes(R.id),
        c = B()[R.slot] === R.id,
        m = document.createElement("article");
      m.className = "shop-card";
      m.dataset.slot = R.slot;
      m.dataset.cosmetic = R.id;
      m.hidden = cosmeticFilter !== "all" && R.slot !== cosmeticFilter;
      const Y = document.createElement("canvas");
      ((Y.width = 140),
        (Y.height = 126),
        (Y.className = "equipment-thumb"),
        Y.setAttribute("aria-label", R.name),
        TI(Y, R.id),
        m.append(Y));
      const J = document.createElement("div");
      ((J.innerHTML = `<small>${R.slot === "hat" ? "CHAPEAU" : "TENUE"}</small><h3>${R.name}</h3>${R.isNew ? '<small class="new-cosmetic">NOUVEAU</small>' : ""}<p>${I ? "ESSAI LIBRE" : h ? "Dans ton vestiaire" : R.price + " points de graisse"}</p>`),
        m.append(J));
      const Z = document.createElement("button");
      ((Z.textContent = c
        ? "Équipé ✓"
        : I
          ? "Essayer"
          : h
            ? "Équiper"
            : `Acheter · ${R.price}`),
        (Z.disabled = c || (!I && !h && o.points < R.price)),
        (Z.dataset.item = R.id),
        (Z.onclick = () => s(R.id)),
        m.append(Z),
        l.append(m));
    }
    k();
  }
  ((L("#remove-hat").onclick = () => s("none")),
    (L("#remove-outfit").onclick = () => s("plain")));
  const restaurant = createRestaurantMenu(CA, (id) => {
    u = id;
  });
  function M() {
    restaurant.refresh();
  }
  function S(l) {
    if (!modeUnlocked(l, o)) return;
    ((E = l),
      (u =
        me[E].onlyMap ||
        (["savanna", "platform", "cannibal", "icecream", "survival"].includes(u)
          ? "cantine"
          : u)),
      (L("#map-search").value = ""),
      (L("#map-search").disabled = E === "somalia"),
      restaurant.show(E, u),
      (L("#title-screen").hidden = !0),
      (L("#map-screen").hidden = !1),
      (L("#map-mode-title").textContent =
        E === "chef"
          ? "MODE CHEF · ATELIER SOLO"
          : E === "platform"
            ? "FILMOVORE · LA PLATEFORME / HUNGER GAMES"
            : `${me[E].name.toUpperCase()} · ${me[E].count} GOURMANDS`),
      L("#map-screen").scrollIntoView({ block: "start" }));
  }
  (document.querySelectorAll(".ingredient-button").forEach((l) =>
    l.addEventListener("keydown", (R) => {
      (R.key === "Enter" || R.key === " ") &&
        (R.preventDefault(),
        l.dispatchEvent(new MouseEvent("click", { bubbles: !0 })));
    }),
  ),
    document
      .querySelectorAll("[data-menu-mode]")
      .forEach((l) => (l.onclick = () => S(l.dataset.menuMode))),
    (L("#back-title").onclick = () => {
      ((L("#title-screen").hidden = !1), (L("#map-screen").hidden = !0));
    }),
    (L("#trophies-entry").onclick = () => {
      (et(o), L("#trophies-dialog").showModal(), L("#close-trophies").focus());
    }),
    (L("#close-trophies").onclick = () => L("#trophies-dialog").close()),
    (L("#chef-entry").onclick = () => {
      (L("#options-dialog").close(),
        (L("#chef-error").textContent = ""),
        (L("#chef-password").value = ""),
        L("#chef-dialog").showModal(),
        L("#chef-password").focus());
    }),
    (L("#close-chef").onclick = () => L("#chef-dialog").close()),
    (L("#chef-form").onsubmit = (l) => {
      if (
        (l.preventDefault(),
        L("#chef-password").value.trim().toUpperCase() !== "PORC")
      ) {
        L("#chef-error").textContent = "Ce pass ne vient pas du chef.";
        return;
      }
      (L("#chef-dialog").close(), S("chef"));
    }),
    (L("#options-entry").onclick = () => L("#options-dialog").showModal()),
    (L("#close-options").onclick = () => L("#options-dialog").close()),
    (L("#option-sound").onclick = () => L("#sound").click()),
    (L("#option-fullscreen").onclick = async () => {
      (L("#options-entry").focus(),
        await fI(L("#app")),
        (L("#option-fullscreen").textContent =
          document.fullscreenElement ||
          document.body.classList.contains("app-expanded")
            ? "Quitter le plein écran"
            : "Passer en plein écran"));
    }),
    (L("#start-game").onclick = () => {
      if (!modeUnlocked(E, o)) return;
      ((I = E === "chef"),
        (C = { ...o.equipped }),
        (A = 0),
        (n = !1),
        (i = !1),
        (L("#main-menu").hidden = !0),
        (L("#play-area").hidden = !1),
        (L("#chef-shop").hidden = !I),
        document.body.classList.add("playing"),
        e(E === "platform" && u === "survival" ? "survival" : E, u),
        t(),
        L("#play-area").scrollIntoView({ block: "start" }));
    }));
  function v() {
    ((i = !0),
      L("#game-shell").classList.remove("expanded-game"),
      document.dispatchEvent(new Event("fullscreenchange")),
      (I = !1),
      (C = null),
      document.body.classList.remove("playing"),
      document.fullscreenElement?.id === "game-shell" &&
        document.exitFullscreen?.(),
      (L("#main-menu").hidden = !1),
      (L("#title-screen").hidden = !1),
      (L("#map-screen").hidden = !0),
      (L("#play-area").hidden = !0),
      t(),
      scrollTo(0, 0));
  }
  ((L("#back-menu").onclick = v),
    (L("#end-menu").onclick = v),
    document.querySelectorAll("[data-open-shop]").forEach(
      (l) =>
        (l.onclick = () => {
          journey?.secret ||
            (!L("#play-area").hidden && !I) ||
            ((i = !0),
            L("#shop-dialog").showModal(),
            r(),
            L("#close-shop").focus());
        }),
    ));
  journey = setupSecretBurger({ profile: o, choose: S, backToMenu: v });
  const f = () => {
    ((i = L("#play-area").hidden), L("#shop-dialog").close());
  };
  return (
    (L("#close-shop").onclick = f),
    L("#shop-dialog").addEventListener("cancel", () => {
      i = L("#play-area").hidden;
    }),
    L("#shop-dialog").addEventListener("click", (l) => {
      l.target === L("#shop-dialog") && f();
    }),
    a(),
    {
      startOnline() {
        i = false;
        I = false;
        C = null;
        L("#main-menu").hidden = true;
        L("#play-area").hidden = false;
        document.body.classList.add("playing");
      },
      backToMenu: v,
      get paused() {
        return i;
      },
      get equipped() {
        return B();
      },
      get chef() {
        return I;
      },
      newRun() {
        ((A = 0), (n = !1), (Q = []), II(), t());
      },
      event(l, R, h, c) {
        if (c.chef || (l === "end" && n)) return;
        let m = 0;
        (["food", "eat", "fondue"].includes(l) &&
          R?.id === 0 &&
          (m = je(
            l,
            h,
            c.mode === "somalia" ? "somalia" : c.count > 8 ? "gros" : "classic",
          )),
          l === "end" &&
            ((n = !0),
            (m = je(
              c.outcome,
              null,
              c.mode === "somalia"
                ? "somalia"
                : c.count > 8
                  ? "gros"
                  : "classic",
            )),
            ["win", "truce"].includes(c.outcome) &&
              !SECRET_MODES.has(c.mode) &&
              o.wins++),
          m && ((A += m), wI(o, m)));
        const Y = UI(o, l, R, h, c);
        if (
          (Q.push(...Y),
          l === "end" ? II() : tt(Y),
          (m ||
            Y.length ||
            l === "end" ||
            (R?.id === 0 && ["food", "eat", "fondue"].includes(l))) &&
            a(),
          l === "end")
        ) {
          L("#result-reward").textContent =
            `Cette partie : +${A} points de graisse · Solde : ${o.points}`;
          const J = c.stats.people[0],
            Z = [
              [
                "Tours joués",
                c.secretRules?.tournament?.playerTurns || c.round,
              ],
              ["Burgers mangés", J.burgers],
              ["Salades mangées", J.salads],
              ["Gourmands dévorés", J.eaten],
            ];
          (c.mode === "cannibal" &&
            Z.push(["Victimes dévorées", c.secretTrophyRun?.food || 0]),
            c.mode === "icecream" &&
              Z.push(["Enfants capturés", c.secretTrophyRun?.food || 0]),
            c.savanna && Z.push(["Steaks de moustiques", J.mosquito]),
            J.fondue && Z.push(["Raclettes avalées", J.fondue]),
            Z.push(["Poids maximal", Math.round(J.maxMass) + " kg"]),
            L("#run-summary").replaceChildren(
              ...Z.flatMap(([D, z]) => {
                const y = document.createElement("dt"),
                  G = document.createElement("dd");
                return ((y.textContent = D), (G.textContent = z), [y, G]);
              }),
            ),
            It(L("#run-trophies"), Q));
        }
      },
    }
  );
}
function gt(e) {
  return e < 2400
    ? {
        speaker: "UN INSTANT DE LUCIDITÉ",
        text: "Deux estomacs. Une révélation.",
      }
    : e < 4500
      ? {
          speaker: "TOI",
          text: "Attends… y a assez de nourriture pour nous deux.",
        }
      : e < 6200
        ? { speaker: "TON ANCIEN ENNEMI", text: "On partage ? Sauf la salade." }
        : {
            speaker: "ET ILS VÉCURENT HEUREUX…",
            text: "…avec beaucoup de burgers et très peu de dignité.",
          };
}
function st(e, g, o, u, E, A, n, i, I) {
  const C = g.cinematic.elapsed,
    Q = Math.min(1, C / 2400),
    B = Q * Q * (3 - 2 * Q);
  (e.save(), (e.fillStyle = "#243a32"), e.fillRect(0, 0, o + E * 2, u + A * 2));
  const k = e.createRadialGradient(
    E + o / 2,
    A + u * 0.5,
    20,
    E + o / 2,
    A + u * 0.5,
    o * 0.65,
  );
  if (
    (k.addColorStop(0, "#b3bd8a"),
    k.addColorStop(1, "#30463b"),
    (e.fillStyle = k),
    e.fillRect(0, 0, o + E * 2, u + A * 2),
    e.translate(E, A),
    (e.globalAlpha = Math.min(1, C / 1800)),
    (e.fillStyle = "#94744f"),
    e.beginPath(),
    e.roundRect(o / 2 - 195, u * 0.5 + 25, 390, 110, 16),
    e.fill(),
    (e.fillStyle = "#ead8b5"),
    e.beginPath(),
    e.roundRect(o / 2 - 188, u * 0.5 + 30, 376, 98, 12),
    e.fill(),
    (e.fillStyle = "#fff2cf"),
    e.beginPath(),
    e.ellipse(o / 2, u * 0.5 + 90, 68, 27, 0, 0, Math.PI * 2),
    e.fill(),
    (e.globalAlpha = 1),
    g.cinematic.people
      .map((a) => g.people.find((s) => s.id === a.id))
      .forEach((a, s) => {
        const r = o / 2 + (s === 0 ? -112 : 112),
          d = s === 0 ? -130 : o + 130;
        n(
          {
            ...a,
            pop: 0,
            body: {
              ...a.body,
              circleRadius: 76,
              position: { x: d + (r - d) * B, y: u * 0.5 },
              speed: C < 2400 ? 3 : 0,
            },
          },
          I,
        );
      }),
    C > 2400)
  ) {
    (e.save(),
      e.translate(o / 2, u * 0.5 + 90),
      e.scale(1.7, 1.7),
      i({ x: -25, y: 0, type: "burger", size: "normal" }),
      i({ x: 25, y: 0, type: "burger", size: "normal" }),
      e.restore(),
      (e.fillStyle = "#c75c55"),
      (e.font = "28px sans-serif"),
      (e.textAlign = "center"));
    for (let a = 0; a < 3; a++) {
      const s = (C / 1e3 + a * 0.7) % 2;
      ((e.globalAlpha = Math.min(1, 2 - s)),
        e.fillText("♥", o / 2 + Math.sin(a * 2) * 45, u * 0.5 - 105 - s * 28));
    }
    e.globalAlpha = 1;
  }
  e.restore();
}
const RI = (e) => `${Number(e.toFixed(1)).toLocaleString("fr-FR")} kg`;
function at(e, g, o) {
  const u = [],
    E = (A, n) =>
      Math.max(0, Math.min(A.x + A.w, n.x + n.w) - Math.max(A.x, n.x)) *
      Math.max(0, Math.min(A.y + A.h, n.y + n.h) - Math.max(A.y, n.y));
  for (const A of e) {
    const n = g < 600 ? 82 : 100,
      i = g < 600 ? 24 : 28,
      I = 8,
      C = [
        { x: A.x - n / 2, y: A.y + (A.top ?? -A.r) - i - I },
        { x: A.x - n / 2, y: A.y + A.r + I },
        { x: A.x + A.r + I, y: A.y - i / 2 },
        { x: A.x - A.r - n - I, y: A.y - i / 2 },
      ];
    let Q;
    for (let B = 0; B < C.length; B++) {
      const k = {
        x: Math.max(3, Math.min(g - n - 3, C[B].x)),
        y: Math.max(3, Math.min(o - i - 3, C[B].y)),
        w: n,
        h: i,
      };
      let t = B * 3;
      for (const a of u) t += E(k, a) * 3;
      for (const a of e)
        t +=
          E(k, {
            x: a.x - a.r,
            y: a.y + (a.top ?? -a.r),
            w: a.r * 2,
            h: a.r - (a.top ?? -a.r),
          }) * 2;
      (!Q || t < Q.penalty) &&
        (Q = { ...k, penalty: t, id: A.id, cx: A.x, cy: A.y, r: A.r });
    }
    u.push(Q);
  }
  return u;
}
function mI(e, g, o) {
  const focus =
    online?.active && !e.people[0].alive
      ? e.people.find((person) => person.alive) || e.people[0]
      : e.people[0];
  const u = focus.body.position;
  return e.count > 8 && !SECRET_MAP_MODE(e.mode)
    ? { x: u.x - g / 2, y: u.y - o / 2 }
    : {
        x: Math.max(0, Math.min(e.w - g, u.x - g / 2)),
        y: Math.max(0, Math.min(e.h - o, u.y - o / 2)),
      };
}
function Je(e, g, o, u) {
  const E = e.body.circleRadius;
  return (
    e.body.position.x + E >= g.x &&
    e.body.position.x - E <= g.x + o &&
    e.body.position.y + E >= g.y &&
    e.body.position.y - E <= g.y + u
  );
}
const iI = {
    resin: { name: "Résine anthracite", color: "#454e52" },
    concrete: { name: "Béton clair", color: "#bdc5c1" },
    asphalt: { name: "Bitume", color: "#454e52" },
    steel: { name: "Inox", color: "#a8b6b8" },
  },
  EI = new WeakMap();
function rt(e, g) {
  let o = EI.get(e);
  if ((o || ((o = {}), EI.set(e, o)), o[g])) return o[g];
  const u = document.createElement("canvas");
  ((u.width = 96), (u.height = 96));
  const E = u.getContext("2d");
  let A = 391;
  const n = () => ((A = (A * 1664525 + 1013904223) >>> 0), A / 4294967296);
  if (g === "steel")
    for (let i = 1; i < 96; i += 3)
      ((E.fillStyle = i % 2 ? "#ffffff14" : "#34464a10"),
        E.fillRect(0, i, 96, 1));
  else
    for (let i = 0; i < 180; i++)
      ((E.fillStyle =
        i % 2
          ? ["asphalt", "resin"].includes(g)
            ? "#f0e8d017"
            : "#ffffff17"
          : ["asphalt", "resin"].includes(g)
            ? "#111b2024"
            : "#475c5a12"),
        E.fillRect(n() * 96, n() * 96, n() * 1.5 + 0.5, 1));
  return ((o[g] = e.createPattern(u, "repeat")), o[g]);
}
function kt(e, g, o, u = "concrete") {
  if (
    (iI[u] || (u = "concrete"),
    (e.fillStyle = iI[u].color),
    e.fillRect(0, 0, g, o),
    u === "steel")
  ) {
    const E = e.createLinearGradient(0, 0, g, o);
    (E.addColorStop(0, "#c7d2d2"),
      E.addColorStop(0.4, "#9eafb1"),
      E.addColorStop(0.65, "#c2cccc"),
      E.addColorStop(1, "#8b9fa1"),
      (e.fillStyle = E),
      e.fillRect(0, 0, g, o));
  }
  if (((e.fillStyle = rt(e, u)), e.fillRect(0, 0, g, o), u === "concrete")) {
    ((e.strokeStyle = "#81928c39"), (e.lineWidth = 1));
    for (let E = 240; E < g; E += 240)
      (e.beginPath(), e.moveTo(E, 0), e.lineTo(E, o), e.stroke());
    for (let E = 240; E < o; E += 240)
      (e.beginPath(), e.moveTo(0, E), e.lineTo(g, E), e.stroke());
  } else if (u === "resin") {
    ((e.strokeStyle = "#9aa8a433"), (e.lineWidth = 1));
    for (let E = 180; E < g; E += 180)
      (e.beginPath(), e.moveTo(E, 0), e.lineTo(E, o), e.stroke());
  } else if (u === "asphalt") {
    e.fillStyle = "#e5ce7c60";
    for (let E = 35; E < g - 30; E += 115)
      (e.fillRect(E, 16, 65, 3), e.fillRect(E, o - 19, 65, 3));
  } else {
    ((e.strokeStyle = "#758a8a60"),
      (e.lineWidth = 1),
      e.strokeRect(17, 17, g - 34, o - 34));
    for (const E of [25, g - 25])
      for (const A of [25, o - 25])
        ((e.fillStyle = "#677c7b"),
          e.beginPath(),
          e.arc(E, A, 3, 0, Math.PI * 2),
          e.fill(),
          (e.fillStyle = "#dce6df"),
          e.fillRect(E - 1, A - 2, 1, 2));
  }
}
function IA(e, g, o, u, E, A, n = 4) {
  ((e.fillStyle = A), e.beginPath(), e.roundRect(g, o, u, E, n), e.fill());
}
function fA(e, g, o, u, E, A) {
  ((e.fillStyle = A),
    e.beginPath(),
    e.ellipse(g, o, u, E, 0, 0, Math.PI * 2),
    e.fill());
}
function ut(e, g, o, u = 128, E = 45) {
  (IA(e, g + 3, o + 5, u, E, "#514b3822"),
    IA(e, g, o - 12, u, 8, "#628f90", 3),
    IA(e, g, o + E + 4, u, 8, "#628f90", 3),
    IA(e, g, o, u, E, "#d7b888"),
    IA(e, g + 3, o + 3, u - 6, E - 6, "#e6cfaa"));
  for (const A of [g + u * 0.24, g + u * 0.76])
    (IA(e, A - 18, o + 10, 36, 25, "#a7b8a1", 3),
      fA(e, A, o + 22, 11, 8, "#f5f0df"),
      fA(e, A, o + 22, 7, 5, "#d4d7c5"),
      IA(e, A + 13, o + 12, 2, 18, "#798675", 0));
}
function Me(e, g, o = 0) {
  const u = Array.from({ length: 18 }, (n, i) => {
    const I = (i / 18) * Math.PI * 2,
      C = 0.87 + 0.07 * Math.sin(I * 3) + 0.045 * Math.cos(I * 5 + o * 3e-4);
    return { x: Math.cos(I) * g * C, y: Math.sin(I) * g * C };
  });
  e.beginPath();
  const E = u.at(-1),
    A = u[0];
  e.moveTo((E.x + A.x) / 2, (E.y + A.y) / 2);
  for (let n = 0; n < u.length; n++) {
    const i = u[n],
      I = u[(n + 1) % u.length];
    e.quadraticCurveTo(i.x, i.y, (i.x + I.x) / 2, (i.y + I.y) / 2);
  }
  e.closePath();
}
function ft(e, g, o) {
  const u = g.sticky;
  if (!u) return;
  const E = g.body.position,
    A = E.x - u.anchor.x,
    n = E.y - u.anchor.y,
    i = Math.hypot(A, n),
    I = g.body.circleRadius;
  if (i < 4) return;
  const C = A / i,
    Q = n / i,
    B = Math.min(1, u.remaining / 250);
  (e.save(), (e.globalAlpha = B), (e.lineCap = "round"));
  for (let k = -1; k <= 1; k++) {
    const t = k * Math.min(9, I * 0.23),
      a = u.anchor.x - Q * t,
      s = u.anchor.y + I * 0.72 + C * t,
      r = E.x - C * Math.min(I * 0.2, i * 0.2) - Q * t,
      d = E.y + I * 0.72 + C * t,
      M = Math.min(17, i * 0.1) + Math.sin(o * 0.009 + k) * 2;
    for (const [S, v] of [
      [5, "#ba8028bb"],
      [3.2, "#f6ce6a"],
      [1.1, "#fff1b9"],
    ])
      (e.beginPath(),
        e.moveTo(a, s),
        e.quadraticCurveTo((a + r) / 2 - Q * M, (s + d) / 2 + C * M, r, d),
        (e.lineWidth = S),
        (e.strokeStyle = v),
        e.stroke());
  }
  (fA(e, u.anchor.x, u.anchor.y, 7, 4, "#f4cc68cc"), e.restore());
}
function dt(e, g, o, u = 0) {
  const { w: E, h: A, mapId: n } = g;
  if (
    (e.save(),
    n === "foodcourt"
      ? kt(e, E, A, g.floorSkin)
      : ((e.fillStyle = o.floor), e.fillRect(0, 0, E, A)),
    !o.experimental && n !== "foodcourt")
  )
    for (let i = 0; i < E; i += 72)
      for (let I = 0; I < A; I += 72)
        (i / 72 + I / 72) % 2 === 0 &&
          ((e.fillStyle = n === "cuisine" ? "#94a99a12" : "#ab8d5910"),
          e.fillRect(i, I, 72, 72));
  if (o.experimental && !mapArtURL(n)) {
    e.save();
    for (let i = 0; i < 220; i++) {
      const I = (i * 173.31) % E,
        C = (i * 91.27) % A;
      ((e.fillStyle =
        n === "volcan" ? (i % 3 ? "#3d423729" : "#cab88d26") : "#ffffff0b"),
        e.beginPath(),
        e.ellipse(I, C, 2 + (i % 5), 1 + (i % 3), i * 0.2, 0, Math.PI * 2),
        e.fill());
    }
    e.restore();
  }
  if (n === "cantine") {
    const i = Math.max(2, Math.floor(E / 240)),
      I = Math.max(2, Math.floor(A / 190));
    e.globalAlpha = 0.68;
    for (let C = 0; C < I; C++)
      for (let Q = 0; Q < i; Q++)
        ut(e, ((Q + 0.5) * E) / i - 64, ((C + 0.5) * A) / I - 22);
    e.globalAlpha = 1;
  } else if (n === "cuisine") {
    for (const [i, I] of [
      [35, 35],
      [E - 152, A - 91],
    ]) {
      (IA(e, i, I, 117, 56, "#a6b9b0"),
        IA(e, i + 4, I + 4, 109, 48, "#c4cec1"));
      for (let C = 0; C < 3; C++)
        (fA(e, i + 23 + C * 34, I + 28, 12, 12, "#64796c"),
          fA(e, i + 23 + C * 34, I + 28, 7, 7, "#8b9f8c"));
    }
    for (const i of g.obstacles) {
      (e.save(),
        e.translate(i.x, i.y),
        e.rotate(i.angle),
        IA(e, -i.w / 2 + 3, -i.h / 2 + 7, i.w, i.h, "#3645393b"),
        IA(e, -i.w / 2, -i.h / 2, i.w, i.h, "#687c76", 3),
        IA(e, -i.w / 2 + 5, -i.h / 2 + 3, i.w - 10, i.h - 6, "#b7c7bc", 2));
      for (const I of [-i.w / 2 + 4, i.w / 2 - 17])
        (IA(e, I, -i.h / 2, 13, i.h, "#dec252", 1),
          (e.strokeStyle = "#4d594b"),
          (e.lineWidth = 3),
          e.beginPath(),
          e.moveTo(I + 1, -i.h / 2 + 3),
          e.lineTo(I + 12, i.h / 2 - 3),
          e.stroke());
      e.restore();
    }
  }
  if (!drawMapArt(e, g)) HI(e, g, o, u);
  if (["station", "works", "mirror"].includes(n)) {
    for (const obstacle of g.obstacles) {
      if (obstacle.boundary) continue;
      e.save();
      e.translate(obstacle.x, obstacle.y);
      e.rotate(obstacle.angle);
      const palette =
        n === "works"
          ? ["#b69254", "#f3cb57"]
          : n === "mirror"
            ? ["#736aa8", "#dbe9ff"]
            : ["#b64c42", "#e9d3a5"];
      IA(
        e,
        -obstacle.w / 2 + 3,
        -obstacle.h / 2 + 5,
        obstacle.w,
        obstacle.h,
        "#172b3055",
        4,
      );
      IA(
        e,
        -obstacle.w / 2,
        -obstacle.h / 2,
        obstacle.w,
        obstacle.h,
        palette[0],
        4,
      );
      IA(
        e,
        -obstacle.w / 2 + 3,
        -obstacle.h / 2 + 3,
        Math.max(1, obstacle.w - 6),
        Math.max(1, obstacle.h - 6),
        palette[1],
        2,
      );
      if (n === "works")
        for (let x = -obstacle.w / 2 + 4; x < obstacle.w / 2 - 6; x += 20)
          IA(e, x, -obstacle.h / 2 + 2, 9, obstacle.h - 4, "#3f4644", 0);
      if (n === "station") {
        e.fillStyle = "#573730";
        e.font = "bold 11px sans-serif";
        e.textAlign = "center";
        e.fillText("BURGER", 0, 3);
      }
      e.restore();
    }
  }
  drawArenaFloor(e, g, u);
  for (const i of g.zones) {
    if ((e.save(), e.translate(i.x, i.y), i.inactive)) {
      ((e.strokeStyle = "#ffe495"),
        (e.lineWidth = 2),
        e.setLineDash([5, 5]),
        e.beginPath(),
        e.arc(0, 0, i.r, 0, Math.PI * 2),
        e.stroke(),
        e.setLineDash([]),
        e.restore());
      continue;
    }
    if (qI(e, i)) {
      e.restore();
      continue;
    }
    if (i.kind === "belt" && n === "pirate") {
      e.restore();
      continue;
    }
    if (
      i.kind === "belt" &&
      ["pirate", "rooftop", "underwater", "space"].includes(n)
    ) {
      ((e.strokeStyle = n === "underwater" ? "#d3f7f16b" : "#f4eacb70"),
        (e.lineWidth = 2));
      const I = i.ax >= 0 ? 1 : -1;
      for (let C = -i.w / 2 + 40; C < i.w / 2; C += 110)
        for (let Q = -i.h / 2 + 35; Q < i.h / 2; Q += 110)
          (e.beginPath(),
            e.moveTo(C - I * 15, Q),
            e.lineTo(C + I * 15, Q),
            e.lineTo(C + I * 7, Q - 6),
            e.moveTo(C + I * 15, Q),
            e.lineTo(C + I * 7, Q + 6),
            e.stroke());
      e.restore();
      continue;
    }
    if (i.kind === "belt") {
      (IA(e, -i.w / 2, -i.h / 2, i.w, i.h, "#547d8b", 5),
        IA(e, -i.w / 2 + 4, -i.h / 2 + 4, i.w - 8, i.h - 8, "#8ab2b7", 3),
        e.save(),
        e.beginPath(),
        e.rect(-i.w / 2 + 6, -i.h / 2 + 6, i.w - 12, i.h - 12),
        e.clip());
      const I = i.ax > 0 ? 1 : -1,
        C = g.phase === "moving" && g.elapsed < 2500;
      for (let Q = -i.w / 2 - 40; Q < i.w / 2 + 40; Q += 38) {
        const B = Q + (C ? ((u / 50) % 38) * I : 0);
        ((e.strokeStyle = "#e5f1d9"),
          (e.lineWidth = 3),
          e.beginPath(),
          e.moveTo(B - I * 7, -10),
          e.lineTo(B + I * 7, 0),
          e.lineTo(B - I * 7, 10),
          e.stroke());
      }
      (e.restore(),
        (e.fillStyle = "#315665"),
        (e.font = "700 9px sans-serif"),
        (e.textAlign = "center"),
        e.fillText("TAPIS · POUSSE 2,5 s", 0, -i.h / 2 - 7),
        e.restore());
      continue;
    }
    if (i.kind === "cheese" && i.flow) {
      const I = Math.sin(u * 0.004 + i.segment);
      (fA(e, -i.r * 0.2, i.r * 0.15, 2 + I * 0.4, 1.6, "#fff2b9bb"),
        e.restore());
      continue;
    }
    if (i.kind === "cheese") {
      const I = e.createRadialGradient(-i.r * 0.2, -i.r * 0.3, 3, 0, 0, i.r);
      (I.addColorStop(0, "#fff0b4"),
        I.addColorStop(0.65, "#f9d477"),
        I.addColorStop(1, "#dca443"),
        Me(e, i.r, u),
        (e.fillStyle = "#9c6e2828"),
        (e.shadowColor = "#7f57253d"),
        (e.shadowBlur = 5),
        (e.shadowOffsetY = 3),
        e.fill(),
        (e.shadowColor = "transparent"),
        Me(e, i.r, u),
        (e.fillStyle = I),
        e.fill(),
        (e.strokeStyle = "#ce9b41"),
        (e.lineWidth = 2),
        e.stroke(),
        (e.strokeStyle = "#fff6cfbd"),
        (e.lineWidth = 3),
        e.beginPath(),
        e.ellipse(
          -i.r * 0.17,
          -i.r * 0.32,
          i.r * 0.43,
          i.r * 0.12,
          -0.2,
          Math.PI * 0.85,
          Math.PI * 1.9,
        ),
        e.stroke());
      for (const [C, Q] of [
        [-0.35, 0.2],
        [0.24, -0.13],
        [0.4, 0.31],
      ])
        (fA(e, i.r * C, i.r * Q, 4, 3, "#e0b65b"),
          fA(e, i.r * C - 1, i.r * Q - 1, 2.5, 1.5, "#fff0bc"));
      (e.save(),
        e.translate(-i.r * 0.62, i.r * 0.37),
        e.rotate(-0.2),
        (e.fillStyle = "#d9a13c"),
        e.beginPath(),
        e.moveTo(-13, 7),
        e.lineTo(10, -12),
        e.lineTo(15, 10),
        e.closePath(),
        e.fill(),
        (e.fillStyle = "#ffe091"),
        e.beginPath(),
        e.moveTo(-13, 3),
        e.lineTo(10, -16),
        e.lineTo(15, 6),
        e.closePath(),
        e.fill(),
        fA(e, 6, -3, 2.6, 2, "#d8ab4f"),
        fA(e, -1, 1, 2, 1.5, "#d8ab4f"),
        e.restore(),
        (e.fillStyle = "#87612a"),
        (e.font = "700 9px sans-serif"),
        (e.textAlign = "center"));
    } else {
      Me(e, i.r);
      const I = e.createRadialGradient(-i.r * 0.2, -i.r * 0.2, 2, 0, 0, i.r);
      (I.addColorStop(0, "#e5c96d57"),
        I.addColorStop(0.8, "#b890335c"),
        I.addColorStop(1, "#ac812d36"),
        (e.fillStyle = I),
        e.fill(),
        (e.strokeStyle = "#bb953c88"),
        (e.lineWidth = 1.4),
        e.stroke(),
        (e.strokeStyle = "#fff7d7cc"),
        (e.lineWidth = 2.6),
        e.beginPath(),
        e.ellipse(
          -i.r * 0.2,
          -i.r * 0.28,
          i.r * 0.5,
          i.r * 0.1,
          -0.35,
          Math.PI,
          Math.PI * 1.95,
        ),
        e.stroke(),
        (e.lineWidth = 1.2),
        e.beginPath(),
        e.ellipse(
          i.r * 0.27,
          i.r * 0.24,
          i.r * 0.25,
          i.r * 0.055,
          -0.4,
          0,
          Math.PI,
        ),
        e.stroke(),
        e.save(),
        e.translate(i.r * 0.63, -i.r * 0.48),
        e.rotate(0.9),
        IA(e, -7, -10, 14, 25, "#718048", 3),
        IA(e, -4, -17, 8, 9, "#546535", 1),
        IA(e, -4, -10, 8, 20, "#b2ad65", 1),
        IA(e, -6, -1, 12, 8, "#ede2b2", 1),
        e.restore(),
        (e.fillStyle = "#866730"),
        (e.font = "700 9px sans-serif"),
        (e.textAlign = "center"),
        e.fillText("HUILE · GLISSE", 0, i.r + 10));
    }
    e.restore();
  }
  drawSecretFloor(e, g, u);
  drawSurvivalFloor(e, g, u);
  drawArenaBorders(e, g);
  e.restore();
}
function SI(e, g, o, u, E, A, n, i = !1) {
  if (g.mode === "somalia" && !i) {
    (e.save(),
      e.translate(A * (1 - 0.55), n * (1 - 0.55)),
      e.scale(0.55, 0.55),
      SI(e, g, o, u, E, A, n, !0),
      e.restore());
    return;
  }
  const I = 139,
    C = 74,
    Q = A - I - 12,
    B = n - C - 10,
    k = (I - 12) / g.w,
    t = (C - 19) / g.h;
  (e.save(),
    IA(e, Q, B, I, C, "#263c31ed", 5),
    (e.fillStyle = "#dae3c3"),
    (e.font = "700 7px sans-serif"),
    (e.textAlign = "left"),
    e.fillText(
      g.mode === "somalia" ? "SOMALIE · MINICARTE" : "MINICARTE",
      Q + 6,
      B + 10,
    ));
  for (const M of g.zones)
    M.w
      ? IA(
          e,
          Q + 6 + (M.x - M.w / 2) * k,
          B + 15 + (M.y - M.h / 2) * t,
          M.w * k,
          M.h * t,
          "#76b3c2",
          0,
        )
      : fA(
          e,
          Q + 6 + M.x * k,
          B + 15 + M.y * t,
          Math.max(2, M.r * k),
          Math.max(2, M.r * t),
          M.kind === "cheese" ? "#f4d68baa" : "#bca34e88",
        );
  for (const M of g.obstacles)
    ((e.strokeStyle = "#b4c3a1"),
      (e.lineWidth = 2),
      e.beginPath(),
      e.moveTo(
        Q + 6 + (M.x - (Math.cos(M.angle) * M.w) / 2) * k,
        B + 15 + (M.y - (Math.sin(M.angle) * M.w) / 2) * t,
      ),
      e.lineTo(
        Q + 6 + (M.x + (Math.cos(M.angle) * M.w) / 2) * k,
        B + 15 + (M.y + (Math.sin(M.angle) * M.w) / 2) * t,
      ),
      e.stroke());
  for (const M of g.food)
    M.size === "chef" &&
      xA(g.mapId, NA(g.people[0]), M, g.obstacles) &&
      ((e.fillStyle = "#ffdf76"),
      (e.font = "8px sans-serif"),
      (e.textAlign = "center"),
      e.fillText("★", Q + 6 + M.x * k, B + 18 + M.y * t));
  ((e.strokeStyle = "#b9c9a399"), (e.lineWidth = 1));
  const a = Math.max(0, o.x),
    s = Math.max(0, o.y),
    r = Math.min(g.w, o.x + u),
    d = Math.min(g.h, o.y + E);
  e.strokeRect(Q + 6 + a * k, B + 15 + s * t, (r - a) * k, (d - s) * t);
  for (const M of g.people)
    M.alive &&
      xA(g.mapId, NA(g.people[0]), M.body.position, g.obstacles) &&
      fA(
        e,
        Q + 6 + M.body.position.x * k,
        B + 15 + M.body.position.y * t,
        M.id === 0 ? 2.5 : 1.5,
        M.id === 0 ? 2.5 : 1.5,
        M.id === 0 ? "#ffc064" : "#d7dfc6",
      );
  e.restore();
}
function Mt(e, g, o, u, E, A = "CANTINE DU CHAOS", n = !1) {
  const i = g + u * 2,
    I = o + E * 2,
    C = (r, d, M, S, v, f = 4) => {
      ((e.fillStyle = v), e.beginPath(), e.roundRect(r, d, M, S, f), e.fill());
    },
    Q = (r, d, M, S, v) => {
      ((e.fillStyle = v),
        e.beginPath(),
        e.ellipse(r, d, M, S, 0, 0, Math.PI * 2),
        e.fill());
    },
    B = (r, d, M = 14) => {
      (Q(r + 2, d + 3, M, M * 0.7, "#392f2729"),
        Q(r, d, M, M * 0.7, "#f7f3e6"),
        Q(r, d, M * 0.7, M * 0.45, "#d5dbcf"),
        Q(r, d, M * 0.54, M * 0.33, "#faf8ed"),
        (e.strokeStyle = "#b6bca9"),
        (e.lineWidth = 1),
        e.beginPath(),
        e.moveTo(r - M - 5, d - 10),
        e.lineTo(r - M - 5, d + 11),
        e.moveTo(r + M + 5, d - 10),
        e.lineTo(r + M + 5, d + 11),
        e.stroke());
    },
    k = (r, d) => {
      (Q(r + 1, d + 2, 6, 5, "#46322b35"),
        Q(r, d, 6, 5, "#f1e5cf"),
        Q(r, d, 4, 3, "#744b32"));
    },
    t = (r, d, M, S) => {
      (C(r + 3, d + 6, M, S, "#332b273b", 6),
        C(r - 3, d - 10, M + 6, 9, "#a35141", 4),
        C(r - 3, d + S + 3, M + 6, 10, "#a35141", 4),
        C(r, d, M, S, "#e5d4a4", 5),
        e.save(),
        e.beginPath(),
        e.roundRect(r + 3, d + 3, M - 6, S - 6, 3),
        e.clip(),
        (e.fillStyle = "#f4e6d1"),
        e.fillRect(r, d, M, S));
      for (let v = 0; v < M; v += 16)
        for (let f = 0; f < S; f += 16)
          (v / 16 + f / 16) % 2 === 0 &&
            ((e.fillStyle = "#c9695545"), e.fillRect(r + v, d + f, 16, 16));
      (e.restore(),
        M > 100
          ? (B(r + M * 0.26, d + S / 2),
            B(r + M * 0.74, d + S / 2),
            k(r + M * 0.5, d + S * 0.7))
          : (B(r + M / 2, d + S * 0.26, 12),
            B(r + M / 2, d + S * 0.74, 12),
            k(r + M * 0.65, d + S * 0.5)),
        C(r + M * 0.5 - 3, d + S * 0.5 - 8, 6, 10, "#eee9d7", 2),
        C(r + M * 0.5 - 3, d + S * 0.5 - 10, 6, 3, "#818b7a", 1));
    };
  (e.save(),
    (e.fillStyle = "#ad8b63"),
    e.fillRect(0, 0, i, I),
    (e.strokeStyle = "#8b6e4e"),
    (e.lineWidth = 1));
  for (let r = 0; r < I; r += 24) {
    (e.beginPath(), e.moveTo(0, r), e.lineTo(i, r), e.stroke());
    for (let d = ((r / 24) % 2) * 65; d < i; d += 130)
      (e.beginPath(), e.moveTo(d, r), e.lineTo(d, r + 24), e.stroke());
  }
  (C(0, 0, i, E - 3, "#d7c9a8", 0),
    C(0, 0, i, 9, "#536b56", 0),
    C(u - 5, 52, g + 10, 37, "#7a8b7a", 3));
  for (let r = u + 4; r < u + g - 8; r += 72)
    (C(r, 60, 65, 24, "#9cad98", 2), C(r + 24, 63, 17, 3, "#5c6c5a", 1));
  (C(u - 10, 45, g + 20, 12, "#e5e6cd", 3),
    C(u - 10, 55, g + 20, 4, "#a3ad96", 0));
  for (const r of [u + 38, u + g - 128]) {
    (C(r, 27, 77, 22, "#687c6b", 5), C(r + 4, 30, 69, 14, "#b8c1a2", 3));
    for (let d = 0; d < 4; d++)
      Q(r + 14 + d * 16, 37, 7, 5, d % 2 ? "#a9b75f" : "#d99947");
  }
  const a = Math.min(250, g * 0.4),
    s = i / 2 - a / 2;
  if (
    (C(s - 4, 10, a + 8, 39, "#77563a", 3),
    C(s, 13, a, 31, "#28443c", 2),
    (e.textAlign = "center"),
    (e.fillStyle = "#f4e7bd"),
    (e.font = "900 14px sans-serif"),
    e.fillText(A, i / 2, 29),
    (e.fillStyle = "#b9c9a8"),
    (e.font = "8px sans-serif"),
    e.fillText("SERVICE CONTINU • FAIM SANS FIN", i / 2, 40),
    u >= 50)
  ) {
    (C(10, 16, u - 26, 68, "#cad4c5", 5),
      C(14, 20, u - 34, 27, "#e3e6d2", 2),
      C(14, 51, u - 34, 28, "#dde2cf", 2),
      C(u - 28, 27, 3, 12, "#6c8072", 1),
      C(u - 28, 58, 3, 12, "#6c8072", 1),
      C(i - u + 14, 24, u - 27, 55, "#e2d4b2", 5));
    for (let r = 0; r < 2; r++) {
      const d = i - u + 22 + r * 16;
      (C(d, 38, 11, 29, r ? "#d5a638" : "#bb5540", 3),
        C(d + 3, 31, 5, 9, r ? "#d2b05a" : "#8d3d31", 1));
    }
  }
  if (!n) {
    const r = u - 18;
    for (const v of [E + 58, E + o * 0.48, E + o - 148])
      (t(8, v, r, 104), t(i - u + 10, v, r, 104));
    const d = g > 800 ? 4 : 3,
      M = g / d,
      S = Math.min(172, M - 26);
    for (let v = 0; v < d; v++) t(u + M * (v + 0.5) - S / 2, E + o + 30, S, 46);
  }
  ((e.strokeStyle = "#634b36"),
    (e.lineWidth = 15),
    e.strokeRect(u - 5, E - 5, g + 10, o + 10),
    (e.strokeStyle = "#cba16d"),
    (e.lineWidth = 5),
    e.strokeRect(u - 5, E - 5, g + 10, o + 10));
  for (let r = u + 14; r < u + g; r += 85)
    (Q(r, E - 5, 2, 2, "#6b5439"), Q(r, E + o + 5, 2, 2, "#6b5439"));
  e.restore();
}
const w = (e) => document.querySelector(e),
  oA = w("#game"),
  x = oA.getContext("2d");
let oe = [];
const PA = new Map();
let online = null;
let onlineMembers = new Map();
let onlinePeople = [],
  onlineSeat = 0;
let ve = "resin",
  nA = "classic",
  $ = "cantine",
  QA = { x: 0, y: 0 },
  Re,
  WA,
  K,
  q = null,
  Ce = !1,
  dA,
  HA = 0,
  qA = 0;
const MA = document.documentElement.dataset.display === "phone";
let gA = MA ? 680 : 1e3,
  sA = MA ? 740 : 560,
  uA = MA ? 65 : 90,
  aA = 100,
  hA = gA + 2 * uA,
  SA = sA + 2 * aA;
w(".arena-wrap").style.aspectRatio = `${hA}/${SA}`;
const gameAudio = createGameAudio({
  isMenuVisible: () => !w("#main-menu").hidden && !w("#title-screen").hidden,
});
const ambientMusic = setupMusicControls();
function ye(e) {
  if (!Ce)
    try {
      dA ??= new (window.AudioContext || window.webkitAudioContext)();
      dA.resume();
      const g = dA.createOscillator(),
        o = dA.createGain();
      ((g.type =
        e === "burp" ? "sawtooth" : e === "burn" ? "triangle" : "sine"),
        g.frequency.setValueAtTime(
          e === "burp" ? 95 : e === "burn" ? 380 : 220,
          dA.currentTime,
        ),
        g.frequency.exponentialRampToValueAtTime(
          60,
          dA.currentTime + (e === "burp" ? 0.65 : 0.13),
        ),
        o.gain.setValueAtTime(0.018, dA.currentTime),
        o.gain.exponentialRampToValueAtTime(
          0.001,
          dA.currentTime + (e === "burp" ? 0.8 : 0.18),
        ),
        g.connect(o),
        o.connect(dA.destination),
        g.start(),
        g.stop(dA.currentTime + (e === "burp" ? 0.8 : 0.18)));
    } catch {}
}
function OA() {
  if (online?.active) return;
  (clearTimeout(Re),
    (w("#discovery").hidden = !0),
    WA?.newRun(),
    K?.destroy(),
    (gA = Math.max(320, innerWidth)),
    (sA = Math.max(320, innerHeight)),
    (uA = 0),
    (aA = 0),
    (hA = gA),
    (SA = sA),
    (w(".arena-wrap").style.aspectRatio = `${hA}/${SA}`));
  const e = GI(nA, $, gA, sA);
  ((K = new zt(e.w, e.h, Math.random, {
    mapId: $,
    count: me[nA].count,
    chef: nA === "chef",
    mode: nA,
  })),
    (K.floorSkin = ve),
    (w("#chef-weight").value = String(K.people[0].mass)),
    (w("#chef-tools").hidden = nA !== "chef"),
    (w("#tournament-open").hidden = nA !== "platform"),
    (w("#briefing-title").textContent =
      (WORK_IN_PROGRESS_MAPS.has($) ? "🚧 En travaux · " : "") + CA[$].name),
    (w("#briefing-text").textContent = CA[$].description),
    (w("#map-briefing").hidden = !1),
    (w("#floor-picker").hidden = $ !== "foodcourt"),
    (be(), (QA = mI(K, gA, sA))),
    PA.clear(),
    w("#character-labels").replaceChildren(),
    (window.__game = K),
    (w("#meal-rules").innerHTML = K.savanna
      ? "Steaks de moustiques : +2 kg. Aucune salade."
      : `${nA === "gros" ? "Burgers" : CA[$].mealName} : +15 / XL +40 kg.<br>Salades : −18 / XL −45 kg.`),
    (w("#map-description").textContent =
      (nA === "gros"
        ? CA[$].description.replace("Pizzas,", "Burgers,")
        : CA[$].description) +
      (nA === "gros"
        ? " • Grande carte 2 200 × 1 600 · 1 joueur + 23 IA · Caméra toujours centrée sur toi."
        : "")),
    (document.querySelector(".intro .eyebrow").textContent =
      `${K.count} GOURMANDS. UNE SEULE PLACE À TABLE.`),
    (w(".intro-note p").innerHTML =
      `Un lance-pierre. ${K.count - 1} rivaux.<br>Et absolument aucune dignité.`),
    (q = null),
    (w("#truce-panel").hidden = !0),
    (w("#overlay").hidden = !0),
    (w("#hint").style.display = nA === "chef" ? "none" : ""),
    (K.onEvent = (g, o, u) => {
      if (
        (WA?.event(g, o, u, K),
        g === "discovery" &&
          ((w("#discovery").hidden = !1),
          clearTimeout(Re),
          (Re = setTimeout(() => (w("#discovery").hidden = !0), 8e3))),
        gameAudio.event(g, o, u),
        ["launch", "truce", "burp", "burn"].includes(g) && ye(g),
        g === "truce" &&
          ((q = null),
          (w("#hint").style.display = "none"),
          (w("#truce-panel").hidden = !1)),
        g === "end")
      ) {
        if (((w("#truce-panel").hidden = !0), K.outcome === "truce")) {
          ((w("#result-icon").textContent = "🍔 🤝 🍔"),
            (w("#result-title").textContent = "LE BUFFET DE L’AMITIÉ"),
            (w("#result-text").textContent =
              "Il y a assez de nourriture pour vous deux. Vous avez partagé le buffet… et laissé la facture aux autres. Fin secrète débloquée !"),
            (w("#overlay").hidden = !1));
          return;
        }
        const E = K.people[0].alive;
        ((w("#result-icon").textContent = E ? "👑" : "💀"),
          (w("#result-title").textContent = E
            ? "LE DERNIER REPAS, C’EST TOI."
            : "TU AS FINI AU MENU."),
          (w("#result-text").textContent = E
            ? `Dernier survivant en ${K.round} manches. Le chef te félicite.`
            : `Éliminé à la manche ${K.round}. La prochaine fois, prends un supplément de vengeance.`),
          (w("#overlay").hidden = !1));
        if (K.mode === "survival") {
          w("#result-icon").textContent = E ? "🌲 👑" : "🌲";
          w("#result-title").textContent =
            K.outcome === "draw"
              ? "LA FORÊT A TOUT REPRIS."
              : E
                ? "LA FORÊT A SON ROI."
                : "LA FORÊT T’A REPRIS.";
          w("#result-text").textContent =
            K.outcome === "draw"
              ? "Aucun survivant : les derniers gourmands ont été rattrapés ensemble par la fermeture."
              : E
                ? `Seul survivant des 24 gourmands après ${K.round} tours. Poids final : ${Math.round(K.people[0].mass)} kg. Le festin est à toi.`
                : `Éliminé au tour ${K.round}. Le prochain festin n’attendra pas !`;
        }
        if (K.mode === "platform") {
          w("#result-title").textContent = E
            ? "LE DERNIER ÉTAGE EST À TOI."
            : "LE VIDE A EU FAIM.";
          w("#result-text").textContent = E
            ? `Tournoi remporté : quatre duels, seize gourmands. Poids final : ${Math.round(K.people[0].mass)} kg.`
            : `Éliminé en ${["huitième de finale", "quart de finale", "demi-finale", "finale"][K.secretRules.duel - 1]}. Les poids étaient conservés d’un duel à l’autre.`;
        }
      }
    }),
    ze());
}
function pe(e) {
  return (
    e.id === 0 || xA(K.mapId, NA(K.people[0]), e.body.position, K.obstacles)
  );
}
function ze() {
  ((w("#camera-help").hidden = nA !== "gros"),
    (w("#camera-help").textContent =
      "Caméra centrée sur toi en permanence. La minicarte montre le reste du terrain."),
    (window.__view = {
      camera: { ...QA },
      width: gA,
      height: sA,
      sceneW: hA,
      sceneH: SA,
      marginX: uA,
      marginY: aA,
    }));
  const e = K.people[0],
    g = w("#pirate-direction");
  ((g.hidden = K.mapId !== "pirate"),
    g.hidden ||
      ((g.textContent =
        K.round % 2 ? "LE PONT PENCHE → TRIBORD" : "BÂBORD ← LE PONT PENCHE"),
      (g.style.top = (82 * oA.getBoundingClientRect().width) / hA + "px")),
    (w("#survivors").innerHTML =
      `${K.people.filter((o) => o.alive).length} <small>/ ${K.count}</small>`),
    (w("#mass").innerHTML = `<span>${RI(e.mass)}</span>`),
    (w("#round").textContent = String(K.round).padStart(2, "0")),
    (w("#phase").textContent =
      K.phase === "cinematic"
        ? "● TRÊVE GÉNÉRALE"
        : K.phase === "aim"
          ? "● À TOI DE VISER"
          : K.phase === "ended"
            ? "● FIN DU FESTIN"
            : "● ÇA VA CROQUER"),
    (w("#status").textContent =
      K.phase === "cinematic"
        ? "La partie est en pause. La diplomatie commence par le buffet."
        : K.phase === "moving"
          ? `Les ${K.people.filter((o) => o.alive).length} gourmands jouent en même temps. Attention aux gros !`
          : K.phase === "ended"
            ? "Une revanche ? La cuisine est encore ouverte."
            : q?.kind === "shot"
              ? "Relâche pour propulser tout le monde !"
              : "Tire ton personnage en arrière, puis relâche."),
    (w("#event-notice").textContent =
      K.eruption?.state === "warning"
        ? "ÉRUPTION IMMINENTE ! Raclette projetée au prochain tir."
        : K.announcement?.text || ""),
    (w("#event-notice").dataset.kind = K.announcement?.kind || "info"),
    K.phase === "moving" &&
      K.zones.some((o) => o.kind === "cheese" && bA(e.body.position, o)) &&
      (w("#status").textContent =
        "FONDUE FILANTE ! Garde de l’élan pour t’en dégager."),
    Dt(),
    (w("#power b").style.width =
      `${q?.kind === "shot" ? Math.min(100, Math.hypot(q.dx, q.dy) / 1.4) : 0}%`));
}
function Dt() {
  const e = !!K.cinematic;
  if (((w("#character-labels").hidden = e), e)) {
    oe = [];
    const I = gt(K.cinematic.elapsed);
    ((w("#truce-speaker").textContent = I.speaker),
      (w("#truce-line").textContent = I.text));
    return;
  }
  const g = oA.getBoundingClientRect(),
    o = g.width / hA,
    u = g.height / SA,
    E = K.people.filter((I) => I.alive && pe(I) && Je(I, QA, gA, sA));
  for (const [I, C] of PA)
    E.some((Q) => Q.id === I) || (C.remove(), PA.delete(I));
  const A = K.people[0],
    n = (A.body.position.x - QA.x + uA) * o,
    i = (A.body.position.y - QA.y + aA) * u;
  ((w("#hint").style.left = `${Math.max(80, Math.min(g.width - 80, n))}px`),
    (w("#hint").style.top = `${Math.max(55, i - 45)}px`),
    (oe = at(
      E.map((I) => ({
        id: I.id,
        x: (I.body.position.x - QA.x + uA) * o,
        y: (I.body.position.y - QA.y + aA) * u,
        r: I.body.circleRadius * o,
        top: FI(equippedFor(I).hat, I.body.circleRadius, I.mass) * o,
      })),
      g.width,
      g.height,
    )));
  for (const I of oe) {
    const C = K.people.find((B) => B.id === I.id);
    let Q = PA.get(C.id);
    (Q ||
      ((Q = document.createElement("div")),
      (Q.className = "character-badge"),
      (Q.dataset.id = C.id),
      (Q.innerHTML =
        '<span class="badge-name"></span><strong class="badge-weight"></strong>'),
      w("#character-labels").append(Q),
      PA.set(C.id, Q)),
      (Q.dataset.player = C.id === 0 ? "true" : "false"),
      (Q.dataset.human = C.human === true ? "true" : "false"),
      (Q.dataset.member = C.memberId || ""),
      (Q.title = C.name),
      (Q.querySelector(".badge-name").textContent = C.name),
      (Q.querySelector(".badge-weight").textContent = RI(C.mass)),
      (Q.style.transform = `translate(${I.x}px,${I.y}px)`),
      (Q.style.opacity = lightOpacity(
        K.mapId,
        NA(K.people[0]),
        C.body.position,
      )),
      (Q.style.width = `${I.w}px`));
  }
}
function vI(e) {
  const g = oA.getBoundingClientRect();
  return {
    x: ((e.clientX - g.left) / g.width) * hA - uA + QA.x,
    y: ((e.clientY - g.top) / g.height) * SA - aA + QA.y,
  };
}
oA.addEventListener("pointerdown", (e) => {
  if (K.phase !== "aim" || (online?.active && !online.canShoot())) return;
  const g = vI(e),
    o = K.people[0];
  Math.hypot(g.x - o.body.position.x, g.y - o.body.position.y) >
    o.body.circleRadius +
      (document.documentElement.dataset.display === "phone"
        ? Math.max(24, (28 * hA) / oA.getBoundingClientRect().width)
        : 24) ||
    (oA.setPointerCapture(e.pointerId),
    (q = { kind: "shot", id: e.pointerId, x: g.x, y: g.y, dx: 0, dy: 0 }),
    (w("#hint").style.display = "none"),
    ye("grab"));
});
oA.addEventListener("pointermove", (e) => {
  if (!q || q.id !== e.pointerId) return;
  const g = vI(e);
  ((q.dx = q.x - g.x), (q.dy = q.y - g.y));
});
oA.addEventListener("pointerup", (e) => {
  if (!q || q.id !== e.pointerId) return;
  const g = Math.hypot(q.dx, q.dy);
  if (g > 6) {
    const o = Math.min(17, g * 0.12);
    const vector = { x: (q.dx / g) * o, y: (q.dy / g) * o };
    if (online?.active) online.shoot(vector);
    else K.launch(vector);
  }
  q = null;
});
oA.addEventListener("pointercancel", () => (q = null));
document.querySelectorAll("[data-floor]").forEach(
  (e) =>
    (e.onclick = () => {
      ((ve = e.dataset.floor),
        (K.floorSkin = ve),
        (w("#chef-weight").value = String(K.people[0].mass)),
        (w("#chef-tools").hidden = nA !== "chef"),
        (w("#briefing-title").textContent =
          (WORK_IN_PROGRESS_MAPS.has($) ? "🚧 En travaux · " : "") +
          CA[$].name),
        (w("#briefing-text").textContent = CA[$].description),
        (w("#map-briefing").hidden = !1),
        document
          .querySelectorAll("[data-floor]")
          .forEach((g) => g.setAttribute("aria-pressed", String(g === e))));
    }),
);
w("#map-select").onchange = (e) => {
  (($ = e.target.value), OA());
};
document.querySelectorAll("[data-mode]").forEach(
  (e) =>
    (e.onclick = () => {
      ((nA = e.dataset.mode),
        document
          .querySelectorAll("[data-mode]")
          .forEach((g) => g.setAttribute("aria-pressed", String(g === e))),
        nA === "gros" && (($ = "foodcourt"), (w("#map-select").value = $)),
        OA());
    }),
);
w("#close-briefing").onclick = () => (w("#map-briefing").hidden = !0);
w("#chef-weight").onchange = (e) => {
  K.chef && K.resize(K.people[0], Number(e.target.value));
};
w("#chef-reset-look").onclick = () => {
  w("#chef-shop").click();
};
w("#skip-truce").onclick = () => K.finishTruce();
w("#restart").onclick = OA;
w("#again").onclick = OA;
w("#sound").onclick = () => {
  ((Ce = !Ce),
    gameAudio.setMuted(Ce),
    ambientMusic.setMuted(Ce),
    (w("#option-sound").textContent = Ce
      ? "Activer tous les sons"
      : "Couper tous les sons"),
    (w("#sound").textContent = Ce ? "SON OFF ♫" : "SON ON ♫"));
};
function BA(e, g, o, u, E) {
  (x.beginPath(),
    x.ellipse(e, g, o, u, 0, 0, Math.PI * 2),
    (x.fillStyle = E),
    x.fill());
}
function equippedFor(person) {
  return online?.active
    ? person.cosmetics || { hat: "none", outfit: "plain" }
    : person.id === 0
      ? WA.equipped
      : { hat: "none", outfit: "plain" };
}
function kI(e, g) {
  if (drawSecretPerson(x, K, e, g)) return;
  Se(x, e, g, equippedFor(e));
}
function uI(e) {
  if (drawSecretFood(x, K, e, performance.now())) return;
  if ((x.save(), x.translate(e.x, e.y), e.type === "mosquito")) {
    (BA(1, 5, 8, 2, "#76572244"),
      BA(-5, -4, 4, 2, "#e9ecc9cc"),
      BA(5, -4, 4, 2, "#e9ecc9cc"),
      BA(0, 0, 7, 4, "#653b2a"),
      BA(0, -1, 6, 3, "#ab6540"),
      (x.strokeStyle = "#452c22"),
      (x.lineWidth = 1.1));
    for (const g of [-3, 0, 3])
      (x.beginPath(), x.moveTo(g - 1, -3), x.lineTo(g + 1, 2), x.stroke());
    (x.beginPath(), x.moveTo(7, -1), x.lineTo(11, -4), x.stroke(), x.restore());
    return;
  }
  if (
    (e.size === "small" && x.scale(0.65, 0.65),
    BA(1, 9, 12, 4, "#76815422"),
    e.size === "chef" &&
      (x.beginPath(),
      x.arc(0, 0, 28, 0, Math.PI * 2),
      (x.fillStyle = "#e3b83c35"),
      x.fill(),
      (x.strokeStyle = "#c79532"),
      (x.lineWidth = 1.5),
      x.stroke(),
      x.scale(1.65, 1.65)),
    e.size === "xl" &&
      x.scale(e.type === "salad" ? 1.7 : 1.5, e.type === "salad" ? 1.7 : 1.5),
    e.type === "pizza")
  ) {
    ((x.fillStyle = "#ba793c"),
      x.beginPath(),
      x.moveTo(-13, -10),
      x.lineTo(14, -10),
      x.lineTo(1, 14),
      x.closePath(),
      x.fill(),
      (x.fillStyle = "#edc85b"),
      x.beginPath(),
      x.moveTo(-10, -7),
      x.lineTo(11, -7),
      x.lineTo(1, 11),
      x.fill());
    for (const [g, o] of [
      [-3, -3],
      [5, -3],
      [1, 4],
    ])
      BA(g, o, 2.6, 2.6, "#b9563c");
    ((x.strokeStyle = "#d99c55"),
      (x.lineWidth = 4),
      x.beginPath(),
      x.moveTo(-12, -10),
      x.lineTo(13, -10),
      x.stroke());
  } else if (e.type === "taco") {
    (BA(0, 0, 14, 10, "#cda147"), BA(0, -2, 12, 7, "#6c9949"));
    for (let g = -7; g < 9; g += 5) BA(g, -2, 2.6, 3, "#b7683d");
    ((x.fillStyle = "#e8c46b"),
      x.beginPath(),
      x.ellipse(0, 0, 14, 10, 0, 0, Math.PI),
      x.fill(),
      (x.strokeStyle = "#b68e3e"),
      (x.lineWidth = 1),
      x.stroke());
  } else if (e.type === "burger") {
    if (e.size === "chef") {
      for (let g = 0; g < 3; g++)
        ((x.fillStyle = "#683b29"),
          x.fillRect(-12, -2 - g * 5, 24, 4),
          (x.fillStyle = "#e6b740"),
          x.fillRect(-12, -3 - g * 5, 24, 2));
      x.translate(0, -10);
    }
    ((x.fillStyle = "#855236"),
      x.fillRect(-11, 0, 22, 6),
      BA(0, 7, 11, 4, "#d49746"),
      (x.fillStyle = "#7a9a43"),
      x.fillRect(-12, -1, 24, 3),
      (x.fillStyle = "#e4b73d"),
      x.beginPath(),
      x.moveTo(-10, 1),
      x.lineTo(5, 5),
      x.lineTo(11, 1),
      x.fill(),
      x.beginPath(),
      x.ellipse(0, -3, 11, 7, 0, Math.PI, Math.PI * 2),
      (x.fillStyle = "#e8b76b"),
      x.fill(),
      x.fillRect(-11, -3, 22, 3),
      (x.fillStyle = "#fff0c0"),
      x.fillRect(-5, -7, 2, 1),
      x.fillRect(3, -6, 2, 1),
      x.fillRect(0, -9, 2, 1));
  } else {
    (BA(0, 2, 13, 10, "#f5f1d9"), BA(0, 2, 11, 8, "#bbd0a5"));
    for (let g = 0; g < 5; g++) {
      const o = g * Math.PI * 0.4;
      BA(Math.cos(o) * 5, Math.sin(o) * 5, 7, 6, g % 2 ? "#7baf51" : "#55964e");
    }
    ((x.strokeStyle = "#d0e7a0"),
      (x.lineWidth = 1.5),
      x.beginPath(),
      x.moveTo(-5, 6),
      x.lineTo(5, -5),
      x.stroke());
  }
  (e.size === "xl" &&
    ((x.fillStyle = e.type === "salad" ? "#315e36" : "#714c26"),
    (x.font = "800 7px sans-serif"),
    (x.textAlign = "center"),
    x.fillText("XL", 0, 17)),
    e.size === "chef" &&
      ((x.fillStyle = "#744516"),
      (x.font = "900 7px sans-serif"),
      (x.textAlign = "center"),
      x.fillText("LE BURGER DE DOUGGY", 0, 27),
      (x.font = "11px sans-serif"),
      x.fillText("★", 0, -17)),
    x.restore());
}
function bt(e) {
  be();
  const g = Math.min(devicePixelRatio || 1, 2),
    o = oA.getBoundingClientRect();
  if (
    ((oA.width !== Math.round(o.width * g) ||
      oA.height !== Math.round(o.height * g)) &&
      ((oA.width = Math.round(o.width * g)),
      (oA.height = Math.round(o.height * g))),
    x.setTransform(oA.width / hA, 0, 0, oA.height / SA, 0, 0),
    K.cinematic)
  ) {
    st(x, K, gA, sA, uA, aA, kI, uI, e);
    return;
  }
  (x.clearRect(0, 0, hA, SA),
    x.save(),
    x.beginPath(),
    x.rect(uA, aA, gA, sA),
    x.clip(),
    (x.fillStyle = "#586c5c"),
    x.fillRect(uA, aA, gA, sA),
    x.translate(uA - QA.x, aA - QA.y),
    dt(x, K, CA[$], e));
  drawArenaActors(x, K, e);
  for (const u of K.food)
    xA(K.mapId, NA(K.people[0]), u, K.obstacles) &&
      u.x >= QA.x - 40 &&
      u.x <= QA.x + gA + 40 &&
      u.y >= QA.y - 40 &&
      u.y <= QA.y + sA + 40 &&
      uI(u);
  for (const u of K.people.filter((E) => E.alive && pe(E) && Je(E, QA, gA, sA)))
    ft(x, u, e);
  for (const u of K.people
    .filter((E) => E.alive && pe(E) && Je(E, QA, gA, sA))
    .sort((E, A) => E.body.position.y - A.body.position.y))
    kI(u, e);
  drawSecretFalls(x, K, e, Se);
  drawArenaPowers(x, K, e);
  if (q?.kind === "shot") {
    const u = K.people[0].body.position,
      E = Math.hypot(q.dx, q.dy);
    if (E > 3) {
      const A = Math.min(E, 140) * propulsionFactor(K.people[0].mass, K.mode),
        n = q.dx / E,
        i = q.dy / E,
        I = u.x + n * (A + 25),
        C = u.y + i * (A + 25);
      (x.beginPath(),
        x.moveTo(u.x + n * 27, u.y + i * 27),
        x.lineTo(I, C),
        (x.strokeStyle = "#f47c3e"),
        (x.lineWidth = 7),
        (x.lineCap = "round"),
        x.stroke(),
        x.beginPath(),
        x.moveTo(I, C),
        x.lineTo(I - n * 16 + i * 10, C - i * 16 - n * 10),
        x.lineTo(I - n * 16 - i * 10, C - i * 16 + n * 10),
        x.closePath(),
        (x.fillStyle = "#f47c3e"),
        x.fill(),
        (x.lineCap = "butt"));
    }
  }
  for (const u of K.effects)
    xA(K.mapId, NA(K.people[0]), u, K.obstacles) &&
      ((x.globalAlpha = Math.min(1, u.life * 2)),
      (x.font = '800 16px "Barlow Condensed",sans-serif'),
      (x.textAlign = "center"),
      (x.fillStyle = u.color),
      x.fillText(u.text, u.x, u.y - (1.4 - u.life) * 25));
  ((x.globalAlpha = 1),
    nt(x, K),
    x.restore(),
    x.save(),
    x.setTransform(oA.width / o.width, 0, 0, oA.height / o.height, 0, 0));
  for (const u of oe) {
    const E = K.people.find((Q) => Q.id === u.id);
    if (!E?.alive) continue;
    const A = Math.max(u.x, Math.min(u.x + u.w, u.cx)),
      n = Math.max(u.y, Math.min(u.y + u.h, u.cy)),
      i = A - u.cx,
      I = n - u.cy,
      C = Math.hypot(i, I) || 1;
    (x.beginPath(),
      x.moveTo(u.cx + (i / C) * (u.r + 3), u.cy + (I / C) * (u.r + 3)),
      x.lineTo(A, n),
      (x.strokeStyle = E.id === 0 ? "#b47d3baa" : "#6e776baa"),
      (x.lineWidth = 1),
      x.stroke());
  }
  x.restore();
}
function Ge(e) {
  if (document.hidden || WA?.paused) {
    ((HA = e), requestAnimationFrame(Ge));
    return;
  }
  if (online?.active) {
    online.tick();
    HA = e;
    qA = 0;
  } else
    for (qA += Math.min(80, e - HA || 16), HA = e; qA >= 1e3 / 60;)
      (K.step(), (qA -= 1e3 / 60));
  ((QA = mI(K, gA, sA)), bt(e), ze(), requestAnimationFrame(Ge));
}
const De = w("#map-select");
De.replaceChildren();
for (const category of mapGroups(CA)) {
  const group = document.createElement("optgroup");
  group.label = category.label;
  for (const [id, map] of category.maps) {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = map.name;
    group.append(option);
  }
  De.append(group);
}
WA = Qt({
  appearance: () => {},
  start: (e, g) => {
    ((nA = e),
      ($ = g),
      (De.value = $),
      document
        .querySelectorAll("[data-mode]")
        .forEach((o) =>
          o.setAttribute("aria-pressed", String(o.dataset.mode === nA)),
        ),
      OA());
  },
});
online = setupMultiplayer({
  getCosmetics: () => {
    try {
      const raw = localStorage.getItem(Oe);
      const value = JSON.parse(raw);
      return value && typeof value === "object" && !Array.isArray(value)
        ? Xe(raw).equipped
        : WA.equipped;
    } catch {
      return WA.equipped;
    }
  },
  onRoster(members) {
    onlineMembers = new Map(members.map((member) => [member.id, member]));
    if (online?.active)
      for (const person of onlinePeople)
        person.human = onlineMembers.has(person.memberId);
  },
  onStart(state, seat) {
    clearTimeout(Re);
    K?.destroy();
    document.body.classList.add("online-playing");
    onlineSeat = seat;
    nA = state.mode;
    $ = state.mapId;
    K = new zt(state.w, state.h, Math.random, {
      mode: state.mode,
      mapId: state.mapId,
      count: state.count,
    });
    K.spectate = true;
    K.floorSkin = ve;
    onlinePeople = [...K.people];
    K.people = [
      onlinePeople[seat],
      ...onlinePeople.filter((_, i) => i !== seat),
    ];
    window.__game = K;
    q = null;
    PA.clear();
    w("#character-labels").replaceChildren();
    w("#overlay").hidden = true;
    w("#map-briefing").hidden = true;
    w("#truce-panel").hidden = true;
    w("#chef-tools").hidden = true;
    w("#tournament-open").hidden = true;
    w("#discovery").hidden = true;
    WA.startOnline();
    be();
  },
  onFrame(state) {
    for (const data of state.people) {
      const person = onlinePeople[data.id];
      if (!person) continue;
      if (person.mass !== data.mass) K.resize(person, data.mass);
      const { x, y, vx, vy, angle, id, ...attributes } = data;
      Object.assign(person, attributes);
      person.networkSeat = id;
      person.human =
        attributes.human === true && onlineMembers.has(attributes.memberId);
      person.id = id === onlineSeat ? 0 : id === 0 ? onlineSeat : id;
      eA.setPosition(person.body, { x, y });
      eA.setVelocity(person.body, { x: vx, y: vy });
      eA.setAngle(person.body, angle);
      // Rendering keeps the exact server coordinates; Matter setters add deltas.
      person.body.position.x = x;
      person.body.position.y = y;
    }
    for (const key of [
      "round",
      "phase",
      "elapsed",
      "outcome",
      "food",
      "zones",
      "effects",
      "announcement",
    ])
      K[key] = state[key];
    Object.assign(K.mechanics, state.mechanics);
  },
  onLeave() {
    document.body.classList.remove("online-playing");
    q = null;
    WA.backToMenu();
  },
  onEnd(state) {
    const winner = state.people.find((p) => p.alive);
    w("#result-icon").textContent = winner?.id === onlineSeat ? "👑" : "🍽️";
    w("#result-title").textContent = winner
      ? `${winner.name} remporte le festin !`
      : "FIN DU FESTIN";
    w("#result-text").textContent = winner
      ? `${Math.round(winner.mass)} kg · ${state.round} tours. Merci aux gourmands !`
      : "Égalité entre les derniers gourmands.";
    w("#overlay").hidden = false;
  },
  onEvent(event) {
    const mapId = (id) => (id === onlineSeat ? 0 : id === 0 ? onlineSeat : id);
    gameAudio.event(
      event.kind,
      { id: mapId(event.person) },
      event.food && { ...event.food, id: mapId(event.food.id) },
    );
  },
});
for (const id of ["#back-menu", "#end-menu"]) {
  const prior = w(id).onclick;
  w(id).onclick = () => {
    if (online.active) online.leave();
    else prior();
  };
}
const JA = w("#game-shell");
function ae() {
  return (
    document.fullscreenElement === JA || JA.classList.contains("expanded-game")
  );
}
function be() {
  if (w("#play-area").hidden) return;
  const scale =
    SECRET_MAP_MODE(K.mode) || K.mode === "classic"
      ? Math.max(1, innerWidth / K.w, innerHeight / K.h)
      : 1;
  const width = Math.max(320, innerWidth) / scale,
    height = Math.max(320, innerHeight) / scale;
  if (gA !== width || sA !== height) {
    gA = width;
    sA = height;
    uA = 0;
    aA = 0;
    hA = width;
    SA = height;
  }
  const arena = w(".arena-wrap");
  arena.style.width = "100%";
  arena.style.height = "100%";
}

function re() {
  if (!ae()) {
    const e = w(".arena-wrap");
    (e.style.removeProperty("width"),
      e.style.removeProperty("height"),
      e.style.removeProperty("flex"));
  }
  ((w("#fullscreen").textContent = ae()
    ? "⛶ Quitter le plein écran"
    : "⛶ Plein écran"),
    be());
}
w("#fullscreen").onclick = async () => {
  ((q = null),
    (qA = 0),
    (HA = performance.now()),
    (w("#map-briefing").hidden = !0),
    await fI(JA),
    re());
};
document.addEventListener("fullscreenchange", () => {
  ((q = null),
    (qA = 0),
    (HA = performance.now()),
    re(),
    requestAnimationFrame(() => {
      (re(), w("#play-area").hidden || ze());
    }));
});
new ResizeObserver(() => {
  ae() && be();
}).observe(JA);
document.addEventListener("keydown", (e) => {
  (e.key === "Escape" &&
    document.body.classList.contains("app-expanded") &&
    document.body.classList.remove("app-expanded"),
    e.key === "Escape" &&
      JA.classList.contains("expanded-game") &&
      (JA.classList.remove("expanded-game"), re()));
});
OA();
requestAnimationFrame(Ge);

function refreshTournament() {
  if (!K?.secretRules?.tournament) return;
  const tournament = K.secretRules.tournament;
  w("#tournament-stage").textContent =
    `${["Huitièmes de finale", "Quarts de finale", "Demi-finales", "Finale"][tournament.stage - 1]} · ${tournament.matches.length} duel(s). Les duels hors écran utilisent le même moteur physique.`;
  w("#tournament-matches").replaceChildren(
    ...tournament.matches.map((match, i) => {
      const row = document.createElement("p"),
        r = match.secretRules;
      row.textContent = `${i === 0 ? "TON DUEL · " : ""}${match.people.map((p) => `${p.name} (${Math.round(p.mass)} kg)`).join(" contre ")} · ${r.lastResult ? `Victoire : ${r.lastResult.winner.name}` : `Tour ${match.round} · ${match.round <= 3 ? "festin" : "combat"}`}`;
      return row;
    }),
  );
}
w("#tournament-open").onclick = () => {
  refreshTournament();
  w("#tournament-dialog").showModal();
};
w("#refresh-tournament").onclick = refreshTournament;
w("#close-tournament").onclick = () => w("#tournament-dialog").close();
