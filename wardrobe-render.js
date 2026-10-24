// Existing clothing artwork becomes the body silhouette, with a rounded belly morph.
const sources = new Map();
const fitted = new Map();
export function drawTailoredOutfit(
  context,
  id,
  shape,
  drawSource,
  pose = null,
) {
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
  const left = -width / 2,
    top = headBottom - height * 0.14;
  if (pose) {
    for (const [start, end, angle, pivot] of [
      [0, 0.26, pose.armL, -0.27],
      [0.74, 1, pose.armR, 0.27],
    ]) {
      context.save();
      context.translate(pivot * width, top + height * 0.17);
      context.rotate(angle || 0);
      context.drawImage(
        image,
        image.width * start,
        0,
        image.width * (end - start),
        image.height * 0.7,
        left + start * width - pivot * width,
        -height * 0.17,
        (end - start) * width,
        height * 0.7,
      );
      context.restore();
    }
    context.drawImage(
      image,
      image.width * 0.24,
      0,
      image.width * 0.52,
      image.height,
      left + width * 0.24,
      top,
      width * 0.52,
      height,
    );
    context.drawImage(
      image,
      0,
      image.height * 0.66,
      image.width,
      image.height * 0.34,
      left,
      top + height * 0.66,
      width,
      height * 0.34,
    );
  } else context.drawImage(image, left, top, width, height);
  return true;
}
export function drawFittedHat(
  context,
  id,
  bounds,
  drawSource,
  layer = "front",
) {
  context.save();
  if (layer === "front") {
    // Two layers share their exact original placement. The front keeps its real
    // alpha silhouette, with an opening matching the head rather than a flat cut.
    context.beginPath();
    context.rect(-3, -5, 6, 8);
    context.moveTo(0.5, -0.38);
    context.ellipse(0, -0.38, 0.5, 0.5, 0, 0, Math.PI * 2);
    context.clip("evenodd");
  }
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
