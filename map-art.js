export const ILLUSTRATED_MAPS = [
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
  return ILLUSTRATED_MAPS.includes(id)
    ? new URL(
        `./assets/maps/${id === "nightmarket" ? "market" : id}${["market", "nightmarket", "fair", "royal", "beach"].includes(id) ? "-real" : ""}.webp`,
        import.meta.url,
      ).href
    : null;
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
