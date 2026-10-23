export const COSMETIC_SLOTS = ["hat", "outfit", "aura", "podium", "title"];
export const SLOT_LABELS = {
  hat: "CHAPEAU",
  outfit: "TENUE",
  aura: "AURA",
  podium: "ANIMATION DE PODIUM",
  title: "SURNOM",
};
export const EFFECT_COSMETICS = [
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
    "Le Buffet Humain",
    "Gros Dossier",
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
  ctx.translate(0, 0.86);
  ctx.scale(1, 0.25);
  ctx.strokeStyle = item.color;
  ctx.globalAlpha = 0.65;
  ctx.lineWidth = 0.07;
  ctx.beginPath();
  ctx.ellipse(0, 0, 1.16, 1.16, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (id === "aura_flame") {
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 1.12, Math.sin(angle) * 1.12);
      ctx.lineTo(Math.cos(angle + 0.08) * 1.45, Math.sin(angle + 0.08) * 1.45);
      ctx.lineTo(Math.cos(angle + 0.18) * 1.12, Math.sin(angle + 0.18) * 1.12);
      ctx.fillStyle = item.color;
      ctx.fill();
    }
  }
  if (mode === "full") {
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 0.11;
    ctx.beginPath();
    const a = time * 0.001;
    ctx.arc(0, 0, 1.16, a, a + 1.2);
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
