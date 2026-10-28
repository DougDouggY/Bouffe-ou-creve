import { drawGroundAura } from "./presentation-art.js?v=audio-48";
import {
  SLIDE_SOUNDS,
  COLLISION_SOUNDS,
} from "./sound-catalog.js?v=audio-48";
export const COSMETIC_SLOTS = [
  "hat",
  "outfit",
  "aura",
  "podium",
  "title",
  "slide",
  "collision",
];
export const SLOT_LABELS = {
  hat: "CHAPEAU",
  outfit: "TENUE",
  aura: "AURA",
  podium: "ANIMATION DE PODIUM",
  title: "SURNOM",
  slide: "SON DE GLISSADE",
  collision: "SON DE COLLISION",
};
export const EFFECT_COSMETICS = [
  ...SLIDE_SOUNDS,
  ...COLLISION_SOUNDS,
  { id: "aura_none", slot: "aura", name: "Sans aura", price: 0, icon: "◌" },
  ...[
    ["ketchup", "Flaque de ketchup", "#c74b39"],
    ["mayo", "Flaque de mayonnaise", "#fff0b0"],
    ["gold", "Flaque dorée", "#f3bf45"],
    ["flame", "Flammes du grill", "#ec7e36"],
    ["toxic", "Flaque toxique", "#8fda68"],
  ].map(([id, name, color], i) => ({
    id: "aura_" + id,
    slot: "aura",
    name,
    color,
    price: 180 + i * 50,
    icon: "◉",
  })),
  {
    id: "podium_none",
    slot: "podium",
    name: "Pose naturelle",
    price: 0,
    icon: "🙂",
  },
  ...[
    ["belly", "Danse du ventre", "🕺"],
    ["burp", "Petit rot triomphal", "😮"],
    ["jump", "Saut de joie ridicule", "🙌"],
    ["champion", "Pose de champion", "🏆"],
    ["despair", "Désespoir du plat du jour", "🍔"],
  ].map(([id, name, icon], i) => ({
    id: "podium_" + id,
    slot: "podium",
    name,
    price: 220 + i * 40,
    icon,
  })),
  { id: "title_none", slot: "title", name: "Sans surnom", price: 0, icon: "—" },
  ...[
    "Le Glouton",
    "Sac à calories",
    "Le Dernier Repas",
    "Roi du Ketchup",
    "Estomac sur pattes",
    "La Faim du Monde",
    "L’Abonné du buffet",
    "Gros Dossier",
    "La Boule",
    "Produit par MVP",
    "Celui qui a accepté les cookies",
  ].map((name, i) => ({
    id: "title_" + i,
    slot: "title",
    name,
    price: 100 + i * 30,
    icon: "✦",
  })),
];
let motionCache;
export function setCosmeticMotion(value) {
  motionCache = value;
  try {
    localStorage.setItem("bouffe-cosmetic-motion", value);
  } catch {}
}
export function cosmeticMotion() {
  if (motionCache) return motionCache;
  try {
    const value = localStorage.getItem("bouffe-cosmetic-motion");
    return (motionCache = ["full", "simple", "off"].includes(value)
      ? value
      : matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "simple"
        : "full");
  } catch {
    return "simple";
  }
}
export function drawAura(ctx, id, time = 0, mode = cosmeticMotion()) {
  if (mode === "off" || !id || id === "aura_none") return;
  const item = EFFECT_COSMETICS.find((c) => c.id === id && c.slot === "aura");
  if (!item) return;
  drawGroundAura(ctx, id, time, mode === "full");
}

export function equippedTitle(cosmetics) {
  return (
    EFFECT_COSMETICS.find(
      (c) =>
        c.id === cosmetics?.title &&
        c.slot === "title" &&
        c.id !== "title_none",
    )?.name || ""
  );
}
