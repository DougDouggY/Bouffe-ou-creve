export function lightRadius(mapId, observer) {
  return mapId === "nightmarket" ? Math.max(160, 140 + (observer.r || 0)) : 300;
}

const NIGHT_STOPS = [
  [0, 0],
  [0.32, 36 / 255],
  [0.7, 153 / 255],
  [1, 242 / 255],
];

export function lightOpacity(mapId, observer, target) {
  if (mapId !== "nightmarket") return 1;
  const core = 18 + (observer.r || 0);
  const distance = Math.hypot(target.x - observer.x, target.y - observer.y);
  const progress = Math.max(
    0,
    Math.min(1, (distance - core) / (lightRadius(mapId, observer) - core)),
  );
  for (let i = 1; i < NIGHT_STOPS.length; i++) {
    const [end, endAlpha] = NIGHT_STOPS[i];
    if (progress <= end) {
      const [start, startAlpha] = NIGHT_STOPS[i - 1];
      return (
        1 -
        (startAlpha +
          ((endAlpha - startAlpha) * (progress - start)) / (end - start))
      );
    }
  }
  return 0;
}

// Shared by rendering, minimap, badges and AI: nighttime vision has no heading.
export function isVisible(mapId, observer, target, obstacles = []) {
  if (!["market", "nightmarket"].includes(mapId)) return true;
  const dx = target.x - observer.x;
  const dy = target.y - observer.y;
  const distance = Math.hypot(dx, dy);
  if (distance < (mapId === "nightmarket" ? 18 : 55) + (observer.r || 0))
    return true;
  if (distance > lightRadius(mapId, observer)) return false;
  for (const obstacle of obstacles) {
    const cosine = Math.cos(obstacle.angle);
    const sine = Math.sin(obstacle.angle);
    const localX =
      (observer.x - obstacle.x) * cosine + (observer.y - obstacle.y) * sine;
    const localY =
      -(observer.x - obstacle.x) * sine + (observer.y - obstacle.y) * cosine;
    const rayX = dx * cosine + dy * sine;
    const rayY = -dx * sine + dy * cosine;
    let near = 0,
      far = 1;
    for (const [position, direction, halfSize] of [
      [localX, rayX, obstacle.w / 2],
      [localY, rayY, obstacle.h / 2],
    ]) {
      if (Math.abs(direction) < 1e-8) {
        if (Math.abs(position) > halfSize) {
          near = 2;
          break;
        }
      } else {
        const first = (-halfSize - position) / direction;
        const last = (halfSize - position) / direction;
        near = Math.max(near, Math.min(first, last));
        far = Math.min(far, Math.max(first, last));
      }
    }
    if (near <= far && far > 0 && near < 1) return false;
  }
  return true;
}

export function drawMarketFog(context, game) {
  if (!["market", "nightmarket"].includes(game.mapId)) return;
  const player = game.people[0];
  const observer = { ...player.body.position, r: player.body.circleRadius };
  const radius = lightRadius(game.mapId, observer);
  if (game.mapId === "nightmarket") {
    // Ambient halo: no angular ray-casting cuts or seams at the fade boundary.
    // Obstacle occlusion for food, opponents and AI remains in isVisible().
    context.save();
    const gradient = context.createRadialGradient(
      observer.x,
      observer.y,
      18 + observer.r,
      observer.x,
      observer.y,
      radius,
    );
    for (const [offset, alpha] of NIGHT_STOPS) {
      gradient.addColorStop(offset, `rgba(8, 11, 22, ${alpha})`);
    }
    context.fillStyle = gradient;
    context.fillRect(0, 0, game.w, game.h);
    context.restore();
    return;
  }
  const boundary = [];
  for (let degrees = 0; degrees < 360; degrees++) {
    const angle = (degrees * Math.PI) / 180;
    const cosine = Math.cos(angle),
      sine = Math.sin(angle);
    let near = 0,
      far = radius;
    for (let step = 0; step < 10; step++) {
      const distance = (near + far) / 2;
      const target = {
        x: observer.x + cosine * distance,
        y: observer.y + sine * distance,
      };
      if (isVisible(game.mapId, observer, target, game.obstacles))
        near = distance;
      else far = distance;
    }
    boundary.push({
      x: observer.x + cosine * near,
      y: observer.y + sine * near,
    });
  }
  const traceBoundary = () => {
    context.moveTo(boundary[0].x, boundary[0].y);
    for (const point of boundary) context.lineTo(point.x, point.y);
    context.closePath();
  };
  context.save();
  context.beginPath();
  context.rect(0, 0, game.w, game.h);
  traceBoundary();
  context.fillStyle = game.mapId === "nightmarket" ? "#080b16f2" : "#202d27e8";
  context.fill("evenodd");
  context.restore();
}
