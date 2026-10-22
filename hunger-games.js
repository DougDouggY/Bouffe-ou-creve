export function hungerZone(w, h, round) {
  const initial = Math.min(w, h) * 0.44;
  return {
    x: w / 2,
    y: h / 2,
    r: initial * 0.86 ** Math.max(0, round - 3),
  };
}
export function hungerStart(w, h, index, count) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
  const radius = Math.min(w, h) * 0.16;
  return {
    x: w / 2 + Math.cos(angle) * radius,
    y: h / 2 + Math.sin(angle) * radius,
  };
}
export function insideHungerZone(point, radius, zone) {
  return (
    Math.hypot(point.x - zone.x, point.y - zone.y) + radius < zone.r - 1e-7
  );
}
