import { SLIDE_SOUNDS } from "./sound-catalog.js?v=sounds-44";
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
  ctx.save();
  const transform = ctx.getTransform();
  const pixels = Math.max(1, Math.hypot(transform.a, transform.b));
  const pulse = mode === "full" ? 1 + Math.sin(time * 0.0028) * 0.045 : 1;
  // Low, filled pool on the ground beneath the soles. Never a body outline.
  const rx = 1.18 * pulse,
    ry = 0.23 * pulse,
    cy = 1.01;
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = item.color;
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const wobble =
      1 + 0.035 * Math.sin(angle * 3 + (mode === "full" ? time * 0.0015 : 0));
    const x = Math.cos(angle) * rx * wobble,
      y = cy + Math.sin(angle) * ry * wobble;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = Math.max(0.035, 1.1 / pixels);
  ctx.strokeStyle = item.color;
  ctx.globalAlpha = 0.75;
  ctx.stroke();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#fff4bd";
  ctx.beginPath();
  ctx.ellipse(-0.24, cy - 0.035, 0.48, 0.055, 0, 0, Math.PI * 2);
  ctx.fill();
  if (mode === "full") {
    const ripple = (time % 1800) / 1800;
    ctx.globalAlpha = (1 - ripple) * 0.35;
    ctx.strokeStyle = item.color;
    ctx.beginPath();
    ctx.ellipse(
      0,
      cy,
      rx * (0.55 + ripple * 0.45),
      ry * (0.55 + ripple * 0.45),
      0,
      0,
      Math.PI * 2,
    );
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
