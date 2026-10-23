import { survivalLayout } from "./survival.js?v=hunger-18";
import { shaft, secretSprite } from "./secret-modes.js?v=arena-17";
export const ILLUSTRATED_MAPS = [
  "survival",
  "platform",
  "cannibal",
  "icecream",
  "hunger",
  "cantine",
  "cold",
  "pirate",
  "market",
  "nightmarket",
  "fair",
  "trampoline",
  "royal",
  "beach",
  "station",
  "rooftop",
  "underwater",
  "wok",
  "picnic",
  "garden",
  "palace",
  "works",
  "mirror",
];
const images = new Map();
const platformFloors = new WeakMap();
const survivalPatterns = new WeakMap();
export function mapArtURL(id) {
  if (!ILLUSTRATED_MAPS.includes(id)) return null;
  if (id === "survival")
    return new URL("./assets/secrets/survival-ground.webp", import.meta.url)
      .href;
  if (id === "icecream")
    return new URL("./assets/secrets/icecream-street.webp", import.meta.url)
      .href;
  if (id === "pirate")
    return new URL("./assets/maps/pirate-barrels.webp", import.meta.url).href;
  if (["platform", "cannibal", "icecream", "survival"].includes(id))
    return new URL(`./assets/secrets/${id}.webp`, import.meta.url).href;
  const source = id === "nightmarket" ? "market" : id;
  const suffix = id === "royal" ? "-real" : "-overhead";
  return new URL(`./assets/maps/${source}${suffix}.webp`, import.meta.url).href;
}

export function drawMapArt(context, game) {
  const url = mapArtURL(game.mapId);
  if (!url) return false;
  if (!images.has(game.mapId)) {
    const image = new Image();
    image.src = url;
    images.set(game.mapId, image);
  }
  const image = images.get(game.mapId);
  if (!image.complete || !image.naturalWidth) return false;
  if (game.mapId === "survival") {
    let pattern = survivalPatterns.get(game);
    if (!pattern) {
      pattern = context.createPattern(image, "repeat");
      pattern.setTransform(new DOMMatrix().scale(0.5));
      survivalPatterns.set(game, pattern);
    }
    context.fillStyle = pattern;
    context.fillRect(0, 0, game.w, game.h);
    context.fillStyle = "rgba(43,58,34,.20)";
    context.fillRect(0, 0, game.w, game.h);
    const layout = survivalLayout(game.w, game.h),
      outer = layout.foodRadii[2] + 65 * layout.unit;
    const clearing = context.createRadialGradient(
      layout.x,
      layout.y,
      0,
      layout.x,
      layout.y,
      outer,
    );
    clearing.addColorStop(0, "rgba(154,123,67,.05)");
    clearing.addColorStop(0.56, "rgba(154,123,67,.05)");
    clearing.addColorStop(0.64, "rgba(154,123,67,.24)");
    clearing.addColorStop(0.94, "rgba(154,123,67,.24)");
    clearing.addColorStop(1, "rgba(154,123,67,0)");
    context.fillStyle = clearing;
    context.fillRect(layout.x - outer, layout.y - outer, outer * 2, outer * 2);
    for (const o of game.obstacles) {
      if (o.scenery === "cornucopia-circle")
        secretSprite(context, "cornucopia-circle", o.x, o.y, o.artW, o.artH);
      else if (o.scenery === "forest-grove")
        secretSprite(
          context,
          "forest-grove",
          o.x,
          o.y,
          o.w * 1.12,
          o.h * 1.12,
          o.angle,
        );
    }
    return true;
  }
  if (game.mapId === "platform") {
    const half = shaft(game).half;
    let cached = platformFloors.get(game);
    if (
      !cached ||
      cached.half !== half ||
      cached.w !== game.w ||
      cached.h !== game.h
    ) {
      const floor = document.createElement("canvas");
      floor.width = game.w;
      floor.height = game.h;
      const floorContext = floor.getContext("2d");
      const s = shaft(game),
        sx = [0, 0.365, 0.638, 1].map((n) => n * image.naturalWidth),
        sy = [0, 0.294, 0.633, 1].map((n) => n * image.naturalHeight);
      const dx = [0, s.x - s.half, s.x + s.half, game.w],
        dy = [0, s.y - s.half, s.y + s.half, game.h];
      for (let y = 0; y < 3; y++)
        for (let x = 0; x < 3; x++)
          floorContext.drawImage(
            image,
            sx[x],
            sy[y],
            sx[x + 1] - sx[x],
            sy[y + 1] - sy[y],
            dx[x],
            dy[y],
            dx[x + 1] - dx[x],
            dy[y + 1] - dy[y],
          );
      cached = { half, w: game.w, h: game.h, floor };
      platformFloors.set(game, cached);
    }
    context.drawImage(cached.floor, 0, 0);
    return true;
  }
  if (game.mapId === "royal") {
    if (!images.has("royal-rest")) {
      const rest = new Image();
      rest.src = new URL(
        "./assets/maps/royal-rest-real.webp",
        import.meta.url,
      ).href;
      images.set("royal-rest", rest);
    }
    const rest = images.get("royal-rest");
    if (rest.complete && rest.naturalWidth) {
      context.drawImage(rest, 0, 0, game.w, game.h);
      const env = game.mechanics?.environment;
      if (env?.kind === "suction" || env?.kind === "burp") {
        const alpha = Math.max(
          0,
          Math.min(1, env.elapsed / 280, (env.duration - env.elapsed) / 280),
        );
        context.save();
        context.globalAlpha = alpha;
        context.drawImage(image, 0, 0, game.w, game.h);
        context.restore();
      }
      return true;
    }
  }
  context.drawImage(image, 0, 0, game.w, game.h);
  return true;
}
