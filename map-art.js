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
        `./assets/maps/${id === "nightmarket" ? "market" : id}.webp`,
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
  context.drawImage(image, 0, 0, game.w, game.h);
  return true;
}
