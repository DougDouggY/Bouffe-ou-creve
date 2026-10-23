import { shaft } from "./secret-modes.js?v=filmovore-15";
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
export function mapArtURL(id) {
  if (!ILLUSTRATED_MAPS.includes(id)) return null;
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
  if (game.mapId === "platform") {
    const s = shaft(game),
      sx = [0, 0.365, 0.638, 1].map((n) => n * image.naturalWidth),
      sy = [0, 0.294, 0.633, 1].map((n) => n * image.naturalHeight);
    const dx = [0, s.x - s.half, s.x + s.half, game.w],
      dy = [0, s.y - s.half, s.y + s.half, game.h];
    for (let y = 0; y < 3; y++)
      for (let x = 0; x < 3; x++)
        context.drawImage(
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
