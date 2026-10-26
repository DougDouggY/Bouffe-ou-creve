import {
  sameTeam,
  lastTeamStanding,
  localTeamWon,
  validTeamSetup,
} from "./teams.js?v=teams-31";
import { royalRisk, insideRoyalMouth } from "./royal-rules.js?v=royal-29";
import { REMOVED_MAPS } from "./map-catalog.js?v=collection-37";
// Shared headless engine: solo and authoritative private rooms use the same rules.
import {
  SurvivalRules,
  survivalStart,
  survivalObstacles,
} from "./survival.js?v=burger-43";
import {
  SecretRules,
  SECRET_GAME_MODES,
  physicalMass,
  propulsionFactor,
} from "./secret-modes.js?v=secret-42";
import {
  hungerStart,
  hungerZone,
  insideHungerZone,
} from "./hunger-games.js?v=filmovore-15";
import { arenaBorderBodies } from "./arena-bounds.js?v=burger-43";
import { ArenaMechanics } from "./arena-mechanics.js?v=burger-43";
import { isVisible as xA } from "./visibility.js?v=filmovore-15";
import { consumeShelves, SHELF_MASS_GAIN } from "./shelves.js";
const SECRET_MAP_MODE = (mode) => Object.hasOwn(SECRET_GAME_MODES, mode);
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
  name: "Burger Games",
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
            ? "24 gourmands à 60 kg sur un cercle de départ. Le monument circulaire central est infranchissable ; les burgers sont dispersés et accessibles autour. Suis la flèche du festin pour le rejoindre, puis explore la forêt et ses rivières de raclette non comestibles. Aucun réapprovisionnement ordinaire : guette les rares parachutages. Dès le sixième tour, rejoins le cercle annoncé avant la fin du mouvement. Dernier survivant : victoire !"
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
    "Gargantouille aspire tous les 2 ou 3 tours, annoncés par le cône. Entre les repas, il digère. Seul le passage dans sa bouche ouverte peut te faire dévorer, quel que soit ton poids.",
};
CA.fair.description =
  "Flipper gourmand : trois bumpers fixes amplifient les rebonds selon l’angle du choc. Compression, ressort et trajectoires en chaîne !";
CA.trampoline = {
  name: "Trampoline Park",
  icon: "🌀",
  floor: "#152a3c",
  experimental: true,
  meal: "burger",
  mealName: "Burgers",
  description:
    "Des murs entièrement rebondissants et des bumpers au milieu ! Termine ton tour sur un trampoline pour être téléporté ailleurs. À l’arrivée, le plus gros peut dévorer le plus petit selon les règles habituelles.",
};
CA.beach.name = "La Plage des Gourmands";
CA.beach.description =
  "Une vague annoncée traverse la plage de bas en haut tous les 2 ou 3 tours. Sa poussée physique regroupe les gourmands, les plus lourds résistent mieux.";
