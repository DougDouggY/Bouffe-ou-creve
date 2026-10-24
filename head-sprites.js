// Each tile is one complete head WITH its hat: no rear/front accessory compositing.
const IDS = [
  "none",
  "cap",
  "beanie",
  "chef",
  "crown",
  "burger",
  "pirate",
  "halo",
  "tender",
  "hat_croissant",
  "hat_pizza",
  "hat_pancakes",
  "hat_strawberry",
  "hat_mushroom",
  "hat_sushi",
  "hat_egg",
  "hat_icecream",
  "hat_popcorn",
  "hat_waffle",
  "hat_teacup",
  "hat_cream",
  "hat_pastry",
  "hat_lemon",
  "hat_teapot",
];
const atlas = new Image();
atlas.src = new URL(
  "./assets/cosmetics/heads-equipped.webp",
  import.meta.url,
).href;
atlas.onload = () => document.dispatchEvent(new Event("gourmand-heads-loaded"));
export const hasHead = (id) => IDS.includes(id);
export function drawEquippedHead(ctx, id) {
  if (!atlas.complete || !atlas.naturalWidth) return false;
  const at = Math.max(0, IDS.indexOf(id));
  ctx.drawImage(
    atlas,
    (at % 6) * 256,
    Math.floor(at / 6) * 384,
    256,
    384,
    -1,
    0.11 - 333 / 128,
    2,
    3,
  );
  return true;
}
export function drawHeadThumbnail(canvas, id) {
  const paint = () => {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!atlas.complete || !atlas.naturalWidth) return;
    const at = Math.max(0, IDS.indexOf(id));
    ctx.drawImage(
      atlas,
      (at % 6) * 256,
      Math.floor(at / 6) * 384,
      256,
      384,
      (canvas.width - (canvas.height * 2) / 3) / 2,
      0,
      (canvas.height * 2) / 3,
      canvas.height,
    );
  };
  paint();
  if (!atlas.complete) atlas.addEventListener("load", paint, { once: true });
}

const TOPS = {
  none: -0.9134,
  cap: -1.4837,
  beanie: -1.2337,
  chef: -1.1791,
  crown: -1.2572,
  burger: -1.2572,
  pirate: -1.2728,
  halo: -1.3978,
  tender: -1.3353,
  hat_croissant: -1.3353,
  hat_pizza: -1.3041,
  hat_pancakes: -1.265,
  hat_strawberry: -1.3353,
  hat_mushroom: -1.2103,
  hat_sushi: -1.1634,
  hat_egg: -1.1009,
  hat_icecream: -1.515,
  hat_popcorn: -1.39,
  hat_waffle: -1.2806,
  hat_teacup: -1.2572,
  hat_cream: -1.4759,
  hat_pastry: -1.4212,
  hat_lemon: -1.2806,
  hat_teapot: -1.3978,
};
export const equippedHeadTop = (id) => TOPS[id] ?? TOPS.none;
