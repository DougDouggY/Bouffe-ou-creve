import {
  SurvivalRules,
  drawSurvivalFloor,
  survivalStart,
  survivalObstacles,
} from "./survival.js?v=hunger-18";
import { setupSecretTrophyLab } from "./secret-trophy-lab.js?v=filmovore-15";
import {
  SecretRules,
  SECRET_GAME_MODES,
  physicalMass,
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
import {
  hungerStart,
  hungerZone,
  insideHungerZone,
} from "./hunger-games.js?v=filmovore-15";
import {
  arenaSize,
  arenaBorderBodies,
  drawArenaBorders,
} from "./arena-bounds.js?v=hunger-18";
import {
  createRestaurantMenu,
  setupSecretBurger,
  modeUnlocked,
} from "./restaurant-menu.js?v=hunger-18";
import { ArenaMechanics } from "./arena-mechanics.js?v=filmovore-15";
import {
  drawArenaFloor,
  drawArenaActors,
  drawArenaPowers,
} from "./arena-render.js?v=filmovore-15";
import {
  EXTRA_COSMETICS,
  EXTRA_HAT_BOUNDS,
  drawExtraCosmetic,
  extraCosmeticImage,
} from "./cosmetics.js?v=filmovore-15";
import { drawMapArt, mapArtURL } from "./map-art.js?v=hunger-18";
import {
  REMOVED_MAPS,
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
import { consumeShelves, SHELF_MASS_GAIN } from "./shelves.js";

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
        front: e !== "halo",
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
const Oe = "bouffe-profile-v1",
  KA = [
    {
      id: "plain",
      slot: "outfit",
      name: "Tenue de cantine",
      price: 0,
      color: "#ed9a41",
      icon: "👕",
    },
    { id: "none", slot: "hat", name: "Sans chapeau", price: 0, icon: "🙂" },
    {
      id: "cap",
      slot: "hat",
      name: "Bouteille de ketchup",
      price: 100,
      icon: "🧢",
    },
    { id: "beanie", slot: "hat", name: "Bonnet DIAG", price: 150, icon: "🎿" },
    { id: "chef", slot: "hat", name: "Toque du chef", price: 250, icon: "👨‍🍳" },
    {
      id: "crown",
      slot: "hat",
      name: "Couronne du gros",
      price: 500,
      icon: "👑",
    },
    {
      id: "burger",
      slot: "hat",
      name: "Burger sur la tête",
      price: 350,
      icon: "🍔",
    },
    {
      id: "pirate",
      slot: "hat",
      name: "Chapeau pirate",
      price: 300,
      icon: "🏴‍☠️",
    },
    { id: "halo", slot: "hat", name: "Auréole de steak", price: 300 },
    { id: "tender", slot: "hat", name: "Tender croustillant", price: 200 },
    {
      id: "diag",
      slot: "outfit",
      name: "T-shirt DIAG",
      price: 180,
      color: "#ad3e31",
    },
    {
      id: "sport",
      slot: "outfit",
      name: "Survêt brocoli",
      price: 150,
      color: "#679b64",
      icon: "🥦",
    },
    {
      id: "cook",
      slot: "outfit",
      name: "Veste de chef",
      price: 250,
      color: "#f1eddf",
      icon: "🥼",
    },
    {
      id: "cosmic",
      slot: "outfit",
      name: "Combinaison cosmique",
      price: 400,
      color: "#9476bd",
      icon: "🪐",
    },
    {
      id: "candy",
      slot: "outfit",
      name: "Tenue barbe à papa",
      price: 250,
      color: "#e49abb",
      icon: "🍬",
    },
    {
      id: "tux",
      slot: "outfit",
      name: "Smoking du buffet",
      price: 350,
      color: "#334558",
      icon: "🤵",
    },
    ...EXTRA_COSMETICS,
  ];
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
    Math.sin(o * 0.012 + g.id) * Math.min(0.035, (g.body.speed || 0) * 0.006) +
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
      ((e.strokeStyle = "#f0b75c"),
      (e.lineWidth = 2 / n),
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
      (g.id === 0 ? KA.find((r) => r.id === u.outfit)?.color : null) ||
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
      u.outfit === "plain" &&
      Q(0, 0.2, I.bodyWidth, I.bodyHeight, t));
  const a = xI(1, g.mass ?? 60);
  ((g.id === 0 || u.outfit !== "plain") && Ie(e, u.outfit, a.x, a.y, a.w, a.h),
    e.save(),
    e.translate(0, I.headY),
    e.scale(I.headScale, I.headScale));
  const s = dI(u.hat);
  (s && !s.front && Ie(e, u.hat, s.x, s.y, s.w, s.h),
    Q(0, -0.39, 0.52, 0.51, "#724831"),
    Q(0, -0.38, 0.49, 0.49, i),
    Q(-0.42, -0.37, 0.13, 0.17, i),
    Q(0.42, -0.37, 0.13, 0.17, i),
    s?.front ||
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
const CA = {
  cantine: {
    name: "Cantine du chaos",
    meal: "burger",
    mealName: "Burgers",
    description:
      "Self en haut, tables uniquement dans le terrain et traversables. Des flaques de fromage apparaissent parfois : attention au freinage !",
    floor: "#eee5cf",
  },
  cuisine: {
    name: "Cuisine en zigzag",
    meal: "pizza",
    mealName: "Pizzas",
    description:
      "Pizzas, cloisons physiques et tapis bleus : ils poussent dans le sens des flèches pendant 2,5 secondes après le tir.",
    floor: "#dce2dc",
  },
  foodcourt: {
    name: "Food court",
    meal: "burger",
    mealName: "Burgers",
    description:
      "Terrain sans tables, quatre sols au choix. Burgers au menu. Huile dorée : glisse plus longue. Fondue filante : ralentissement progressif et fils collants, pendant deux manches.",
    floor: "#e5d7c8",
  },
};
CA.savanna = {
  name: "Savane des moustiques",
  icon: "🌾",
  meal: "mosquito",
  mealName: "Steaks de moustiques",
  floor: "#d6b15e",
  experimental: !0,
  description:
    "50 gourmands se disputent la savane. Aucun burger ni salade : des steaks de moustiques pour grossir. La savane est la seule carte du mode Somalie.",
};
const PI = [
  [
    "volcan",
    "Volcan raclette",
    "🌋",
    "#716050",
    "Un cratère rocheux infranchissable, des pentes traversables et trois coulées de raclette qui freinent et étirent des fils. Les coulées se reforment entre les manches. Des éruptions annoncées projettent parfois de la raclette au prochain tir.",
  ],
  [
    "market",
    "Supermarché en Folie",
    "🛒",
    "#dbd5bb",
    "Grand supermarché ouvert : les rayons restent au bord. Bouscule les chariots pour transmettre ton élan et provoquer des collisions en chaîne.",
  ],
  [
    "nightmarket",
    "Supermarché nocturne",
    "🔦",
    "#aaa992",
    "Même supermarché, dans le noir. Deux agents annoncent leur prochaine petite propulsion : leur contact est mortel. Lampe : deux tours. Protection anti-sécurité : un tour.",
  ],
  [
    "sushi",
    "Sushi-bar",
    "🍣",
    "#cfa985",
    "Les tapis déplacent les personnages et les plats à chaque fin de manche.",
  ],
  [
    "cold",
    "Chambre froide",
    "🧊",
    "#b8d6df",
    "Sol gelé : les glissades durent beaucoup plus longtemps. Gare aux étagères !",
  ],
  [
    "cinema",
    "Cinéma du goûter",
    "🍿",
    "#493b50",
    "Des rangées de fauteuils et un distributeur : un buffet supplémentaire toutes les deux manches.",
  ],
  [
    "gym",
    "Gymnase des gourmands",
    "🏀",
    "#cba66e",
    "Des plots rebondissants et un parquet de terrain de basket.",
  ],
  [
    "space",
    "Cantine spatiale",
    "🪐",
    "#182b43",
    "Très peu de frottement et des propulseurs qui poussent pendant le début du tir.",
  ],
  [
    "candy",
    "Usine à bonbons",
    "🍬",
    "#dec2d6",
    "Tapis croisés et barrières qui changent de position entre les manches.",
  ],
  [
    "train",
    "Train-restaurant",
    "🚂",
    "#bda68a",
    "Trois wagons, deux passages étroits. Anticipe les embuscades.",
  ],
  [
    "pirate",
    "Banquet pirate",
    "🏴‍☠️",
    "#ac8054",
    "Le pont du bateau penche alternativement à gauche et à droite à chaque manche.",
  ],
  [
    "beach",
    "Plage des frites",
    "🏖️",
    "#e2c886",
    "Le sable freine fort. Les passerelles en bois permettent de conserver son élan.",
  ],
  [
    "parking",
    "Parking des food trucks",
    "🚚",
    "#777c78",
    "Des camions solides forment des ruelles, et la nourriture remplit les places libres.",
  ],
  [
    "station",
    "Station-service",
    "⛽",
    "#aab3ad",
    "De l’huile autour des pompes. Heurte un distributeur pour faire tomber un burger.",
  ],
  [
    "rooftop",
    "Restaurant sur le toit",
    "🌬️",
    "#adb2a5",
    "Un vent annoncé change de direction à chaque manche et pousse pendant 2,5 secondes.",
  ],
  [
    "underwater",
    "Restaurant sous-marin",
    "🐠",
    "#508c9d",
    "Des courants traversent la salle. Les flèches montrent leur direction.",
  ],
  [
    "wok",
    "Wok géant",
    "🥘",
    "#807a70",
    "La cuve inclinée attire doucement les personnages vers son centre pendant les tirs.",
  ],
  [
    "haunted",
    "Cantine hantée",
    "👻",
    "#827c92",
    "Les cloisons se déplacent entre les manches, jamais pendant ton tir.",
  ],
  [
    "fair",
    "Fête foraine",
    "🎪",
    "#d1ac91",
    "Des bumpers de flipper : utilise les rebonds pour attraper les plats et surprendre tes rivaux.",
  ],
  [
    "crepe",
    "Crêperie cosmique",
    "🌀",
    "#b9a6cf",
    "Deux portails reliés : entre par un anneau, ressors par l’autre avec ton élan.",
  ],
  [
    "picnic",
    "Pique-nique géant",
    "🧺",
    "#789567",
    "L’herbe ralentit. Les nappes glissantes deviennent des chemins rapides.",
  ],
  [
    "garden",
    "Potager de l’enfer",
    "🥬",
    "#86715a",
    "Beaucoup plus de salades ! Les rares burgers XL valent le détour.",
  ],
  [
    "palace",
    "Palais de Douggy",
    "👑",
    "#d6c595",
    "Un buffet central généreux, réapprovisionné toutes les deux manches.",
  ],
  [
    "works",
    "Cantine en travaux",
    "🚧",
    "#b8b3a3",
    "Des barrières changent de sens entre les manches. Les passages restent ouverts.",
  ],
  [
    "mirror",
    "Arène miroir",
    "🪞",
    "#bed2d0",
    "Une arène et un buffet symétriques : mêmes chances, chacun sa trajectoire.",
  ],
];
for (const [e, g, o, u, E] of PI) {
  if (REMOVED_MAPS.has(e)) continue;
  CA[e] = {
    name: g,
    icon: o,
    floor: u,
    description: E,
    meal: "burger",
    mealName: "Burgers",
    experimental: !0,
  };
}
CA.hunger = {
  name: "Hunger Games",
  icon: "🌲",
  floor: "#67764b",
  experimental: true,
  meal: "burger",
  mealName: "Burgers",
  description:
    "Tous les gourmands démarrent en cercle autour d’un festin de burgers de Douggy. Dès la manche 4, la zone sûre rétrécit à chaque tour. À la fin du mouvement, toucher la bordure ou rester dehors élimine le gourmand. Le cercle rouge annonce la limite à rejoindre avant la fin du tour.",
};
for (const [id, mode] of Object.entries(SECRET_GAME_MODES))
  CA[id] = {
    name: mode.name,
    floor: "#36313a",
    meal: "burger",
    mealName: "Burgers",
    experimental: true,
    description:
      id === "platform"
        ? "Tournoi physique à 16 gourmands. Chaque duel commence par trois tours de festin. Quitte la plateforme avant sa descente à la fin du troisième tour ! Ensuite, pousse ton adversaire dans le puits. Les gourmands ne se dévorent pas ; le poids gagné est conservé entre les duels. Les autres duels se jouent simultanément, hors écran."
        : id === "cannibal"
          ? "Les victimes sont des adultes fictifs de 40 kg. Elles préparent de courtes fuites avant les propulsions simultanées, paniquent et trébuchent parfois. Les gourmands peuvent toujours se dévorer. Dernier survivant : même règle que le Classique."
          : id === "survival"
            ? "24 gourmands à 60 kg sur un cercle de départ. Le monument circulaire central est infranchissable ; les burgers sont accessibles en anneau autour. Suis la flèche du festin pour le rejoindre, puis explore la grande forêt. Aucun réapprovisionnement ordinaire : guette les rares parachutages. Dès le sixième tour, rejoins le cercle annoncé avant la fin du mouvement. Dernier survivant : victoire !"
            : "Une grande rue, des camions de glaces vus du dessus et une course-poursuite de comédie horrifique. Capture les enfants pour grossir, évite les camions plus imposants et reste le dernier gourmand en piste.",
  };
CA.royal = {
  name: "Le Buffet du Roi",
  icon: "♛",
  floor: "#6e2934",
  experimental: true,
  meal: "burger",
  mealName: "Burgers",
  description:
    "Gargantouille, roi des secondes portions : manches impaires, aspiration physique dans le cône annoncé ; manches paires, rot royal. Sa bouche élimine tous les poids.",
};
CA.fair.description =
  "Flipper gourmand : trois bumpers fixes amplifient les rebonds selon l’angle du choc. Compression, ressort et trajectoires en chaîne !";
CA.beach.name = "La Plage des Gourmands";
CA.beach.description =
  "Une vague annoncée traverse la plage de bas en haut toutes les trois manches. Sa poussée physique regroupe les gourmands, les plus lourds résistent mieux.";
function _e(e, g, o, u = 1) {
  const E = (A, n, i, I, C = 0, Q = {}) => ({
    x: A * g,
    y: n * o,
    w: i * g,
    h: I * o,
    angle: C,
    ...Q,
  });
  if (e === "icecream") return [];
  if (e === "survival") return survivalObstacles(g, o);
  if (e === "cuisine")
    return [
      E(0.3, 0.44, 0.25, 24 / o, 0.58),
      E(0.7, 0.56, 0.25, 24 / o, -0.58),
    ];
  if (["market", "nightmarket"].includes(e)) return [];
  if (e === "train")
    return [0.33, 0.67].flatMap((A) => [
      E(A, 0.18, 0.025, 0.36),
      E(A, 0.82, 0.025, 0.36),
    ]);
  if (["candy", "haunted", "works"].includes(e))
    return [
      E(0.33, 0.4, 0.23, 0.035, u % 2 ? 0.55 : -0.55),
      E(0.67, 0.6, 0.23, 0.035, u % 2 ? -0.55 : 0.55),
    ];
  if (["gym", "fair"].includes(e)) {
    const A = Math.min(g, o) * (e === "fair" ? 0.085 : 0.055);
    return [0.25, 0.5, 0.75].map((n, i) => ({
      x: n * g,
      y: (i % 2 ? 0.65 : 0.35) * o,
      w: A * 2,
      h: A * 2,
      r: A,
      angle: 0,
      bumper: !0,
    }));
  }
  if (e === "volcan") {
    const A = Math.min(g, o) * 0.105;
    return [
      {
        x: g / 2,
        y: o / 2,
        w: A * 2.2,
        h: A * 2.2,
        angle: 0,
        vertices: Array.from({ length: 24 }, (n, i) => {
          const I = (i * Math.PI) / 12,
            C = A * (1 + 0.07 * Math.cos(I * 4) + 0.04 * Math.sin(I * 6));
          return { x: Math.cos(I) * C, y: Math.sin(I) * C };
        }),
      },
    ];
  }
  return e === "parking"
    ? [0.25, 0.7].flatMap((A) => [
        E(A, 0.3, 0.22, 0.12, 0, { truck: !0 }),
        E(A, 0.7, 0.22, 0.12, 0, { truck: !0 }),
      ])
    : e === "station"
      ? [
          E(0.3, 0.5, 0.07, 0.17, 0, { vending: !0 }),
          E(0.7, 0.5, 0.07, 0.17, 0, { vending: !0 }),
        ]
      : e === "cinema"
        ? [0.28, 0.5, 0.72].flatMap((A) => [
            E(0.25, A, 0.25, 0.055),
            E(0.75, A, 0.25, 0.055),
          ])
        : e === "cold"
          ? [E(0.25, 0.4, 0.09, 0.35), E(0.75, 0.6, 0.09, 0.35)]
          : e === "mirror"
            ? [E(0.3, 0.5, 0.035, 0.4), E(0.7, 0.5, 0.035, 0.4)]
            : [];
}
function Ee(e, g, o, u = 1) {
  const E = (I, C, Q, B, k, t = {}) => ({
      kind: I,
      x: C * g,
      y: Q * o,
      w: B * g,
      h: k * o,
      ...t,
    }),
    A = (I, C, Q, B, k, t = 0) => E("belt", I, C, Q, B, { ax: k, ay: t }),
    n = (I, C = {}) => E(I, 0.5, 0.5, 1, 1, C),
    i = (I, C, Q, B) => ({
      kind: I,
      x: C * g,
      y: Q * o,
      r: Math.min(g, o) * B,
    });
  if (["platform", "cannibal", "icecream", "survival"].includes(e)) return [];
  if (e === "cuisine")
    return [
      A(0.5, 0.24, 0.38, 60 / o, 0.13),
      A(0.5, 0.77, 0.38, 60 / o, -0.13),
    ];
  if (e === "foodcourt" || e === "station")
    return [
      i("oil", 0.26, 0.32, 0.1),
      i("oil", 0.72, 0.68, 0.11),
      i("oil", 0.52, 0.46, 0.08),
    ];
  if (e === "volcan") {
    const I = Math.min(g, o);
    return [0, 1, 2].flatMap((C) =>
      Array.from({ length: 6 }, (Q, B) => {
        const k =
            [-Math.PI / 2, Math.PI / 5, Math.PI * 0.78][C] +
            Math.sin(B * 0.8) * 0.08,
          t = I * (0.135 + B * 0.047);
        return {
          kind: "cheese",
          x: g / 2 + Math.cos(k) * t,
          y: o / 2 + Math.sin(k) * t,
          r: I * (0.035 + B * 0.002),
          flow: !0,
          arm: C,
          segment: B,
        };
      }),
    );
  }
  return e === "sushi"
    ? [
        E("sushi", 0.5, 0.28, 0.85, 0.15, { ax: 1, ay: 0 }),
        E("sushi", 0.5, 0.72, 0.85, 0.15, { ax: -1, ay: 0 }),
      ]
    : e === "cold"
      ? [n("ice")]
      : e === "space"
        ? [
            n("ice"),
            A(0.25, 0.5, 0.15, 0.8, 0.055),
            A(0.75, 0.5, 0.15, 0.8, -0.055),
          ]
        : e === "candy"
          ? [A(0.5, 0.28, 0.86, 0.13, 0.13), A(0.5, 0.72, 0.86, 0.13, -0.13)]
          : ["pirate", "rooftop"].includes(e)
            ? [
                A(
                  0.5,
                  0.5,
                  1,
                  1,
                  (u % 2 ? 1 : -1) * (e === "pirate" ? 0.06 : 0.1),
                ),
              ]
            : e === "underwater"
              ? [
                  A(0.5, 0.28, 0.95, 0.22, 0.09),
                  A(0.5, 0.72, 0.95, 0.22, -0.09),
                ]
              : e === "wok"
                ? [n("wok")]
                : ["beach", "picnic"].includes(e)
                  ? [
                      n("sand"),
                      E("ice", 0.5, 0.28, 0.95, 0.17),
                      E("ice", 0.5, 0.72, 0.95, 0.17),
                    ]
                  : e === "crepe"
                    ? [
                        { ...i("portal", 0.2, 0.3, 0.055), pair: 1 },
                        { ...i("portal", 0.8, 0.7, 0.055), pair: 0 },
                      ]
                    : [];
}
function AI(e, g) {
  const o = g.find((u) => u.kind === "sushi" && bA(e, u));
  return o ? { x: e.x + o.ax * 90, y: e.y + o.ay * 90 } : null;
}
function bA(e, g) {
  return g.inactive
    ? !1
    : g.w
      ? Math.abs(e.x - g.x) < g.w / 2 && Math.abs(e.y - g.y) < g.h / 2
      : Math.hypot(e.x - g.x, e.y - g.y) < g.r;
}
function ce(e, g = []) {
  const o = g.filter((u) => bA(e, u));
  return o.some((u) => u.kind === "cheese")
    ? 0.1
    : o.some((u) => u.kind === "ice")
      ? 0.004
      : o.some((u) => u.kind === "sand")
        ? 0.03
        : o.some((u) => !u.kind || u.kind === "oil")
          ? 0.009
          : 0.024;
}
function hI(e, g = [], o = 0) {
  if (o >= 2500) return null;
  const u = g.find((E) => E.kind === "wok");
  if (u) {
    const E = u.x - e.x,
      A = u.y - e.y,
      n = Math.hypot(E, A) || 1;
    return { ax: (E / n) * 0.055, ay: (A / n) * 0.055 };
  }
  return g.find((E) => E.kind === "belt" && bA(e, E));
}
function RA(e, g, o) {
  if (o.r) {
    const d = e.x - o.x,
      M = e.y - o.y,
      S = Math.hypot(d, M),
      v = g + o.r - S;
    return v > 0 ? { nx: S ? d / S : 1, ny: S ? M / S : 0, depth: v } : null;
  }
  if (o.vertices) {
    const d = o.vertices.map((f) => ({ x: o.x + f.x, y: o.y + f.y }));
    let M = !1,
      S = null;
    for (let f = 0, l = d.length - 1; f < d.length; l = f++) {
      const R = d[l],
        h = d[f];
      R.y > e.y != h.y > e.y &&
        e.x < ((h.x - R.x) * (e.y - R.y)) / (h.y - R.y) + R.x &&
        (M = !M);
      const c = h.x - R.x,
        m = h.y - R.y,
        Y = Math.max(
          0,
          Math.min(1, ((e.x - R.x) * c + (e.y - R.y) * m) / (c * c + m * m)),
        ),
        J = { x: R.x + Y * c, y: R.y + Y * m },
        Z = Math.hypot(e.x - J.x, e.y - J.y);
      (!S || Z < S.d) && (S = { q: J, d: Z });
    }
    if (!M && S.d >= g) return null;
    const v = S.d || 1;
    return {
      nx: (M ? S.q.x - e.x : e.x - S.q.x) / v,
      ny: (M ? S.q.y - e.y : e.y - S.q.y) / v,
      depth: M ? g + S.d : g - S.d,
    };
  }
  const u = Math.cos(o.angle),
    E = Math.sin(o.angle),
    A = e.x - o.x,
    n = e.y - o.y,
    i = A * u + n * E,
    I = -A * E + n * u,
    C = o.w / 2,
    Q = o.h / 2,
    B = Math.max(-C, Math.min(C, i)),
    k = Math.max(-Q, Math.min(Q, I));
  let t = i - B,
    a = I - k,
    s = Math.hypot(t, a),
    r;
  return s >= g
    ? null
    : (s > 1e-4
        ? ((t /= s), (a /= s), (r = g - s))
        : C - Math.abs(i) < Q - Math.abs(I)
          ? ((t = i < 0 ? -1 : 1), (a = 0), (r = g + C - Math.abs(i)))
          : ((t = 0), (a = I < 0 ? -1 : 1), (r = g + Q - Math.abs(I))),
      { nx: t * u - a * E, ny: t * E + a * u, depth: r });
}
function LA(e, g, o, u, E) {
  let A = { ...e };
  for (let n = 0; n < 6; n++) {
    ((A.x = Math.max(g + 1, Math.min(u - g - 1, A.x))),
      (A.y = Math.max(g + 1, Math.min(E - g - 1, A.y))));
    for (const i of o) {
      const I = RA(A, g + 1, i);
      I && ((A.x += I.nx * (I.depth + 0.1)), (A.y += I.ny * (I.depth + 0.1)));
    }
  }
  return A;
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
const VA = 2e3,
  Qe = 200,
  wA = 1.1,
  it = 3e3,
  ke = (e) => Math.max(0.38, Math.min(1.2, Math.sqrt(60 / e))),
  zA = (e) =>
    ["victim", "child"].includes(e.type)
      ? 16
      : e.type === "mosquito"
        ? 6
        : e.size === "chef"
          ? 24
          : e.size === "xl"
            ? 16
            : e.size === "small"
              ? 6
              : 9;
function Et(e, g, o) {
  return o === "chef" || (e !== "salad" && g() < 0.03)
    ? "chef"
    : o || (g() < 0.25 ? "xl" : "normal");
}
const ZA = (e) =>
    ["victim", "child"].includes(e.type)
      ? 40
      : e.type === "mosquito"
        ? 2
        : e.type === "salad"
          ? e.size === "xl"
            ? -45
            : -18
          : e.size === "chef"
            ? 120
            : e.size === "xl"
              ? 40
              : e.size === "small"
                ? 8
                : 15,
  ne = (e) => 19 * Math.sqrt(e / 60),
  Fe = (e) => e.type !== "salad",
  L = (e) => document.querySelector(e);
function Qt({ start: e, appearance: g }) {
  let o, journey;
  try {
    o = Xe(localStorage.getItem(Oe));
  } catch {
    o = Xe(null);
  }
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
      (localStorage.setItem(Oe, JSON.stringify(o)),
        (L("#save-status").textContent =
          "Progression enregistrée dans ce navigateur."));
    } catch {
      L("#save-status").textContent =
        "Sauvegarde indisponible : progression conservée pendant cette session.";
    }
    t();
  }
  function s(l) {
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
function NA(e) {
  return {
    x: e.body.position.x,
    y: e.body.position.y,
    r: e.body.circleRadius,
    heading: e.heading ?? 0,
    lightBoost: e.lightBoost || 1,
  };
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
function Bt(e, g) {
  return e > g * wA ? "prey" : g > e * wA ? "danger" : "neutral";
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
  const u = e.people[0].body.position;
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
function lt(e) {
  return {
    round: 1,
    launched: !1,
    turn: {},
    people: Object.fromEntries(
      e.map((g) => [
        g.id,
        {
          burgers: 0,
          salads: 0,
          douggy: 0,
          fondue: 0,
          eaten: 0,
          mosquito: 0,
          meals: 0,
          maxMass: g.mass,
          maxBurgers: 0,
          maxSalads: 0,
          maxFondue: 0,
          maxEaten: 0,
          maxPropulsion: 0,
          chains: 0,
          growthKills: 0,
          burgerGrowthKills: 0,
          firstTurnKills: 0,
          firstTurnDeath: !1,
          smallestSurvivals: 0,
          summer: !1,
          lastMeal: !1,
          heaviestVictim: 0,
        },
      ]),
    ),
    victimLastEat: {},
    lastGrowth: {},
    events: [],
  };
}
const ht = () => ({ burgers: 0, salads: 0, fondue: 0, eaten: 0 });
function Rt(e, g, o, u, E) {
  if (!e) return;
  if (g === "launch") {
    ((e.round = E.round),
      (e.launched = !0),
      (e.turn = {}),
      (e.victimLastEat = {}),
      (e.lastGrowth = {}));
    return;
  }
  const A = o && e.people[o.id],
    n = o && (e.turn[o.id] ??= ht());
  if (A) {
    if (
      ((A.maxMass = Math.max(A.maxMass, o.mass)),
      g === "food" &&
        (A.meals++,
        u.type === "salad"
          ? (A.salads++, n.salads++)
          : u.type === "burger"
            ? (A.burgers++, n.burgers++, u.size === "chef" && A.douggy++)
            : u.type === "mosquito" && A.mosquito++,
        ZA(u) > 0 &&
          (e.lastGrowth[o.id] = {
            before: o.mass - ZA(u),
            elapsed: E.elapsed,
            type: u.type,
          })),
      g === "fondue" && (A.fondue++, n.fondue++),
      g === "eat")
    ) {
      (A.eaten++,
        n.eaten++,
        (A.heaviestVictim = Math.max(A.heaviestVictim, u.mass)),
        E.round === 1 &&
          (A.firstTurnKills++, (e.people[u.id].firstTurnDeath = !0)),
        e.victimLastEat[u.id] === E.round && A.chains++,
        (e.victimLastEat[o.id] = E.round));
      const i = e.lastGrowth[o.id],
        I = o.mass - u.mass * 0.55;
      (i &&
        i.before <= u.mass * 1.1 &&
        I > u.mass * 1.1 &&
        (A.growthKills++, i.type === "burger" && A.burgerGrowthKills++),
        E.people.filter((C) => C.alive).length === 1 && (A.lastMeal = !0));
    }
    ((A.maxBurgers = Math.max(A.maxBurgers, n.burgers)),
      (A.maxSalads = Math.max(A.maxSalads, n.salads)),
      (A.maxFondue = Math.max(A.maxFondue, n.fondue)),
      (A.maxEaten = Math.max(A.maxEaten, n.eaten)),
      (A.maxPropulsion = Math.max(A.maxPropulsion, n.eaten)),
      (A.summer ||= n.burgers > 0 && n.salads > 0));
  }
  if (g === "round" || g === "end") {
    for (const i of E.people) {
      const I = e.people[i.id];
      I.maxMass = Math.max(I.maxMass, i.mass);
    }
    if (e.launched) {
      const i = E.people.filter((C) => C.alive),
        I = Math.min(...i.map((C) => C.mass));
      for (const C of i) C.mass <= I && e.people[C.id].smallestSurvivals++;
      e.launched = !1;
    }
  }
}
var QI =
  typeof globalThis < "u"
    ? globalThis
    : typeof window < "u"
      ? window
      : typeof global < "u"
        ? global
        : typeof self < "u"
          ? self
          : {};
function cI(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default")
    ? e.default
    : e;
}
var le, nI;
function mt() {
  if (nI) return le;
  ((nI = 1),
    (le = {
      decomp: R,
      quickDecomp: Y,
      isSimple: c,
      removeCollinearPoints: J,
      removeDuplicatePoints: Z,
      makeCCW: a,
    }));
  function e(y, G, p) {
    p = p || 0;
    var F = [0, 0],
      b,
      U,
      N,
      W,
      P,
      X,
      T;
    return (
      (b = y[1][1] - y[0][1]),
      (U = y[0][0] - y[1][0]),
      (N = b * y[0][0] + U * y[0][1]),
      (W = G[1][1] - G[0][1]),
      (P = G[0][0] - G[1][0]),
      (X = W * G[0][0] + P * G[0][1]),
      (T = b * P - W * U),
      D(T, 0, p) ||
        ((F[0] = (P * N - U * X) / T), (F[1] = (b * X - W * N) / T)),
      F
    );
  }
  function g(y, G, p, F) {
    var b = G[0] - y[0],
      U = G[1] - y[1],
      N = F[0] - p[0],
      W = F[1] - p[1];
    if (N * U - W * b === 0) return !1;
    var P = (b * (p[1] - y[1]) + U * (y[0] - p[0])) / (N * U - W * b),
      X = (N * (y[1] - p[1]) + W * (p[0] - y[0])) / (W * b - N * U);
    return P >= 0 && P <= 1 && X >= 0 && X <= 1;
  }
  function o(y, G, p) {
    return (G[0] - y[0]) * (p[1] - y[1]) - (p[0] - y[0]) * (G[1] - y[1]);
  }
  function u(y, G, p) {
    return o(y, G, p) > 0;
  }
  function E(y, G, p) {
    return o(y, G, p) >= 0;
  }
  function A(y, G, p) {
    return o(y, G, p) < 0;
  }
  function n(y, G, p) {
    return o(y, G, p) <= 0;
  }
  var i = [],
    I = [];
  function C(y, G, p, F) {
    if (F) {
      var b = i,
        U = I;
      ((b[0] = G[0] - y[0]),
        (b[1] = G[1] - y[1]),
        (U[0] = p[0] - G[0]),
        (U[1] = p[1] - G[1]));
      var N = b[0] * U[0] + b[1] * U[1],
        W = Math.sqrt(b[0] * b[0] + b[1] * b[1]),
        P = Math.sqrt(U[0] * U[0] + U[1] * U[1]),
        X = Math.acos(N / (W * P));
      return X < F;
    } else return o(y, G, p) === 0;
  }
  function Q(y, G) {
    var p = G[0] - y[0],
      F = G[1] - y[1];
    return p * p + F * F;
  }
  function B(y, G) {
    var p = y.length;
    return y[G < 0 ? (G % p) + p : G % p];
  }
  function k(y) {
    y.length = 0;
  }
  function t(y, G, p, F) {
    for (var b = p; b < F; b++) y.push(G[b]);
  }
  function a(y) {
    for (var G = 0, p = y, F = 1; F < y.length; ++F)
      (p[F][1] < p[G][1] || (p[F][1] === p[G][1] && p[F][0] > p[G][0])) &&
        (G = F);
    return u(B(y, G - 1), B(y, G), B(y, G + 1)) ? !1 : (s(y), !0);
  }
  function s(y) {
    for (var G = [], p = y.length, F = 0; F !== p; F++) G.push(y.pop());
    for (var F = 0; F !== p; F++) y[F] = G[F];
  }
  function r(y, G) {
    return A(B(y, G - 1), B(y, G), B(y, G + 1));
  }
  var d = [],
    M = [];
  function S(y, G, p) {
    var F,
      b,
      U = d,
      N = M;
    if (E(B(y, G + 1), B(y, G), B(y, p)) && n(B(y, G - 1), B(y, G), B(y, p)))
      return !1;
    b = Q(B(y, G), B(y, p));
    for (var W = 0; W !== y.length; ++W)
      if (
        !((W + 1) % y.length === G || W === G) &&
        E(B(y, G), B(y, p), B(y, W + 1)) &&
        n(B(y, G), B(y, p), B(y, W)) &&
        ((U[0] = B(y, G)),
        (U[1] = B(y, p)),
        (N[0] = B(y, W)),
        (N[1] = B(y, W + 1)),
        (F = e(U, N)),
        Q(B(y, G), F) < b)
      )
        return !1;
    return !0;
  }
  function v(y, G, p) {
    for (var F = 0; F !== y.length; ++F)
      if (
        !(
          F === G ||
          F === p ||
          (F + 1) % y.length === G ||
          (F + 1) % y.length === p
        ) &&
        g(B(y, G), B(y, p), B(y, F), B(y, F + 1))
      )
        return !1;
    return !0;
  }
  function f(y, G, p, F) {
    var b = F || [];
    if ((k(b), G < p)) for (var U = G; U <= p; U++) b.push(y[U]);
    else {
      for (var U = 0; U <= p; U++) b.push(y[U]);
      for (var U = G; U < y.length; U++) b.push(y[U]);
    }
    return b;
  }
  function l(y) {
    for (
      var G = [], p = [], F = [], b = [], U = Number.MAX_VALUE, N = 0;
      N < y.length;
      ++N
    )
      if (r(y, N)) {
        for (var W = 0; W < y.length; ++W)
          if (S(y, N, W)) {
            ((p = l(f(y, N, W, b))), (F = l(f(y, W, N, b))));
            for (var P = 0; P < F.length; P++) p.push(F[P]);
            p.length < U &&
              ((G = p), (U = p.length), G.push([B(y, N), B(y, W)]));
          }
      }
    return G;
  }
  function R(y) {
    var G = l(y);
    return G.length > 0 ? h(y, G) : [y];
  }
  function h(y, G) {
    if (G.length === 0) return [y];
    if (
      G instanceof Array &&
      G.length &&
      G[0] instanceof Array &&
      G[0].length === 2 &&
      G[0][0] instanceof Array
    ) {
      for (var p = [y], F = 0; F < G.length; F++)
        for (var b = G[F], U = 0; U < p.length; U++) {
          var N = p[U],
            W = h(N, b);
          if (W) {
            (p.splice(U, 1), p.push(W[0], W[1]));
            break;
          }
        }
      return p;
    } else {
      var b = G,
        F = y.indexOf(b[0]),
        U = y.indexOf(b[1]);
      return F !== -1 && U !== -1 ? [f(y, F, U), f(y, U, F)] : !1;
    }
  }
  function c(y) {
    var G = y,
      p;
    for (p = 0; p < G.length - 1; p++)
      for (var F = 0; F < p - 1; F++)
        if (g(G[p], G[p + 1], G[F], G[F + 1])) return !1;
    for (p = 1; p < G.length - 2; p++)
      if (g(G[0], G[G.length - 1], G[p], G[p + 1])) return !1;
    return !0;
  }
  function m(y, G, p, F, b) {
    b = b || 0;
    var U = G[1] - y[1],
      N = y[0] - G[0],
      W = U * y[0] + N * y[1],
      P = F[1] - p[1],
      X = p[0] - F[0],
      T = P * p[0] + X * p[1],
      _ = U * X - P * N;
    return D(_, 0, b) ? [0, 0] : [(X * W - N * T) / _, (U * T - P * W) / _];
  }
  function Y(y, G, p, F, b, U, N) {
    ((U = U || 100),
      (N = N || 0),
      (b = b || 25),
      (G = typeof G < "u" ? G : []),
      (p = p || []),
      (F = F || []));
    var W = [0, 0],
      P = [0, 0],
      X = [0, 0],
      T = 0,
      _ = 0,
      H = 0,
      cA = 0,
      tA = 0,
      EA = 0,
      AA = 0,
      rA = [],
      kA = [],
      O = y,
      UA = y;
    if (UA.length < 3) return G;
    if ((N++, N > U))
      return (console.warn("quickDecomp: max level (" + U + ") reached."), G);
    for (var j = 0; j < y.length; ++j)
      if (r(O, j)) {
        (p.push(O[j]), (T = _ = Number.MAX_VALUE));
        for (var V = 0; V < y.length; ++V)
          (u(B(O, j - 1), B(O, j), B(O, V)) &&
            n(B(O, j - 1), B(O, j), B(O, V - 1)) &&
            ((X = m(B(O, j - 1), B(O, j), B(O, V), B(O, V - 1))),
            A(B(O, j + 1), B(O, j), X) &&
              ((H = Q(O[j], X)), H < _ && ((_ = H), (P = X), (EA = V)))),
            u(B(O, j + 1), B(O, j), B(O, V + 1)) &&
              n(B(O, j + 1), B(O, j), B(O, V)) &&
              ((X = m(B(O, j + 1), B(O, j), B(O, V), B(O, V + 1))),
              u(B(O, j - 1), B(O, j), X) &&
                ((H = Q(O[j], X)), H < T && ((T = H), (W = X), (tA = V)))));
        if (EA === (tA + 1) % y.length)
          ((X[0] = (P[0] + W[0]) / 2),
            (X[1] = (P[1] + W[1]) / 2),
            F.push(X),
            j < tA
              ? (t(rA, O, j, tA + 1),
                rA.push(X),
                kA.push(X),
                EA !== 0 && t(kA, O, EA, O.length),
                t(kA, O, 0, j + 1))
              : (j !== 0 && t(rA, O, j, O.length),
                t(rA, O, 0, tA + 1),
                rA.push(X),
                kA.push(X),
                t(kA, O, EA, j + 1)));
        else {
          if ((EA > tA && (tA += y.length), (cA = Number.MAX_VALUE), tA < EA))
            return G;
          for (var V = EA; V <= tA; ++V)
            E(B(O, j - 1), B(O, j), B(O, V)) &&
              n(B(O, j + 1), B(O, j), B(O, V)) &&
              ((H = Q(B(O, j), B(O, V))),
              H < cA && v(O, j, V) && ((cA = H), (AA = V % y.length)));
          j < AA
            ? (t(rA, O, j, AA + 1),
              AA !== 0 && t(kA, O, AA, UA.length),
              t(kA, O, 0, j + 1))
            : (j !== 0 && t(rA, O, j, UA.length),
              t(rA, O, 0, AA + 1),
              t(kA, O, AA, j + 1));
        }
        return (
          rA.length < kA.length
            ? (Y(rA, G, p, F, b, U, N), Y(kA, G, p, F, b, U, N))
            : (Y(kA, G, p, F, b, U, N), Y(rA, G, p, F, b, U, N)),
          G
        );
      }
    return (G.push(y), G);
  }
  function J(y, G) {
    for (var p = 0, F = y.length - 1; y.length > 3 && F >= 0; --F)
      C(B(y, F - 1), B(y, F), B(y, F + 1), G) &&
        (y.splice(F % y.length, 1), p++);
    return p;
  }
  function Z(y, G) {
    for (var p = y.length - 1; p >= 1; --p)
      for (var F = y[p], b = p - 1; b >= 0; --b)
        if (z(F, y[b], G)) {
          y.splice(p, 1);
          continue;
        }
  }
  function D(y, G, p) {
    return ((p = p || 0), Math.abs(y - G) <= p);
  }
  function z(y, G, p) {
    return D(y[0], G[0], p) && D(y[1], G[1], p);
  }
  return le;
}
var St = mt();
const ct = cI(St);
var ge = { exports: {} };
var Yt = ge.exports,
  gI;
function Jt() {
  return (
    gI ||
      ((gI = 1),
      (function (e, g) {
        (function (u, E) {
          e.exports = E();
        })(Yt, function () {
          return (function (o) {
            var u = {};
            function E(A) {
              if (u[A]) return u[A].exports;
              var n = (u[A] = { i: A, l: !1, exports: {} });
              return (
                o[A].call(n.exports, n, n.exports, E),
                (n.l = !0),
                n.exports
              );
            }
            return (
              (E.m = o),
              (E.c = u),
              (E.d = function (A, n, i) {
                E.o(A, n) ||
                  Object.defineProperty(A, n, { enumerable: !0, get: i });
              }),
              (E.r = function (A) {
                (typeof Symbol < "u" &&
                  Symbol.toStringTag &&
                  Object.defineProperty(A, Symbol.toStringTag, {
                    value: "Module",
                  }),
                  Object.defineProperty(A, "__esModule", { value: !0 }));
              }),
              (E.t = function (A, n) {
                if (
                  (n & 1 && (A = E(A)),
                  n & 8 || (n & 4 && typeof A == "object" && A && A.__esModule))
                )
                  return A;
                var i = Object.create(null);
                if (
                  (E.r(i),
                  Object.defineProperty(i, "default", {
                    enumerable: !0,
                    value: A,
                  }),
                  n & 2 && typeof A != "string")
                )
                  for (var I in A)
                    E.d(
                      i,
                      I,
                      function (C) {
                        return A[C];
                      }.bind(null, I),
                    );
                return i;
              }),
              (E.n = function (A) {
                var n =
                  A && A.__esModule
                    ? function () {
                        return A.default;
                      }
                    : function () {
                        return A;
                      };
                return (E.d(n, "a", n), n);
              }),
              (E.o = function (A, n) {
                return Object.prototype.hasOwnProperty.call(A, n);
              }),
              (E.p = ""),
              E((E.s = 20))
            );
          })([
            function (o, u) {
              var E = {};
              ((o.exports = E),
                (function () {
                  ((E._baseDelta = 1e3 / 60),
                    (E._nextId = 0),
                    (E._seed = 0),
                    (E._nowStartTime = +new Date()),
                    (E._warnedOnce = {}),
                    (E._decomp = null),
                    (E.extend = function (n, i) {
                      var I, C;
                      typeof i == "boolean"
                        ? ((I = 2), (C = i))
                        : ((I = 1), (C = !0));
                      for (var Q = I; Q < arguments.length; Q++) {
                        var B = arguments[Q];
                        if (B)
                          for (var k in B)
                            C &&
                            B[k] &&
                            B[k].constructor === Object &&
                            (!n[k] || n[k].constructor === Object)
                              ? ((n[k] = n[k] || {}), E.extend(n[k], C, B[k]))
                              : (n[k] = B[k]);
                      }
                      return n;
                    }),
                    (E.clone = function (n, i) {
                      return E.extend({}, i, n);
                    }),
                    (E.keys = function (n) {
                      if (Object.keys) return Object.keys(n);
                      var i = [];
                      for (var I in n) i.push(I);
                      return i;
                    }),
                    (E.values = function (n) {
                      var i = [];
                      if (Object.keys) {
                        for (var I = Object.keys(n), C = 0; C < I.length; C++)
                          i.push(n[I[C]]);
                        return i;
                      }
                      for (var Q in n) i.push(n[Q]);
                      return i;
                    }),
                    (E.get = function (n, i, I, C) {
                      i = i.split(".").slice(I, C);
                      for (var Q = 0; Q < i.length; Q += 1) n = n[i[Q]];
                      return n;
                    }),
                    (E.set = function (n, i, I, C, Q) {
                      var B = i.split(".").slice(C, Q);
                      return ((E.get(n, i, 0, -1)[B[B.length - 1]] = I), I);
                    }),
                    (E.shuffle = function (n) {
                      for (var i = n.length - 1; i > 0; i--) {
                        var I = Math.floor(E.random() * (i + 1)),
                          C = n[i];
                        ((n[i] = n[I]), (n[I] = C));
                      }
                      return n;
                    }),
                    (E.choose = function (n) {
                      return n[Math.floor(E.random() * n.length)];
                    }),
                    (E.isElement = function (n) {
                      return typeof HTMLElement < "u"
                        ? n instanceof HTMLElement
                        : !!(n && n.nodeType && n.nodeName);
                    }),
                    (E.isArray = function (n) {
                      return (
                        Object.prototype.toString.call(n) === "[object Array]"
                      );
                    }),
                    (E.isFunction = function (n) {
                      return typeof n == "function";
                    }),
                    (E.isPlainObject = function (n) {
                      return typeof n == "object" && n.constructor === Object;
                    }),
                    (E.isString = function (n) {
                      return toString.call(n) === "[object String]";
                    }),
                    (E.clamp = function (n, i, I) {
                      return n < i ? i : n > I ? I : n;
                    }),
                    (E.sign = function (n) {
                      return n < 0 ? -1 : 1;
                    }),
                    (E.now = function () {
                      if (typeof window < "u" && window.performance) {
                        if (window.performance.now)
                          return window.performance.now();
                        if (window.performance.webkitNow)
                          return window.performance.webkitNow();
                      }
                      return Date.now
                        ? Date.now()
                        : new Date() - E._nowStartTime;
                    }),
                    (E.random = function (n, i) {
                      return (
                        (n = typeof n < "u" ? n : 0),
                        (i = typeof i < "u" ? i : 1),
                        n + A() * (i - n)
                      );
                    }));
                  var A = function () {
                    return (
                      (E._seed = (E._seed * 9301 + 49297) % 233280),
                      E._seed / 233280
                    );
                  };
                  ((E.colorToNumber = function (n) {
                    return (
                      (n = n.replace("#", "")),
                      n.length == 3 &&
                        (n =
                          n.charAt(0) +
                          n.charAt(0) +
                          n.charAt(1) +
                          n.charAt(1) +
                          n.charAt(2) +
                          n.charAt(2)),
                      parseInt(n, 16)
                    );
                  }),
                    (E.logLevel = 1),
                    (E.log = function () {
                      console &&
                        E.logLevel > 0 &&
                        E.logLevel <= 3 &&
                        console.log.apply(
                          console,
                          ["matter-js:"].concat(
                            Array.prototype.slice.call(arguments),
                          ),
                        );
                    }),
                    (E.info = function () {
                      console &&
                        E.logLevel > 0 &&
                        E.logLevel <= 2 &&
                        console.info.apply(
                          console,
                          ["matter-js:"].concat(
                            Array.prototype.slice.call(arguments),
                          ),
                        );
                    }),
                    (E.warn = function () {
                      console &&
                        E.logLevel > 0 &&
                        E.logLevel <= 3 &&
                        console.warn.apply(
                          console,
                          ["matter-js:"].concat(
                            Array.prototype.slice.call(arguments),
                          ),
                        );
                    }),
                    (E.warnOnce = function () {
                      var n = Array.prototype.slice.call(arguments).join(" ");
                      E._warnedOnce[n] || (E.warn(n), (E._warnedOnce[n] = !0));
                    }),
                    (E.deprecated = function (n, i, I) {
                      n[i] = E.chain(function () {
                        E.warnOnce("🔅 deprecated 🔅", I);
                      }, n[i]);
                    }),
                    (E.nextId = function () {
                      return E._nextId++;
                    }),
                    (E.indexOf = function (n, i) {
                      if (n.indexOf) return n.indexOf(i);
                      for (var I = 0; I < n.length; I++)
                        if (n[I] === i) return I;
                      return -1;
                    }),
                    (E.map = function (n, i) {
                      if (n.map) return n.map(i);
                      for (var I = [], C = 0; C < n.length; C += 1)
                        I.push(i(n[C]));
                      return I;
                    }),
                    (E.topologicalSort = function (n) {
                      var i = [],
                        I = [],
                        C = [];
                      for (var Q in n)
                        !I[Q] && !C[Q] && E._topologicalSort(Q, I, C, n, i);
                      return i;
                    }),
                    (E._topologicalSort = function (n, i, I, C, Q) {
                      var B = C[n] || [];
                      I[n] = !0;
                      for (var k = 0; k < B.length; k += 1) {
                        var t = B[k];
                        I[t] || i[t] || E._topologicalSort(t, i, I, C, Q);
                      }
                      ((I[n] = !1), (i[n] = !0), Q.push(n));
                    }),
                    (E.chain = function () {
                      for (var n = [], i = 0; i < arguments.length; i += 1) {
                        var I = arguments[i];
                        I._chained ? n.push.apply(n, I._chained) : n.push(I);
                      }
                      var C = function () {
                        for (
                          var Q,
                            B = new Array(arguments.length),
                            k = 0,
                            t = arguments.length;
                          k < t;
                          k++
                        )
                          B[k] = arguments[k];
                        for (k = 0; k < n.length; k += 1) {
                          var a = n[k].apply(Q, B);
                          typeof a < "u" && (Q = a);
                        }
                        return Q;
                      };
                      return ((C._chained = n), C);
                    }),
                    (E.chainPathBefore = function (n, i, I) {
                      return E.set(n, i, E.chain(I, E.get(n, i)));
                    }),
                    (E.chainPathAfter = function (n, i, I) {
                      return E.set(n, i, E.chain(E.get(n, i), I));
                    }),
                    (E.setDecomp = function (n) {
                      E._decomp = n;
                    }),
                    (E.getDecomp = function () {
                      var n = E._decomp;
                      try {
                        (!n && typeof window < "u" && (n = window.decomp),
                          !n && typeof QI < "u" && (n = QI.decomp));
                      } catch {
                        n = null;
                      }
                      return n;
                    }));
                })());
            },
            function (o, u) {
              var E = {};
              ((o.exports = E),
                (function () {
                  ((E.create = function (A) {
                    var n = { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
                    return (A && E.update(n, A), n);
                  }),
                    (E.update = function (A, n, i) {
                      ((A.min.x = 1 / 0),
                        (A.max.x = -1 / 0),
                        (A.min.y = 1 / 0),
                        (A.max.y = -1 / 0));
                      for (var I = 0; I < n.length; I++) {
                        var C = n[I];
                        (C.x > A.max.x && (A.max.x = C.x),
                          C.x < A.min.x && (A.min.x = C.x),
                          C.y > A.max.y && (A.max.y = C.y),
                          C.y < A.min.y && (A.min.y = C.y));
                      }
                      i &&
                        (i.x > 0 ? (A.max.x += i.x) : (A.min.x += i.x),
                        i.y > 0 ? (A.max.y += i.y) : (A.min.y += i.y));
                    }),
                    (E.contains = function (A, n) {
                      return (
                        n.x >= A.min.x &&
                        n.x <= A.max.x &&
                        n.y >= A.min.y &&
                        n.y <= A.max.y
                      );
                    }),
                    (E.overlaps = function (A, n) {
                      return (
                        A.min.x <= n.max.x &&
                        A.max.x >= n.min.x &&
                        A.max.y >= n.min.y &&
                        A.min.y <= n.max.y
                      );
                    }),
                    (E.translate = function (A, n) {
                      ((A.min.x += n.x),
                        (A.max.x += n.x),
                        (A.min.y += n.y),
                        (A.max.y += n.y));
                    }),
                    (E.shift = function (A, n) {
                      var i = A.max.x - A.min.x,
                        I = A.max.y - A.min.y;
                      ((A.min.x = n.x),
                        (A.max.x = n.x + i),
                        (A.min.y = n.y),
                        (A.max.y = n.y + I));
                    }));
                })());
            },
            function (o, u) {
              var E = {};
              ((o.exports = E),
                (function () {
                  ((E.create = function (A, n) {
                    return { x: A || 0, y: n || 0 };
                  }),
                    (E.clone = function (A) {
                      return { x: A.x, y: A.y };
                    }),
                    (E.magnitude = function (A) {
                      return Math.sqrt(A.x * A.x + A.y * A.y);
                    }),
                    (E.magnitudeSquared = function (A) {
                      return A.x * A.x + A.y * A.y;
                    }),
                    (E.rotate = function (A, n, i) {
                      var I = Math.cos(n),
                        C = Math.sin(n);
                      i || (i = {});
                      var Q = A.x * I - A.y * C;
                      return ((i.y = A.x * C + A.y * I), (i.x = Q), i);
                    }),
                    (E.rotateAbout = function (A, n, i, I) {
                      var C = Math.cos(n),
                        Q = Math.sin(n);
                      I || (I = {});
                      var B = i.x + ((A.x - i.x) * C - (A.y - i.y) * Q);
                      return (
                        (I.y = i.y + ((A.x - i.x) * Q + (A.y - i.y) * C)),
                        (I.x = B),
                        I
                      );
                    }),
                    (E.normalise = function (A) {
                      var n = E.magnitude(A);
                      return n === 0
                        ? { x: 0, y: 0 }
                        : { x: A.x / n, y: A.y / n };
                    }),
                    (E.dot = function (A, n) {
                      return A.x * n.x + A.y * n.y;
                    }),
                    (E.cross = function (A, n) {
                      return A.x * n.y - A.y * n.x;
                    }),
                    (E.cross3 = function (A, n, i) {
                      return (
                        (n.x - A.x) * (i.y - A.y) - (n.y - A.y) * (i.x - A.x)
                      );
                    }),
                    (E.add = function (A, n, i) {
                      return (
                        i || (i = {}),
                        (i.x = A.x + n.x),
                        (i.y = A.y + n.y),
                        i
                      );
                    }),
                    (E.sub = function (A, n, i) {
                      return (
                        i || (i = {}),
                        (i.x = A.x - n.x),
                        (i.y = A.y - n.y),
                        i
                      );
                    }),
                    (E.mult = function (A, n) {
                      return { x: A.x * n, y: A.y * n };
                    }),
                    (E.div = function (A, n) {
                      return { x: A.x / n, y: A.y / n };
                    }),
                    (E.perp = function (A, n) {
                      return (
                        (n = n === !0 ? -1 : 1),
                        { x: n * -A.y, y: n * A.x }
                      );
                    }),
                    (E.neg = function (A) {
                      return { x: -A.x, y: -A.y };
                    }),
                    (E.angle = function (A, n) {
                      return Math.atan2(n.y - A.y, n.x - A.x);
                    }),
                    (E._temp = [
                      E.create(),
                      E.create(),
                      E.create(),
                      E.create(),
                      E.create(),
                      E.create(),
                    ]));
                })());
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(2),
                i = E(0);
              (function () {
                ((A.create = function (I, C) {
                  for (var Q = [], B = 0; B < I.length; B++) {
                    var k = I[B],
                      t = { x: k.x, y: k.y, index: B, body: C, isInternal: !1 };
                    Q.push(t);
                  }
                  return Q;
                }),
                  (A.fromPath = function (I, C) {
                    var Q = /L?\s*([-\d.e]+)[\s,]*([-\d.e]+)*/gi,
                      B = [];
                    return (
                      I.replace(Q, function (k, t, a) {
                        B.push({ x: parseFloat(t), y: parseFloat(a) });
                      }),
                      A.create(B, C)
                    );
                  }),
                  (A.centre = function (I) {
                    for (
                      var C = A.area(I, !0), Q = { x: 0, y: 0 }, B, k, t, a = 0;
                      a < I.length;
                      a++
                    )
                      ((t = (a + 1) % I.length),
                        (B = n.cross(I[a], I[t])),
                        (k = n.mult(n.add(I[a], I[t]), B)),
                        (Q = n.add(Q, k)));
                    return n.div(Q, 6 * C);
                  }),
                  (A.mean = function (I) {
                    for (var C = { x: 0, y: 0 }, Q = 0; Q < I.length; Q++)
                      ((C.x += I[Q].x), (C.y += I[Q].y));
                    return n.div(C, I.length);
                  }),
                  (A.area = function (I, C) {
                    for (var Q = 0, B = I.length - 1, k = 0; k < I.length; k++)
                      ((Q += (I[B].x - I[k].x) * (I[B].y + I[k].y)), (B = k));
                    return C ? Q / 2 : Math.abs(Q) / 2;
                  }),
                  (A.inertia = function (I, C) {
                    for (
                      var Q = 0, B = 0, k = I, t, a, s = 0;
                      s < k.length;
                      s++
                    )
                      ((a = (s + 1) % k.length),
                        (t = Math.abs(n.cross(k[a], k[s]))),
                        (Q +=
                          t *
                          (n.dot(k[a], k[a]) +
                            n.dot(k[a], k[s]) +
                            n.dot(k[s], k[s]))),
                        (B += t));
                    return (C / 6) * (Q / B);
                  }),
                  (A.translate = function (I, C, Q) {
                    Q = typeof Q < "u" ? Q : 1;
                    var B = I.length,
                      k = C.x * Q,
                      t = C.y * Q,
                      a;
                    for (a = 0; a < B; a++) ((I[a].x += k), (I[a].y += t));
                    return I;
                  }),
                  (A.rotate = function (I, C, Q) {
                    if (C !== 0) {
                      var B = Math.cos(C),
                        k = Math.sin(C),
                        t = Q.x,
                        a = Q.y,
                        s = I.length,
                        r,
                        d,
                        M,
                        S;
                      for (S = 0; S < s; S++)
                        ((r = I[S]),
                          (d = r.x - t),
                          (M = r.y - a),
                          (r.x = t + (d * B - M * k)),
                          (r.y = a + (d * k + M * B)));
                      return I;
                    }
                  }),
                  (A.contains = function (I, C) {
                    for (
                      var Q = C.x,
                        B = C.y,
                        k = I.length,
                        t = I[k - 1],
                        a,
                        s = 0;
                      s < k;
                      s++
                    ) {
                      if (
                        ((a = I[s]),
                        (Q - t.x) * (a.y - t.y) + (B - t.y) * (t.x - a.x) > 0)
                      )
                        return !1;
                      t = a;
                    }
                    return !0;
                  }),
                  (A.scale = function (I, C, Q, B) {
                    if (C === 1 && Q === 1) return I;
                    B = B || A.centre(I);
                    for (var k, t, a = 0; a < I.length; a++)
                      ((k = I[a]),
                        (t = n.sub(k, B)),
                        (I[a].x = B.x + t.x * C),
                        (I[a].y = B.y + t.y * Q));
                    return I;
                  }),
                  (A.chamfer = function (I, C, Q, B, k) {
                    (typeof C == "number" ? (C = [C]) : (C = C || [8]),
                      (Q = typeof Q < "u" ? Q : -1),
                      (B = B || 2),
                      (k = k || 14));
                    for (var t = [], a = 0; a < I.length; a++) {
                      var s = I[a - 1 >= 0 ? a - 1 : I.length - 1],
                        r = I[a],
                        d = I[(a + 1) % I.length],
                        M = C[a < C.length ? a : C.length - 1];
                      if (M === 0) {
                        t.push(r);
                        continue;
                      }
                      var S = n.normalise({ x: r.y - s.y, y: s.x - r.x }),
                        v = n.normalise({ x: d.y - r.y, y: r.x - d.x }),
                        f = Math.sqrt(2 * Math.pow(M, 2)),
                        l = n.mult(i.clone(S), M),
                        R = n.normalise(n.mult(n.add(S, v), 0.5)),
                        h = n.sub(r, n.mult(R, f)),
                        c = Q;
                      (Q === -1 && (c = Math.pow(M, 0.32) * 1.75),
                        (c = i.clamp(c, B, k)),
                        c % 2 === 1 && (c += 1));
                      for (
                        var m = Math.acos(n.dot(S, v)), Y = m / c, J = 0;
                        J < c;
                        J++
                      )
                        t.push(n.add(n.rotate(l, Y * J), h));
                    }
                    return t;
                  }),
                  (A.clockwiseSort = function (I) {
                    var C = A.mean(I);
                    return (
                      I.sort(function (Q, B) {
                        return n.angle(C, Q) - n.angle(C, B);
                      }),
                      I
                    );
                  }),
                  (A.isConvex = function (I) {
                    var C = 0,
                      Q = I.length,
                      B,
                      k,
                      t,
                      a;
                    if (Q < 3) return null;
                    for (B = 0; B < Q; B++)
                      if (
                        ((k = (B + 1) % Q),
                        (t = (B + 2) % Q),
                        (a = (I[k].x - I[B].x) * (I[t].y - I[k].y)),
                        (a -= (I[k].y - I[B].y) * (I[t].x - I[k].x)),
                        a < 0 ? (C |= 1) : a > 0 && (C |= 2),
                        C === 3)
                      )
                        return !1;
                    return C !== 0 ? !0 : null;
                  }),
                  (A.hull = function (I) {
                    var C = [],
                      Q = [],
                      B,
                      k;
                    for (
                      I = I.slice(0),
                        I.sort(function (t, a) {
                          var s = t.x - a.x;
                          return s !== 0 ? s : t.y - a.y;
                        }),
                        k = 0;
                      k < I.length;
                      k += 1
                    ) {
                      for (
                        B = I[k];
                        Q.length >= 2 &&
                        n.cross3(Q[Q.length - 2], Q[Q.length - 1], B) <= 0;
                      )
                        Q.pop();
                      Q.push(B);
                    }
                    for (k = I.length - 1; k >= 0; k -= 1) {
                      for (
                        B = I[k];
                        C.length >= 2 &&
                        n.cross3(C[C.length - 2], C[C.length - 1], B) <= 0;
                      )
                        C.pop();
                      C.push(B);
                    }
                    return (C.pop(), Q.pop(), C.concat(Q));
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(3),
                i = E(2),
                I = E(7),
                C = E(0),
                Q = E(1),
                B = E(11);
              (function () {
                ((A._timeCorrection = !0),
                  (A._inertiaScale = 4),
                  (A._nextCollidingGroupId = 1),
                  (A._nextNonCollidingGroupId = -1),
                  (A._nextCategory = 1),
                  (A._baseDelta = 1e3 / 60),
                  (A.create = function (t) {
                    var a = {
                        id: C.nextId(),
                        type: "body",
                        label: "Body",
                        parts: [],
                        plugin: {},
                        angle: 0,
                        vertices: n.fromPath("L 0 0 L 40 0 L 40 40 L 0 40"),
                        position: { x: 0, y: 0 },
                        force: { x: 0, y: 0 },
                        torque: 0,
                        positionImpulse: { x: 0, y: 0 },
                        constraintImpulse: { x: 0, y: 0, angle: 0 },
                        totalContacts: 0,
                        speed: 0,
                        angularSpeed: 0,
                        velocity: { x: 0, y: 0 },
                        angularVelocity: 0,
                        isSensor: !1,
                        isStatic: !1,
                        isSleeping: !1,
                        motion: 0,
                        sleepThreshold: 60,
                        density: 0.001,
                        restitution: 0,
                        friction: 0.1,
                        frictionStatic: 0.5,
                        frictionAir: 0.01,
                        collisionFilter: {
                          category: 1,
                          mask: 4294967295,
                          group: 0,
                        },
                        slop: 0.05,
                        timeScale: 1,
                        render: {
                          visible: !0,
                          opacity: 1,
                          strokeStyle: null,
                          fillStyle: null,
                          lineWidth: null,
                          sprite: {
                            xScale: 1,
                            yScale: 1,
                            xOffset: 0,
                            yOffset: 0,
                          },
                        },
                        events: null,
                        bounds: null,
                        chamfer: null,
                        circleRadius: 0,
                        positionPrev: null,
                        anglePrev: 0,
                        parent: null,
                        axes: null,
                        area: 0,
                        mass: 0,
                        inertia: 0,
                        deltaTime: 16.666666666666668,
                        _original: null,
                      },
                      s = C.extend(a, t);
                    return (k(s, t), s);
                  }),
                  (A.nextGroup = function (t) {
                    return t
                      ? A._nextNonCollidingGroupId--
                      : A._nextCollidingGroupId++;
                  }),
                  (A.nextCategory = function () {
                    return (
                      (A._nextCategory = A._nextCategory << 1),
                      A._nextCategory
                    );
                  }));
                var k = function (t, a) {
                  ((a = a || {}),
                    A.set(t, {
                      bounds: t.bounds || Q.create(t.vertices),
                      positionPrev: t.positionPrev || i.clone(t.position),
                      anglePrev: t.anglePrev || t.angle,
                      vertices: t.vertices,
                      parts: t.parts || [t],
                      isStatic: t.isStatic,
                      isSleeping: t.isSleeping,
                      parent: t.parent || t,
                    }),
                    n.rotate(t.vertices, t.angle, t.position),
                    B.rotate(t.axes, t.angle),
                    Q.update(t.bounds, t.vertices, t.velocity),
                    A.set(t, {
                      axes: a.axes || t.axes,
                      area: a.area || t.area,
                      mass: a.mass || t.mass,
                      inertia: a.inertia || t.inertia,
                    }));
                  var s = t.isStatic
                      ? "#14151f"
                      : C.choose([
                          "#f19648",
                          "#f5d259",
                          "#f55a3c",
                          "#063e7b",
                          "#ececd1",
                        ]),
                    r = t.isStatic ? "#555" : "#ccc",
                    d = t.isStatic && t.render.fillStyle === null ? 1 : 0;
                  ((t.render.fillStyle = t.render.fillStyle || s),
                    (t.render.strokeStyle = t.render.strokeStyle || r),
                    (t.render.lineWidth = t.render.lineWidth || d),
                    (t.render.sprite.xOffset +=
                      -(t.bounds.min.x - t.position.x) /
                      (t.bounds.max.x - t.bounds.min.x)),
                    (t.render.sprite.yOffset +=
                      -(t.bounds.min.y - t.position.y) /
                      (t.bounds.max.y - t.bounds.min.y)));
                };
                ((A.set = function (t, a, s) {
                  var r;
                  typeof a == "string" && ((r = a), (a = {}), (a[r] = s));
                  for (r in a)
                    if (Object.prototype.hasOwnProperty.call(a, r))
                      switch (((s = a[r]), r)) {
                        case "isStatic":
                          A.setStatic(t, s);
                          break;
                        case "isSleeping":
                          I.set(t, s);
                          break;
                        case "mass":
                          A.setMass(t, s);
                          break;
                        case "density":
                          A.setDensity(t, s);
                          break;
                        case "inertia":
                          A.setInertia(t, s);
                          break;
                        case "vertices":
                          A.setVertices(t, s);
                          break;
                        case "position":
                          A.setPosition(t, s);
                          break;
                        case "angle":
                          A.setAngle(t, s);
                          break;
                        case "velocity":
                          A.setVelocity(t, s);
                          break;
                        case "angularVelocity":
                          A.setAngularVelocity(t, s);
                          break;
                        case "speed":
                          A.setSpeed(t, s);
                          break;
                        case "angularSpeed":
                          A.setAngularSpeed(t, s);
                          break;
                        case "parts":
                          A.setParts(t, s);
                          break;
                        case "centre":
                          A.setCentre(t, s);
                          break;
                        default:
                          t[r] = s;
                      }
                }),
                  (A.setStatic = function (t, a) {
                    for (var s = 0; s < t.parts.length; s++) {
                      var r = t.parts[s];
                      (a
                        ? (r.isStatic ||
                            (r._original = {
                              restitution: r.restitution,
                              friction: r.friction,
                              mass: r.mass,
                              inertia: r.inertia,
                              density: r.density,
                              inverseMass: r.inverseMass,
                              inverseInertia: r.inverseInertia,
                            }),
                          (r.restitution = 0),
                          (r.friction = 1),
                          (r.mass = r.inertia = r.density = 1 / 0),
                          (r.inverseMass = r.inverseInertia = 0),
                          (r.positionPrev.x = r.position.x),
                          (r.positionPrev.y = r.position.y),
                          (r.anglePrev = r.angle),
                          (r.angularVelocity = 0),
                          (r.speed = 0),
                          (r.angularSpeed = 0),
                          (r.motion = 0))
                        : r._original &&
                          ((r.restitution = r._original.restitution),
                          (r.friction = r._original.friction),
                          (r.mass = r._original.mass),
                          (r.inertia = r._original.inertia),
                          (r.density = r._original.density),
                          (r.inverseMass = r._original.inverseMass),
                          (r.inverseInertia = r._original.inverseInertia),
                          (r._original = null)),
                        (r.isStatic = a));
                    }
                  }),
                  (A.setMass = function (t, a) {
                    var s = t.inertia / (t.mass / 6);
                    ((t.inertia = s * (a / 6)),
                      (t.inverseInertia = 1 / t.inertia),
                      (t.mass = a),
                      (t.inverseMass = 1 / t.mass),
                      (t.density = t.mass / t.area));
                  }),
                  (A.setDensity = function (t, a) {
                    (A.setMass(t, a * t.area), (t.density = a));
                  }),
                  (A.setInertia = function (t, a) {
                    ((t.inertia = a), (t.inverseInertia = 1 / t.inertia));
                  }),
                  (A.setVertices = function (t, a) {
                    (a[0].body === t
                      ? (t.vertices = a)
                      : (t.vertices = n.create(a, t)),
                      (t.axes = B.fromVertices(t.vertices)),
                      (t.area = n.area(t.vertices)),
                      A.setMass(t, t.density * t.area));
                    var s = n.centre(t.vertices);
                    (n.translate(t.vertices, s, -1),
                      A.setInertia(
                        t,
                        A._inertiaScale * n.inertia(t.vertices, t.mass),
                      ),
                      n.translate(t.vertices, t.position),
                      Q.update(t.bounds, t.vertices, t.velocity));
                  }),
                  (A.setParts = function (t, a, s) {
                    var r;
                    for (
                      a = a.slice(0),
                        t.parts.length = 0,
                        t.parts.push(t),
                        t.parent = t,
                        r = 0;
                      r < a.length;
                      r++
                    ) {
                      var d = a[r];
                      d !== t && ((d.parent = t), t.parts.push(d));
                    }
                    if (t.parts.length !== 1) {
                      if (((s = typeof s < "u" ? s : !0), s)) {
                        var M = [];
                        for (r = 0; r < a.length; r++)
                          M = M.concat(a[r].vertices);
                        n.clockwiseSort(M);
                        var S = n.hull(M),
                          v = n.centre(S);
                        (A.setVertices(t, S), n.translate(t.vertices, v));
                      }
                      var f = A._totalProperties(t);
                      ((t.area = f.area),
                        (t.parent = t),
                        (t.position.x = f.centre.x),
                        (t.position.y = f.centre.y),
                        (t.positionPrev.x = f.centre.x),
                        (t.positionPrev.y = f.centre.y),
                        A.setMass(t, f.mass),
                        A.setInertia(t, f.inertia),
                        A.setPosition(t, f.centre));
                    }
                  }),
                  (A.setCentre = function (t, a, s) {
                    s
                      ? ((t.positionPrev.x += a.x),
                        (t.positionPrev.y += a.y),
                        (t.position.x += a.x),
                        (t.position.y += a.y))
                      : ((t.positionPrev.x =
                          a.x - (t.position.x - t.positionPrev.x)),
                        (t.positionPrev.y =
                          a.y - (t.position.y - t.positionPrev.y)),
                        (t.position.x = a.x),
                        (t.position.y = a.y));
                  }),
                  (A.setPosition = function (t, a, s) {
                    var r = i.sub(a, t.position);
                    s
                      ? ((t.positionPrev.x = t.position.x),
                        (t.positionPrev.y = t.position.y),
                        (t.velocity.x = r.x),
                        (t.velocity.y = r.y),
                        (t.speed = i.magnitude(r)))
                      : ((t.positionPrev.x += r.x), (t.positionPrev.y += r.y));
                    for (var d = 0; d < t.parts.length; d++) {
                      var M = t.parts[d];
                      ((M.position.x += r.x),
                        (M.position.y += r.y),
                        n.translate(M.vertices, r),
                        Q.update(M.bounds, M.vertices, t.velocity));
                    }
                  }),
                  (A.setAngle = function (t, a, s) {
                    var r = a - t.angle;
                    s
                      ? ((t.anglePrev = t.angle),
                        (t.angularVelocity = r),
                        (t.angularSpeed = Math.abs(r)))
                      : (t.anglePrev += r);
                    for (var d = 0; d < t.parts.length; d++) {
                      var M = t.parts[d];
                      ((M.angle += r),
                        n.rotate(M.vertices, r, t.position),
                        B.rotate(M.axes, r),
                        Q.update(M.bounds, M.vertices, t.velocity),
                        d > 0 &&
                          i.rotateAbout(M.position, r, t.position, M.position));
                    }
                  }),
                  (A.setVelocity = function (t, a) {
                    var s = t.deltaTime / A._baseDelta;
                    ((t.positionPrev.x = t.position.x - a.x * s),
                      (t.positionPrev.y = t.position.y - a.y * s),
                      (t.velocity.x = (t.position.x - t.positionPrev.x) / s),
                      (t.velocity.y = (t.position.y - t.positionPrev.y) / s),
                      (t.speed = i.magnitude(t.velocity)));
                  }),
                  (A.getVelocity = function (t) {
                    var a = A._baseDelta / t.deltaTime;
                    return {
                      x: (t.position.x - t.positionPrev.x) * a,
                      y: (t.position.y - t.positionPrev.y) * a,
                    };
                  }),
                  (A.getSpeed = function (t) {
                    return i.magnitude(A.getVelocity(t));
                  }),
                  (A.setSpeed = function (t, a) {
                    A.setVelocity(t, i.mult(i.normalise(A.getVelocity(t)), a));
                  }),
                  (A.setAngularVelocity = function (t, a) {
                    var s = t.deltaTime / A._baseDelta;
                    ((t.anglePrev = t.angle - a * s),
                      (t.angularVelocity = (t.angle - t.anglePrev) / s),
                      (t.angularSpeed = Math.abs(t.angularVelocity)));
                  }),
                  (A.getAngularVelocity = function (t) {
                    return (
                      ((t.angle - t.anglePrev) * A._baseDelta) / t.deltaTime
                    );
                  }),
                  (A.getAngularSpeed = function (t) {
                    return Math.abs(A.getAngularVelocity(t));
                  }),
                  (A.setAngularSpeed = function (t, a) {
                    A.setAngularVelocity(
                      t,
                      C.sign(A.getAngularVelocity(t)) * a,
                    );
                  }),
                  (A.translate = function (t, a, s) {
                    A.setPosition(t, i.add(t.position, a), s);
                  }),
                  (A.rotate = function (t, a, s, r) {
                    if (!s) A.setAngle(t, t.angle + a, r);
                    else {
                      var d = Math.cos(a),
                        M = Math.sin(a),
                        S = t.position.x - s.x,
                        v = t.position.y - s.y;
                      (A.setPosition(
                        t,
                        { x: s.x + (S * d - v * M), y: s.y + (S * M + v * d) },
                        r,
                      ),
                        A.setAngle(t, t.angle + a, r));
                    }
                  }),
                  (A.scale = function (t, a, s, r) {
                    var d = 0,
                      M = 0;
                    r = r || t.position;
                    for (var S = 0; S < t.parts.length; S++) {
                      var v = t.parts[S];
                      (n.scale(v.vertices, a, s, r),
                        (v.axes = B.fromVertices(v.vertices)),
                        (v.area = n.area(v.vertices)),
                        A.setMass(v, t.density * v.area),
                        n.translate(v.vertices, {
                          x: -v.position.x,
                          y: -v.position.y,
                        }),
                        A.setInertia(
                          v,
                          A._inertiaScale * n.inertia(v.vertices, v.mass),
                        ),
                        n.translate(v.vertices, {
                          x: v.position.x,
                          y: v.position.y,
                        }),
                        S > 0 && ((d += v.area), (M += v.inertia)),
                        (v.position.x = r.x + (v.position.x - r.x) * a),
                        (v.position.y = r.y + (v.position.y - r.y) * s),
                        Q.update(v.bounds, v.vertices, t.velocity));
                    }
                    (t.parts.length > 1 &&
                      ((t.area = d),
                      t.isStatic ||
                        (A.setMass(t, t.density * d), A.setInertia(t, M))),
                      t.circleRadius &&
                        (a === s
                          ? (t.circleRadius *= a)
                          : (t.circleRadius = null)));
                  }),
                  (A.update = function (t, a) {
                    a = (typeof a < "u" ? a : 1e3 / 60) * t.timeScale;
                    var s = a * a,
                      r = A._timeCorrection ? a / (t.deltaTime || a) : 1,
                      d = 1 - t.frictionAir * (a / C._baseDelta),
                      M = (t.position.x - t.positionPrev.x) * r,
                      S = (t.position.y - t.positionPrev.y) * r;
                    ((t.velocity.x = M * d + (t.force.x / t.mass) * s),
                      (t.velocity.y = S * d + (t.force.y / t.mass) * s),
                      (t.positionPrev.x = t.position.x),
                      (t.positionPrev.y = t.position.y),
                      (t.position.x += t.velocity.x),
                      (t.position.y += t.velocity.y),
                      (t.deltaTime = a),
                      (t.angularVelocity =
                        (t.angle - t.anglePrev) * d * r +
                        (t.torque / t.inertia) * s),
                      (t.anglePrev = t.angle),
                      (t.angle += t.angularVelocity));
                    for (var v = 0; v < t.parts.length; v++) {
                      var f = t.parts[v];
                      (n.translate(f.vertices, t.velocity),
                        v > 0 &&
                          ((f.position.x += t.velocity.x),
                          (f.position.y += t.velocity.y)),
                        t.angularVelocity !== 0 &&
                          (n.rotate(f.vertices, t.angularVelocity, t.position),
                          B.rotate(f.axes, t.angularVelocity),
                          v > 0 &&
                            i.rotateAbout(
                              f.position,
                              t.angularVelocity,
                              t.position,
                              f.position,
                            )),
                        Q.update(f.bounds, f.vertices, t.velocity));
                    }
                  }),
                  (A.updateVelocities = function (t) {
                    var a = A._baseDelta / t.deltaTime,
                      s = t.velocity;
                    ((s.x = (t.position.x - t.positionPrev.x) * a),
                      (s.y = (t.position.y - t.positionPrev.y) * a),
                      (t.speed = Math.sqrt(s.x * s.x + s.y * s.y)),
                      (t.angularVelocity = (t.angle - t.anglePrev) * a),
                      (t.angularSpeed = Math.abs(t.angularVelocity)));
                  }),
                  (A.applyForce = function (t, a, s) {
                    var r = { x: a.x - t.position.x, y: a.y - t.position.y };
                    ((t.force.x += s.x),
                      (t.force.y += s.y),
                      (t.torque += r.x * s.y - r.y * s.x));
                  }),
                  (A._totalProperties = function (t) {
                    for (
                      var a = {
                          mass: 0,
                          area: 0,
                          inertia: 0,
                          centre: { x: 0, y: 0 },
                        },
                        s = t.parts.length === 1 ? 0 : 1;
                      s < t.parts.length;
                      s++
                    ) {
                      var r = t.parts[s],
                        d = r.mass !== 1 / 0 ? r.mass : 1;
                      ((a.mass += d),
                        (a.area += r.area),
                        (a.inertia += r.inertia),
                        (a.centre = i.add(a.centre, i.mult(r.position, d))));
                    }
                    return ((a.centre = i.div(a.centre, a.mass)), a);
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(0);
              (function () {
                ((A.on = function (i, I, C) {
                  for (var Q = I.split(" "), B, k = 0; k < Q.length; k++)
                    ((B = Q[k]),
                      (i.events = i.events || {}),
                      (i.events[B] = i.events[B] || []),
                      i.events[B].push(C));
                  return C;
                }),
                  (A.off = function (i, I, C) {
                    if (!I) {
                      i.events = {};
                      return;
                    }
                    typeof I == "function" &&
                      ((C = I), (I = n.keys(i.events).join(" ")));
                    for (var Q = I.split(" "), B = 0; B < Q.length; B++) {
                      var k = i.events[Q[B]],
                        t = [];
                      if (C && k)
                        for (var a = 0; a < k.length; a++)
                          k[a] !== C && t.push(k[a]);
                      i.events[Q[B]] = t;
                    }
                  }),
                  (A.trigger = function (i, I, C) {
                    var Q,
                      B,
                      k,
                      t,
                      a = i.events;
                    if (a && n.keys(a).length > 0) {
                      (C || (C = {}), (Q = I.split(" ")));
                      for (var s = 0; s < Q.length; s++)
                        if (((B = Q[s]), (k = a[B]), k)) {
                          ((t = n.clone(C, !1)), (t.name = B), (t.source = i));
                          for (var r = 0; r < k.length; r++) k[r].apply(i, [t]);
                        }
                    }
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(5),
                i = E(0),
                I = E(1),
                C = E(4);
              (function () {
                ((A.create = function (Q) {
                  return i.extend(
                    {
                      id: i.nextId(),
                      type: "composite",
                      parent: null,
                      isModified: !1,
                      bodies: [],
                      constraints: [],
                      composites: [],
                      label: "Composite",
                      plugin: {},
                      cache: {
                        allBodies: null,
                        allConstraints: null,
                        allComposites: null,
                      },
                    },
                    Q,
                  );
                }),
                  (A.setModified = function (Q, B, k, t) {
                    if (
                      ((Q.isModified = B),
                      B &&
                        Q.cache &&
                        ((Q.cache.allBodies = null),
                        (Q.cache.allConstraints = null),
                        (Q.cache.allComposites = null)),
                      k && Q.parent && A.setModified(Q.parent, B, k, t),
                      t)
                    )
                      for (var a = 0; a < Q.composites.length; a++) {
                        var s = Q.composites[a];
                        A.setModified(s, B, k, t);
                      }
                  }),
                  (A.add = function (Q, B) {
                    var k = [].concat(B);
                    n.trigger(Q, "beforeAdd", { object: B });
                    for (var t = 0; t < k.length; t++) {
                      var a = k[t];
                      switch (a.type) {
                        case "body":
                          if (a.parent !== a) {
                            i.warn(
                              "Composite.add: skipped adding a compound body part (you must add its parent instead)",
                            );
                            break;
                          }
                          A.addBody(Q, a);
                          break;
                        case "constraint":
                          A.addConstraint(Q, a);
                          break;
                        case "composite":
                          A.addComposite(Q, a);
                          break;
                        case "mouseConstraint":
                          A.addConstraint(Q, a.constraint);
                          break;
                      }
                    }
                    return (n.trigger(Q, "afterAdd", { object: B }), Q);
                  }),
                  (A.remove = function (Q, B, k) {
                    var t = [].concat(B);
                    n.trigger(Q, "beforeRemove", { object: B });
                    for (var a = 0; a < t.length; a++) {
                      var s = t[a];
                      switch (s.type) {
                        case "body":
                          A.removeBody(Q, s, k);
                          break;
                        case "constraint":
                          A.removeConstraint(Q, s, k);
                          break;
                        case "composite":
                          A.removeComposite(Q, s, k);
                          break;
                        case "mouseConstraint":
                          A.removeConstraint(Q, s.constraint);
                          break;
                      }
                    }
                    return (n.trigger(Q, "afterRemove", { object: B }), Q);
                  }),
                  (A.addComposite = function (Q, B) {
                    return (
                      Q.composites.push(B),
                      (B.parent = Q),
                      A.setModified(Q, !0, !0, !1),
                      Q
                    );
                  }),
                  (A.removeComposite = function (Q, B, k) {
                    var t = i.indexOf(Q.composites, B);
                    if (t !== -1) {
                      var a = A.allBodies(B);
                      A.removeCompositeAt(Q, t);
                      for (var s = 0; s < a.length; s++) a[s].sleepCounter = 0;
                    }
                    if (k)
                      for (var s = 0; s < Q.composites.length; s++)
                        A.removeComposite(Q.composites[s], B, !0);
                    return Q;
                  }),
                  (A.removeCompositeAt = function (Q, B) {
                    return (
                      Q.composites.splice(B, 1),
                      A.setModified(Q, !0, !0, !1),
                      Q
                    );
                  }),
                  (A.addBody = function (Q, B) {
                    return (Q.bodies.push(B), A.setModified(Q, !0, !0, !1), Q);
                  }),
                  (A.removeBody = function (Q, B, k) {
                    var t = i.indexOf(Q.bodies, B);
                    if (
                      (t !== -1 && (A.removeBodyAt(Q, t), (B.sleepCounter = 0)),
                      k)
                    )
                      for (var a = 0; a < Q.composites.length; a++)
                        A.removeBody(Q.composites[a], B, !0);
                    return Q;
                  }),
                  (A.removeBodyAt = function (Q, B) {
                    return (
                      Q.bodies.splice(B, 1),
                      A.setModified(Q, !0, !0, !1),
                      Q
                    );
                  }),
                  (A.addConstraint = function (Q, B) {
                    return (
                      Q.constraints.push(B),
                      A.setModified(Q, !0, !0, !1),
                      Q
                    );
                  }),
                  (A.removeConstraint = function (Q, B, k) {
                    var t = i.indexOf(Q.constraints, B);
                    if ((t !== -1 && A.removeConstraintAt(Q, t), k))
                      for (var a = 0; a < Q.composites.length; a++)
                        A.removeConstraint(Q.composites[a], B, !0);
                    return Q;
                  }),
                  (A.removeConstraintAt = function (Q, B) {
                    return (
                      Q.constraints.splice(B, 1),
                      A.setModified(Q, !0, !0, !1),
                      Q
                    );
                  }),
                  (A.clear = function (Q, B, k) {
                    if (k)
                      for (var t = 0; t < Q.composites.length; t++)
                        A.clear(Q.composites[t], B, !0);
                    return (
                      B
                        ? (Q.bodies = Q.bodies.filter(function (a) {
                            return a.isStatic;
                          }))
                        : (Q.bodies.length = 0),
                      (Q.constraints.length = 0),
                      (Q.composites.length = 0),
                      A.setModified(Q, !0, !0, !1),
                      Q
                    );
                  }),
                  (A.allBodies = function (Q) {
                    if (Q.cache && Q.cache.allBodies) return Q.cache.allBodies;
                    for (
                      var B = [].concat(Q.bodies), k = 0;
                      k < Q.composites.length;
                      k++
                    )
                      B = B.concat(A.allBodies(Q.composites[k]));
                    return (Q.cache && (Q.cache.allBodies = B), B);
                  }),
                  (A.allConstraints = function (Q) {
                    if (Q.cache && Q.cache.allConstraints)
                      return Q.cache.allConstraints;
                    for (
                      var B = [].concat(Q.constraints), k = 0;
                      k < Q.composites.length;
                      k++
                    )
                      B = B.concat(A.allConstraints(Q.composites[k]));
                    return (Q.cache && (Q.cache.allConstraints = B), B);
                  }),
                  (A.allComposites = function (Q) {
                    if (Q.cache && Q.cache.allComposites)
                      return Q.cache.allComposites;
                    for (
                      var B = [].concat(Q.composites), k = 0;
                      k < Q.composites.length;
                      k++
                    )
                      B = B.concat(A.allComposites(Q.composites[k]));
                    return (Q.cache && (Q.cache.allComposites = B), B);
                  }),
                  (A.get = function (Q, B, k) {
                    var t, a;
                    switch (k) {
                      case "body":
                        t = A.allBodies(Q);
                        break;
                      case "constraint":
                        t = A.allConstraints(Q);
                        break;
                      case "composite":
                        t = A.allComposites(Q).concat(Q);
                        break;
                    }
                    return t
                      ? ((a = t.filter(function (s) {
                          return s.id.toString() === B.toString();
                        })),
                        a.length === 0 ? null : a[0])
                      : null;
                  }),
                  (A.move = function (Q, B, k) {
                    return (A.remove(Q, B), A.add(k, B), Q);
                  }),
                  (A.rebase = function (Q) {
                    for (
                      var B = A.allBodies(Q)
                          .concat(A.allConstraints(Q))
                          .concat(A.allComposites(Q)),
                        k = 0;
                      k < B.length;
                      k++
                    )
                      B[k].id = i.nextId();
                    return Q;
                  }),
                  (A.translate = function (Q, B, k) {
                    for (
                      var t = k ? A.allBodies(Q) : Q.bodies, a = 0;
                      a < t.length;
                      a++
                    )
                      C.translate(t[a], B);
                    return Q;
                  }),
                  (A.rotate = function (Q, B, k, t) {
                    for (
                      var a = Math.cos(B),
                        s = Math.sin(B),
                        r = t ? A.allBodies(Q) : Q.bodies,
                        d = 0;
                      d < r.length;
                      d++
                    ) {
                      var M = r[d],
                        S = M.position.x - k.x,
                        v = M.position.y - k.y;
                      (C.setPosition(M, {
                        x: k.x + (S * a - v * s),
                        y: k.y + (S * s + v * a),
                      }),
                        C.rotate(M, B));
                    }
                    return Q;
                  }),
                  (A.scale = function (Q, B, k, t, a) {
                    for (
                      var s = a ? A.allBodies(Q) : Q.bodies, r = 0;
                      r < s.length;
                      r++
                    ) {
                      var d = s[r],
                        M = d.position.x - t.x,
                        S = d.position.y - t.y;
                      (C.setPosition(d, { x: t.x + M * B, y: t.y + S * k }),
                        C.scale(d, B, k));
                    }
                    return Q;
                  }),
                  (A.bounds = function (Q) {
                    for (
                      var B = A.allBodies(Q), k = [], t = 0;
                      t < B.length;
                      t += 1
                    ) {
                      var a = B[t];
                      k.push(a.bounds.min, a.bounds.max);
                    }
                    return I.create(k);
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(4),
                i = E(5),
                I = E(0);
              (function () {
                ((A._motionWakeThreshold = 0.18),
                  (A._motionSleepThreshold = 0.08),
                  (A._minBias = 0.9),
                  (A.update = function (C, Q) {
                    for (
                      var B = Q / I._baseDelta,
                        k = A._motionSleepThreshold,
                        t = 0;
                      t < C.length;
                      t++
                    ) {
                      var a = C[t],
                        s = n.getSpeed(a),
                        r = n.getAngularSpeed(a),
                        d = s * s + r * r;
                      if (a.force.x !== 0 || a.force.y !== 0) {
                        A.set(a, !1);
                        continue;
                      }
                      var M = Math.min(a.motion, d),
                        S = Math.max(a.motion, d);
                      ((a.motion = A._minBias * M + (1 - A._minBias) * S),
                        a.sleepThreshold > 0 && a.motion < k
                          ? ((a.sleepCounter += 1),
                            a.sleepCounter >= a.sleepThreshold / B &&
                              A.set(a, !0))
                          : a.sleepCounter > 0 && (a.sleepCounter -= 1));
                    }
                  }),
                  (A.afterCollisions = function (C) {
                    for (
                      var Q = A._motionSleepThreshold, B = 0;
                      B < C.length;
                      B++
                    ) {
                      var k = C[B];
                      if (k.isActive) {
                        var t = k.collision,
                          a = t.bodyA.parent,
                          s = t.bodyB.parent;
                        if (
                          !(
                            (a.isSleeping && s.isSleeping) ||
                            a.isStatic ||
                            s.isStatic
                          ) &&
                          (a.isSleeping || s.isSleeping)
                        ) {
                          var r = a.isSleeping && !a.isStatic ? a : s,
                            d = r === a ? s : a;
                          !r.isStatic && d.motion > Q && A.set(r, !1);
                        }
                      }
                    }
                  }),
                  (A.set = function (C, Q) {
                    var B = C.isSleeping;
                    Q
                      ? ((C.isSleeping = !0),
                        (C.sleepCounter = C.sleepThreshold),
                        (C.positionImpulse.x = 0),
                        (C.positionImpulse.y = 0),
                        (C.positionPrev.x = C.position.x),
                        (C.positionPrev.y = C.position.y),
                        (C.anglePrev = C.angle),
                        (C.speed = 0),
                        (C.angularSpeed = 0),
                        (C.motion = 0),
                        B || i.trigger(C, "sleepStart"))
                      : ((C.isSleeping = !1),
                        (C.sleepCounter = 0),
                        B && i.trigger(C, "sleepEnd"));
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(3),
                i = E(9);
              (function () {
                var I = [],
                  C = { overlap: 0, axis: null },
                  Q = { overlap: 0, axis: null };
                ((A.create = function (B, k) {
                  return {
                    pair: null,
                    collided: !1,
                    bodyA: B,
                    bodyB: k,
                    parentA: B.parent,
                    parentB: k.parent,
                    depth: 0,
                    normal: { x: 0, y: 0 },
                    tangent: { x: 0, y: 0 },
                    penetration: { x: 0, y: 0 },
                    supports: [null, null],
                    supportCount: 0,
                  };
                }),
                  (A.collides = function (B, k, t) {
                    if (
                      (A._overlapAxes(C, B.vertices, k.vertices, B.axes),
                      C.overlap <= 0 ||
                        (A._overlapAxes(Q, k.vertices, B.vertices, k.axes),
                        Q.overlap <= 0))
                    )
                      return null;
                    var a = t && t.table[i.id(B, k)],
                      s;
                    (a
                      ? (s = a.collision)
                      : ((s = A.create(B, k)),
                        (s.collided = !0),
                        (s.bodyA = B.id < k.id ? B : k),
                        (s.bodyB = B.id < k.id ? k : B),
                        (s.parentA = s.bodyA.parent),
                        (s.parentB = s.bodyB.parent)),
                      (B = s.bodyA),
                      (k = s.bodyB));
                    var r;
                    C.overlap < Q.overlap ? (r = C) : (r = Q);
                    var d = s.normal,
                      M = s.tangent,
                      S = s.penetration,
                      v = s.supports,
                      f = r.overlap,
                      l = r.axis,
                      R = l.x,
                      h = l.y,
                      c = k.position.x - B.position.x,
                      m = k.position.y - B.position.y;
                    (R * c + h * m >= 0 && ((R = -R), (h = -h)),
                      (d.x = R),
                      (d.y = h),
                      (M.x = -h),
                      (M.y = R),
                      (S.x = R * f),
                      (S.y = h * f),
                      (s.depth = f));
                    var Y = A._findSupports(B, k, d, 1),
                      J = 0;
                    if (
                      (n.contains(B.vertices, Y[0]) && (v[J++] = Y[0]),
                      n.contains(B.vertices, Y[1]) && (v[J++] = Y[1]),
                      J < 2)
                    ) {
                      var Z = A._findSupports(k, B, d, -1);
                      (n.contains(k.vertices, Z[0]) && (v[J++] = Z[0]),
                        J < 2 &&
                          n.contains(k.vertices, Z[1]) &&
                          (v[J++] = Z[1]));
                    }
                    return (
                      J === 0 && (v[J++] = Y[0]),
                      (s.supportCount = J),
                      s
                    );
                  }),
                  (A._overlapAxes = function (B, k, t, a) {
                    var s = k.length,
                      r = t.length,
                      d = k[0].x,
                      M = k[0].y,
                      S = t[0].x,
                      v = t[0].y,
                      f = a.length,
                      l = Number.MAX_VALUE,
                      R = 0,
                      h,
                      c,
                      m,
                      Y,
                      J,
                      Z;
                    for (J = 0; J < f; J++) {
                      var D = a[J],
                        z = D.x,
                        y = D.y,
                        G = d * z + M * y,
                        p = S * z + v * y,
                        F = G,
                        b = p;
                      for (Z = 1; Z < s; Z += 1)
                        ((Y = k[Z].x * z + k[Z].y * y),
                          Y > F ? (F = Y) : Y < G && (G = Y));
                      for (Z = 1; Z < r; Z += 1)
                        ((Y = t[Z].x * z + t[Z].y * y),
                          Y > b ? (b = Y) : Y < p && (p = Y));
                      if (
                        ((c = F - p),
                        (m = b - G),
                        (h = c < m ? c : m),
                        h < l && ((l = h), (R = J), h <= 0))
                      )
                        break;
                    }
                    ((B.axis = a[R]), (B.overlap = l));
                  }),
                  (A._findSupports = function (B, k, t, a) {
                    var s = k.vertices,
                      r = s.length,
                      d = B.position.x,
                      M = B.position.y,
                      S = t.x * a,
                      v = t.y * a,
                      f = s[0],
                      l = f,
                      R = S * (d - l.x) + v * (M - l.y),
                      h,
                      c,
                      m;
                    for (m = 1; m < r; m += 1)
                      ((l = s[m]),
                        (c = S * (d - l.x) + v * (M - l.y)),
                        c < R && ((R = c), (f = l)));
                    return (
                      (h = s[(r + f.index - 1) % r]),
                      (R = S * (d - h.x) + v * (M - h.y)),
                      (l = s[(f.index + 1) % r]),
                      S * (d - l.x) + v * (M - l.y) < R
                        ? ((I[0] = f), (I[1] = l), I)
                        : ((I[0] = f), (I[1] = h), I)
                    );
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(16);
              (function () {
                ((A.create = function (i, I) {
                  var C = i.bodyA,
                    Q = i.bodyB,
                    B = {
                      id: A.id(C, Q),
                      bodyA: C,
                      bodyB: Q,
                      collision: i,
                      contacts: [n.create(), n.create()],
                      contactCount: 0,
                      separation: 0,
                      isActive: !0,
                      isSensor: C.isSensor || Q.isSensor,
                      timeCreated: I,
                      timeUpdated: I,
                      inverseMass: 0,
                      friction: 0,
                      frictionStatic: 0,
                      restitution: 0,
                      slop: 0,
                    };
                  return (A.update(B, i, I), B);
                }),
                  (A.update = function (i, I, C) {
                    var Q = I.supports,
                      B = I.supportCount,
                      k = i.contacts,
                      t = I.parentA,
                      a = I.parentB;
                    ((i.isActive = !0),
                      (i.timeUpdated = C),
                      (i.collision = I),
                      (i.separation = I.depth),
                      (i.inverseMass = t.inverseMass + a.inverseMass),
                      (i.friction =
                        t.friction < a.friction ? t.friction : a.friction),
                      (i.frictionStatic =
                        t.frictionStatic > a.frictionStatic
                          ? t.frictionStatic
                          : a.frictionStatic),
                      (i.restitution =
                        t.restitution > a.restitution
                          ? t.restitution
                          : a.restitution),
                      (i.slop = t.slop > a.slop ? t.slop : a.slop),
                      (i.contactCount = B),
                      (I.pair = i));
                    var s = Q[0],
                      r = k[0],
                      d = Q[1],
                      M = k[1];
                    ((M.vertex === s || r.vertex === d) &&
                      ((k[1] = r), (k[0] = r = M), (M = k[1])),
                      (r.vertex = s),
                      (M.vertex = d));
                  }),
                  (A.setActive = function (i, I, C) {
                    I
                      ? ((i.isActive = !0), (i.timeUpdated = C))
                      : ((i.isActive = !1), (i.contactCount = 0));
                  }),
                  (A.id = function (i, I) {
                    return i.id < I.id
                      ? i.id.toString(36) + ":" + I.id.toString(36)
                      : I.id.toString(36) + ":" + i.id.toString(36);
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(3),
                i = E(2),
                I = E(7),
                C = E(1),
                Q = E(11),
                B = E(0);
              (function () {
                ((A._warming = 0.4),
                  (A._torqueDampen = 1),
                  (A._minLength = 1e-6),
                  (A.create = function (k) {
                    var t = k;
                    (t.bodyA && !t.pointA && (t.pointA = { x: 0, y: 0 }),
                      t.bodyB && !t.pointB && (t.pointB = { x: 0, y: 0 }));
                    var a = t.bodyA
                        ? i.add(t.bodyA.position, t.pointA)
                        : t.pointA,
                      s = t.bodyB
                        ? i.add(t.bodyB.position, t.pointB)
                        : t.pointB,
                      r = i.magnitude(i.sub(a, s));
                    ((t.length = typeof t.length < "u" ? t.length : r),
                      (t.id = t.id || B.nextId()),
                      (t.label = t.label || "Constraint"),
                      (t.type = "constraint"),
                      (t.stiffness = t.stiffness || (t.length > 0 ? 1 : 0.7)),
                      (t.damping = t.damping || 0),
                      (t.angularStiffness = t.angularStiffness || 0),
                      (t.angleA = t.bodyA ? t.bodyA.angle : t.angleA),
                      (t.angleB = t.bodyB ? t.bodyB.angle : t.angleB),
                      (t.plugin = {}));
                    var d = {
                      visible: !0,
                      lineWidth: 2,
                      strokeStyle: "#ffffff",
                      type: "line",
                      anchors: !0,
                    };
                    return (
                      t.length === 0 && t.stiffness > 0.1
                        ? ((d.type = "pin"), (d.anchors = !1))
                        : t.stiffness < 0.9 && (d.type = "spring"),
                      (t.render = B.extend(d, t.render)),
                      t
                    );
                  }),
                  (A.preSolveAll = function (k) {
                    for (var t = 0; t < k.length; t += 1) {
                      var a = k[t],
                        s = a.constraintImpulse;
                      a.isStatic ||
                        (s.x === 0 && s.y === 0 && s.angle === 0) ||
                        ((a.position.x += s.x),
                        (a.position.y += s.y),
                        (a.angle += s.angle));
                    }
                  }),
                  (A.solveAll = function (k, t) {
                    for (
                      var a = B.clamp(t / B._baseDelta, 0, 1), s = 0;
                      s < k.length;
                      s += 1
                    ) {
                      var r = k[s],
                        d = !r.bodyA || (r.bodyA && r.bodyA.isStatic),
                        M = !r.bodyB || (r.bodyB && r.bodyB.isStatic);
                      (d || M) && A.solve(k[s], a);
                    }
                    for (s = 0; s < k.length; s += 1)
                      ((r = k[s]),
                        (d = !r.bodyA || (r.bodyA && r.bodyA.isStatic)),
                        (M = !r.bodyB || (r.bodyB && r.bodyB.isStatic)),
                        !d && !M && A.solve(k[s], a));
                  }),
                  (A.solve = function (k, t) {
                    var a = k.bodyA,
                      s = k.bodyB,
                      r = k.pointA,
                      d = k.pointB;
                    if (!(!a && !s)) {
                      (a &&
                        !a.isStatic &&
                        (i.rotate(r, a.angle - k.angleA, r),
                        (k.angleA = a.angle)),
                        s &&
                          !s.isStatic &&
                          (i.rotate(d, s.angle - k.angleB, d),
                          (k.angleB = s.angle)));
                      var M = r,
                        S = d;
                      if (
                        (a && (M = i.add(a.position, r)),
                        s && (S = i.add(s.position, d)),
                        !(!M || !S))
                      ) {
                        var v = i.sub(M, S),
                          f = i.magnitude(v);
                        f < A._minLength && (f = A._minLength);
                        var l = (f - k.length) / f,
                          R = k.stiffness >= 1 || k.length === 0,
                          h = R ? k.stiffness * t : k.stiffness * t * t,
                          c = k.damping * t,
                          m = i.mult(v, l * h),
                          Y = (a ? a.inverseMass : 0) + (s ? s.inverseMass : 0),
                          J =
                            (a ? a.inverseInertia : 0) +
                            (s ? s.inverseInertia : 0),
                          Z = Y + J,
                          D,
                          z,
                          y,
                          G,
                          p;
                        if (c > 0) {
                          var F = i.create();
                          ((y = i.div(v, f)),
                            (p = i.sub(
                              (s && i.sub(s.position, s.positionPrev)) || F,
                              (a && i.sub(a.position, a.positionPrev)) || F,
                            )),
                            (G = i.dot(y, p)));
                        }
                        (a &&
                          !a.isStatic &&
                          ((z = a.inverseMass / Y),
                          (a.constraintImpulse.x -= m.x * z),
                          (a.constraintImpulse.y -= m.y * z),
                          (a.position.x -= m.x * z),
                          (a.position.y -= m.y * z),
                          c > 0 &&
                            ((a.positionPrev.x -= c * y.x * G * z),
                            (a.positionPrev.y -= c * y.y * G * z)),
                          (D =
                            (i.cross(r, m) / Z) *
                            A._torqueDampen *
                            a.inverseInertia *
                            (1 - k.angularStiffness)),
                          (a.constraintImpulse.angle -= D),
                          (a.angle -= D)),
                          s &&
                            !s.isStatic &&
                            ((z = s.inverseMass / Y),
                            (s.constraintImpulse.x += m.x * z),
                            (s.constraintImpulse.y += m.y * z),
                            (s.position.x += m.x * z),
                            (s.position.y += m.y * z),
                            c > 0 &&
                              ((s.positionPrev.x += c * y.x * G * z),
                              (s.positionPrev.y += c * y.y * G * z)),
                            (D =
                              (i.cross(d, m) / Z) *
                              A._torqueDampen *
                              s.inverseInertia *
                              (1 - k.angularStiffness)),
                            (s.constraintImpulse.angle += D),
                            (s.angle += D)));
                      }
                    }
                  }),
                  (A.postSolveAll = function (k) {
                    for (var t = 0; t < k.length; t++) {
                      var a = k[t],
                        s = a.constraintImpulse;
                      if (!(
                        a.isStatic ||
                        (s.x === 0 && s.y === 0 && s.angle === 0)
                      )) {
                        I.set(a, !1);
                        for (var r = 0; r < a.parts.length; r++) {
                          var d = a.parts[r];
                          (n.translate(d.vertices, s),
                            r > 0 &&
                              ((d.position.x += s.x), (d.position.y += s.y)),
                            s.angle !== 0 &&
                              (n.rotate(d.vertices, s.angle, a.position),
                              Q.rotate(d.axes, s.angle),
                              r > 0 &&
                                i.rotateAbout(
                                  d.position,
                                  s.angle,
                                  a.position,
                                  d.position,
                                )),
                            C.update(d.bounds, d.vertices, a.velocity));
                        }
                        ((s.angle *= A._warming),
                          (s.x *= A._warming),
                          (s.y *= A._warming));
                      }
                    }
                  }),
                  (A.pointAWorld = function (k) {
                    return {
                      x:
                        (k.bodyA ? k.bodyA.position.x : 0) +
                        (k.pointA ? k.pointA.x : 0),
                      y:
                        (k.bodyA ? k.bodyA.position.y : 0) +
                        (k.pointA ? k.pointA.y : 0),
                    };
                  }),
                  (A.pointBWorld = function (k) {
                    return {
                      x:
                        (k.bodyB ? k.bodyB.position.x : 0) +
                        (k.pointB ? k.pointB.x : 0),
                      y:
                        (k.bodyB ? k.bodyB.position.y : 0) +
                        (k.pointB ? k.pointB.y : 0),
                    };
                  }),
                  (A.currentLength = function (k) {
                    var t =
                        (k.bodyA ? k.bodyA.position.x : 0) +
                        (k.pointA ? k.pointA.x : 0),
                      a =
                        (k.bodyA ? k.bodyA.position.y : 0) +
                        (k.pointA ? k.pointA.y : 0),
                      s =
                        (k.bodyB ? k.bodyB.position.x : 0) +
                        (k.pointB ? k.pointB.x : 0),
                      r =
                        (k.bodyB ? k.bodyB.position.y : 0) +
                        (k.pointB ? k.pointB.y : 0),
                      d = t - s,
                      M = a - r;
                    return Math.sqrt(d * d + M * M);
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(2),
                i = E(0);
              (function () {
                ((A.fromVertices = function (I) {
                  for (var C = {}, Q = 0; Q < I.length; Q++) {
                    var B = (Q + 1) % I.length,
                      k = n.normalise({
                        x: I[B].y - I[Q].y,
                        y: I[Q].x - I[B].x,
                      }),
                      t = k.y === 0 ? 1 / 0 : k.x / k.y;
                    ((t = t.toFixed(3).toString()), (C[t] = k));
                  }
                  return i.values(C);
                }),
                  (A.rotate = function (I, C) {
                    if (C !== 0)
                      for (
                        var Q = Math.cos(C), B = Math.sin(C), k = 0;
                        k < I.length;
                        k++
                      ) {
                        var t = I[k],
                          a;
                        ((a = t.x * Q - t.y * B),
                          (t.y = t.x * B + t.y * Q),
                          (t.x = a));
                      }
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(3),
                i = E(0),
                I = E(4),
                C = E(1),
                Q = E(2);
              (function () {
                ((A.rectangle = function (B, k, t, a, s) {
                  s = s || {};
                  var r = {
                    label: "Rectangle Body",
                    position: { x: B, y: k },
                    vertices: n.fromPath(
                      "L 0 0 L " + t + " 0 L " + t + " " + a + " L 0 " + a,
                    ),
                  };
                  if (s.chamfer) {
                    var d = s.chamfer;
                    ((r.vertices = n.chamfer(
                      r.vertices,
                      d.radius,
                      d.quality,
                      d.qualityMin,
                      d.qualityMax,
                    )),
                      delete s.chamfer);
                  }
                  return I.create(i.extend({}, r, s));
                }),
                  (A.trapezoid = function (B, k, t, a, s, r) {
                    ((r = r || {}),
                      s >= 1 &&
                        i.warn(
                          "Bodies.trapezoid: slope parameter must be < 1.",
                        ),
                      (s *= 0.5));
                    var d = (1 - s * 2) * t,
                      M = t * s,
                      S = M + d,
                      v = S + M,
                      f;
                    s < 0.5
                      ? (f =
                          "L 0 0 L " +
                          M +
                          " " +
                          -a +
                          " L " +
                          S +
                          " " +
                          -a +
                          " L " +
                          v +
                          " 0")
                      : (f = "L 0 0 L " + S + " " + -a + " L " + v + " 0");
                    var l = {
                      label: "Trapezoid Body",
                      position: { x: B, y: k },
                      vertices: n.fromPath(f),
                    };
                    if (r.chamfer) {
                      var R = r.chamfer;
                      ((l.vertices = n.chamfer(
                        l.vertices,
                        R.radius,
                        R.quality,
                        R.qualityMin,
                        R.qualityMax,
                      )),
                        delete r.chamfer);
                    }
                    return I.create(i.extend({}, l, r));
                  }),
                  (A.circle = function (B, k, t, a, s) {
                    a = a || {};
                    var r = { label: "Circle Body", circleRadius: t };
                    s = s || 25;
                    var d = Math.ceil(Math.max(10, Math.min(s, t)));
                    return (
                      d % 2 === 1 && (d += 1),
                      A.polygon(B, k, d, t, i.extend({}, r, a))
                    );
                  }),
                  (A.polygon = function (B, k, t, a, s) {
                    if (((s = s || {}), t < 3)) return A.circle(B, k, a, s);
                    for (
                      var r = (2 * Math.PI) / t, d = "", M = r * 0.5, S = 0;
                      S < t;
                      S += 1
                    ) {
                      var v = M + S * r,
                        f = Math.cos(v) * a,
                        l = Math.sin(v) * a;
                      d += "L " + f.toFixed(3) + " " + l.toFixed(3) + " ";
                    }
                    var R = {
                      label: "Polygon Body",
                      position: { x: B, y: k },
                      vertices: n.fromPath(d),
                    };
                    if (s.chamfer) {
                      var h = s.chamfer;
                      ((R.vertices = n.chamfer(
                        R.vertices,
                        h.radius,
                        h.quality,
                        h.qualityMin,
                        h.qualityMax,
                      )),
                        delete s.chamfer);
                    }
                    return I.create(i.extend({}, R, s));
                  }),
                  (A.fromVertices = function (B, k, t, a, s, r, d, M) {
                    var S = i.getDecomp(),
                      v,
                      f,
                      l,
                      R,
                      h,
                      c,
                      m,
                      Y,
                      J,
                      Z,
                      D;
                    for (
                      v = !!(S && S.quickDecomp),
                        a = a || {},
                        l = [],
                        s = typeof s < "u" ? s : !1,
                        r = typeof r < "u" ? r : 0.01,
                        d = typeof d < "u" ? d : 10,
                        M = typeof M < "u" ? M : 0.01,
                        i.isArray(t[0]) || (t = [t]),
                        Z = 0;
                      Z < t.length;
                      Z += 1
                    )
                      if (
                        ((c = t[Z]),
                        (R = n.isConvex(c)),
                        (h = !R),
                        h &&
                          !v &&
                          i.warnOnce(
                            "Bodies.fromVertices: Install the 'poly-decomp' library and use Common.setDecomp or provide 'decomp' as a global to decompose concave vertices.",
                          ),
                        R || !v)
                      )
                        (R ? (c = n.clockwiseSort(c)) : (c = n.hull(c)),
                          l.push({ position: { x: B, y: k }, vertices: c }));
                      else {
                        var z = c.map(function (T) {
                          return [T.x, T.y];
                        });
                        (S.makeCCW(z),
                          r !== !1 && S.removeCollinearPoints(z, r),
                          M !== !1 &&
                            S.removeDuplicatePoints &&
                            S.removeDuplicatePoints(z, M));
                        var y = S.quickDecomp(z);
                        for (m = 0; m < y.length; m++) {
                          var G = y[m],
                            p = G.map(function (T) {
                              return { x: T[0], y: T[1] };
                            });
                          (d > 0 && n.area(p) < d) ||
                            l.push({ position: n.centre(p), vertices: p });
                        }
                      }
                    for (m = 0; m < l.length; m++)
                      l[m] = I.create(i.extend(l[m], a));
                    if (s) {
                      var F = 5;
                      for (m = 0; m < l.length; m++) {
                        var b = l[m];
                        for (Y = m + 1; Y < l.length; Y++) {
                          var U = l[Y];
                          if (C.overlaps(b.bounds, U.bounds)) {
                            var N = b.vertices,
                              W = U.vertices;
                            for (J = 0; J < b.vertices.length; J++)
                              for (D = 0; D < U.vertices.length; D++) {
                                var P = Q.magnitudeSquared(
                                    Q.sub(N[(J + 1) % N.length], W[D]),
                                  ),
                                  X = Q.magnitudeSquared(
                                    Q.sub(N[J], W[(D + 1) % W.length]),
                                  );
                                P < F &&
                                  X < F &&
                                  ((N[J].isInternal = !0),
                                  (W[D].isInternal = !0));
                              }
                          }
                        }
                      }
                    }
                    return l.length > 1
                      ? ((f = I.create(i.extend({ parts: l.slice(0) }, a))),
                        I.setPosition(f, { x: B, y: k }),
                        f)
                      : l[0];
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(0),
                i = E(8);
              (function () {
                ((A.create = function (I) {
                  var C = { bodies: [], collisions: [], pairs: null };
                  return n.extend(C, I);
                }),
                  (A.setBodies = function (I, C) {
                    I.bodies = C.slice(0);
                  }),
                  (A.clear = function (I) {
                    ((I.bodies = []), (I.collisions = []));
                  }),
                  (A.collisions = function (I) {
                    var C = I.pairs,
                      Q = I.bodies,
                      B = Q.length,
                      k = A.canCollide,
                      t = i.collides,
                      a = I.collisions,
                      s = 0,
                      r,
                      d;
                    for (Q.sort(A._compareBoundsX), r = 0; r < B; r++) {
                      var M = Q[r],
                        S = M.bounds,
                        v = M.bounds.max.x,
                        f = M.bounds.max.y,
                        l = M.bounds.min.y,
                        R = M.isStatic || M.isSleeping,
                        h = M.parts.length,
                        c = h === 1;
                      for (d = r + 1; d < B; d++) {
                        var m = Q[d],
                          Y = m.bounds;
                        if (Y.min.x > v) break;
                        if (
                          !(f < Y.min.y || l > Y.max.y) &&
                          !(R && (m.isStatic || m.isSleeping)) &&
                          k(M.collisionFilter, m.collisionFilter)
                        ) {
                          var J = m.parts.length;
                          if (c && J === 1) {
                            var Z = t(M, m, C);
                            Z && (a[s++] = Z);
                          } else
                            for (
                              var D = h > 1 ? 1 : 0, z = J > 1 ? 1 : 0, y = D;
                              y < h;
                              y++
                            )
                              for (
                                var G = M.parts[y], S = G.bounds, p = z;
                                p < J;
                                p++
                              ) {
                                var F = m.parts[p],
                                  Y = F.bounds;
                                if (!(
                                  S.min.x > Y.max.x ||
                                  S.max.x < Y.min.x ||
                                  S.max.y < Y.min.y ||
                                  S.min.y > Y.max.y
                                )) {
                                  var Z = t(G, F, C);
                                  Z && (a[s++] = Z);
                                }
                              }
                        }
                      }
                    }
                    return (a.length !== s && (a.length = s), a);
                  }),
                  (A.canCollide = function (I, C) {
                    return I.group === C.group && I.group !== 0
                      ? I.group > 0
                      : (I.mask & C.category) !== 0 &&
                          (C.mask & I.category) !== 0;
                  }),
                  (A._compareBoundsX = function (I, C) {
                    return I.bounds.min.x - C.bounds.min.x;
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(0);
              (function () {
                ((A.create = function (i) {
                  var I = {};
                  return (
                    i ||
                      n.log(
                        "Mouse.create: element was undefined, defaulting to document.body",
                        "warn",
                      ),
                    (I.element = i || document.body),
                    (I.absolute = { x: 0, y: 0 }),
                    (I.position = { x: 0, y: 0 }),
                    (I.mousedownPosition = { x: 0, y: 0 }),
                    (I.mouseupPosition = { x: 0, y: 0 }),
                    (I.offset = { x: 0, y: 0 }),
                    (I.scale = { x: 1, y: 1 }),
                    (I.wheelDelta = 0),
                    (I.button = -1),
                    (I.pixelRatio =
                      parseInt(
                        I.element.getAttribute("data-pixel-ratio"),
                        10,
                      ) || 1),
                    (I.sourceEvents = {
                      mousemove: null,
                      mousedown: null,
                      mouseup: null,
                      mousewheel: null,
                    }),
                    (I.mousemove = function (C) {
                      var Q = A._getRelativeMousePosition(
                          C,
                          I.element,
                          I.pixelRatio,
                        ),
                        B = C.changedTouches;
                      (B && ((I.button = 0), C.preventDefault()),
                        (I.absolute.x = Q.x),
                        (I.absolute.y = Q.y),
                        (I.position.x = I.absolute.x * I.scale.x + I.offset.x),
                        (I.position.y = I.absolute.y * I.scale.y + I.offset.y),
                        (I.sourceEvents.mousemove = C));
                    }),
                    (I.mousedown = function (C) {
                      var Q = A._getRelativeMousePosition(
                          C,
                          I.element,
                          I.pixelRatio,
                        ),
                        B = C.changedTouches;
                      (B
                        ? ((I.button = 0), C.preventDefault())
                        : (I.button = C.button),
                        (I.absolute.x = Q.x),
                        (I.absolute.y = Q.y),
                        (I.position.x = I.absolute.x * I.scale.x + I.offset.x),
                        (I.position.y = I.absolute.y * I.scale.y + I.offset.y),
                        (I.mousedownPosition.x = I.position.x),
                        (I.mousedownPosition.y = I.position.y),
                        (I.sourceEvents.mousedown = C));
                    }),
                    (I.mouseup = function (C) {
                      var Q = A._getRelativeMousePosition(
                          C,
                          I.element,
                          I.pixelRatio,
                        ),
                        B = C.changedTouches;
                      (B && C.preventDefault(),
                        (I.button = -1),
                        (I.absolute.x = Q.x),
                        (I.absolute.y = Q.y),
                        (I.position.x = I.absolute.x * I.scale.x + I.offset.x),
                        (I.position.y = I.absolute.y * I.scale.y + I.offset.y),
                        (I.mouseupPosition.x = I.position.x),
                        (I.mouseupPosition.y = I.position.y),
                        (I.sourceEvents.mouseup = C));
                    }),
                    (I.mousewheel = function (C) {
                      ((I.wheelDelta = Math.max(
                        -1,
                        Math.min(1, C.wheelDelta || -C.detail),
                      )),
                        C.preventDefault(),
                        (I.sourceEvents.mousewheel = C));
                    }),
                    A.setElement(I, I.element),
                    I
                  );
                }),
                  (A.setElement = function (i, I) {
                    ((i.element = I),
                      I.addEventListener("mousemove", i.mousemove, {
                        passive: !0,
                      }),
                      I.addEventListener("mousedown", i.mousedown, {
                        passive: !0,
                      }),
                      I.addEventListener("mouseup", i.mouseup, { passive: !0 }),
                      I.addEventListener("wheel", i.mousewheel, {
                        passive: !1,
                      }),
                      I.addEventListener("touchmove", i.mousemove, {
                        passive: !1,
                      }),
                      I.addEventListener("touchstart", i.mousedown, {
                        passive: !1,
                      }),
                      I.addEventListener("touchend", i.mouseup, {
                        passive: !1,
                      }));
                  }),
                  (A.clearSourceEvents = function (i) {
                    ((i.sourceEvents.mousemove = null),
                      (i.sourceEvents.mousedown = null),
                      (i.sourceEvents.mouseup = null),
                      (i.sourceEvents.mousewheel = null),
                      (i.wheelDelta = 0));
                  }),
                  (A.setOffset = function (i, I) {
                    ((i.offset.x = I.x),
                      (i.offset.y = I.y),
                      (i.position.x = i.absolute.x * i.scale.x + i.offset.x),
                      (i.position.y = i.absolute.y * i.scale.y + i.offset.y));
                  }),
                  (A.setScale = function (i, I) {
                    ((i.scale.x = I.x),
                      (i.scale.y = I.y),
                      (i.position.x = i.absolute.x * i.scale.x + i.offset.x),
                      (i.position.y = i.absolute.y * i.scale.y + i.offset.y));
                  }),
                  (A._getRelativeMousePosition = function (i, I, C) {
                    var Q = I.getBoundingClientRect(),
                      B =
                        document.documentElement ||
                        document.body.parentNode ||
                        document.body,
                      k =
                        window.pageXOffset !== void 0
                          ? window.pageXOffset
                          : B.scrollLeft,
                      t =
                        window.pageYOffset !== void 0
                          ? window.pageYOffset
                          : B.scrollTop,
                      a = i.changedTouches,
                      s,
                      r;
                    return (
                      a
                        ? ((s = a[0].pageX - Q.left - k),
                          (r = a[0].pageY - Q.top - t))
                        : ((s = i.pageX - Q.left - k),
                          (r = i.pageY - Q.top - t)),
                      {
                        x:
                          s /
                          ((I.clientWidth / (I.width || I.clientWidth)) * C),
                        y:
                          r /
                          ((I.clientHeight / (I.height || I.clientHeight)) * C),
                      }
                    );
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(0);
              (function () {
                ((A._registry = {}),
                  (A.register = function (i) {
                    if (
                      (A.isPlugin(i) ||
                        n.warn(
                          "Plugin.register:",
                          A.toString(i),
                          "does not implement all required fields.",
                        ),
                      i.name in A._registry)
                    ) {
                      var I = A._registry[i.name],
                        C = A.versionParse(i.version).number,
                        Q = A.versionParse(I.version).number;
                      C > Q
                        ? (n.warn(
                            "Plugin.register:",
                            A.toString(I),
                            "was upgraded to",
                            A.toString(i),
                          ),
                          (A._registry[i.name] = i))
                        : C < Q
                          ? n.warn(
                              "Plugin.register:",
                              A.toString(I),
                              "can not be downgraded to",
                              A.toString(i),
                            )
                          : i !== I &&
                            n.warn(
                              "Plugin.register:",
                              A.toString(i),
                              "is already registered to different plugin object",
                            );
                    } else A._registry[i.name] = i;
                    return i;
                  }),
                  (A.resolve = function (i) {
                    return A._registry[A.dependencyParse(i).name];
                  }),
                  (A.toString = function (i) {
                    return typeof i == "string"
                      ? i
                      : (i.name || "anonymous") +
                          "@" +
                          (i.version || i.range || "0.0.0");
                  }),
                  (A.isPlugin = function (i) {
                    return i && i.name && i.version && i.install;
                  }),
                  (A.isUsed = function (i, I) {
                    return i.used.indexOf(I) > -1;
                  }),
                  (A.isFor = function (i, I) {
                    var C = i.for && A.dependencyParse(i.for);
                    return (
                      !i.for ||
                      (I.name === C.name &&
                        A.versionSatisfies(I.version, C.range))
                    );
                  }),
                  (A.use = function (i, I) {
                    if (
                      ((i.uses = (i.uses || []).concat(I || [])),
                      i.uses.length === 0)
                    ) {
                      n.warn(
                        "Plugin.use:",
                        A.toString(i),
                        "does not specify any dependencies to install.",
                      );
                      return;
                    }
                    for (
                      var C = A.dependencies(i),
                        Q = n.topologicalSort(C),
                        B = [],
                        k = 0;
                      k < Q.length;
                      k += 1
                    )
                      if (Q[k] !== i.name) {
                        var t = A.resolve(Q[k]);
                        if (!t) {
                          B.push("❌ " + Q[k]);
                          continue;
                        }
                        A.isUsed(i, t.name) ||
                          (A.isFor(t, i) ||
                            (n.warn(
                              "Plugin.use:",
                              A.toString(t),
                              "is for",
                              t.for,
                              "but installed on",
                              A.toString(i) + ".",
                            ),
                            (t._warned = !0)),
                          t.install
                            ? t.install(i)
                            : (n.warn(
                                "Plugin.use:",
                                A.toString(t),
                                "does not specify an install function.",
                              ),
                              (t._warned = !0)),
                          t._warned
                            ? (B.push("🔶 " + A.toString(t)), delete t._warned)
                            : B.push("✅ " + A.toString(t)),
                          i.used.push(t.name));
                      }
                    B.length > 0 && n.info(B.join("  "));
                  }),
                  (A.dependencies = function (i, I) {
                    var C = A.dependencyParse(i),
                      Q = C.name;
                    if (((I = I || {}), !(Q in I))) {
                      ((i = A.resolve(i) || i),
                        (I[Q] = n.map(i.uses || [], function (k) {
                          A.isPlugin(k) && A.register(k);
                          var t = A.dependencyParse(k),
                            a = A.resolve(k);
                          return (
                            a && !A.versionSatisfies(a.version, t.range)
                              ? (n.warn(
                                  "Plugin.dependencies:",
                                  A.toString(a),
                                  "does not satisfy",
                                  A.toString(t),
                                  "used by",
                                  A.toString(C) + ".",
                                ),
                                (a._warned = !0),
                                (i._warned = !0))
                              : a ||
                                (n.warn(
                                  "Plugin.dependencies:",
                                  A.toString(k),
                                  "used by",
                                  A.toString(C),
                                  "could not be resolved.",
                                ),
                                (i._warned = !0)),
                            t.name
                          );
                        })));
                      for (var B = 0; B < I[Q].length; B += 1)
                        A.dependencies(I[Q][B], I);
                      return I;
                    }
                  }),
                  (A.dependencyParse = function (i) {
                    if (n.isString(i)) {
                      var I =
                        /^[\w-]+(@(\*|[\^~]?\d+\.\d+\.\d+(-[0-9A-Za-z-+]+)?))?$/;
                      return (
                        I.test(i) ||
                          n.warn(
                            "Plugin.dependencyParse:",
                            i,
                            "is not a valid dependency string.",
                          ),
                        { name: i.split("@")[0], range: i.split("@")[1] || "*" }
                      );
                    }
                    return { name: i.name, range: i.range || i.version };
                  }),
                  (A.versionParse = function (i) {
                    var I =
                      /^(\*)|(\^|~|>=|>)?\s*((\d+)\.(\d+)\.(\d+))(-[0-9A-Za-z-+]+)?$/;
                    I.test(i) ||
                      n.warn(
                        "Plugin.versionParse:",
                        i,
                        "is not a valid version or range.",
                      );
                    var C = I.exec(i),
                      Q = Number(C[4]),
                      B = Number(C[5]),
                      k = Number(C[6]);
                    return {
                      isRange: !!(C[1] || C[2]),
                      version: C[3],
                      range: i,
                      operator: C[1] || C[2] || "",
                      major: Q,
                      minor: B,
                      patch: k,
                      parts: [Q, B, k],
                      prerelease: C[7],
                      number: Q * 1e8 + B * 1e4 + k,
                    };
                  }),
                  (A.versionSatisfies = function (i, I) {
                    I = I || "*";
                    var C = A.versionParse(I),
                      Q = A.versionParse(i);
                    if (C.isRange) {
                      if (C.operator === "*" || i === "*") return !0;
                      if (C.operator === ">") return Q.number > C.number;
                      if (C.operator === ">=") return Q.number >= C.number;
                      if (C.operator === "~")
                        return (
                          Q.major === C.major &&
                          Q.minor === C.minor &&
                          Q.patch >= C.patch
                        );
                      if (C.operator === "^")
                        return C.major > 0
                          ? Q.major === C.major && Q.number >= C.number
                          : C.minor > 0
                            ? Q.minor === C.minor && Q.patch >= C.patch
                            : Q.patch === C.patch;
                    }
                    return i === I || i === "*";
                  }));
              })();
            },
            function (o, u) {
              var E = {};
              ((o.exports = E),
                (function () {
                  E.create = function (A) {
                    return { vertex: A, normalImpulse: 0, tangentImpulse: 0 };
                  };
                })());
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(7),
                i = E(18),
                I = E(13),
                C = E(19),
                Q = E(5),
                B = E(6),
                k = E(10),
                t = E(0),
                a = E(4);
              (function () {
                ((A._deltaMax = 1e3 / 60),
                  (A.create = function (s) {
                    s = s || {};
                    var r = {
                        positionIterations: 6,
                        velocityIterations: 4,
                        constraintIterations: 2,
                        enableSleeping: !1,
                        events: [],
                        plugin: {},
                        gravity: { x: 0, y: 1, scale: 0.001 },
                        timing: {
                          timestamp: 0,
                          timeScale: 1,
                          lastDelta: 0,
                          lastElapsed: 0,
                          lastUpdatesPerFrame: 0,
                        },
                      },
                      d = t.extend(r, s);
                    return (
                      (d.world = s.world || B.create({ label: "World" })),
                      (d.pairs = s.pairs || C.create()),
                      (d.detector = s.detector || I.create()),
                      (d.detector.pairs = d.pairs),
                      (d.grid = { buckets: [] }),
                      (d.world.gravity = d.gravity),
                      (d.broadphase = d.grid),
                      (d.metrics = {}),
                      d
                    );
                  }),
                  (A.update = function (s, r) {
                    var d = t.now(),
                      M = s.world,
                      S = s.detector,
                      v = s.pairs,
                      f = s.timing,
                      l = f.timestamp,
                      R;
                    (r > A._deltaMax &&
                      t.warnOnce(
                        "Matter.Engine.update: delta argument is recommended to be less than or equal to",
                        A._deltaMax.toFixed(3),
                        "ms.",
                      ),
                      (r = typeof r < "u" ? r : t._baseDelta),
                      (r *= f.timeScale),
                      (f.timestamp += r),
                      (f.lastDelta = r));
                    var h = { timestamp: f.timestamp, delta: r };
                    Q.trigger(s, "beforeUpdate", h);
                    var c = B.allBodies(M),
                      m = B.allConstraints(M);
                    for (
                      M.isModified &&
                        (I.setBodies(S, c), B.setModified(M, !1, !1, !0)),
                        s.enableSleeping && n.update(c, r),
                        A._bodiesApplyGravity(c, s.gravity),
                        r > 0 && A._bodiesUpdate(c, r),
                        Q.trigger(s, "beforeSolve", h),
                        k.preSolveAll(c),
                        R = 0;
                      R < s.constraintIterations;
                      R++
                    )
                      k.solveAll(m, r);
                    k.postSolveAll(c);
                    var Y = I.collisions(S);
                    (C.update(v, Y, l),
                      s.enableSleeping && n.afterCollisions(v.list),
                      v.collisionStart.length > 0 &&
                        Q.trigger(s, "collisionStart", {
                          pairs: v.collisionStart,
                          timestamp: f.timestamp,
                          delta: r,
                        }));
                    var J = t.clamp(20 / s.positionIterations, 0, 1);
                    for (
                      i.preSolvePosition(v.list), R = 0;
                      R < s.positionIterations;
                      R++
                    )
                      i.solvePosition(v.list, r, J);
                    for (
                      i.postSolvePosition(c), k.preSolveAll(c), R = 0;
                      R < s.constraintIterations;
                      R++
                    )
                      k.solveAll(m, r);
                    for (
                      k.postSolveAll(c), i.preSolveVelocity(v.list), R = 0;
                      R < s.velocityIterations;
                      R++
                    )
                      i.solveVelocity(v.list, r);
                    return (
                      A._bodiesUpdateVelocities(c),
                      v.collisionActive.length > 0 &&
                        Q.trigger(s, "collisionActive", {
                          pairs: v.collisionActive,
                          timestamp: f.timestamp,
                          delta: r,
                        }),
                      v.collisionEnd.length > 0 &&
                        Q.trigger(s, "collisionEnd", {
                          pairs: v.collisionEnd,
                          timestamp: f.timestamp,
                          delta: r,
                        }),
                      A._bodiesClearForces(c),
                      Q.trigger(s, "afterUpdate", h),
                      (s.timing.lastElapsed = t.now() - d),
                      s
                    );
                  }),
                  (A.merge = function (s, r) {
                    if ((t.extend(s, r), r.world)) {
                      ((s.world = r.world), A.clear(s));
                      for (
                        var d = B.allBodies(s.world), M = 0;
                        M < d.length;
                        M++
                      ) {
                        var S = d[M];
                        (n.set(S, !1), (S.id = t.nextId()));
                      }
                    }
                  }),
                  (A.clear = function (s) {
                    (C.clear(s.pairs), I.clear(s.detector));
                  }),
                  (A._bodiesClearForces = function (s) {
                    for (var r = s.length, d = 0; d < r; d++) {
                      var M = s[d];
                      ((M.force.x = 0), (M.force.y = 0), (M.torque = 0));
                    }
                  }),
                  (A._bodiesApplyGravity = function (s, r) {
                    var d = typeof r.scale < "u" ? r.scale : 0.001,
                      M = s.length;
                    if (!((r.x === 0 && r.y === 0) || d === 0))
                      for (var S = 0; S < M; S++) {
                        var v = s[S];
                        v.isStatic ||
                          v.isSleeping ||
                          ((v.force.y += v.mass * r.y * d),
                          (v.force.x += v.mass * r.x * d));
                      }
                  }),
                  (A._bodiesUpdate = function (s, r) {
                    for (var d = s.length, M = 0; M < d; M++) {
                      var S = s[M];
                      S.isStatic || S.isSleeping || a.update(S, r);
                    }
                  }),
                  (A._bodiesUpdateVelocities = function (s) {
                    for (var r = s.length, d = 0; d < r; d++)
                      a.updateVelocities(s[d]);
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(3),
                i = E(0),
                I = E(1);
              (function () {
                ((A._restingThresh = 2),
                  (A._restingThreshTangent = Math.sqrt(6)),
                  (A._positionDampen = 0.9),
                  (A._positionWarming = 0.8),
                  (A._frictionNormalMultiplier = 5),
                  (A._frictionMaxStatic = Number.MAX_VALUE),
                  (A.preSolvePosition = function (C) {
                    var Q,
                      B,
                      k,
                      t = C.length;
                    for (Q = 0; Q < t; Q++)
                      ((B = C[Q]),
                        B.isActive &&
                          ((k = B.contactCount),
                          (B.collision.parentA.totalContacts += k),
                          (B.collision.parentB.totalContacts += k)));
                  }),
                  (A.solvePosition = function (C, Q, B) {
                    var k,
                      t,
                      a,
                      s,
                      r,
                      d,
                      M,
                      S,
                      v = A._positionDampen * (B || 1),
                      f = i.clamp(Q / i._baseDelta, 0, 1),
                      l = C.length;
                    for (k = 0; k < l; k++)
                      ((t = C[k]),
                        !(!t.isActive || t.isSensor) &&
                          ((a = t.collision),
                          (s = a.parentA),
                          (r = a.parentB),
                          (d = a.normal),
                          (t.separation =
                            a.depth +
                            d.x * (r.positionImpulse.x - s.positionImpulse.x) +
                            d.y *
                              (r.positionImpulse.y - s.positionImpulse.y))));
                    for (k = 0; k < l; k++)
                      ((t = C[k]),
                        !(!t.isActive || t.isSensor) &&
                          ((a = t.collision),
                          (s = a.parentA),
                          (r = a.parentB),
                          (d = a.normal),
                          (S = t.separation - t.slop * f),
                          (s.isStatic || r.isStatic) && (S *= 2),
                          s.isStatic ||
                            s.isSleeping ||
                            ((M = v / s.totalContacts),
                            (s.positionImpulse.x += d.x * S * M),
                            (s.positionImpulse.y += d.y * S * M)),
                          r.isStatic ||
                            r.isSleeping ||
                            ((M = v / r.totalContacts),
                            (r.positionImpulse.x -= d.x * S * M),
                            (r.positionImpulse.y -= d.y * S * M))));
                  }),
                  (A.postSolvePosition = function (C) {
                    for (
                      var Q = A._positionWarming,
                        B = C.length,
                        k = n.translate,
                        t = I.update,
                        a = 0;
                      a < B;
                      a++
                    ) {
                      var s = C[a],
                        r = s.positionImpulse,
                        d = r.x,
                        M = r.y,
                        S = s.velocity;
                      if (((s.totalContacts = 0), d !== 0 || M !== 0)) {
                        for (var v = 0; v < s.parts.length; v++) {
                          var f = s.parts[v];
                          (k(f.vertices, r),
                            t(f.bounds, f.vertices, S),
                            (f.position.x += d),
                            (f.position.y += M));
                        }
                        ((s.positionPrev.x += d),
                          (s.positionPrev.y += M),
                          d * S.x + M * S.y < 0
                            ? ((r.x = 0), (r.y = 0))
                            : ((r.x *= Q), (r.y *= Q)));
                      }
                    }
                  }),
                  (A.preSolveVelocity = function (C) {
                    var Q = C.length,
                      B,
                      k;
                    for (B = 0; B < Q; B++) {
                      var t = C[B];
                      if (!(!t.isActive || t.isSensor)) {
                        var a = t.contacts,
                          s = t.contactCount,
                          r = t.collision,
                          d = r.parentA,
                          M = r.parentB,
                          S = r.normal,
                          v = r.tangent;
                        for (k = 0; k < s; k++) {
                          var f = a[k],
                            l = f.vertex,
                            R = f.normalImpulse,
                            h = f.tangentImpulse;
                          if (R !== 0 || h !== 0) {
                            var c = S.x * R + v.x * h,
                              m = S.y * R + v.y * h;
                            (d.isStatic ||
                              d.isSleeping ||
                              ((d.positionPrev.x += c * d.inverseMass),
                              (d.positionPrev.y += m * d.inverseMass),
                              (d.anglePrev +=
                                d.inverseInertia *
                                ((l.x - d.position.x) * m -
                                  (l.y - d.position.y) * c))),
                              M.isStatic ||
                                M.isSleeping ||
                                ((M.positionPrev.x -= c * M.inverseMass),
                                (M.positionPrev.y -= m * M.inverseMass),
                                (M.anglePrev -=
                                  M.inverseInertia *
                                  ((l.x - M.position.x) * m -
                                    (l.y - M.position.y) * c))));
                          }
                        }
                      }
                    }
                  }),
                  (A.solveVelocity = function (C, Q) {
                    var B = Q / i._baseDelta,
                      k = B * B,
                      t = k * B,
                      a = -A._restingThresh * B,
                      s = A._restingThreshTangent,
                      r = A._frictionNormalMultiplier * B,
                      d = A._frictionMaxStatic,
                      M = C.length,
                      S,
                      v,
                      f,
                      l;
                    for (f = 0; f < M; f++) {
                      var R = C[f];
                      if (!(!R.isActive || R.isSensor)) {
                        var h = R.collision,
                          c = h.parentA,
                          m = h.parentB,
                          Y = h.normal.x,
                          J = h.normal.y,
                          Z = h.tangent.x,
                          D = h.tangent.y,
                          z = R.inverseMass,
                          y = R.friction * R.frictionStatic * r,
                          G = R.contacts,
                          p = R.contactCount,
                          F = 1 / p,
                          b = c.position.x - c.positionPrev.x,
                          U = c.position.y - c.positionPrev.y,
                          N = c.angle - c.anglePrev,
                          W = m.position.x - m.positionPrev.x,
                          P = m.position.y - m.positionPrev.y,
                          X = m.angle - m.anglePrev;
                        for (l = 0; l < p; l++) {
                          var T = G[l],
                            _ = T.vertex,
                            H = _.x - c.position.x,
                            cA = _.y - c.position.y,
                            tA = _.x - m.position.x,
                            EA = _.y - m.position.y,
                            AA = b - cA * N,
                            rA = U + H * N,
                            kA = W - EA * X,
                            O = P + tA * X,
                            UA = AA - kA,
                            j = rA - O,
                            V = Y * UA + J * j,
                            YA = Z * UA + D * j,
                            Ue = R.separation + V,
                            ue = Math.min(Ue, 1);
                          ue = Ue < 0 ? 0 : ue;
                          var Le = ue * y;
                          YA < -Le || YA > Le
                            ? ((v = YA > 0 ? YA : -YA),
                              (S = R.friction * (YA > 0 ? 1 : -1) * t),
                              S < -v ? (S = -v) : S > v && (S = v))
                            : ((S = YA), (v = d));
                          var we = H * J - cA * Y,
                            Ke = tA * J - EA * Y,
                            Ne =
                              F /
                              (z +
                                c.inverseInertia * we * we +
                                m.inverseInertia * Ke * Ke),
                            $A = (1 + R.restitution) * V * Ne;
                          if (((S *= Ne), V < a)) T.normalImpulse = 0;
                          else {
                            var yI = T.normalImpulse;
                            ((T.normalImpulse += $A),
                              T.normalImpulse > 0 && (T.normalImpulse = 0),
                              ($A = T.normalImpulse - yI));
                          }
                          if (YA < -s || YA > s) T.tangentImpulse = 0;
                          else {
                            var pI = T.tangentImpulse;
                            ((T.tangentImpulse += S),
                              T.tangentImpulse < -v && (T.tangentImpulse = -v),
                              T.tangentImpulse > v && (T.tangentImpulse = v),
                              (S = T.tangentImpulse - pI));
                          }
                          var _A = Y * $A + Z * S,
                            Ae = J * $A + D * S;
                          (c.isStatic ||
                            c.isSleeping ||
                            ((c.positionPrev.x += _A * c.inverseMass),
                            (c.positionPrev.y += Ae * c.inverseMass),
                            (c.anglePrev +=
                              (H * Ae - cA * _A) * c.inverseInertia)),
                            m.isStatic ||
                              m.isSleeping ||
                              ((m.positionPrev.x -= _A * m.inverseMass),
                              (m.positionPrev.y -= Ae * m.inverseMass),
                              (m.anglePrev -=
                                (tA * Ae - EA * _A) * m.inverseInertia)));
                        }
                      }
                    }
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(9),
                i = E(0);
              (function () {
                ((A.create = function (I) {
                  return i.extend(
                    {
                      table: {},
                      list: [],
                      collisionStart: [],
                      collisionActive: [],
                      collisionEnd: [],
                    },
                    I,
                  );
                }),
                  (A.update = function (I, C, Q) {
                    var B = n.update,
                      k = n.create,
                      t = n.setActive,
                      a = I.table,
                      s = I.list,
                      r = s.length,
                      d = r,
                      M = I.collisionStart,
                      S = I.collisionEnd,
                      v = I.collisionActive,
                      f = C.length,
                      l = 0,
                      R = 0,
                      h = 0,
                      c,
                      m,
                      Y;
                    for (Y = 0; Y < f; Y++)
                      ((c = C[Y]),
                        (m = c.pair),
                        m
                          ? (m.isActive && (v[h++] = m), B(m, c, Q))
                          : ((m = k(c, Q)),
                            (a[m.id] = m),
                            (M[l++] = m),
                            (s[d++] = m)));
                    for (d = 0, r = s.length, Y = 0; Y < r; Y++)
                      ((m = s[Y]),
                        m.timeUpdated >= Q
                          ? (s[d++] = m)
                          : (t(m, !1, Q),
                            m.collision.bodyA.sleepCounter > 0 &&
                            m.collision.bodyB.sleepCounter > 0
                              ? (s[d++] = m)
                              : ((S[R++] = m), delete a[m.id])));
                    (s.length !== d && (s.length = d),
                      M.length !== l && (M.length = l),
                      S.length !== R && (S.length = R),
                      v.length !== h && (v.length = h));
                  }),
                  (A.clear = function (I) {
                    return (
                      (I.table = {}),
                      (I.list.length = 0),
                      (I.collisionStart.length = 0),
                      (I.collisionActive.length = 0),
                      (I.collisionEnd.length = 0),
                      I
                    );
                  }));
              })();
            },
            function (o, u, E) {
              var A = (o.exports = E(21));
              ((A.Axes = E(11)),
                (A.Bodies = E(12)),
                (A.Body = E(4)),
                (A.Bounds = E(1)),
                (A.Collision = E(8)),
                (A.Common = E(0)),
                (A.Composite = E(6)),
                (A.Composites = E(22)),
                (A.Constraint = E(10)),
                (A.Contact = E(16)),
                (A.Detector = E(13)),
                (A.Engine = E(17)),
                (A.Events = E(5)),
                (A.Grid = E(23)),
                (A.Mouse = E(14)),
                (A.MouseConstraint = E(24)),
                (A.Pair = E(9)),
                (A.Pairs = E(19)),
                (A.Plugin = E(15)),
                (A.Query = E(25)),
                (A.Render = E(26)),
                (A.Resolver = E(18)),
                (A.Runner = E(27)),
                (A.SAT = E(28)),
                (A.Sleeping = E(7)),
                (A.Svg = E(29)),
                (A.Vector = E(2)),
                (A.Vertices = E(3)),
                (A.World = E(30)),
                (A.Engine.run = A.Runner.run),
                A.Common.deprecated(
                  A.Engine,
                  "run",
                  "Engine.run ➤ use Matter.Runner.run(engine) instead",
                ));
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(15),
                i = E(0);
              (function () {
                ((A.name = "matter-js"),
                  (A.version = "0.20.0"),
                  (A.uses = []),
                  (A.used = []),
                  (A.use = function () {
                    n.use(A, Array.prototype.slice.call(arguments));
                  }),
                  (A.before = function (I, C) {
                    return (
                      (I = I.replace(/^Matter./, "")),
                      i.chainPathBefore(A, I, C)
                    );
                  }),
                  (A.after = function (I, C) {
                    return (
                      (I = I.replace(/^Matter./, "")),
                      i.chainPathAfter(A, I, C)
                    );
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(6),
                i = E(10),
                I = E(0),
                C = E(4),
                Q = E(12),
                B = I.deprecated;
              (function () {
                ((A.stack = function (k, t, a, s, r, d, M) {
                  for (
                    var S = n.create({ label: "Stack" }),
                      v = k,
                      f = t,
                      l,
                      R = 0,
                      h = 0;
                    h < s;
                    h++
                  ) {
                    for (var c = 0, m = 0; m < a; m++) {
                      var Y = M(v, f, m, h, l, R);
                      if (Y) {
                        var J = Y.bounds.max.y - Y.bounds.min.y,
                          Z = Y.bounds.max.x - Y.bounds.min.x;
                        (J > c && (c = J),
                          C.translate(Y, { x: Z * 0.5, y: J * 0.5 }),
                          (v = Y.bounds.max.x + r),
                          n.addBody(S, Y),
                          (l = Y),
                          (R += 1));
                      } else v += r;
                    }
                    ((f += c + d), (v = k));
                  }
                  return S;
                }),
                  (A.chain = function (k, t, a, s, r, d) {
                    for (var M = k.bodies, S = 1; S < M.length; S++) {
                      var v = M[S - 1],
                        f = M[S],
                        l = v.bounds.max.y - v.bounds.min.y,
                        R = v.bounds.max.x - v.bounds.min.x,
                        h = f.bounds.max.y - f.bounds.min.y,
                        c = f.bounds.max.x - f.bounds.min.x,
                        m = {
                          bodyA: v,
                          pointA: { x: R * t, y: l * a },
                          bodyB: f,
                          pointB: { x: c * s, y: h * r },
                        },
                        Y = I.extend(m, d);
                      n.addConstraint(k, i.create(Y));
                    }
                    return ((k.label += " Chain"), k);
                  }),
                  (A.mesh = function (k, t, a, s, r) {
                    var d = k.bodies,
                      M,
                      S,
                      v,
                      f,
                      l;
                    for (M = 0; M < a; M++) {
                      for (S = 1; S < t; S++)
                        ((v = d[S - 1 + M * t]),
                          (f = d[S + M * t]),
                          n.addConstraint(
                            k,
                            i.create(I.extend({ bodyA: v, bodyB: f }, r)),
                          ));
                      if (M > 0)
                        for (S = 0; S < t; S++)
                          ((v = d[S + (M - 1) * t]),
                            (f = d[S + M * t]),
                            n.addConstraint(
                              k,
                              i.create(I.extend({ bodyA: v, bodyB: f }, r)),
                            ),
                            s &&
                              S > 0 &&
                              ((l = d[S - 1 + (M - 1) * t]),
                              n.addConstraint(
                                k,
                                i.create(I.extend({ bodyA: l, bodyB: f }, r)),
                              )),
                            s &&
                              S < t - 1 &&
                              ((l = d[S + 1 + (M - 1) * t]),
                              n.addConstraint(
                                k,
                                i.create(I.extend({ bodyA: l, bodyB: f }, r)),
                              )));
                    }
                    return ((k.label += " Mesh"), k);
                  }),
                  (A.pyramid = function (k, t, a, s, r, d, M) {
                    return A.stack(
                      k,
                      t,
                      a,
                      s,
                      r,
                      d,
                      function (S, v, f, l, R, h) {
                        var c = Math.min(s, Math.ceil(a / 2)),
                          m = R ? R.bounds.max.x - R.bounds.min.x : 0;
                        if (!(l > c)) {
                          l = c - l;
                          var Y = l,
                            J = a - 1 - l;
                          if (!(f < Y || f > J)) {
                            h === 1 &&
                              C.translate(R, {
                                x: (f + (a % 2 === 1 ? 1 : -1)) * m,
                                y: 0,
                              });
                            var Z = R ? f * m : 0;
                            return M(k + Z + f * r, v, f, l, R, h);
                          }
                        }
                      },
                    );
                  }),
                  (A.newtonsCradle = function (k, t, a, s, r) {
                    for (
                      var d = n.create({ label: "Newtons Cradle" }), M = 0;
                      M < a;
                      M++
                    ) {
                      var S = 1.9,
                        v = Q.circle(k + M * (s * S), t + r, s, {
                          inertia: 1 / 0,
                          restitution: 1,
                          friction: 0,
                          frictionAir: 1e-4,
                          slop: 1,
                        }),
                        f = i.create({
                          pointA: { x: k + M * (s * S), y: t },
                          bodyB: v,
                        });
                      (n.addBody(d, v), n.addConstraint(d, f));
                    }
                    return d;
                  }),
                  B(
                    A,
                    "newtonsCradle",
                    "Composites.newtonsCradle ➤ moved to newtonsCradle example",
                  ),
                  (A.car = function (k, t, a, s, r) {
                    var d = C.nextGroup(!0),
                      M = 20,
                      S = -a * 0.5 + M,
                      v = a * 0.5 - M,
                      f = 0,
                      l = n.create({ label: "Car" }),
                      R = Q.rectangle(k, t, a, s, {
                        collisionFilter: { group: d },
                        chamfer: { radius: s * 0.5 },
                        density: 2e-4,
                      }),
                      h = Q.circle(k + S, t + f, r, {
                        collisionFilter: { group: d },
                        friction: 0.8,
                      }),
                      c = Q.circle(k + v, t + f, r, {
                        collisionFilter: { group: d },
                        friction: 0.8,
                      }),
                      m = i.create({
                        bodyB: R,
                        pointB: { x: S, y: f },
                        bodyA: h,
                        stiffness: 1,
                        length: 0,
                      }),
                      Y = i.create({
                        bodyB: R,
                        pointB: { x: v, y: f },
                        bodyA: c,
                        stiffness: 1,
                        length: 0,
                      });
                    return (
                      n.addBody(l, R),
                      n.addBody(l, h),
                      n.addBody(l, c),
                      n.addConstraint(l, m),
                      n.addConstraint(l, Y),
                      l
                    );
                  }),
                  B(A, "car", "Composites.car ➤ moved to car example"),
                  (A.softBody = function (k, t, a, s, r, d, M, S, v, f) {
                    ((v = I.extend({ inertia: 1 / 0 }, v)),
                      (f = I.extend(
                        {
                          stiffness: 0.2,
                          render: { type: "line", anchors: !1 },
                        },
                        f,
                      )));
                    var l = A.stack(k, t, a, s, r, d, function (R, h) {
                      return Q.circle(R, h, S, v);
                    });
                    return (A.mesh(l, a, s, M, f), (l.label = "Soft Body"), l);
                  }),
                  B(
                    A,
                    "softBody",
                    "Composites.softBody ➤ moved to softBody and cloth examples",
                  ));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(9),
                i = E(0),
                I = i.deprecated;
              (function () {
                ((A.create = function (C) {
                  var Q = {
                    buckets: {},
                    pairs: {},
                    pairsList: [],
                    bucketWidth: 48,
                    bucketHeight: 48,
                  };
                  return i.extend(Q, C);
                }),
                  (A.update = function (C, Q, B, k) {
                    var t,
                      a,
                      s,
                      r = B.world,
                      d = C.buckets,
                      M,
                      S,
                      v = !1;
                    for (t = 0; t < Q.length; t++) {
                      var f = Q[t];
                      if (
                        !(f.isSleeping && !k) &&
                        !(
                          r.bounds &&
                          (f.bounds.max.x < r.bounds.min.x ||
                            f.bounds.min.x > r.bounds.max.x ||
                            f.bounds.max.y < r.bounds.min.y ||
                            f.bounds.min.y > r.bounds.max.y)
                        )
                      ) {
                        var l = A._getRegion(C, f);
                        if (!f.region || l.id !== f.region.id || k) {
                          (!f.region || k) && (f.region = l);
                          var R = A._regionUnion(l, f.region);
                          for (a = R.startCol; a <= R.endCol; a++)
                            for (s = R.startRow; s <= R.endRow; s++) {
                              ((S = A._getBucketId(a, s)), (M = d[S]));
                              var h =
                                  a >= l.startCol &&
                                  a <= l.endCol &&
                                  s >= l.startRow &&
                                  s <= l.endRow,
                                c =
                                  a >= f.region.startCol &&
                                  a <= f.region.endCol &&
                                  s >= f.region.startRow &&
                                  s <= f.region.endRow;
                              (!h &&
                                c &&
                                c &&
                                M &&
                                A._bucketRemoveBody(C, M, f),
                                (f.region === l || (h && !c) || k) &&
                                  (M || (M = A._createBucket(d, S)),
                                  A._bucketAddBody(C, M, f)));
                            }
                          ((f.region = l), (v = !0));
                        }
                      }
                    }
                    v && (C.pairsList = A._createActivePairsList(C));
                  }),
                  I(A, "update", "Grid.update ➤ replaced by Matter.Detector"),
                  (A.clear = function (C) {
                    ((C.buckets = {}), (C.pairs = {}), (C.pairsList = []));
                  }),
                  I(A, "clear", "Grid.clear ➤ replaced by Matter.Detector"),
                  (A._regionUnion = function (C, Q) {
                    var B = Math.min(C.startCol, Q.startCol),
                      k = Math.max(C.endCol, Q.endCol),
                      t = Math.min(C.startRow, Q.startRow),
                      a = Math.max(C.endRow, Q.endRow);
                    return A._createRegion(B, k, t, a);
                  }),
                  (A._getRegion = function (C, Q) {
                    var B = Q.bounds,
                      k = Math.floor(B.min.x / C.bucketWidth),
                      t = Math.floor(B.max.x / C.bucketWidth),
                      a = Math.floor(B.min.y / C.bucketHeight),
                      s = Math.floor(B.max.y / C.bucketHeight);
                    return A._createRegion(k, t, a, s);
                  }),
                  (A._createRegion = function (C, Q, B, k) {
                    return {
                      id: C + "," + Q + "," + B + "," + k,
                      startCol: C,
                      endCol: Q,
                      startRow: B,
                      endRow: k,
                    };
                  }),
                  (A._getBucketId = function (C, Q) {
                    return "C" + C + "R" + Q;
                  }),
                  (A._createBucket = function (C, Q) {
                    var B = (C[Q] = []);
                    return B;
                  }),
                  (A._bucketAddBody = function (C, Q, B) {
                    var k = C.pairs,
                      t = n.id,
                      a = Q.length,
                      s;
                    for (s = 0; s < a; s++) {
                      var r = Q[s];
                      if (!(B.id === r.id || (B.isStatic && r.isStatic))) {
                        var d = t(B, r),
                          M = k[d];
                        M ? (M[2] += 1) : (k[d] = [B, r, 1]);
                      }
                    }
                    Q.push(B);
                  }),
                  (A._bucketRemoveBody = function (C, Q, B) {
                    var k = C.pairs,
                      t = n.id,
                      a;
                    Q.splice(i.indexOf(Q, B), 1);
                    var s = Q.length;
                    for (a = 0; a < s; a++) {
                      var r = k[t(B, Q[a])];
                      r && (r[2] -= 1);
                    }
                  }),
                  (A._createActivePairsList = function (C) {
                    var Q,
                      B = C.pairs,
                      k = i.keys(B),
                      t = k.length,
                      a = [],
                      s;
                    for (s = 0; s < t; s++)
                      ((Q = B[k[s]]), Q[2] > 0 ? a.push(Q) : delete B[k[s]]);
                    return a;
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(3),
                i = E(7),
                I = E(14),
                C = E(5),
                Q = E(13),
                B = E(10),
                k = E(6),
                t = E(0),
                a = E(1);
              (function () {
                ((A.create = function (s, r) {
                  var d = (s ? s.mouse : null) || (r ? r.mouse : null);
                  d ||
                    (s && s.render && s.render.canvas
                      ? (d = I.create(s.render.canvas))
                      : r && r.element
                        ? (d = I.create(r.element))
                        : ((d = I.create()),
                          t.warn(
                            "MouseConstraint.create: options.mouse was undefined, options.element was undefined, may not function as expected",
                          )));
                  var M = B.create({
                      label: "Mouse Constraint",
                      pointA: d.position,
                      pointB: { x: 0, y: 0 },
                      length: 0.01,
                      stiffness: 0.1,
                      angularStiffness: 1,
                      render: { strokeStyle: "#90EE90", lineWidth: 3 },
                    }),
                    S = {
                      type: "mouseConstraint",
                      mouse: d,
                      element: null,
                      body: null,
                      constraint: M,
                      collisionFilter: {
                        category: 1,
                        mask: 4294967295,
                        group: 0,
                      },
                    },
                    v = t.extend(S, r);
                  return (
                    C.on(s, "beforeUpdate", function () {
                      var f = k.allBodies(s.world);
                      (A.update(v, f), A._triggerEvents(v));
                    }),
                    v
                  );
                }),
                  (A.update = function (s, r) {
                    var d = s.mouse,
                      M = s.constraint,
                      S = s.body;
                    if (d.button === 0) {
                      if (M.bodyB)
                        (i.set(M.bodyB, !1), (M.pointA = d.position));
                      else
                        for (var v = 0; v < r.length; v++)
                          if (
                            ((S = r[v]),
                            a.contains(S.bounds, d.position) &&
                              Q.canCollide(
                                S.collisionFilter,
                                s.collisionFilter,
                              ))
                          )
                            for (
                              var f = S.parts.length > 1 ? 1 : 0;
                              f < S.parts.length;
                              f++
                            ) {
                              var l = S.parts[f];
                              if (n.contains(l.vertices, d.position)) {
                                ((M.pointA = d.position),
                                  (M.bodyB = s.body = S),
                                  (M.pointB = {
                                    x: d.position.x - S.position.x,
                                    y: d.position.y - S.position.y,
                                  }),
                                  (M.angleB = S.angle),
                                  i.set(S, !1),
                                  C.trigger(s, "startdrag", {
                                    mouse: d,
                                    body: S,
                                  }));
                                break;
                              }
                            }
                    } else
                      ((M.bodyB = s.body = null),
                        (M.pointB = null),
                        S && C.trigger(s, "enddrag", { mouse: d, body: S }));
                  }),
                  (A._triggerEvents = function (s) {
                    var r = s.mouse,
                      d = r.sourceEvents;
                    (d.mousemove && C.trigger(s, "mousemove", { mouse: r }),
                      d.mousedown && C.trigger(s, "mousedown", { mouse: r }),
                      d.mouseup && C.trigger(s, "mouseup", { mouse: r }),
                      I.clearSourceEvents(r));
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(2),
                i = E(8),
                I = E(1),
                C = E(12),
                Q = E(3);
              (function () {
                ((A.collides = function (B, k) {
                  for (
                    var t = [],
                      a = k.length,
                      s = B.bounds,
                      r = i.collides,
                      d = I.overlaps,
                      M = 0;
                    M < a;
                    M++
                  ) {
                    var S = k[M],
                      v = S.parts.length,
                      f = v === 1 ? 0 : 1;
                    if (d(S.bounds, s))
                      for (var l = f; l < v; l++) {
                        var R = S.parts[l];
                        if (d(R.bounds, s)) {
                          var h = r(R, B);
                          if (h) {
                            t.push(h);
                            break;
                          }
                        }
                      }
                  }
                  return t;
                }),
                  (A.ray = function (B, k, t, a) {
                    a = a || 1e-100;
                    for (
                      var s = n.angle(k, t),
                        r = n.magnitude(n.sub(k, t)),
                        d = (t.x + k.x) * 0.5,
                        M = (t.y + k.y) * 0.5,
                        S = C.rectangle(d, M, r, a, { angle: s }),
                        v = A.collides(S, B),
                        f = 0;
                      f < v.length;
                      f += 1
                    ) {
                      var l = v[f];
                      l.body = l.bodyB = l.bodyA;
                    }
                    return v;
                  }),
                  (A.region = function (B, k, t) {
                    for (var a = [], s = 0; s < B.length; s++) {
                      var r = B[s],
                        d = I.overlaps(r.bounds, k);
                      ((d && !t) || (!d && t)) && a.push(r);
                    }
                    return a;
                  }),
                  (A.point = function (B, k) {
                    for (var t = [], a = 0; a < B.length; a++) {
                      var s = B[a];
                      if (I.contains(s.bounds, k))
                        for (
                          var r = s.parts.length === 1 ? 0 : 1;
                          r < s.parts.length;
                          r++
                        ) {
                          var d = s.parts[r];
                          if (
                            I.contains(d.bounds, k) &&
                            Q.contains(d.vertices, k)
                          ) {
                            t.push(s);
                            break;
                          }
                        }
                    }
                    return t;
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(4),
                i = E(0),
                I = E(6),
                C = E(1),
                Q = E(5),
                B = E(2),
                k = E(14);
              (function () {
                var t, a;
                (typeof window < "u" &&
                  ((t =
                    window.requestAnimationFrame ||
                    window.webkitRequestAnimationFrame ||
                    window.mozRequestAnimationFrame ||
                    window.msRequestAnimationFrame ||
                    function (f) {
                      window.setTimeout(function () {
                        f(i.now());
                      }, 1e3 / 60);
                    }),
                  (a =
                    window.cancelAnimationFrame ||
                    window.mozCancelAnimationFrame ||
                    window.webkitCancelAnimationFrame ||
                    window.msCancelAnimationFrame)),
                  (A._goodFps = 30),
                  (A._goodDelta = 1e3 / 60),
                  (A.create = function (f) {
                    var l = {
                        engine: null,
                        element: null,
                        canvas: null,
                        mouse: null,
                        frameRequestId: null,
                        timing: {
                          historySize: 60,
                          delta: 0,
                          deltaHistory: [],
                          lastTime: 0,
                          lastTimestamp: 0,
                          lastElapsed: 0,
                          timestampElapsed: 0,
                          timestampElapsedHistory: [],
                          engineDeltaHistory: [],
                          engineElapsedHistory: [],
                          engineUpdatesHistory: [],
                          elapsedHistory: [],
                        },
                        options: {
                          width: 800,
                          height: 600,
                          pixelRatio: 1,
                          background: "#14151f",
                          wireframeBackground: "#14151f",
                          wireframeStrokeStyle: "#bbb",
                          hasBounds: !!f.bounds,
                          enabled: !0,
                          wireframes: !0,
                          showSleeping: !0,
                          showDebug: !1,
                          showStats: !1,
                          showPerformance: !1,
                          showBounds: !1,
                          showVelocity: !1,
                          showCollisions: !1,
                          showSeparations: !1,
                          showAxes: !1,
                          showPositions: !1,
                          showAngleIndicator: !1,
                          showIds: !1,
                          showVertexNumbers: !1,
                          showConvexHulls: !1,
                          showInternalEdges: !1,
                          showMousePosition: !1,
                        },
                      },
                      R = i.extend(l, f);
                    return (
                      R.canvas &&
                        ((R.canvas.width = R.options.width || R.canvas.width),
                        (R.canvas.height =
                          R.options.height || R.canvas.height)),
                      (R.mouse = f.mouse),
                      (R.engine = f.engine),
                      (R.canvas =
                        R.canvas || d(R.options.width, R.options.height)),
                      (R.context = R.canvas.getContext("2d")),
                      (R.textures = {}),
                      (R.bounds = R.bounds || {
                        min: { x: 0, y: 0 },
                        max: { x: R.canvas.width, y: R.canvas.height },
                      }),
                      (R.controller = A),
                      (R.options.showBroadphase = !1),
                      R.options.pixelRatio !== 1 &&
                        A.setPixelRatio(R, R.options.pixelRatio),
                      i.isElement(R.element) && R.element.appendChild(R.canvas),
                      R
                    );
                  }),
                  (A.run = function (f) {
                    (function l(R) {
                      ((f.frameRequestId = t(l)),
                        s(f, R),
                        A.world(f, R),
                        f.context.setTransform(
                          f.options.pixelRatio,
                          0,
                          0,
                          f.options.pixelRatio,
                          0,
                          0,
                        ),
                        (f.options.showStats || f.options.showDebug) &&
                          A.stats(f, f.context, R),
                        (f.options.showPerformance || f.options.showDebug) &&
                          A.performance(f, f.context, R),
                        f.context.setTransform(1, 0, 0, 1, 0, 0));
                    })();
                  }),
                  (A.stop = function (f) {
                    a(f.frameRequestId);
                  }),
                  (A.setPixelRatio = function (f, l) {
                    var R = f.options,
                      h = f.canvas;
                    (l === "auto" && (l = M(h)),
                      (R.pixelRatio = l),
                      h.setAttribute("data-pixel-ratio", l),
                      (h.width = R.width * l),
                      (h.height = R.height * l),
                      (h.style.width = R.width + "px"),
                      (h.style.height = R.height + "px"));
                  }),
                  (A.setSize = function (f, l, R) {
                    ((f.options.width = l),
                      (f.options.height = R),
                      (f.bounds.max.x = f.bounds.min.x + l),
                      (f.bounds.max.y = f.bounds.min.y + R),
                      f.options.pixelRatio !== 1
                        ? A.setPixelRatio(f, f.options.pixelRatio)
                        : ((f.canvas.width = l), (f.canvas.height = R)));
                  }),
                  (A.lookAt = function (f, l, R, h) {
                    ((h = typeof h < "u" ? h : !0),
                      (l = i.isArray(l) ? l : [l]),
                      (R = R || { x: 0, y: 0 }));
                    for (
                      var c = {
                          min: { x: 1 / 0, y: 1 / 0 },
                          max: { x: -1 / 0, y: -1 / 0 },
                        },
                        m = 0;
                      m < l.length;
                      m += 1
                    ) {
                      var Y = l[m],
                        J = Y.bounds ? Y.bounds.min : Y.min || Y.position || Y,
                        Z = Y.bounds ? Y.bounds.max : Y.max || Y.position || Y;
                      J &&
                        Z &&
                        (J.x < c.min.x && (c.min.x = J.x),
                        Z.x > c.max.x && (c.max.x = Z.x),
                        J.y < c.min.y && (c.min.y = J.y),
                        Z.y > c.max.y && (c.max.y = Z.y));
                    }
                    var D = c.max.x - c.min.x + 2 * R.x,
                      z = c.max.y - c.min.y + 2 * R.y,
                      y = f.canvas.height,
                      G = f.canvas.width,
                      p = G / y,
                      F = D / z,
                      b = 1,
                      U = 1;
                    (F > p ? (U = F / p) : (b = p / F),
                      (f.options.hasBounds = !0),
                      (f.bounds.min.x = c.min.x),
                      (f.bounds.max.x = c.min.x + D * b),
                      (f.bounds.min.y = c.min.y),
                      (f.bounds.max.y = c.min.y + z * U),
                      h &&
                        ((f.bounds.min.x += D * 0.5 - D * b * 0.5),
                        (f.bounds.max.x += D * 0.5 - D * b * 0.5),
                        (f.bounds.min.y += z * 0.5 - z * U * 0.5),
                        (f.bounds.max.y += z * 0.5 - z * U * 0.5)),
                      (f.bounds.min.x -= R.x),
                      (f.bounds.max.x -= R.x),
                      (f.bounds.min.y -= R.y),
                      (f.bounds.max.y -= R.y),
                      f.mouse &&
                        (k.setScale(f.mouse, {
                          x: (f.bounds.max.x - f.bounds.min.x) / f.canvas.width,
                          y:
                            (f.bounds.max.y - f.bounds.min.y) / f.canvas.height,
                        }),
                        k.setOffset(f.mouse, f.bounds.min)));
                  }),
                  (A.startViewTransform = function (f) {
                    var l = f.bounds.max.x - f.bounds.min.x,
                      R = f.bounds.max.y - f.bounds.min.y,
                      h = l / f.options.width,
                      c = R / f.options.height;
                    (f.context.setTransform(
                      f.options.pixelRatio / h,
                      0,
                      0,
                      f.options.pixelRatio / c,
                      0,
                      0,
                    ),
                      f.context.translate(-f.bounds.min.x, -f.bounds.min.y));
                  }),
                  (A.endViewTransform = function (f) {
                    f.context.setTransform(
                      f.options.pixelRatio,
                      0,
                      0,
                      f.options.pixelRatio,
                      0,
                      0,
                    );
                  }),
                  (A.world = function (f, l) {
                    var R = i.now(),
                      h = f.engine,
                      c = h.world,
                      m = f.canvas,
                      Y = f.context,
                      J = f.options,
                      Z = f.timing,
                      D = I.allBodies(c),
                      z = I.allConstraints(c),
                      y = J.wireframes ? J.wireframeBackground : J.background,
                      G = [],
                      p = [],
                      F,
                      b = { timestamp: h.timing.timestamp };
                    if (
                      (Q.trigger(f, "beforeRender", b),
                      f.currentBackground !== y && v(f, y),
                      (Y.globalCompositeOperation = "source-in"),
                      (Y.fillStyle = "transparent"),
                      Y.fillRect(0, 0, m.width, m.height),
                      (Y.globalCompositeOperation = "source-over"),
                      J.hasBounds)
                    ) {
                      for (F = 0; F < D.length; F++) {
                        var U = D[F];
                        C.overlaps(U.bounds, f.bounds) && G.push(U);
                      }
                      for (F = 0; F < z.length; F++) {
                        var N = z[F],
                          W = N.bodyA,
                          P = N.bodyB,
                          X = N.pointA,
                          T = N.pointB;
                        (W && (X = B.add(W.position, N.pointA)),
                          P && (T = B.add(P.position, N.pointB)),
                          !(!X || !T) &&
                            (C.contains(f.bounds, X) ||
                              C.contains(f.bounds, T)) &&
                            p.push(N));
                      }
                      (A.startViewTransform(f),
                        f.mouse &&
                          (k.setScale(f.mouse, {
                            x:
                              (f.bounds.max.x - f.bounds.min.x) /
                              f.options.width,
                            y:
                              (f.bounds.max.y - f.bounds.min.y) /
                              f.options.height,
                          }),
                          k.setOffset(f.mouse, f.bounds.min)));
                    } else
                      ((p = z),
                        (G = D),
                        f.options.pixelRatio !== 1 &&
                          f.context.setTransform(
                            f.options.pixelRatio,
                            0,
                            0,
                            f.options.pixelRatio,
                            0,
                            0,
                          ));
                    (!J.wireframes || (h.enableSleeping && J.showSleeping)
                      ? A.bodies(f, G, Y)
                      : (J.showConvexHulls && A.bodyConvexHulls(f, G, Y),
                        A.bodyWireframes(f, G, Y)),
                      J.showBounds && A.bodyBounds(f, G, Y),
                      (J.showAxes || J.showAngleIndicator) &&
                        A.bodyAxes(f, G, Y),
                      J.showPositions && A.bodyPositions(f, G, Y),
                      J.showVelocity && A.bodyVelocity(f, G, Y),
                      J.showIds && A.bodyIds(f, G, Y),
                      J.showSeparations && A.separations(f, h.pairs.list, Y),
                      J.showCollisions && A.collisions(f, h.pairs.list, Y),
                      J.showVertexNumbers && A.vertexNumbers(f, G, Y),
                      J.showMousePosition && A.mousePosition(f, f.mouse, Y),
                      A.constraints(p, Y),
                      J.hasBounds && A.endViewTransform(f),
                      Q.trigger(f, "afterRender", b),
                      (Z.lastElapsed = i.now() - R));
                  }),
                  (A.stats = function (f, l, R) {
                    for (
                      var h = f.engine,
                        c = h.world,
                        m = I.allBodies(c),
                        Y = 0,
                        J = 55,
                        Z = 44,
                        D = 0,
                        z = 0,
                        y = 0;
                      y < m.length;
                      y += 1
                    )
                      Y += m[y].parts.length;
                    var G = {
                      Part: Y,
                      Body: m.length,
                      Cons: I.allConstraints(c).length,
                      Comp: I.allComposites(c).length,
                      Pair: h.pairs.list.length,
                    };
                    ((l.fillStyle = "#0e0f19"),
                      l.fillRect(D, z, J * 5.5, Z),
                      (l.font = "12px Arial"),
                      (l.textBaseline = "top"),
                      (l.textAlign = "right"));
                    for (var p in G) {
                      var F = G[p];
                      ((l.fillStyle = "#aaa"),
                        l.fillText(p, D + J, z + 8),
                        (l.fillStyle = "#eee"),
                        l.fillText(F, D + J, z + 26),
                        (D += J));
                    }
                  }),
                  (A.performance = function (f, l) {
                    var R = f.engine,
                      h = f.timing,
                      c = h.deltaHistory,
                      m = h.elapsedHistory,
                      Y = h.timestampElapsedHistory,
                      J = h.engineDeltaHistory,
                      Z = h.engineUpdatesHistory,
                      D = h.engineElapsedHistory,
                      z = R.timing.lastUpdatesPerFrame,
                      y = R.timing.lastDelta,
                      G = r(c),
                      p = r(m),
                      F = r(J),
                      b = r(Z),
                      U = r(D),
                      N = r(Y),
                      W = N / G || 0,
                      P = Math.round(G / y),
                      X = 1e3 / G || 0,
                      T = 4,
                      _ = 12,
                      H = 60,
                      cA = 34,
                      tA = 10,
                      EA = 69;
                    ((l.fillStyle = "#0e0f19"),
                      l.fillRect(0, 50, _ * 5 + H * 6 + 22, cA),
                      A.status(
                        l,
                        tA,
                        EA,
                        H,
                        T,
                        c.length,
                        Math.round(X) + " fps",
                        X / A._goodFps,
                        function (AA) {
                          return c[AA] / G - 1;
                        },
                      ),
                      A.status(
                        l,
                        tA + _ + H,
                        EA,
                        H,
                        T,
                        J.length,
                        y.toFixed(2) + " dt",
                        A._goodDelta / y,
                        function (AA) {
                          return J[AA] / F - 1;
                        },
                      ),
                      A.status(
                        l,
                        tA + (_ + H) * 2,
                        EA,
                        H,
                        T,
                        Z.length,
                        z + " upf",
                        Math.pow(i.clamp(b / P || 1, 0, 1), 4),
                        function (AA) {
                          return Z[AA] / b - 1;
                        },
                      ),
                      A.status(
                        l,
                        tA + (_ + H) * 3,
                        EA,
                        H,
                        T,
                        D.length,
                        U.toFixed(2) + " ut",
                        1 - (z * U) / A._goodFps,
                        function (AA) {
                          return D[AA] / U - 1;
                        },
                      ),
                      A.status(
                        l,
                        tA + (_ + H) * 4,
                        EA,
                        H,
                        T,
                        m.length,
                        p.toFixed(2) + " rt",
                        1 - p / A._goodFps,
                        function (AA) {
                          return m[AA] / p - 1;
                        },
                      ),
                      A.status(
                        l,
                        tA + (_ + H) * 5,
                        EA,
                        H,
                        T,
                        Y.length,
                        W.toFixed(2) + " x",
                        W * W * W,
                        function (AA) {
                          return (Y[AA] / c[AA] / W || 0) - 1;
                        },
                      ));
                  }),
                  (A.status = function (f, l, R, h, c, m, Y, J, Z) {
                    ((f.strokeStyle = "#888"),
                      (f.fillStyle = "#444"),
                      (f.lineWidth = 1),
                      f.fillRect(l, R + 7, h, 1),
                      f.beginPath(),
                      f.moveTo(l, R + 7 - c * i.clamp(0.4 * Z(0), -2, 2)));
                    for (var D = 0; D < h; D += 1)
                      f.lineTo(
                        l + D,
                        R + 7 - (D < m ? c * i.clamp(0.4 * Z(D), -2, 2) : 0),
                      );
                    (f.stroke(),
                      (f.fillStyle =
                        "hsl(" + i.clamp(25 + 95 * J, 0, 120) + ",100%,60%)"),
                      f.fillRect(l, R - 7, 4, 4),
                      (f.font = "12px Arial"),
                      (f.textBaseline = "middle"),
                      (f.textAlign = "right"),
                      (f.fillStyle = "#eee"),
                      f.fillText(Y, l + h, R - 5));
                  }),
                  (A.constraints = function (f, l) {
                    for (var R = l, h = 0; h < f.length; h++) {
                      var c = f[h];
                      if (!(!c.render.visible || !c.pointA || !c.pointB)) {
                        var m = c.bodyA,
                          Y = c.bodyB,
                          J,
                          Z;
                        if (
                          (m
                            ? (J = B.add(m.position, c.pointA))
                            : (J = c.pointA),
                          c.render.type === "pin")
                        )
                          (R.beginPath(),
                            R.arc(J.x, J.y, 3, 0, 2 * Math.PI),
                            R.closePath());
                        else {
                          if (
                            (Y
                              ? (Z = B.add(Y.position, c.pointB))
                              : (Z = c.pointB),
                            R.beginPath(),
                            R.moveTo(J.x, J.y),
                            c.render.type === "spring")
                          )
                            for (
                              var D = B.sub(Z, J),
                                z = B.perp(B.normalise(D)),
                                y = Math.ceil(i.clamp(c.length / 5, 12, 20)),
                                G,
                                p = 1;
                              p < y;
                              p += 1
                            )
                              ((G = p % 2 === 0 ? 1 : -1),
                                R.lineTo(
                                  J.x + D.x * (p / y) + z.x * G * 4,
                                  J.y + D.y * (p / y) + z.y * G * 4,
                                ));
                          R.lineTo(Z.x, Z.y);
                        }
                        (c.render.lineWidth &&
                          ((R.lineWidth = c.render.lineWidth),
                          (R.strokeStyle = c.render.strokeStyle),
                          R.stroke()),
                          c.render.anchors &&
                            ((R.fillStyle = c.render.strokeStyle),
                            R.beginPath(),
                            R.arc(J.x, J.y, 3, 0, 2 * Math.PI),
                            R.arc(Z.x, Z.y, 3, 0, 2 * Math.PI),
                            R.closePath(),
                            R.fill()));
                      }
                    }
                  }),
                  (A.bodies = function (f, l, R) {
                    var h = R;
                    f.engine;
                    var c = f.options,
                      m = c.showInternalEdges || !c.wireframes,
                      Y,
                      J,
                      Z,
                      D;
                    for (Z = 0; Z < l.length; Z++)
                      if (((Y = l[Z]), !!Y.render.visible)) {
                        for (
                          D = Y.parts.length > 1 ? 1 : 0;
                          D < Y.parts.length;
                          D++
                        )
                          if (((J = Y.parts[D]), !!J.render.visible)) {
                            if (
                              (c.showSleeping && Y.isSleeping
                                ? (h.globalAlpha = 0.5 * J.render.opacity)
                                : J.render.opacity !== 1 &&
                                  (h.globalAlpha = J.render.opacity),
                              J.render.sprite &&
                                J.render.sprite.texture &&
                                !c.wireframes)
                            ) {
                              var z = J.render.sprite,
                                y = S(f, z.texture);
                              (h.translate(J.position.x, J.position.y),
                                h.rotate(J.angle),
                                h.drawImage(
                                  y,
                                  y.width * -z.xOffset * z.xScale,
                                  y.height * -z.yOffset * z.yScale,
                                  y.width * z.xScale,
                                  y.height * z.yScale,
                                ),
                                h.rotate(-J.angle),
                                h.translate(-J.position.x, -J.position.y));
                            } else {
                              if (J.circleRadius)
                                (h.beginPath(),
                                  h.arc(
                                    J.position.x,
                                    J.position.y,
                                    J.circleRadius,
                                    0,
                                    2 * Math.PI,
                                  ));
                              else {
                                (h.beginPath(),
                                  h.moveTo(J.vertices[0].x, J.vertices[0].y));
                                for (var G = 1; G < J.vertices.length; G++)
                                  (!J.vertices[G - 1].isInternal || m
                                    ? h.lineTo(J.vertices[G].x, J.vertices[G].y)
                                    : h.moveTo(
                                        J.vertices[G].x,
                                        J.vertices[G].y,
                                      ),
                                    J.vertices[G].isInternal &&
                                      !m &&
                                      h.moveTo(
                                        J.vertices[(G + 1) % J.vertices.length]
                                          .x,
                                        J.vertices[(G + 1) % J.vertices.length]
                                          .y,
                                      ));
                                (h.lineTo(J.vertices[0].x, J.vertices[0].y),
                                  h.closePath());
                              }
                              c.wireframes
                                ? ((h.lineWidth = 1),
                                  (h.strokeStyle =
                                    f.options.wireframeStrokeStyle),
                                  h.stroke())
                                : ((h.fillStyle = J.render.fillStyle),
                                  J.render.lineWidth &&
                                    ((h.lineWidth = J.render.lineWidth),
                                    (h.strokeStyle = J.render.strokeStyle),
                                    h.stroke()),
                                  h.fill());
                            }
                            h.globalAlpha = 1;
                          }
                      }
                  }),
                  (A.bodyWireframes = function (f, l, R) {
                    var h = R,
                      c = f.options.showInternalEdges,
                      m,
                      Y,
                      J,
                      Z,
                      D;
                    for (h.beginPath(), J = 0; J < l.length; J++)
                      if (((m = l[J]), !!m.render.visible))
                        for (
                          D = m.parts.length > 1 ? 1 : 0;
                          D < m.parts.length;
                          D++
                        ) {
                          for (
                            Y = m.parts[D],
                              h.moveTo(Y.vertices[0].x, Y.vertices[0].y),
                              Z = 1;
                            Z < Y.vertices.length;
                            Z++
                          )
                            (!Y.vertices[Z - 1].isInternal || c
                              ? h.lineTo(Y.vertices[Z].x, Y.vertices[Z].y)
                              : h.moveTo(Y.vertices[Z].x, Y.vertices[Z].y),
                              Y.vertices[Z].isInternal &&
                                !c &&
                                h.moveTo(
                                  Y.vertices[(Z + 1) % Y.vertices.length].x,
                                  Y.vertices[(Z + 1) % Y.vertices.length].y,
                                ));
                          h.lineTo(Y.vertices[0].x, Y.vertices[0].y);
                        }
                    ((h.lineWidth = 1),
                      (h.strokeStyle = f.options.wireframeStrokeStyle),
                      h.stroke());
                  }),
                  (A.bodyConvexHulls = function (f, l, R) {
                    var h = R,
                      c,
                      m,
                      Y;
                    for (h.beginPath(), m = 0; m < l.length; m++)
                      if (
                        ((c = l[m]),
                        !(!c.render.visible || c.parts.length === 1))
                      ) {
                        for (
                          h.moveTo(c.vertices[0].x, c.vertices[0].y), Y = 1;
                          Y < c.vertices.length;
                          Y++
                        )
                          h.lineTo(c.vertices[Y].x, c.vertices[Y].y);
                        h.lineTo(c.vertices[0].x, c.vertices[0].y);
                      }
                    ((h.lineWidth = 1),
                      (h.strokeStyle = "rgba(255,255,255,0.2)"),
                      h.stroke());
                  }),
                  (A.vertexNumbers = function (f, l, R) {
                    var h = R,
                      c,
                      m,
                      Y;
                    for (c = 0; c < l.length; c++) {
                      var J = l[c].parts;
                      for (Y = J.length > 1 ? 1 : 0; Y < J.length; Y++) {
                        var Z = J[Y];
                        for (m = 0; m < Z.vertices.length; m++)
                          ((h.fillStyle = "rgba(255,255,255,0.2)"),
                            h.fillText(
                              c + "_" + m,
                              Z.position.x +
                                (Z.vertices[m].x - Z.position.x) * 0.8,
                              Z.position.y +
                                (Z.vertices[m].y - Z.position.y) * 0.8,
                            ));
                      }
                    }
                  }),
                  (A.mousePosition = function (f, l, R) {
                    var h = R;
                    ((h.fillStyle = "rgba(255,255,255,0.8)"),
                      h.fillText(
                        l.position.x + "  " + l.position.y,
                        l.position.x + 5,
                        l.position.y - 5,
                      ));
                  }),
                  (A.bodyBounds = function (f, l, R) {
                    var h = R;
                    f.engine;
                    var c = f.options;
                    h.beginPath();
                    for (var m = 0; m < l.length; m++) {
                      var Y = l[m];
                      if (Y.render.visible)
                        for (
                          var J = l[m].parts, Z = J.length > 1 ? 1 : 0;
                          Z < J.length;
                          Z++
                        ) {
                          var D = J[Z];
                          h.rect(
                            D.bounds.min.x,
                            D.bounds.min.y,
                            D.bounds.max.x - D.bounds.min.x,
                            D.bounds.max.y - D.bounds.min.y,
                          );
                        }
                    }
                    (c.wireframes
                      ? (h.strokeStyle = "rgba(255,255,255,0.08)")
                      : (h.strokeStyle = "rgba(0,0,0,0.1)"),
                      (h.lineWidth = 1),
                      h.stroke());
                  }),
                  (A.bodyAxes = function (f, l, R) {
                    var h = R;
                    f.engine;
                    var c = f.options,
                      m,
                      Y,
                      J,
                      Z;
                    for (h.beginPath(), Y = 0; Y < l.length; Y++) {
                      var D = l[Y],
                        z = D.parts;
                      if (D.render.visible)
                        if (c.showAxes)
                          for (J = z.length > 1 ? 1 : 0; J < z.length; J++)
                            for (m = z[J], Z = 0; Z < m.axes.length; Z++) {
                              var y = m.axes[Z];
                              (h.moveTo(m.position.x, m.position.y),
                                h.lineTo(
                                  m.position.x + y.x * 20,
                                  m.position.y + y.y * 20,
                                ));
                            }
                        else
                          for (J = z.length > 1 ? 1 : 0; J < z.length; J++)
                            for (m = z[J], Z = 0; Z < m.axes.length; Z++)
                              (h.moveTo(m.position.x, m.position.y),
                                h.lineTo(
                                  (m.vertices[0].x +
                                    m.vertices[m.vertices.length - 1].x) /
                                    2,
                                  (m.vertices[0].y +
                                    m.vertices[m.vertices.length - 1].y) /
                                    2,
                                ));
                    }
                    (c.wireframes
                      ? ((h.strokeStyle = "indianred"), (h.lineWidth = 1))
                      : ((h.strokeStyle = "rgba(255, 255, 255, 0.4)"),
                        (h.globalCompositeOperation = "overlay"),
                        (h.lineWidth = 2)),
                      h.stroke(),
                      (h.globalCompositeOperation = "source-over"));
                  }),
                  (A.bodyPositions = function (f, l, R) {
                    var h = R;
                    f.engine;
                    var c = f.options,
                      m,
                      Y,
                      J,
                      Z;
                    for (h.beginPath(), J = 0; J < l.length; J++)
                      if (((m = l[J]), !!m.render.visible))
                        for (Z = 0; Z < m.parts.length; Z++)
                          ((Y = m.parts[Z]),
                            h.arc(
                              Y.position.x,
                              Y.position.y,
                              3,
                              0,
                              2 * Math.PI,
                              !1,
                            ),
                            h.closePath());
                    for (
                      c.wireframes
                        ? (h.fillStyle = "indianred")
                        : (h.fillStyle = "rgba(0,0,0,0.5)"),
                        h.fill(),
                        h.beginPath(),
                        J = 0;
                      J < l.length;
                      J++
                    )
                      ((m = l[J]),
                        m.render.visible &&
                          (h.arc(
                            m.positionPrev.x,
                            m.positionPrev.y,
                            2,
                            0,
                            2 * Math.PI,
                            !1,
                          ),
                          h.closePath()));
                    ((h.fillStyle = "rgba(255,165,0,0.8)"), h.fill());
                  }),
                  (A.bodyVelocity = function (f, l, R) {
                    var h = R;
                    h.beginPath();
                    for (var c = 0; c < l.length; c++) {
                      var m = l[c];
                      if (m.render.visible) {
                        var Y = n.getVelocity(m);
                        (h.moveTo(m.position.x, m.position.y),
                          h.lineTo(m.position.x + Y.x, m.position.y + Y.y));
                      }
                    }
                    ((h.lineWidth = 3),
                      (h.strokeStyle = "cornflowerblue"),
                      h.stroke());
                  }),
                  (A.bodyIds = function (f, l, R) {
                    var h = R,
                      c,
                      m;
                    for (c = 0; c < l.length; c++)
                      if (l[c].render.visible) {
                        var Y = l[c].parts;
                        for (m = Y.length > 1 ? 1 : 0; m < Y.length; m++) {
                          var J = Y[m];
                          ((h.font = "12px Arial"),
                            (h.fillStyle = "rgba(255,255,255,0.5)"),
                            h.fillText(
                              J.id,
                              J.position.x + 10,
                              J.position.y - 10,
                            ));
                        }
                      }
                  }),
                  (A.collisions = function (f, l, R) {
                    var h = R,
                      c = f.options,
                      m,
                      Y,
                      J,
                      Z;
                    for (h.beginPath(), J = 0; J < l.length; J++)
                      if (((m = l[J]), !!m.isActive))
                        for (Y = m.collision, Z = 0; Z < m.contactCount; Z++) {
                          var D = m.contacts[Z],
                            z = D.vertex;
                          h.rect(z.x - 1.5, z.y - 1.5, 3.5, 3.5);
                        }
                    for (
                      c.wireframes
                        ? (h.fillStyle = "rgba(255,255,255,0.7)")
                        : (h.fillStyle = "orange"),
                        h.fill(),
                        h.beginPath(),
                        J = 0;
                      J < l.length;
                      J++
                    )
                      if (
                        ((m = l[J]),
                        !!m.isActive && ((Y = m.collision), m.contactCount > 0))
                      ) {
                        var y = m.contacts[0].vertex.x,
                          G = m.contacts[0].vertex.y;
                        (m.contactCount === 2 &&
                          ((y =
                            (m.contacts[0].vertex.x + m.contacts[1].vertex.x) /
                            2),
                          (G =
                            (m.contacts[0].vertex.y + m.contacts[1].vertex.y) /
                            2)),
                          Y.bodyB === Y.supports[0].body ||
                          Y.bodyA.isStatic === !0
                            ? h.moveTo(y - Y.normal.x * 8, G - Y.normal.y * 8)
                            : h.moveTo(y + Y.normal.x * 8, G + Y.normal.y * 8),
                          h.lineTo(y, G));
                      }
                    (c.wireframes
                      ? (h.strokeStyle = "rgba(255,165,0,0.7)")
                      : (h.strokeStyle = "orange"),
                      (h.lineWidth = 1),
                      h.stroke());
                  }),
                  (A.separations = function (f, l, R) {
                    var h = R,
                      c = f.options,
                      m,
                      Y,
                      J,
                      Z,
                      D;
                    for (h.beginPath(), D = 0; D < l.length; D++)
                      if (((m = l[D]), !!m.isActive)) {
                        ((Y = m.collision), (J = Y.bodyA), (Z = Y.bodyB));
                        var z = 1;
                        (!Z.isStatic && !J.isStatic && (z = 0.5),
                          Z.isStatic && (z = 0),
                          h.moveTo(Z.position.x, Z.position.y),
                          h.lineTo(
                            Z.position.x - Y.penetration.x * z,
                            Z.position.y - Y.penetration.y * z,
                          ),
                          (z = 1),
                          !Z.isStatic && !J.isStatic && (z = 0.5),
                          J.isStatic && (z = 0),
                          h.moveTo(J.position.x, J.position.y),
                          h.lineTo(
                            J.position.x + Y.penetration.x * z,
                            J.position.y + Y.penetration.y * z,
                          ));
                      }
                    (c.wireframes
                      ? (h.strokeStyle = "rgba(255,165,0,0.5)")
                      : (h.strokeStyle = "orange"),
                      h.stroke());
                  }),
                  (A.inspector = function (f, l) {
                    f.engine;
                    var R = f.selected,
                      h = f.render,
                      c = h.options,
                      m;
                    if (c.hasBounds) {
                      var Y = h.bounds.max.x - h.bounds.min.x,
                        J = h.bounds.max.y - h.bounds.min.y,
                        Z = Y / h.options.width,
                        D = J / h.options.height;
                      (l.scale(1 / Z, 1 / D),
                        l.translate(-h.bounds.min.x, -h.bounds.min.y));
                    }
                    for (var z = 0; z < R.length; z++) {
                      var y = R[z].data;
                      switch (
                        (l.translate(0.5, 0.5),
                        (l.lineWidth = 1),
                        (l.strokeStyle = "rgba(255,165,0,0.9)"),
                        l.setLineDash([1, 2]),
                        y.type)
                      ) {
                        case "body":
                          ((m = y.bounds),
                            l.beginPath(),
                            l.rect(
                              Math.floor(m.min.x - 3),
                              Math.floor(m.min.y - 3),
                              Math.floor(m.max.x - m.min.x + 6),
                              Math.floor(m.max.y - m.min.y + 6),
                            ),
                            l.closePath(),
                            l.stroke());
                          break;
                        case "constraint":
                          var G = y.pointA;
                          (y.bodyA && (G = y.pointB),
                            l.beginPath(),
                            l.arc(G.x, G.y, 10, 0, 2 * Math.PI),
                            l.closePath(),
                            l.stroke());
                          break;
                      }
                      (l.setLineDash([]), l.translate(-0.5, -0.5));
                    }
                    (f.selectStart !== null &&
                      (l.translate(0.5, 0.5),
                      (l.lineWidth = 1),
                      (l.strokeStyle = "rgba(255,165,0,0.6)"),
                      (l.fillStyle = "rgba(255,165,0,0.1)"),
                      (m = f.selectBounds),
                      l.beginPath(),
                      l.rect(
                        Math.floor(m.min.x),
                        Math.floor(m.min.y),
                        Math.floor(m.max.x - m.min.x),
                        Math.floor(m.max.y - m.min.y),
                      ),
                      l.closePath(),
                      l.stroke(),
                      l.fill(),
                      l.translate(-0.5, -0.5)),
                      c.hasBounds && l.setTransform(1, 0, 0, 1, 0, 0));
                  }));
                var s = function (f, l) {
                    var R = f.engine,
                      h = f.timing,
                      c = h.historySize,
                      m = R.timing.timestamp;
                    ((h.delta = l - h.lastTime || A._goodDelta),
                      (h.lastTime = l),
                      (h.timestampElapsed = m - h.lastTimestamp || 0),
                      (h.lastTimestamp = m),
                      h.deltaHistory.unshift(h.delta),
                      (h.deltaHistory.length = Math.min(
                        h.deltaHistory.length,
                        c,
                      )),
                      h.engineDeltaHistory.unshift(R.timing.lastDelta),
                      (h.engineDeltaHistory.length = Math.min(
                        h.engineDeltaHistory.length,
                        c,
                      )),
                      h.timestampElapsedHistory.unshift(h.timestampElapsed),
                      (h.timestampElapsedHistory.length = Math.min(
                        h.timestampElapsedHistory.length,
                        c,
                      )),
                      h.engineUpdatesHistory.unshift(
                        R.timing.lastUpdatesPerFrame,
                      ),
                      (h.engineUpdatesHistory.length = Math.min(
                        h.engineUpdatesHistory.length,
                        c,
                      )),
                      h.engineElapsedHistory.unshift(R.timing.lastElapsed),
                      (h.engineElapsedHistory.length = Math.min(
                        h.engineElapsedHistory.length,
                        c,
                      )),
                      h.elapsedHistory.unshift(h.lastElapsed),
                      (h.elapsedHistory.length = Math.min(
                        h.elapsedHistory.length,
                        c,
                      )));
                  },
                  r = function (f) {
                    for (var l = 0, R = 0; R < f.length; R += 1) l += f[R];
                    return l / f.length || 0;
                  },
                  d = function (f, l) {
                    var R = document.createElement("canvas");
                    return (
                      (R.width = f),
                      (R.height = l),
                      (R.oncontextmenu = function () {
                        return !1;
                      }),
                      (R.onselectstart = function () {
                        return !1;
                      }),
                      R
                    );
                  },
                  M = function (f) {
                    var l = f.getContext("2d"),
                      R = window.devicePixelRatio || 1,
                      h =
                        l.webkitBackingStorePixelRatio ||
                        l.mozBackingStorePixelRatio ||
                        l.msBackingStorePixelRatio ||
                        l.oBackingStorePixelRatio ||
                        l.backingStorePixelRatio ||
                        1;
                    return R / h;
                  },
                  S = function (f, l) {
                    var R = f.textures[l];
                    return (
                      R || ((R = f.textures[l] = new Image()), (R.src = l), R)
                    );
                  },
                  v = function (f, l) {
                    var R = l;
                    (/(jpg|gif|png)$/.test(l) && (R = "url(" + l + ")"),
                      (f.canvas.style.background = R),
                      (f.canvas.style.backgroundSize = "contain"),
                      (f.currentBackground = l));
                  };
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(5),
                i = E(17),
                I = E(0);
              (function () {
                ((A._maxFrameDelta = 1e3 / 15),
                  (A._frameDeltaFallback = 1e3 / 60),
                  (A._timeBufferMargin = 1.5),
                  (A._elapsedNextEstimate = 1),
                  (A._smoothingLowerBound = 0.1),
                  (A._smoothingUpperBound = 0.9),
                  (A.create = function (Q) {
                    var B = {
                        delta: 16.666666666666668,
                        frameDelta: null,
                        frameDeltaSmoothing: !0,
                        frameDeltaSnapping: !0,
                        frameDeltaHistory: [],
                        frameDeltaHistorySize: 100,
                        frameRequestId: null,
                        timeBuffer: 0,
                        timeLastTick: null,
                        maxUpdates: null,
                        maxFrameTime: 33.333333333333336,
                        lastUpdatesDeferred: 0,
                        enabled: !0,
                      },
                      k = I.extend(B, Q);
                    return ((k.fps = 0), k);
                  }),
                  (A.run = function (Q, B) {
                    return (
                      (Q.timeBuffer = A._frameDeltaFallback),
                      (function k(t) {
                        ((Q.frameRequestId = A._onNextFrame(Q, k)),
                          t && Q.enabled && A.tick(Q, B, t));
                      })(),
                      Q
                    );
                  }),
                  (A.tick = function (Q, B, k) {
                    var t = I.now(),
                      a = Q.delta,
                      s = 0,
                      r = k - Q.timeLastTick;
                    if (
                      ((!r ||
                        !Q.timeLastTick ||
                        r > Math.max(A._maxFrameDelta, Q.maxFrameTime)) &&
                        (r = Q.frameDelta || A._frameDeltaFallback),
                      Q.frameDeltaSmoothing)
                    ) {
                      (Q.frameDeltaHistory.push(r),
                        (Q.frameDeltaHistory = Q.frameDeltaHistory.slice(
                          -Q.frameDeltaHistorySize,
                        )));
                      var d = Q.frameDeltaHistory.slice(0).sort(),
                        M = Q.frameDeltaHistory.slice(
                          d.length * A._smoothingLowerBound,
                          d.length * A._smoothingUpperBound,
                        ),
                        S = C(M);
                      r = S || r;
                    }
                    (Q.frameDeltaSnapping && (r = 1e3 / Math.round(1e3 / r)),
                      (Q.frameDelta = r),
                      (Q.timeLastTick = k),
                      (Q.timeBuffer += Q.frameDelta),
                      (Q.timeBuffer = I.clamp(
                        Q.timeBuffer,
                        0,
                        Q.frameDelta + a * A._timeBufferMargin,
                      )),
                      (Q.lastUpdatesDeferred = 0));
                    var v = Q.maxUpdates || Math.ceil(Q.maxFrameTime / a),
                      f = { timestamp: B.timing.timestamp };
                    (n.trigger(Q, "beforeTick", f), n.trigger(Q, "tick", f));
                    for (
                      var l = I.now();
                      a > 0 && Q.timeBuffer >= a * A._timeBufferMargin;
                    ) {
                      (n.trigger(Q, "beforeUpdate", f),
                        i.update(B, a),
                        n.trigger(Q, "afterUpdate", f),
                        (Q.timeBuffer -= a),
                        (s += 1));
                      var R = I.now() - t,
                        h = I.now() - l,
                        c = R + (A._elapsedNextEstimate * h) / s;
                      if (s >= v || c > Q.maxFrameTime) {
                        Q.lastUpdatesDeferred = Math.round(
                          Math.max(0, Q.timeBuffer / a - A._timeBufferMargin),
                        );
                        break;
                      }
                    }
                    ((B.timing.lastUpdatesPerFrame = s),
                      n.trigger(Q, "afterTick", f),
                      Q.frameDeltaHistory.length >= 100 &&
                        (Q.lastUpdatesDeferred &&
                        Math.round(Q.frameDelta / a) > v
                          ? I.warnOnce(
                              "Matter.Runner: runner reached runner.maxUpdates, see docs.",
                            )
                          : Q.lastUpdatesDeferred &&
                            I.warnOnce(
                              "Matter.Runner: runner reached runner.maxFrameTime, see docs.",
                            ),
                        typeof Q.isFixed < "u" &&
                          I.warnOnce(
                            "Matter.Runner: runner.isFixed is now redundant, see docs.",
                          ),
                        (Q.deltaMin || Q.deltaMax) &&
                          I.warnOnce(
                            "Matter.Runner: runner.deltaMin and runner.deltaMax were removed, see docs.",
                          ),
                        Q.fps !== 0 &&
                          I.warnOnce(
                            "Matter.Runner: runner.fps was replaced by runner.delta, see docs.",
                          )));
                  }),
                  (A.stop = function (Q) {
                    A._cancelNextFrame(Q);
                  }),
                  (A._onNextFrame = function (Q, B) {
                    if (typeof window < "u" && window.requestAnimationFrame)
                      Q.frameRequestId = window.requestAnimationFrame(B);
                    else
                      throw new Error(
                        "Matter.Runner: missing required global window.requestAnimationFrame.",
                      );
                    return Q.frameRequestId;
                  }),
                  (A._cancelNextFrame = function (Q) {
                    if (typeof window < "u" && window.cancelAnimationFrame)
                      window.cancelAnimationFrame(Q.frameRequestId);
                    else
                      throw new Error(
                        "Matter.Runner: missing required global window.cancelAnimationFrame.",
                      );
                  }));
                var C = function (Q) {
                  for (var B = 0, k = Q.length, t = 0; t < k; t += 1) B += Q[t];
                  return B / k || 0;
                };
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(8),
                i = E(0),
                I = i.deprecated;
              (function () {
                ((A.collides = function (C, Q) {
                  return n.collides(C, Q);
                }),
                  I(
                    A,
                    "collides",
                    "SAT.collides ➤ replaced by Collision.collides",
                  ));
              })();
            },
            function (o, u, E) {
              var A = {};
              ((o.exports = A), E(1));
              var n = E(0);
              (function () {
                ((A.pathToVertices = function (i, I) {
                  typeof window < "u" &&
                    !("SVGPathSeg" in window) &&
                    n.warn(
                      "Svg.pathToVertices: SVGPathSeg not defined, a polyfill is required.",
                    );
                  var C,
                    Q,
                    B,
                    k,
                    t,
                    a,
                    s,
                    r,
                    d,
                    M,
                    S = [],
                    v,
                    f,
                    l = 0,
                    R = 0,
                    h = 0;
                  I = I || 15;
                  var c = function (Y, J, Z) {
                      var D = Z % 2 === 1 && Z > 1;
                      if (!d || Y != d.x || J != d.y) {
                        d && D ? ((v = d.x), (f = d.y)) : ((v = 0), (f = 0));
                        var z = { x: v + Y, y: f + J };
                        ((D || !d) && (d = z),
                          S.push(z),
                          (R = v + Y),
                          (h = f + J));
                      }
                    },
                    m = function (Y) {
                      var J = Y.pathSegTypeAsLetter.toUpperCase();
                      if (J !== "Z") {
                        switch (J) {
                          case "M":
                          case "L":
                          case "T":
                          case "C":
                          case "S":
                          case "Q":
                            ((R = Y.x), (h = Y.y));
                            break;
                          case "H":
                            R = Y.x;
                            break;
                          case "V":
                            h = Y.y;
                            break;
                        }
                        c(R, h, Y.pathSegType);
                      }
                    };
                  for (
                    A._svgPathToAbsolute(i),
                      B = i.getTotalLength(),
                      a = [],
                      C = 0;
                    C < i.pathSegList.numberOfItems;
                    C += 1
                  )
                    a.push(i.pathSegList.getItem(C));
                  for (s = a.concat(); l < B;) {
                    if (((M = i.getPathSegAtLength(l)), (t = a[M]), t != r)) {
                      for (; s.length && s[0] != t;) m(s.shift());
                      r = t;
                    }
                    switch (t.pathSegTypeAsLetter.toUpperCase()) {
                      case "C":
                      case "T":
                      case "S":
                      case "Q":
                      case "A":
                        ((k = i.getPointAtLength(l)), c(k.x, k.y, 0));
                        break;
                    }
                    l += I;
                  }
                  for (C = 0, Q = s.length; C < Q; ++C) m(s[C]);
                  return S;
                }),
                  (A._svgPathToAbsolute = function (i) {
                    for (
                      var I,
                        C,
                        Q,
                        B,
                        k,
                        t,
                        a = i.pathSegList,
                        s = 0,
                        r = 0,
                        d = a.numberOfItems,
                        M = 0;
                      M < d;
                      ++M
                    ) {
                      var S = a.getItem(M),
                        v = S.pathSegTypeAsLetter;
                      if (/[MLHVCSQTA]/.test(v))
                        ("x" in S && (s = S.x), "y" in S && (r = S.y));
                      else
                        switch (
                          ("x1" in S && (Q = s + S.x1),
                          "x2" in S && (k = s + S.x2),
                          "y1" in S && (B = r + S.y1),
                          "y2" in S && (t = r + S.y2),
                          "x" in S && (s += S.x),
                          "y" in S && (r += S.y),
                          v)
                        ) {
                          case "m":
                            a.replaceItem(i.createSVGPathSegMovetoAbs(s, r), M);
                            break;
                          case "l":
                            a.replaceItem(i.createSVGPathSegLinetoAbs(s, r), M);
                            break;
                          case "h":
                            a.replaceItem(
                              i.createSVGPathSegLinetoHorizontalAbs(s),
                              M,
                            );
                            break;
                          case "v":
                            a.replaceItem(
                              i.createSVGPathSegLinetoVerticalAbs(r),
                              M,
                            );
                            break;
                          case "c":
                            a.replaceItem(
                              i.createSVGPathSegCurvetoCubicAbs(
                                s,
                                r,
                                Q,
                                B,
                                k,
                                t,
                              ),
                              M,
                            );
                            break;
                          case "s":
                            a.replaceItem(
                              i.createSVGPathSegCurvetoCubicSmoothAbs(
                                s,
                                r,
                                k,
                                t,
                              ),
                              M,
                            );
                            break;
                          case "q":
                            a.replaceItem(
                              i.createSVGPathSegCurvetoQuadraticAbs(s, r, Q, B),
                              M,
                            );
                            break;
                          case "t":
                            a.replaceItem(
                              i.createSVGPathSegCurvetoQuadraticSmoothAbs(s, r),
                              M,
                            );
                            break;
                          case "a":
                            a.replaceItem(
                              i.createSVGPathSegArcAbs(
                                s,
                                r,
                                S.r1,
                                S.r2,
                                S.angle,
                                S.largeArcFlag,
                                S.sweepFlag,
                              ),
                              M,
                            );
                            break;
                          case "z":
                          case "Z":
                            ((s = I), (r = C));
                            break;
                        }
                      (v == "M" || v == "m") && ((I = s), (C = r));
                    }
                  }));
              })();
            },
            function (o, u, E) {
              var A = {};
              o.exports = A;
              var n = E(6);
              (E(0),
                (function () {
                  ((A.create = n.create),
                    (A.add = n.add),
                    (A.remove = n.remove),
                    (A.clear = n.clear),
                    (A.addComposite = n.addComposite),
                    (A.addBody = n.addBody),
                    (A.addConstraint = n.addConstraint));
                })());
            },
          ]);
        });
      })(ge)),
    ge.exports
  );
}
var vt = Jt();
const YI = cI(vt),
  sI = (e, g, o) => Math.max(g, Math.min(o, e));
function yt(e, g = 450) {
  return (
    (0.04 + 0.1 * (1 - sI(e / 17, 0, 1))) * (0.5 + 0.5 * sI(g / 450, 0, 1))
  );
}
function JI(e, g, o, u, E = 1e3 / 60) {
  const A = u.find((B) => B.kind === "cheese" && bA(g, B));
  let n = e;
  if (
    (n &&
      !u.some(
        (B) => B.kind === "cheese" && B.x === n.zone.x && B.y === n.zone.y,
      ) &&
      (n = null),
    A)
  ) {
    const B = n && n.zone.x === A.x && n.zone.y === A.y;
    n = {
      zone: { x: A.x, y: A.y, r: A.r },
      anchor: B ? n.anchor : { ...g },
      age: B ? n.age + E : E,
      remaining: 650,
    };
  } else n && (n = { ...n, remaining: n.remaining - E });
  let i = o.x,
    I = o.y;
  if (n) {
    const B = g.x - n.anchor.x,
      k = g.y - n.anchor.y,
      t = Math.hypot(B, k);
    if (n.remaining <= 0 || t > Math.min(200, n.zone.r * 2 + 60)) n = null;
    else if (t > 1) {
      const a = B / t,
        s = k / t,
        r = Math.max(0, i * a + I * s),
        d = Math.min(r * 0.18, t * 0.0025 * (E / (1e3 / 60)));
      ((i -= a * d), (I -= s * d));
    }
  }
  const C = Math.hypot(o.x, o.y),
    Q = A
      ? yt(C, n?.age || E)
      : n
        ? Math.max(ce(g, u), (0.035 * n.remaining) / 650)
        : ce(g, u);
  return { sticky: n, velocity: { x: i, y: I }, drag: Q };
}
const pt = 0.976,
  se = 17,
  oI = 1.1,
  mA = (e, g) => Math.hypot(e.x - g.x, e.y - g.y),
  pA = (e, g, o) => Math.max(g, Math.min(o, e));
function CI(e) {
  return {
    mapId: e.mapId,
    w: e.w,
    h: e.h,
    obstacles: e.obstacles.map((g) => ({ ...g })),
    zones: e.zones.map((g) => ({ ...g })),
    food: e.food.map((g) => ({ ...g })),
    people: e.people
      .filter((g) => g.alive)
      .map((g) => ({
        id: g.id,
        heading: g.heading ?? 0,
        lightBoost: g.lightBoost || 1,
        mass: g.mass,
        strategy: g.strategy,
        x: g.body.position.x,
        y: g.body.position.y,
        r: g.body.circleRadius,
        lastMove: g.lastMove ? { ...g.lastMove } : null,
        sticky: g.sticky
          ? {
              ...g.sticky,
              anchor: { ...g.sticky.anchor },
              zone: { ...g.sticky.zone },
            }
          : null,
      })),
  };
}
function Gt(e, g) {
  const o = e.lastMove;
  if (o && Math.hypot(o.x, o.y) > 12) {
    const E = Math.min(0.55, 145 / Math.hypot(o.x, o.y));
    return { x: o.x * E, y: o.y * E, confidence: 0.6 };
  }
  const u = g.food.filter(Fe).sort((E, A) => mA(e, E) - mA(e, A))[0];
  if (u) {
    const E = u.x - e.x,
      A = u.y - e.y,
      n = Math.hypot(E, A) || 1,
      i = Math.min(0.65, 100 / n);
    return { x: E * i, y: A * i, confidence: 0.3 };
  }
  return { x: 0, y: 0, confidence: 0 };
}
function Zt(e, g, o = Math.random) {
  const u = e.people.find((s) => s.id === g),
    E = ke(u.mass);
  e = {
    ...e,
    food: e.food.filter((s) => xA(e.mapId, u, s, e.obstacles)),
    people: e.people.filter(
      (s) => s.id === g || xA(e.mapId, u, s, e.obstacles),
    ),
  };
  const A = e.people.length > 12;
  A &&
    (e = {
      ...e,
      food: [...e.food].sort((s, r) => mA(u, s) - mA(u, r)).slice(0, 26),
      people: e.people.filter((s) => s.id === g || mA(u, s) < 1050),
    });
  const n = e.people
      .filter((s) => s.id !== g)
      .map((s) => ({ ...s, forecast: Gt(s, e) })),
    i = [],
    I = (s, r, d, M = null) => {
      const S = s.x - u.x,
        v = s.y - u.y,
        f = Math.hypot(S, v);
      if (f < 1) return;
      const l =
          r === "fondue"
            ? u.r + s.r
            : r === "hunt"
              ? u.r + (e.people.find((c) => c.id === d)?.r || 18)
              : u.r + 8,
        R = Math.max(0, f - l) * ce(u, e.zones) + (r === "hunt" ? 1.6 : 0.65),
        h = pA(R / E, 1, se);
      for (const c of r === "fondue" ? [1, 1.28, se / h] : [1, 1.28])
        i.push({
          x: (S / f) * h * c,
          y: (v / f) * h * c,
          kind: r,
          targetId: d,
          target: { ...s },
          bank: M,
        });
    };
  for (const s of e.zones || []) s.kind === "portal" && I(s, "reposition");
  if (u.mass >= VA)
    for (const s of e.zones || []) s.kind === "cheese" && I(s, "fondue");
  const C = e.food
    .filter(Fe)
    .sort((s, r) => mA(u, s) / Math.sqrt(ZA(s)) - mA(u, r) / Math.sqrt(ZA(r)))
    .slice(0, A ? 8 : 30);
  for (const [s, r] of C.entries())
    if ((I(r, "food"), u.strategy === 2 && s < 3))
      for (const d of ["left", "right", "top", "bottom"]) {
        const M = u.r,
          S =
            d === "left"
              ? { x: 2 * M - r.x, y: r.y }
              : d === "right"
                ? { x: 2 * (e.w - M) - r.x, y: r.y }
                : d === "top"
                  ? { x: r.x, y: 2 * M - r.y }
                  : { x: r.x, y: 2 * (e.h - M) - r.y };
        I(S, "food", null, d);
      }
  for (const s of n
    .filter((r) => u.mass > r.mass * wA)
    .sort((r, d) => mA(u, r) - mA(u, d))
    .slice(0, A ? 5 : 8))
    if ((I(s, "hunt", s.id), s.forecast.confidence))
      for (const r of [0.5, 1])
        I(
          {
            x: pA(s.x + s.forecast.x * r, s.r, e.w - s.r),
            y: pA(s.y + s.forecast.y * r, s.r, e.h - s.r),
          },
          "hunt",
          s.id,
        );
  for (const s of e.obstacles || [])
    for (const r of [-1, 1]) {
      const d = Math.cos(s.angle),
        M = Math.sin(s.angle);
      I(
        {
          x: s.x + r * (s.w / 2 + u.r + 35) * d,
          y: s.y + r * (s.w / 2 + u.r + 35) * M,
        },
        "reposition",
      );
    }
  for (let s = 0; s < 12; s++) {
    const r = (s * Math.PI) / 6;
    i.push({ x: Math.cos(r) * 10, y: Math.sin(r) * 10, kind: "reposition" });
  }
  let Q = null;
  for (const s of i) {
    const r = xt(s, u, n, e, E);
    (!Q || r.score > Q.score) && (Q = { ...s, ...r });
  }
  const B = Math.hypot(Q.x, Q.y),
    k = Math.min(se, B),
    t = Math.atan2(Q.y, Q.x) + (o() - 0.5) * 0.035,
    a = Q.preyValue > 0 ? "hunt" : Q.foodValue > 0 ? "food" : "escape";
  return {
    x: Math.cos(t) * k,
    y: Math.sin(t) * k,
    intent: a,
    target: Q.target || null,
    score: Q.score,
  };
}
function xt(e, g, o, u, E) {
  const A = Math.hypot(e.x, e.y),
    n = Math.min(1, se / A) * E;
  let i = g.x,
    I = g.y,
    C = e.x * n,
    Q = e.y * n,
    B = 0,
    k = 0,
    t = 0,
    a = 0,
    s = !1,
    r = g.sticky || null;
  const d = new Set(),
    M = (u.zones || []).filter((m) => !(m.kind === "cheese" && g.mass >= VA));
  let S = 0;
  const v = M.filter((m) => m.kind === "portal"),
    f = new Set(),
    l = new Set(),
    R = new Set();
  for (let m = 0; m < 210; m += 2) {
    const Y = hI({ x: i, y: I }, M, (m * 1e3) / 60);
    Y && ((C += Y.ax * 2), (Q += Y.ay * 2));
    const J = JI(r, { x: i, y: I }, { x: C, y: Q }, M, 1e3 / 30);
    ((r = J.sticky), (C = J.velocity.x), (Q = J.velocity.y));
    const Z = 1 - J.drag,
      D = C * (Z + Z * Z),
      z = Q * (Z + Z * Z);
    ((i += D), (I += z), (C *= Z * Z), (Q *= Z * Z));
    for (const p of u.obstacles || []) {
      const F = RA({ x: i, y: I }, g.r, p);
      if (F) {
        ((i += F.nx * (F.depth + 0.1)), (I += F.ny * (F.depth + 0.1)));
        const b = C * F.nx + Q * F.ny;
        (b < 0 &&
          ((C -= (p.bumper ? 2.5 : 1.83) * b * F.nx),
          (Q -= (p.bumper ? 2.5 : 1.83) * b * F.ny)),
          (a += 1));
      }
    }
    if (
      ((i < g.r || i > u.w - g.r) &&
        ((i = pA(i, g.r, u.w - g.r)), (C *= -0.83), (a += 0.4)),
      (I < g.r || I > u.h - g.r) &&
        ((I = pA(I, g.r, u.h - g.r)), (Q *= -0.83), (a += 0.4)),
      m >= S)
    ) {
      const p = v.findIndex((F) => bA({ x: i, y: I }, F));
      if (p >= 0) {
        const F = v[1 - p];
        ((i = F.x), (I = F.y), (S = m + 54));
      }
    }
    const y = Math.hypot(C, Q),
      G = 1 - m / 420;
    for (let p = 0; p < u.food.length; p++) {
      if (f.has(p)) continue;
      const F = u.food[p];
      Math.hypot(i - F.x, I - F.y) < g.r + zA(F) &&
        (f.add(p), (B += ZA(F) * G));
    }
    if (g.mass >= VA)
      for (const p of u.zones || [])
        p.kind === "cheese" &&
          !d.has(p.flow ? "arm" + p.arm : p) &&
          Math.hypot(i - p.x, I - p.y) <= g.r + p.r &&
          (d.add(p.flow ? "arm" + p.arm : p), (B += Qe * G));
    for (const p of o) {
      const F = 1 - Math.pow(pt, m + 2),
        b = pA(p.x + p.forecast.x * F, p.r, u.w - p.r),
        U = pA(p.y + p.forecast.y * F, p.r, u.h - p.r),
        N = g.r + p.r;
      if (g.mass > p.mass * wA && y > oI) {
        const W = [
          { x: p.x, y: p.y, weight: 1 - p.forecast.confidence },
          { x: b, y: U, weight: p.forecast.confidence },
        ];
        for (let P = 0; P < W.length; P++) {
          const X = W[P],
            T = p.id + ":" + P,
            _ = Math.hypot(X.x - i, X.y - I),
            H = ((X.x - i) * C + (X.y - I) * Q) / (_ || 1);
          !l.has(T) &&
            _ < N + 2 &&
            H > 0.75 &&
            (l.add(T), (k += (p.mass * 0.55 + 65) * X.weight * G));
        }
      } else if (p.mass > g.mass * wA) {
        const W = Math.min(
          Math.hypot(i - p.x, I - p.y),
          Math.hypot(i - b, I - U),
        );
        (W < N + 18 && !R.has(p.id) && (R.add(p.id), (t += 105)),
          W < N && (s = !0));
      } else
        Math.hypot(i - p.x, I - p.y) < N * 0.95 &&
          !R.has(p.id) &&
          (R.add(p.id), (t += 24), (s = !0));
    }
    if (s || y < 0.2) break;
  }
  for (const m of o)
    if (m.mass > g.mass * wA) {
      const Y = (17 * ke(m.mass) - oI) / 0.024 + g.r + m.r,
        J = Math.hypot(i - m.x, I - m.y);
      J < Y && (t += Math.max(0, 1 - J / Y) * 38);
    }
  let h = 0;
  const c = u.food.filter(Fe);
  if (c.length) {
    const m = Math.min(...c.map((J) => mA(g, J))),
      Y = Math.min(...c.map((J) => Math.hypot(i - J.x, I - J.y)));
    h = pA((m - Y) * 0.04, -15, 15);
  }
  return {
    foodValue: B,
    preyValue: k,
    score:
      B * (g.strategy === 0 ? 1.12 : 1) +
      k * (g.strategy === 1 ? 1.15 : 1) -
      t * (g.strategy === 0 ? 1.12 : 0.95) -
      a +
      h,
  };
}
const { Engine: he, Bodies: yA, Body: eA, Composite: XA, Events: BI } = YI;
YI.Common.setDecomp(ct);
function aI(e, g) {
  const dx = g.body.position.x - e.body.position.x,
    dy = g.body.position.y - e.body.position.y,
    distance = Math.hypot(dx, dy) || 1,
    eaterVelocity = eA.getVelocity(e.body),
    victimVelocity = eA.getVelocity(g.body),
    forward = (eaterVelocity.x * dx + eaterVelocity.y * dy) / distance,
    relative =
      ((eaterVelocity.x - victimVelocity.x) * dx +
        (eaterVelocity.y - victimVelocity.y) * dy) /
      distance;
  return Bt(e.mass, g.mass) === "prey" && forward > 1.05 && relative > 0.65;
}

const Ft = [
    "TOI",
    "Jean-Faim",
    "La Dalle",
    "Bébert",
    "Gigi Gras",
    "Croq-Mort",
    "Mayo Max",
    "Chips",
  ],
  rI = [
    "#ed9a41",
    "#7f9db7",
    "#c97e8b",
    "#a5ad61",
    "#bb9ac5",
    "#e2ba65",
    "#6aa897",
    "#da8061",
  ];
class zt {
  constructor(g = 1e3, o = 560, u = Math.random, E = {}) {
    ((this.mode = E.mode || "classic"),
      (this.mapId = this.mode === "somalia" ? "savanna" : E.mapId || "cantine"),
      (this.savanna = this.mapId === "savanna"),
      (this.count =
        this.mode === "platform"
          ? 2
          : this.mode === "somalia"
            ? 50
            : E.count || 8),
      (this.chef = !!E.chef),
      (this.minMass = this.savanna || this.chef ? 8 : 42),
      (this.fondueDiscovered = !1),
      (this.nextEruptionRound = 4),
      (this.eruption = null),
      (this.foodTarget = this.savanna
        ? 80
        : this.mapId === "cold" && g * o > 2e6
          ? this.count > 8
            ? 160
            : 64
          : this.count > 8
            ? 96
            : g * o > 6e6
              ? 64
              : 16),
      (this.foodCap = this.savanna
        ? 120
        : this.mapId === "cold" && g * o > 2e6
          ? this.count > 8
            ? 220
            : 96
          : this.count > 8
            ? 140
            : g * o > 6e6
              ? 96
              : 22),
      (this.announcement = null),
      (this.obstacles = [
        ..._e(this.mapId, g, o),
        ...arenaBorderBodies(this.mapId, g, o),
      ]),
      (this.zones = Ee(this.mapId, g, o)),
      (this.w = g),
      (this.h = o),
      (this.random = u),
      (this.engine = he.create({
        gravity: { x: 0, y: 0 },
        positionIterations: 8,
        velocityIterations: 8,
      })),
      (this.people = []),
      (this.food = []),
      (this.effects = []),
      (this.round = 1),
      (this.phase = "aim"),
      (this.elapsed = 0),
      (this.spawnClock = 0),
      (this.onEvent = () => {}));
    const A = [
      yA.rectangle(g / 2, -25, g + 100, 50, { isStatic: !0 }),
      yA.rectangle(g / 2, o + 25, g + 100, 50, { isStatic: !0 }),
      yA.rectangle(-25, o / 2, 50, o + 100, { isStatic: !0 }),
      yA.rectangle(g + 25, o / 2, 50, o + 100, { isStatic: !0 }),
    ];
    (XA.add(this.engine.world, A),
      (this.obstacleBodies = this.obstacles.map((i) =>
        i.r
          ? yA.circle(i.x, i.y, i.r, {
              isStatic: !0,
              restitution: i.scenery === "cornucopia-circle" ? 0.3 : 1.5,
              label: i.scenery === "cornucopia-circle" ? "obstacle" : "bumper",
            })
          : i.vertices
            ? yA.fromVertices(i.x, i.y, [i.vertices], {
                isStatic: !0,
                restitution: 0.83,
                label: "crater",
              })
            : yA.rectangle(i.x, i.y, i.w, i.h, {
                isStatic: !0,
                angle: i.angle,
                restitution: i.bumper ? 1.5 : 0.83,
                label: "obstacle",
              }),
      )),
      XA.add(this.engine.world, this.obstacleBodies));
    const n = [];
    for (let i = 0; i < this.count; i++) {
      let I;
      const C = this.count > 8 ? 125 : 95;
      for (let Q = 0; Q < 180; Q++) {
        const B = {
          x: 55 + this.random() * (g - 110),
          y: 55 + this.random() * (o - 110),
        };
        if (
          !(this.mapId === "royal" && B.y < this.h * 0.28) &&
          !this.obstacles.some((k) => RA(B, 42, k)) &&
          !n.some((k) => Math.hypot(k.x - B.x, k.y - B.y) < C)
        ) {
          I = B;
          break;
        }
      }
      if (!I)
        for (let Q = 55; Q < o - 35 && !I; Q += 75)
          for (let B = 55; B < g - 35 && !I; B += 75) {
            const k = { x: B, y: Q };
            !this.obstacles.some((t) => RA(k, 32, t)) &&
              !n.some((t) => Math.hypot(t.x - B, t.y - Q) < 65) &&
              (I = k);
          }
      if (this.mapId === "mirror")
        if (i % 2 === 1) I = { x: g - n[i - 1].x, y: o - n[i - 1].y };
        else {
          I = null;
          for (let Q = 0; Q < 400; Q++) {
            const B = {
                x: 55 + this.random() * (g * 0.42 - 55),
                y: 55 + this.random() * (o - 110),
              },
              k = { x: g - B.x, y: o - B.y };
            if (
              !this.obstacles.some((t) => RA(B, 42, t) || RA(k, 42, t)) &&
              !n.some(
                (t) =>
                  Math.hypot(t.x - B.x, t.y - B.y) < 65 ||
                  Math.hypot(t.x - k.x, t.y - k.y) < 65,
              )
            ) {
              I = B;
              break;
            }
          }
        }
      if (this.mapId === "hunger") I = hungerStart(g, o, i, this.count);
      if (this.mode === "survival") I = survivalStart(g, o, i, this.count);
      if (!I) throw new Error("Aucun point de départ libre");
      n.push(I);
    }
    (n.forEach((i, I) => {
      const C = this.savanna ? 8 : 60,
        Q =
          this.mode === "icecream"
            ? yA.rectangle(i.x, i.y, ne(C) * 1.8, ne(C) * 2.4, {
                chamfer: { radius: ne(C) * 0.4 },
                frictionAir: 0.024,
                friction: 0,
                restitution: 0.83,
                slop: 0.03,
              })
            : yA.circle(i.x, i.y, ne(C), {
                frictionAir: 0.024,
                friction: 0,
                restitution: 0.83,
                slop: 0.03,
              });
      ((Q.circleRadius = ne(C)), eA.setMass(Q, C / 10), (Q.label = "person"));
      const B = {
        id: I,
        name:
          Ft[I] ||
          [
            "Nugget",
            "Patate",
            "Kébab",
            "Brioche",
            "Tonton Frit",
            "Sauce Sam",
            "Ravioli",
            "Churros",
          ][(I - 8) % 8] + (I >= 16 ? " " + Math.floor(I / 8) : ""),
        color: rI[I % rI.length],
        skin: this.savanna
          ? ["#70452f", "#573524", "#8c593b", "#623c29"][I % 4]
          : void 0,
        mass: C,
        body: Q,
        alive: !0,
        pop: 0,
        strategy: I % 3,
      };
      ((Q.person = B), this.people.push(B), XA.add(this.engine.world, Q));
    }),
      (this.stats = lt(this.people)));
    for (
      let i = 0;
      i < this.foodTarget / (this.mapId === "mirror" ? 2 : 1);
      i++
    )
      this.addFood(
        i >= (this.foodTarget * 0.75) / (this.mapId === "mirror" ? 2 : 1)
          ? "salad"
          : "burger",
        i % 4 === 0 ? "xl" : "normal",
      );
    if (this.mapId === "hunger") {
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        const radius = Math.min(g, o) * 0.085;
        this.food.push({
          x: g / 2 + Math.cos(angle) * radius,
          y: o / 2 + Math.sin(angle) * radius,
          type: "burger",
          size: "chef",
        });
      }
    }
    (this.mapId === "foodcourt" && this.spawnCheese(1),
      BI.on(this.engine, "collisionStart", (i) => {
        for (const I of i.pairs) {
          if (this.phase === "cinematic") break;
          this.mechanics?.collision(I);
          this.secretRules?.collision(I);
          const C = I.bodyA.person,
            Q = I.bodyB.person,
            B = C || Q,
            k = C ? I.bodyB : I.bodyA,
            t = this.obstacleBodies.indexOf(k);
          if (
            B &&
            t >= 0 &&
            this.food.length < this.foodCap &&
            this.obstacles[t].vending &&
            this.elapsed - (this.lastVending ?? -2e3) > 1200
          ) {
            this.lastVending = this.elapsed;
            const r = LA(
              { x: B.body.position.x + 35, y: B.body.position.y + 35 },
              16,
              this.obstacles,
              this.w,
              this.h,
            );
            (this.food.push({ ...r, type: "burger", size: "normal" }),
              (this.announcement = {
                text: "Le distributeur a lâché un burger !",
              }));
          }
          if (this.mode === "platform" || !C || !Q || !C.alive || !Q.alive)
            continue;
          let a, s;
          (aI(C, Q) ? ((a = C), (s = Q)) : aI(Q, C) && ((a = Q), (s = C)),
            a ? this.eat(a, s) : this.emit("bounce", C));
        }
      }));
    this.mechanics = new ArenaMechanics(this, {
      Bodies: yA,
      Body: eA,
      World: XA,
      intersects: RA,
    });
    if (SECRET_MAP_MODE(this.mode))
      this.secretRules = new (
        this.mode === "survival" ? SurvivalRules : SecretRules
      )(
        this,
        {
          Body: eA,
          World: XA,
          Engine: he,
          intersects: RA,
          makeGame: (options) => new zt(this.w, this.h, this.random, options),
        },
        E,
      );
  }
  emit(g, o, u) {
    if (g === "end" && this.secretRules?.onEnd()) return;
    (Rt(this.stats, g, o, u, this), this.onEvent(g, o, u));
  }
  addFood(g, o) {
    if (["platform", "survival"].includes(this.mode)) return false;
    if (this.mode === "cannibal") {
      g = "victim";
      o = "normal";
    }
    if (this.mode === "icecream") {
      g = "child";
      o = "normal";
    }
    (this.savanna && ((g = "mosquito"), (o = "normal")),
      this.mapId === "garden" &&
        g === "burger" &&
        this.random() < 0.6 &&
        (g = "salad"));
    const u =
        g === "burger" ? (this.count > 8 ? "burger" : CA[this.mapId].meal) : g,
      E =
        this.savanna || ["victim", "child"].includes(u)
          ? "normal"
          : Et(u, this.random, o);
    g = E === "chef" ? "burger" : u;
    for (let A = 0; A < 50; A++) {
      const n = {
        x: 35 + this.random() * (this.w - 70),
        y: 35 + this.random() * (this.h - 70),
        type: g,
        size: E,
      };
      if (
        (this.mapId === "palace" &&
          ((n.x = this.w * (0.32 + this.random() * 0.36)),
          (n.y = this.h * (0.2 + this.random() * 0.6))),
        !(
          (this.mapId === "hunger" &&
            !insideHungerZone(
              n,
              zA(n) + 6,
              hungerZone(this.w, this.h, this.round),
            )) ||
          this.obstacles.some((i) => RA(n, zA(n) + 6, i)) ||
          this.people.some(
            (i) =>
              i.alive &&
              Math.hypot(i.body.position.x - n.x, i.body.position.y - n.y) <
                ne(i.mass) + zA(n) + 12,
          ) ||
          this.food.some((i) => Math.hypot(i.x - n.x, i.y - n.y) < 28)
        ))
      ) {
        if (this.mapId === "mirror") {
          const i = { ...n, x: this.w - n.x, y: this.h - n.y };
          if (
            Math.hypot(i.x - n.x, i.y - n.y) < 60 ||
            this.obstacles.some((I) => RA(i, zA(i) + 6, I)) ||
            this.people.some(
              (I) =>
                I.alive &&
                Math.hypot(I.body.position.x - i.x, I.body.position.y - i.y) <
                  I.body.circleRadius + zA(i) + 12,
            ) ||
            this.food.some((I) => Math.hypot(I.x - i.x, I.y - i.y) < 28)
          )
            continue;
          if (this.food.length + 2 > this.foodCap) return !1;
          this.food.push(i);
        }
        return (
          this.food.push(n),
          E === "chef" &&
            (this.announcement = {
              kind: "chef",
              text: "LE BURGER DE DOUGGY EST SERVI ! +120 kg",
              round: this.round,
            }),
          !0
        );
      }
    }
  }
  spawnCheese(g = 2) {
    if (this.savanna || this.mapId === "hunger" || SECRET_MAP_MODE(this.mode))
      return 0;
    let o = 0;
    for (let u = 0; u < g; u++)
      for (let E = 0; E < 50; E++) {
        const A = this.count > 8 ? 90 : 55,
          n = {
            x: A + 20 + this.random() * (this.w - 2 * A - 40),
            y: A + 20 + this.random() * (this.h - 2 * A - 40),
          };
        if (!(
          this.obstacles.some((i) => RA(n, A + 8, i)) ||
          this.people.some(
            (i) =>
              i.alive &&
              Math.hypot(i.body.position.x - n.x, i.body.position.y - n.y) <
                i.body.circleRadius + A + 10,
          ) ||
          this.zones.some(
            (i) => i.r && Math.hypot(i.x - n.x, i.y - n.y) < A + i.r + 20,
          )
        )) {
          (this.zones.push({
            ...n,
            r: A,
            kind: "cheese",
            expiresRound: this.round + 2,
          }),
            o++);
          break;
        }
      }
    return o;
  }
  consumeFondue() {
    for (let g = this.zones.length - 1; g >= 0; g--) {
      const o = this.zones[g];
      if (!o || o.inactive || o.kind !== "cheese") continue;
      const E = this.people
        .filter(
          (A) =>
            A.alive &&
            A.mass >= VA &&
            Math.hypot(A.body.position.x - o.x, A.body.position.y - o.y) <=
              A.body.circleRadius + o.r,
        )
        .sort(
          (A, n) =>
            Math.hypot(A.body.position.x - o.x, A.body.position.y - o.y) -
              A.body.circleRadius -
              (Math.hypot(n.body.position.x - o.x, n.body.position.y - o.y) -
                n.body.circleRadius) || A.id - n.id,
        )[0];
      if (E) {
        (this.zones.splice(g, 1),
          o.flow &&
            (this.zones = this.zones.filter(
              (A) => !A.flow || A.arm !== o.arm,
            )));
        for (const A of this.people)
          A.sticky?.zone.x === o.x &&
            A.sticky?.zone.y === o.y &&
            (A.sticky = null);
        if (
          (this.resize(E, E.mass + Qe),
          this.effects.push({
            x: o.x,
            y: o.y,
            text: `FONDUE AVALÉE ! +${Qe} kg`,
            life: 1.4,
            color: "#9b6725",
          }),
          (this.announcement = {
            kind: "cheese",
            text: `${E.name} a avalé la fondue ! +${Qe} kg`,
            round: this.round,
          }),
          this.emit("fondue", E),
          this.checkTruce())
        )
          return;
      }
    }
  }
  resize(g, o) {
    g.mass = Math.max(this.minMass, o);
    const u = g.body.circleRadius,
      E = ne(g.mass);
    eA.scale(g.body, E / u, E / u);
    eA.setMass(g.body, physicalMass(g.mass, this.mode));
    const eaten = this.consumeNearbyShelves(g);
    if (eaten) return this.resize(g, g.mass + eaten * SHELF_MASS_GAIN);
    (eA.setPosition(
      g.body,
      LA(g.body.position, E, this.obstacles, this.w, this.h),
    ),
      (g.pop = 1),
      g.id === 0 &&
        g.mass >= VA &&
        !this.fondueDiscovered &&
        ((this.fondueDiscovered = !0), this.emit("discovery", g)));
  }
  consumeNearbyShelves(person) {
    return consumeShelves(this, person, {
      intersects: RA,
      removeBody: (body) => XA.remove(this.engine.world, body),
    });
  }
  eat(g, o) {
    if (this.mode === "platform") return;
    if (!g.alive || !o.alive || this.mechanics?.protect(o, g)) return;
    ((o.alive = !1),
      XA.remove(this.engine.world, o.body),
      this.resize(g, g.mass + o.mass * 0.55),
      this.effects.push({
        x: o.body.position.x,
        y: o.body.position.y,
        text: ["MIAM. UN VOISIN !", "SANS LES COUVERTS !", "ÇA CROQUE !"][
          Math.floor(this.random() * 3)
        ],
        life: 1.4,
        color: "#a23f32",
      }),
      this.emit("eat", g, o),
      this.checkTruce());
  }
  plan(g, o = CI(this)) {
    if (["platform", "survival"].includes(this.mode) && this.secretRules)
      return this.secretRules.plan(g);
    if (this.mapId === "hunger" && this.round >= 4) {
      const zone = hungerZone(this.w, this.h, this.round),
        pos = g.body.position;
      const dx = zone.x - pos.x,
        dy = zone.y - pos.y,
        distance = Math.hypot(dx, dy);
      if (distance + g.body.circleRadius > zone.r * 0.72) {
        g.intent = "reposition";
        return distance > 1e-7
          ? { x: (dx / distance) * 14, y: (dy / distance) * 14 }
          : { x: 0, y: 0 };
      }
    }
    const u = Zt(o, g.id, this.random);
    return ((g.intent = u.intent), (g.target = u.target), { x: u.x, y: u.y });
  }
  checkTruce() {
    if (
      this.mechanics?.blocksTruce() ||
      this.phase === "ended" ||
      this.phase === "cinematic" ||
      !this.people[0].alive
    )
      return !1;
    const g = this.people.filter((o) => o.alive);
    if (g.length !== 2 || !g.every((o) => o.mass > it)) return !1;
    ((this.phase = "cinematic"),
      (this.cinematic = {
        elapsed: 0,
        people: g.map((o, u) => ({
          id: o.id,
          from: { ...o.body.position },
          to: {
            x:
              this.w / 2 +
              ((u === 0 ? -1 : 1) *
                (g[0].body.circleRadius + g[1].body.circleRadius + 22)) /
                2,
            y: this.h / 2,
          },
        })),
      }));
    for (const o of g)
      (eA.setVelocity(o.body, { x: 0, y: 0 }),
        eA.setAngularVelocity(o.body, 0));
    return (this.emit("truce"), !0);
  }
  finishTruce() {
    if (this.phase === "cinematic") {
      for (const g of this.cinematic.people)
        eA.setPosition(this.people.find((o) => o.id === g.id).body, g.to);
      ((this.cinematic.elapsed = 7600),
        (this.outcome = "truce"),
        (this.phase = "ended"),
        this.emit("end"));
    }
  }
  stepTruce(g) {
    this.cinematic.elapsed += g;
    const o = Math.min(1, this.cinematic.elapsed / 2400),
      u = o * o * (3 - 2 * o);
    for (const E of this.cinematic.people)
      eA.setPosition(this.people.find((A) => A.id === E.id).body, {
        x: E.from.x + (E.to.x - E.from.x) * u,
        y: E.from.y + (E.to.y - E.from.y) * u,
      });
    this.cinematic.elapsed >= 7600 && this.finishTruce();
  }
  recordMotion() {
    for (const g of this.people)
      g.alive &&
        g.roundStart &&
        (g.lastMove = {
          x: g.body.position.x - g.roundStart.x,
          y: g.body.position.y - g.roundStart.y,
        });
  }
  launch(g) {
    if (
      this.checkTruce() ||
      this.phase !== "aim" ||
      (!this.people[0].alive && !this.spectate)
    )
      return !1;
    if (this.eruption?.state === "warning") {
      ((this.eruption.state = "active"), (this.eruption.elapsed = 0));
      for (const E of this.zones) E.eruption && (E.inactive = !1);
      ((this.announcement = {
        kind: "eruption",
        text: "ÉRUPTION ! Le volcan projette de la raclette !",
      }),
        this.emit("eruption"));
    }
    const o = CI(this),
      u = this.people
        .filter((E) => E.alive)
        .map((E) => [E, E.id === 0 ? g : this.plan(E, o)]);
    for (const [E, A] of u) {
      ((E.heading = Math.atan2(A.y, A.x)),
        this.mode === "icecream" &&
          eA.setAngle(E.body, E.heading - Math.PI / 2),
        (E.roundStart = { ...E.body.position }));
      const n = Math.hypot(A.x, A.y),
        i = (n > 17 ? 17 / n : 1) * propulsionFactor(E.mass, this.mode);
      (eA.setVelocity(E.body, { x: A.x * i, y: A.y * i }),
        eA.setAngularVelocity(E.body, 0));
    }
    return (
      (this.phase = "moving"),
      (this.lastVending = -2e3),
      (this.elapsed = 0),
      this.mechanics.launch(),
      this.emit("launch"),
      !0
    );
  }
  step(g = 1e3 / 60) {
    if (this.phase === "ended") return;
    this.secretRules?.tick(g);
    if (["lift", "bracket", "fall"].includes(this.phase)) return;
    if (this.phase !== "ended") {
      if (this.phase === "cinematic") {
        this.stepTruce(g);
        return;
      }
      if (!this.checkTruce()) {
        for (const o of this.people) o.pop = Math.max(0, o.pop - g / 300);
        for (const o of this.effects) o.life -= g / 1e3;
        if (
          ((this.effects = this.effects.filter((o) => o.life > 0)),
          this.phase === "moving" &&
            (this.consumeFondue(), this.phase !== "cinematic"))
        ) {
          for (const o of this.people)
            if (o.alive) {
              const eaten = this.consumeNearbyShelves(o);
              if (eaten) this.resize(o, o.mass + eaten * SHELF_MASS_GAIN);
              const u = JI(
                o.sticky,
                o.body.position,
                o.body.velocity,
                this.zones,
                g,
              );
              ((o.sticky = u.sticky),
                (o.body.frictionAir = u.drag),
                eA.setVelocity(o.body, u.velocity));
              const E = hI(o.body.position, this.zones, this.elapsed);
              E &&
                eA.setVelocity(o.body, {
                  x: o.body.velocity.x + (E.ax * g) / (1e3 / 60),
                  y: o.body.velocity.y + (E.ay * g) / (1e3 / 60),
                });
            }
          if (
            (this.mechanics.update(g, (dt) => he.update(this.engine, dt)),
            this.phase === "cinematic")
          ) {
            for (const o of this.people)
              o.alive &&
                (eA.setVelocity(o.body, { x: 0, y: 0 }),
                eA.setAngularVelocity(o.body, 0));
            return;
          }
          ((this.elapsed += g),
            this.eruption?.state === "active" && (this.eruption.elapsed += g),
            this.updatePortals());
          for (const o of this.people.filter((u) => u.alive)) {
            eA.setAngularVelocity(o.body, 0);
            for (let u = this.food.length - 1; u >= 0; u--) {
              const E = this.food[u];
              if (
                Math.hypot(o.body.position.x - E.x, o.body.position.y - E.y) <
                  o.body.circleRadius + zA(E) &&
                (this.food.splice(u, 1),
                this.secretRules?.onFood(o, E),
                this.resize(o, o.mass + ZA(E)),
                this.effects.push({
                  x: E.x,
                  y: E.y,
                  text: `${ZA(E) > 0 ? "+" : "−"}${Math.abs(ZA(E))} kg${E.size === "chef" ? " • LE BURGER DE DOUGGY !" : E.size === "xl" ? " • XL !" : ""}`,
                  life: 0.85,
                  color: E.type !== "salad" ? "#8b5325" : "#55813c",
                }),
                this.emit("food", o, E),
                this.checkTruce())
              )
                return;
            }
          }
          if (
            (this.consumeFondue(),
            !(this.checkTruce() || this.phase === "cinematic"))
          ) {
            if (((this.spawnClock += g), this.spawnClock > 1400)) {
              this.spawnClock = 0;
              for (
                let o = 0;
                o < (this.count > 8 ? 4 : 1) && this.food.length < this.foodCap;
                o++
              )
                this.addFood(this.random() < 0.22 ? "salad" : "burger");
            }
            if (
              (!this.chef || !this.people[0].alive) &&
              ((!this.people[0].alive && !this.spectate) ||
                this.people.filter((o) => o.alive).length === 1)
            ) {
              (this.recordMotion(),
                this.mechanics.finishRound(),
                (this.outcome = this.people[0].alive ? "win" : "loss"),
                (this.phase = "ended"),
                this.emit("end"));
              return;
            }
            if (
              (this.elapsed > 700 &&
                this.people
                  .filter((o) => o.alive)
                  .every((o) => o.body.speed < 0.18)) ||
              this.elapsed > 11e3
            ) {
              if (!this.mechanics.finishReady()) return;
              this.mechanics.finishRound();
              if (
                (!this.chef || !this.people[0].alive) &&
                ((!this.people[0].alive && !this.spectate) ||
                  this.people.filter((p) => p.alive).length <= 1)
              ) {
                this.recordMotion();
                this.outcome = this.people[0].alive ? "win" : "loss";
                this.phase = "ended";
                this.emit("end");
                return;
              }
              this.recordMotion();
              for (const o of this.people.filter((u) => u.alive))
                (eA.setVelocity(o.body, { x: 0, y: 0 }),
                  eA.setAngularVelocity(o.body, 0),
                  (o.sticky = null));
              (this.round++,
                (this.phase = "aim"),
                (this.announcement = null),
                this.advanceMap(),
                (this.zones = this.zones.filter(
                  (o) => !o.expiresRound || o.expiresRound > this.round,
                )),
                this.mapId !== "volcan" &&
                  this.round % 3 === 0 &&
                  this.spawnCheese(this.count > 8 ? 4 : 2) &&
                  (this.announcement = {
                    kind: "cheese",
                    text: "FONDUE SURPRISE ! Fondue filante : ralentissement progressif pendant 2 manches",
                    round: this.round,
                  }));
              for (
                let o = 0;
                this.food.length < this.foodTarget && o < this.foodTarget * 3;
                o++
              )
                this.addFood(this.random() < 0.25 ? "salad" : "burger");
              if (this.round % 4 === 0 && this.mode !== "survival") {
                let o = 0;
                for (
                  let u = 0;
                  u < (this.count > 8 ? 16 : 6) &&
                  this.food.length < this.foodCap;
                  u++
                )
                  this.addFood("burger") && o++;
                ["chef", "eruption"].includes(this.announcement?.kind) ||
                  (this.announcement = {
                    kind: "service",
                    text: `SERVICE SURPRISE ! ${o} ${this.savanna ? "steaks de moustiques" : this.count > 8 ? "burgers" : CA[this.mapId].mealName.toLowerCase()} supplémentaires`,
                    round: this.round,
                  });
              }
              this.mechanics.beginRound();
              this.emit("round");
            }
          }
        }
      }
    }
  }
  prepareEruption() {
    if (this.mapId !== "volcan" || this.round < this.nextEruptionRound) return;
    const g = Math.min(this.w, this.h),
      o = this.random() * Math.PI * 2,
      u = Array.from({ length: 7 }, (E, A) => {
        const n = o + (A * Math.PI * 2) / 7,
          i = g * (0.3 + this.random() * 0.12);
        return {
          kind: "cheese",
          eruption: !0,
          inactive: !0,
          x: this.w / 2 + Math.cos(n) * i,
          y: this.h / 2 + Math.sin(n) * i,
          r: g * 0.035,
          expiresRound: this.round + 2,
        };
      });
    (this.zones.push(...u),
      (this.eruption = { state: "warning", elapsed: 0, targets: u }),
      (this.nextEruptionRound = this.round + 4 + Math.floor(this.random() * 3)),
      (this.announcement = {
        kind: "eruption",
        text: "ÉRUPTION IMMINENTE ! Le volcan projettera de la raclette au prochain tir.",
      }));
  }
  updatePortals() {
    const g = this.zones.filter((o) => o.kind === "portal");
    for (const o of this.people)
      if (o.alive && (o.portalUntil || 0) < this.elapsed) {
        const u = g.findIndex((E) => bA(o.body.position, E));
        if (u >= 0) {
          const E = g[1 - u];
          (eA.setPosition(
            o.body,
            LA(
              { x: E.x, y: E.y },
              o.body.circleRadius,
              this.obstacles,
              this.w,
              this.h,
            ),
          ),
            (o.portalUntil = this.elapsed + 900),
            this.effects.push({
              x: E.x,
              y: E.y,
              text: "PORTAIL !",
              life: 0.8,
              color: "#745ab3",
            }));
        }
      }
  }
  advanceMap() {
    this.mapId === "volcan" &&
      ((this.zones = this.zones.filter((g) => !g.flow)),
      this.zones.push(...Ee("volcan", this.w, this.h)),
      this.prepareEruption());
    for (const g of this.people)
      if (((g.portalUntil = 0), g.alive)) {
        const o = AI(g.body.position, this.zones);
        o &&
          eA.setPosition(
            g.body,
            LA(o, g.body.circleRadius, this.obstacles, this.w, this.h),
          );
      }
    for (const g of this.food) {
      const o = AI(g, this.zones);
      o && Object.assign(g, LA(o, 12, this.obstacles, this.w, this.h));
    }
    if (["candy", "haunted", "works"].includes(this.mapId)) {
      ((this.obstacles = [
        ..._e(this.mapId, this.w, this.h, this.round),
        ...arenaBorderBodies(this.mapId, this.w, this.h),
      ]),
        this.obstacles.forEach((g, o) => {
          (eA.setPosition(this.obstacleBodies[o], g),
            eA.setAngle(this.obstacleBodies[o], g.angle));
        }));
      for (const g of this.people)
        g.alive &&
          eA.setPosition(
            g.body,
            LA(
              g.body.position,
              g.body.circleRadius,
              this.obstacles,
              this.w,
              this.h,
            ),
          );
      this.food = this.food.filter(
        (g) => !this.obstacles.some((o) => RA(g, zA(g), o)),
      );
    }
    if (
      (["pirate", "rooftop"].includes(this.mapId) &&
        (this.zones = Ee(this.mapId, this.w, this.h, this.round)),
      ["cinema", "palace"].includes(this.mapId) && this.round % 2 === 0)
    )
      for (let g = 0; g < 8 && this.food.length < this.foodCap; g++)
        this.addFood("burger", this.mapId === "palace" ? "xl" : "normal");
  }
  destroy() {
    this.secretRules?.tournament?.destroy();
    (BI.off(this.engine),
      XA.clear(this.engine.world, !1),
      he.clear(this.engine));
  }
}
const w = (e) => document.querySelector(e),
  oA = w("#game"),
  x = oA.getContext("2d");
let oe = [];
const PA = new Map();
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
const MA = matchMedia("(max-width:650px)").matches;
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
        top:
          FI(
            I.id === 0 ? WA.equipped.hat : "none",
            I.body.circleRadius,
            I.mass,
          ) * o,
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
  if (K.phase !== "aim") return;
  const g = vI(e),
    o = K.people[0];
  Math.hypot(g.x - o.body.position.x, g.y - o.body.position.y) >
    o.body.circleRadius + 24 ||
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
    K.launch({ x: (q.dx / g) * o, y: (q.dy / g) * o });
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
function kI(e, g) {
  if (drawSecretPerson(x, K, e, g)) return;
  Se(x, e, g, e.id === 0 ? WA.equipped : { hat: "none", outfit: "plain" });
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