function _e(e, g, o, u = 1) {
  const E = (A, n, i, I, C = 0, Q = {}) => ({
    x: A * g,
    y: n * o,
    w: i * g,
    h: I * o,
    angle: C,
    ...Q,
  });
  if (e === "trampoline") {
    const r = Math.min(g, o) * 0.027;
    const points = [
      [0.38, 0.43],
      [0.62, 0.43],
      [0.38, 0.68],
      [0.62, 0.68],
    ];
    return points.map(([x, y]) => ({
      x: x * g,
      y: y * o,
      w: r * 2,
      h: r * 2,
      r,
      angle: 0,
      bumper: true,
    }));
  }
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
  if (e === "trampoline")
    return [
      [0.25, 0.3],
      [0.75, 0.3],
      [0.5, 0.53],
      [0.25, 0.76],
      [0.75, 0.76],
    ].map(([x, y]) => i("trampoline", x, y, 0.065));
  if (e === "beach") return [n("sand", { regularSand: true })];
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
        ? o.some((u) => u.regularSand)
          ? 0.024
          : 0.03
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
            ? -30
            : -12
          : e.size === "chef"
            ? 120
            : e.size === "xl"
              ? 40
              : e.size === "small"
                ? 8
                : 15,
  ne = (e) => 19 * Math.sqrt(e / 60),
  Fe = (e) => e.type !== "salad";

function NA(e) {
  return {
    x: e.body.position.x,
    y: e.body.position.y,
    r: e.body.circleRadius,
    heading: e.heading ?? 0,
    lightBoost: e.lightBoost || 1,
  };
}

function Bt(e, g) {
  return e > g * wA ? "prey" : g > e * wA ? "danger" : "neutral";
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
    royal:
      e.mapId === "royal"
        ? { mouth: e.mechanics.mouth(), suction: e.mechanics.royalSuctionRound }
        : null,
    w: e.w,
    h: e.h,
    obstacles: e.obstacles.map((g) => ({ ...g })),
    zones: e.zones.map((g) => ({ ...g })),
    food: e.food.map((g) => ({ ...g })),
    people: e.people
      .filter((g) => g.alive)
      .map((g) => ({
        id: g.id,
        teamId: g.teamId,
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
      .filter((s) => s.id !== g && !sameTeam(s, u))
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
    for (const s of e.zones || []) s.kind === "cheese" && !s.flow && I(s, "fondue");
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
  const forecastFactors = Array.from(
    { length: 105 },
    (_, index) => 1 - Math.pow(pt, index * 2 + 2),
  );
  const projectionFrames = n.some(
    (p) => u.mass > p.mass * wA || p.mass > u.mass * wA,
  )
    ? forecastFactors.map((F) =>
        n.map((p) => ({
          x: pA(p.x + p.forecast.x * F, p.r, e.w - p.r),
          y: pA(p.y + p.forecast.y * F, p.r, e.h - p.r),
        })),
      )
    : null;
  const edible = e.food.filter(Fe),
    nearestFood = edible.length
      ? Math.min(...edible.map((food) => mA(u, food)))
      : Infinity;
  const evaluation = { projectionFrames, edible, nearestFood };
  let Q = null;
  for (const s of i) {
    const r = xt(s, u, n, e, E, evaluation);
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
function xt(e, g, o, u, E, evaluation) {
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
    M = (u.zones || []).filter((m) => !(m.kind === "cheese" && !m.flow && g.mass >= VA));
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
          !p.flow &&
          !d.has(p.flow ? "arm" + p.arm : p) &&
          Math.hypot(i - p.x, I - p.y) <= g.r + p.r &&
          (d.add(p.flow ? "arm" + p.arm : p), (B += Qe * G));
    for (let opponentIndex = 0; opponentIndex < o.length; opponentIndex++) {
      const p = o[opponentIndex],
        N = g.r + p.r;
      const projected = evaluation.projectionFrames?.[m / 2]?.[opponentIndex];
      if (g.mass > p.mass * wA && y > oI) {
        const b = projected.x,
          U = projected.y;
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
        const b = projected.x,
          U = projected.y;
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
    if (u.royal && insideRoyalMouth({ x: i, y: I }, u.royal.mouth)) {
      t += 10000;
      break;
    }
    if (s || y < 0.2) break;
  }
  for (const m of o)
    if (m.mass > g.mass * wA) {
      const Y = (17 * ke(m.mass) - oI) / 0.024 + g.r + m.r,
        J = Math.hypot(i - m.x, I - m.y);
      J < Y && (t += Math.max(0, 1 - J / Y) * 38);
    }
  if (u.royal) t += royalRisk({ x: i, y: I }, u.royal, u.h);
  let h = 0;
  const c = evaluation.edible;
  if (c.length) {
    const m = evaluation.nearestFood,
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
    ((this.teamSize =
      validTeamSetup(E.count || 8, E.teamSize || 1) &&
      !SECRET_MAP_MODE(E.mode) &&
      E.mode !== "somalia"
        ? E.teamSize || 1
        : 1),
      (this.spectate = this.teamSize > 1),
      (this.mode = E.mode || "classic"),
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
    if (this.teamSize > 1)
      for (const p of this.people) {
        p.teamId = Math.floor(p.id / this.teamSize);
        p.networkSeat = p.id;
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
          if(this.mode==='platform' && C?.alive && Q?.alive) this.emit('bounce',C,Q);
          if (this.mode === "platform" || !C || !Q || !C.alive || !Q.alive)
            continue;
          let a, s;
          (aI(C, Q) ? ((a = C), (s = Q)) : aI(Q, C) && ((a = Q), (s = C)),
            a ? this.eat(a, s) : this.emit("bounce", C, Q));
        }
      }));
    this.mechanics = new ArenaMechanics(this, {
      Bodies: yA,
      Body: eA,
      World: XA,
      intersects: RA,
      canEat: (eater, victim) =>
        !sameTeam(eater, victim) && Bt(eater.mass, victim.mass) === "prey",
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
      if (!o || o.inactive || o.kind !== "cheese" || o.flow) continue;
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
    if (this.mode === "platform" || sameTeam(g, o)) return;
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
      this.teamSize > 1 ||
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
  launch(g, humanShots = null) {
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
        .map((E) => [
          E,
          humanShots?.has(E.id)
            ? humanShots.get(E.id)
            : E.id === 0 && !humanShots
              ? g
              : this.plan(E, o),
        ]);
    for (const [E, A] of u) {
      ((E.heading = Math.atan2(A.y, A.x)),
        this.mode === "icecream" &&
          eA.setAngle(E.body, E.heading - Math.PI / 2),
        (E.roundStart = { ...E.body.position }));
      const n = Math.hypot(A.x, A.y),
        i = (n > 17 ? 17 / n : 1) * propulsionFactor(E.mass, this.mode);
      (eA.setVelocity(E.body, { x: A.x * i, y: A.y * i }),
        eA.setAngularVelocity(E.body, 0));
      if (n > 0.1) this.emit("slide", E);
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
                (this.teamSize > 1
                  ? lastTeamStanding(this)
                  : this.people.filter((o) => o.alive).length === 1))
            ) {
              (this.recordMotion(),
                this.mechanics.finishRound(),
                (this.outcome = localTeamWon(this) ? "win" : "loss"),
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
                  (this.teamSize > 1
                    ? lastTeamStanding(this)
                    : this.people.filter((p) => p.alive).length <= 1))
              ) {
                this.recordMotion();
                this.outcome = localTeamWon(this) ? "win" : "loss";
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

export { CA, Ee, bA, RA, ne, NA, he, yA, eA, XA, zt };
