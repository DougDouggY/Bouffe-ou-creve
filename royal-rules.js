// Shared with physics, warnings and AI. Coordinates follow the inner mouth in the existing artwork.
export function royalMouth(w, h) {
  return {
    x: w * 0.5,
    y: h * 0.145,
    rx: w * 0.034,
    ry: h * 0.04,
    r: Math.min(w * 0.034, h * 0.04),
  };
}
export function insideRoyalMouth(point, mouth) {
  return (
    ((point.x - mouth.x) / mouth.rx) ** 2 +
      ((point.y - mouth.y) / mouth.ry) ** 2 <
    1
  );
}
export function crossesRoyalMouth(from, to, mouth) {
  const a = {
      x: (from.x - mouth.x) / mouth.rx,
      y: (from.y - mouth.y) / mouth.ry,
    },
    b = { x: (to.x - mouth.x) / mouth.rx, y: (to.y - mouth.y) / mouth.ry };
  const dx = b.x - a.x,
    dy = b.y - a.y,
    t = Math.max(
      0,
      Math.min(1, -(a.x * dx + a.y * dy) / (dx * dx + dy * dy || 1)),
    );
  return (a.x + dx * t) ** 2 + (a.y + dy * t) ** 2 < 1;
}
export function inRoyalCone(point, mouth, h) {
  const dy = point.y - mouth.y;
  return (
    dy >= -mouth.ry &&
    dy < h * 0.86 &&
    Math.abs(point.x - mouth.x) < mouth.rx + Math.max(0, dy) * 0.65
  );
}
export function royalRisk(point, royal, h) {
  if (insideRoyalMouth(point, royal.mouth)) return 10000;
  if (!royal.suction || !inRoyalCone(point, royal.mouth, h)) return 0;
  const dy = Math.max(0, point.y - royal.mouth.y),
    depth = royal.mouth.rx + dy * 0.65 - Math.abs(point.x - royal.mouth.x);
  return 800 + (600 * Math.max(0, depth)) / (h * 0.65);
}
