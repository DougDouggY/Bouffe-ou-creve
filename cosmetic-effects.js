import { SLIDE_SOUNDS } from "./sound-catalog.js?v=ceremony-38";
export const COSMETIC_SLOTS = [
  "hat",
  "outfit",
  "aura",
  "podium",
  "title",
  "slide",
];
export const SLOT_LABELS = {
  hat: "CHAPEAU",
  outfit: "TENUE",
  aura: "AURA",
  podium: "ANIMATION DE PODIUM",
  title: "SURNOM",
  slide: "SON DE GLISSADE",
};
export const EFFECT_COSMETICS = [
  ...SLIDE_SOUNDS,
  { id: "aura_none", slot: "aura", name: "Sans aura", price: 0, icon: "◌" },
  ...[
    ["ketchup", "Cercle de ketchup", "#c74b39"],
    ["mayo", "Cercle de mayonnaise", "#fff0b0"],
    ["gold", "Cercle doré", "#f3bf45"],
    ["flame", "Flammes du grill", "#ec7e36"],
    ["toxic", "Cercle toxique", "#8fda68"],
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
  ctx.save();
  const transform = ctx.getTransform();
  const pixels = Math.max(1, Math.hypot(transform.a, transform.b));
  const width = Math.max(0.15, 1.8 / pixels),
    rx = 1.42,
    ry = 0.43,
    cy = 0.87;
  ctx.beginPath();
  ctx.ellipse(0, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = item.color;
  ctx.globalAlpha = 0.16;
  ctx.fill();
  ctx.strokeStyle = "#172219";
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = width + 0.12;
  ctx.stroke();
  ctx.strokeStyle = item.color;
  ctx.globalAlpha = 0.98;
  ctx.lineWidth = width;
  ctx.stroke();
  if (id === "aura_flame") {
    ctx.fillStyle = item.color;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 1.3, cy + Math.sin(a) * 0.4);
      ctx.lineTo(Math.cos(a + 0.08) * 1.7, cy + Math.sin(a + 0.08) * 0.57);
      ctx.lineTo(Math.cos(a + 0.2) * 1.3, cy + Math.sin(a + 0.2) * 0.4);
      ctx.fill();
    }
  }
  if (mode === "full") {
    ctx.strokeStyle = "#fff7cc";
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = width * 0.55;
    ctx.lineCap = "round";
    const a = time * 0.001;
    ctx.beginPath();
    ctx.ellipse(0, cy, rx, ry, 0, a, a + 1.2);
    ctx.stroke();
  }
  ctx.restore();
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
