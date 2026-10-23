// Existing clothing artwork becomes the body silhouette, with a rounded belly morph.
const sources = new Map();
const fitted = new Map();
export function drawTailoredOutfit(context, id, shape, drawSource) {
  let source = sources.get(id);
  if (!source) {
    source = document.createElement("canvas");
    source.width = 256;
    source.height = 192;
    if (!drawSource(source.getContext("2d"), id, 0, 0, 256, 192)) return false;
    sources.set(id, source);
  }
  const fullness = Math.round(shape.fullness * 32) / 32,
    lean = shape.lean;
  const key = id + ":" + fullness;
  let image = fitted.get(key);
  if (!image) {
    image = document.createElement("canvas");
    image.width = 384;
    image.height = 288;
    const ctx = image.getContext("2d"),
      maximum = 1 + fullness * 0.32;
    for (let band = 0; band < 64; band++) {
      const t = (band + 0.5) / 64,
        belly = 1 + fullness * 0.32 * Math.sin(Math.PI * t) ** 0.8;
      const width = (image.width * belly) / maximum;
      ctx.drawImage(
        source,
        0,
        (band * source.height) / 64,
        source.width,
        source.height / 64,
        (image.width - width) / 2,
        (band * image.height) / 64,
        width,
        image.height / 64 + 0.5,
      );
    }
    fitted.set(key, image);
    if (fitted.size > 64) fitted.delete(fitted.keys().next().value);
  }
  const width = 1.98 * (1 + fullness * 0.32) * (1 - lean * 0.48),
    height = 1.44 + fullness * 0.1;
  const headBottom = shape.headY + 0.11 * shape.headScale;
  context.drawImage(
    image,
    -width / 2,
    headBottom - height * 0.14,
    width,
    height,
  );
  return true;
}
export function drawFittedHat(context, id, bounds, drawSource) {
  if (!id.startsWith("hat_"))
    return drawSource(context, id, bounds.x, bounds.y, bounds.w, bounds.h);
  context.save();
  // Remove the backing that projects down behind the forehead; keep the original placement.
  context.beginPath();
  context.rect(-3, -5, 6, 4.18);
  context.clip();
  const result = drawSource(
    context,
    id,
    bounds.x,
    bounds.y,
    bounds.w,
    bounds.h,
  );
  context.restore();
  return result;
}
