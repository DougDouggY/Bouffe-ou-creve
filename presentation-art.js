// Generated alpha atlases, decoded once. No Image or DOM access in headless imports.
const images = new Map(),
  heads = new Map();
export const AURA_IDS = [
  "aura_ketchup",
  "aura_mayo",
  "aura_gold",
  "aura_flame",
  "aura_toxic",
];
function source(file) {
  if (typeof Image === "undefined") return null;
  if (!images.has(file)) {
    const im = new Image();
    im.src = new URL("./assets/" + file, import.meta.url).href;
    im.onload = () =>
      document.dispatchEvent(new Event("gourmand-presentation-loaded"));
    images.set(file, im);
  }
  const im = images.get(file);
  return im.complete && im.naturalWidth ? im : null;
}
export async function preparePresentationArt() {
  const files = [
    "cosmetics/auras-frames-45.webp",
    "cosmetics/face-frames-45.webp",
    "cosmetics/fire-burp-frames-45.webp",
    "cosmetics/heads-equipped.webp",
    "ceremony-restaurant-45.webp",
  ];
  await Promise.all(
    files.map(async (file) => {
      source(file);
      const im = images.get(file);
      if (im) await im.decode();
    }),
  );
}
export const auraAtlas = () => source("cosmetics/auras-frames-45.webp");
export const vfxAtlas = () => source("cosmetics/fire-burp-frames-45.webp");
export const ceremonyBackdrop = () => source("ceremony-restaurant-45.webp");
export function drawGroundAura(ctx, id, time = 0, animated = true) {
  const col = AURA_IDS.indexOf(id),
    im = auraAtlas();
  if (col < 0 || !im) return false;
  const cycle = animated ? time / 180 : 0,
    frame = Math.floor(cycle) % 4,
    next = (frame + 1) % 4,
    blend = animated ? (cycle % 1) * 0.45 : 0;
  ctx.save();
  const opacity = ctx.globalAlpha;
  ctx.globalAlpha = opacity * (1 - blend);
  ctx.drawImage(im, col * 256, frame * 160, 256, 160, -1.5, 0.44, 3, 0.82);
  if (blend) {
    ctx.globalAlpha = opacity * blend;
    ctx.drawImage(im, col * 256, next * 160, 256, 160, -1.5, 0.44, 3, 0.82);
  }
  ctx.restore();
  return true;
}
export function drawAuraThumbnail(canvas, item) {
  if (!AURA_IDS.includes(item.id)) return false;
  const paint = () => {
    const im = auraAtlas();
    if (!im) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      im,
      AURA_IDS.indexOf(item.id) * 256,
      0,
      256,
      160,
      0,
      (canvas.height - (canvas.width * 160) / 256) / 2,
      canvas.width,
      (canvas.width * 160) / 256,
    );
    canvas.dataset.illustrated = "true";
  };
  paint();
  const im = images.get("cosmetics/auras-frames-45.webp");
  if (im && !im.complete) im.addEventListener("load", paint, { once: true });
  return true;
}
export function getCeremonyHead(index, expression = 0) {
  const base = source("cosmetics/heads-equipped.webp"),
    faces = source("cosmetics/face-frames-45.webp");
  if (!base || !faces) return null;
  const key = index + ":" + expression;
  if (heads.has(key)) return heads.get(key);
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 384;
  const ctx = c.getContext("2d");
  ctx.drawImage(
    base,
    (index % 6) * 256,
    Math.floor(index / 6) * 384,
    256,
    384,
    0,
    0,
    256,
    384,
  );
  const top = index === 0 ? 195 : 257;
  ctx.clearRect(0, top, 256, 384 - top);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top, 256, 384 - top);
  ctx.clip();
  ctx.drawImage(
    faces,
    (expression % 4) * 256,
    Math.floor(expression / 4) * 256,
    256,
    256,
    53,
    197,
    150,
    140,
  );
  ctx.restore();
  heads.set(key, c);
  if (heads.size > 32) heads.delete(heads.keys().next().value);
  return c;
}
export function drawVFX(ctx, kind, frame, x, y, w, h, alpha = 1) {
  const im = vfxAtlas();
  if (!im) return false;
  const tw = im.naturalWidth / 6,
    th = im.naturalHeight / 2;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.drawImage(
    im,
    Math.max(0, Math.min(5, frame)) * tw,
    kind === "fire" ? 0 : th,
    tw,
    th,
    x - w / 2,
    y - h,
    w,
    h,
  );
  ctx.restore();
  return true;
}

export function preloadGameEffects() {
  source("cosmetics/auras-frames-45.webp");
  source("cosmetics/fire-burp-frames-45.webp");
}
