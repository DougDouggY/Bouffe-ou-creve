import {
  EFFECT_COSMETICS,
  COSMETIC_SLOTS,
} from "./cosmetic-effects.js?v=quiet-46";
// The Dressing catalog is shared by solo, multiplayer clients and server validation.
import { EXTRA_COSMETICS } from "./cosmetics.js?v=podium-35";
export const COSMETIC_CATALOG = [
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
  ...EFFECT_COSMETICS,
];
const hats = new Set(
  COSMETIC_CATALOG.filter((item) => item.slot === "hat").map((item) => item.id),
);
const outfits = new Set(
  COSMETIC_CATALOG.filter((item) => item.slot === "outfit").map(
    (item) => item.id,
  ),
);
export function normalizeCosmetics(value) {
  const extra = {};
  for (const slot of COSMETIC_SLOTS.slice(2))
    if (
      COSMETIC_CATALOG.some(
        (item) =>
          item.slot === slot && item.id === value?.[slot] && !item.disabled,
      )
    )
      extra[slot] = value[slot];
  return {
    ...extra,
    hat:
      typeof value?.hat === "string" && hats.has(value.hat)
        ? value.hat
        : "none",
    outfit:
      typeof value?.outfit === "string" && outfits.has(value.outfit)
        ? value.outfit
        : "plain",
  };
}
