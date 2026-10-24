import {
  survivalLayout,
  survivalScenery,
  survivalRivers,
} from "./survival.js?v=burger-43";
import { shaft, secretSprite } from "./secret-modes.js?v=secret-42";
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
const survivalDecor = new WeakMap();
let survivalDetails = null;
let detailPattern = null;
export function mapArtURL(id) {
  if (!ILLUSTRATED_MAPS.includes(id)) return null;
  if (id === "platform")
    return new URL("./assets/secrets/plateau-restaurant.webp", import.meta.url)
      .href;
  if (id === "survival")
    return new URL("./assets/secrets/burger-games-forest.webp", import.meta.url)
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
    context.drawImage(image, 0, 0, game.w, game.h);
    if (!survivalDetails) {
      survivalDetails = new Image();
      survivalDetails.src = new URL(
        "./assets/secrets/survival-ground.webp",
        import.meta.url,
      ).href;
    }
    if (survivalDetails.complete && survivalDetails.naturalWidth) {
      detailPattern ||= context.createPattern(survivalDetails, "repeat");
      detailPattern.setTransform(new DOMMatrix().scale(0.5));
      context.save();
      context.globalCompositeOperation = "soft-light";
      context.globalAlpha = 0.7;
      context.fillStyle = detailPattern;
      context.fillRect(0, 0, game.w, game.h);
      context.restore();
    }
    // Smooth ribbons use the same sampled centreline as the permanent slowdown zones.
    context.save();
    context.lineJoin = "round";
    context.lineCap = "round";
    let decor = survivalDecor.get(game);
    if (!decor || decor.w !== game.w || decor.h !== game.h) {
      decor = {
        w: game.w,
        h: game.h,
        scenery: survivalScenery(game.w, game.h),
        rivers: survivalRivers(game.w, game.h).map((river) => {
          const shape = new Path2D(),
            shine = new Path2D(),
            bubbles = [];
          const banks = [[], []];
          river.forEach((p, i) => {
            const before = river[Math.max(0, i - 1)],
              after = river[Math.min(river.length - 1, i + 1)];
            const dx = after.x - before.x,
              dy = after.y - before.y,
              len = Math.hypot(dx, dy) || 1,
              nx = -dy / len,
              ny = dx / len;
            banks[0].push({ x: p.x + nx * p.r, y: p.y + ny * p.r });
            banks[1].push({ x: p.x - nx * p.r, y: p.y - ny * p.r });
            const x = p.x + nx * p.r * 0.34 * Math.sin(i * 0.7),
              y = p.y + ny * p.r * 0.34 * Math.sin(i * 0.7);
            if (i === 0) shine.moveTo(x, y);
            else shine.lineTo(x, y);
            if (i % 2 === 0)
              bubbles.push({ x, y, r: p.r * (0.025 + (i % 5) * 0.008) });
          });
          const polygon = [...banks[0], ...banks[1].reverse()];
          shape.moveTo(polygon[0].x, polygon[0].y);
          for (const p of polygon.slice(1)) shape.lineTo(p.x, p.y);
          shape.closePath();
          return { shape, shine, bubbles };
        }),
      };
      survivalDecor.set(game, decor);
    }
    for (const { shape, shine, bubbles } of decor.rivers) {
      context.strokeStyle = "#80552c";
      context.lineWidth = 48;
      context.stroke(shape);
      context.fillStyle = "#f5ca64";
      context.fill(shape);
      context.strokeStyle = "#ffedaf88";
      context.lineWidth = 42;
      context.stroke(shine);
      context.fillStyle = "#fff2b9";
      for (const p of bubbles) {
        context.beginPath();
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.restore();
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
    for (const o of [...game.obstacles, ...decor.scenery]) {
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
        sx = [0, 0.36, 0.638, 1].map((n) => n * image.naturalWidth),
        sy = [0, 0.287, 0.638, 1].map((n) => n * image.naturalHeight);
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
