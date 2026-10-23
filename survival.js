import { survivalWaypoint } from "./survival-navigation.js?v=arena-17";
// Secret FILMOVORE survival mode. Its finite food supply never calls Game.addFood.
export function survivalStart(w, h, index, count) {
  const a = -Math.PI / 2 + (index * Math.PI * 2) / count,
    r = Math.min(w, h) * (2500 / 9000);
  return { x: w / 2 + Math.cos(a) * r, y: h / 2 + Math.sin(a) * r };
}
export function survivalObstacles(w, h) {
  const u = Math.min(w, h) / 9000,
    cx = w / 2,
    cy = h / 2;
  const block = (dx, dy, bw, bh, angle = 0, extra = {}) => ({
    x: cx + dx * u,
    y: cy + dy * u,
    w: bw * u,
    h: bh * u,
    angle,
    ...extra,
  });
  const objects = [
    block(0, 100, 500, 280, 0, {
      scenery: "cornucopia",
      artX: cx,
      artY: cy,
      artW: 760 * u,
      artH: 720 * u,
    }),
    block(-285, -65, 130, 570, -0.12, { sceneryPart: true }),
    block(285, -65, 130, 570, 0.12, { sceneryPart: true }),
    block(0, -255, 450, 75, 0, { sceneryPart: true }),
  ];
  for (let ring = 0; ring < 2; ring++)
    for (let i = 0; i < (ring ? 16 : 12); i++) {
      const a = (i * Math.PI * 2) / (ring ? 16 : 12) + ring * 0.14,
        r = (ring ? 4200 : 3150) + Math.sin(i * 2.3) * 110;
      objects.push(
        block(
          Math.cos(a) * r,
          Math.sin(a) * r,
          450 + Math.sin(i) * 70,
          350 + Math.cos(i * 1.7) * 50,
          a,
          { scenery: "forest-grove" },
        ),
      );
    }
  return objects;
}
export function survivalZone(g, round = g.round) {
  const step = Math.max(0, round - 5);
  return {
    x: g.w / 2,
    y: g.h / 2,
    r: Math.max(
      Math.min(990, Math.min(g.w, g.h) * 0.44),
      Math.min(g.w, g.h) * 0.44 * Math.pow(0.9, step),
    ),
  };
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export class SurvivalRules {
  constructor(g, api) {
    this.g = g;
    this.api = api;
    this.clock = 0;
    this.fallAnimations = [];
    this.drops = [];
    this.dropHistory = [];
    this.resolved = 0;
    g.food = [];
    g.foodTarget = 0;
    g.foodCap = 0;
    g.zones = [];
    const types = [
      "chef",
      "chef",
      "chef",
      "chef",
      "xl",
      "xl",
      "xl",
      "xl",
      "normal",
      "normal",
      "small",
      "small",
    ];
    const unit = Math.min(g.w, g.h) / 9000;
    // Three complete accessible food rings, outside the central sculpture.
    for (let ring = 0; ring < 3; ring++)
      for (let i = 0; i < 32; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI) / 16,
          r = (1900 + ring * 120) * unit;
        const point = {
          x: g.w / 2 + Math.cos(angle) * r,
          y: g.h / 2 + Math.sin(angle) * r,
        };
        if (!g.obstacles.some((o) => api.intersects(point, 26, o)))
          g.food.push({
            ...point,
            type: "burger",
            size: types[(i + ring * 4) % types.length],
          });
      }
    for (const p of g.people) p.survivalStyle = p.id % 3;
  }
  onEnd() {
    if (!this.g.people.some((p) => p.alive)) this.g.outcome = "draw";
    return false;
  }
  onFood() {}
  collision() {}
  substep() {}
  launch() {}
  beginRound() {
    const g = this.g;
    // At most one drop every fourth round, with a genuine empty interval and a warning.
    if (g.round >= 5 && g.round % 4 === 1 && g.random() < 0.78) {
      const z = survivalZone(g, g.round + 1);
      for (let i = 0; i < 120; i++) {
        const a = g.random() * Math.PI * 2,
          r = Math.sqrt(g.random()) * Math.max(0, z.r - 150);
        const p = { x: z.x + Math.cos(a) * r, y: z.y + Math.sin(a) * r };
        if (g.obstacles.some((o) => this.api.intersects(p, 75, o))) continue;
        this.drops.push({
          ...p,
          at: this.clock,
          round: g.round,
          landed: false,
        });
        this.dropHistory.push({ round: g.round, ...p });
        g.announcement = {
          kind: "supply",
          text: "PARACHUTAGE · REPÈRE LA FUMÉE DORÉE",
          round: g.round,
        };
        break;
      }
    }
  }
  tick(ms) {
    this.clock += ms;
    for (const drop of this.drops)
      if (!drop.landed && this.clock - drop.at >= 2600) {
        drop.landed = true;
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2,
            p = { x: drop.x + Math.cos(a) * 28, y: drop.y + Math.sin(a) * 28 };
          if (!this.g.obstacles.some((o) => this.api.intersects(p, 18, o)))
            this.g.food.push({
              ...p,
              type: "burger",
              size:
                i === 0 && this.g.random() < 0.12
                  ? "chef"
                  : i < 2
                    ? "xl"
                    : "normal",
            });
        }
      }
    this.drops = this.drops.filter(
      (d) => !d.landed || this.clock - d.at < 4500,
    );
  }
  finishReady() {
    const g = this.g;
    if (this.resolved === g.round) return true;
    this.resolved = g.round;
    if (g.round >= 6) {
      const z = survivalZone(g);
      for (const p of g.people)
        if (p.alive && dist(p.body.position, z) + p.body.circleRadius >= z.r)
          g.mechanics.kill(p, "zone");
      g.food = g.food.filter((f) => dist(f, z) + 18 < z.r);
    }
    return true;
  }
  plan(person) {
    const g = this.g,
      p = person.body.position,
      z = survivalZone(g, g.round + 1),
      radius = person.body.circleRadius;
    const seen = g.people.filter(
      (q) => q.alive && q !== person && dist(p, q.body.position) < 1000,
    );
    const threats = seen
      .filter((q) => q.mass > person.mass * 1.1)
      .sort((a, b) => dist(p, a.body.position) - dist(p, b.body.position));
    const prey = seen
      .filter((q) => person.mass > q.mass * 1.12)
      .sort((a, b) => dist(p, a.body.position) - dist(p, b.body.position));
    const food = g.food
      .filter(
        (f) =>
          dist(p, f) < (g.round <= 2 ? 1000 : 650) && dist(f, z) < z.r - 45,
      )
      .sort((a, b) => dist(p, a) - dist(p, b));
    let target;
    if (dist(p, z) + radius > z.r * 0.82) {
      target = { x: z.x, y: z.y + Math.min(z.r * 0.4, g.h * 0.08) };
      person.intent = "reposition";
    } else if (threats.length && dist(p, threats[0].body.position) < 330) {
      const q = threats[0].body.position;
      target = { x: p.x + (p.x - q.x) * 2, y: p.y + (p.y - q.y) * 2 };
      person.intent = "flee";
    } else if (prey.length && (g.round > 3 || person.survivalStyle === 2)) {
      target = prey[0].body.position;
      person.intent = "hunt";
    } else if (food.length && !(g.round === 1 && person.survivalStyle === 1)) {
      target = food[0];
      person.intent = "forage";
    } else if (this.drops.some((d) => !d.landed)) {
      target = this.drops.find((d) => !d.landed);
      person.intent = "supply";
    } else {
      // Finish crossing a search sector instead of changing destination every turn.
      const old = person.survivalSearch;
      if (!old || dist(p, old) < 130 || dist(old, z) > z.r * 0.84) {
        const a =
          Math.atan2(p.y - z.y, p.x - z.x) +
          Math.PI +
          ((person.id % 3) - 1) * 0.6;
        person.survivalSearch = {
          x: z.x + Math.cos(a) * z.r * 0.72,
          y: z.y + Math.sin(a) * z.r * 0.72,
        };
      }
      target = person.survivalSearch;
      person.intent = "search";
    }
    if (g.obstacles.some((o) => this.api.intersects(target, radius + 8, o)))
      target = { x: z.x, y: z.y + Math.min(z.r * 0.55, g.h * 0.1) };
    const waypoint = survivalWaypoint(g, p, target, radius + 8),
      base = Math.atan2(waypoint.y - p.y, waypoint.x - p.x);
    let best = { score: -Infinity, x: 0, y: 0 };
    const mobility = Math.max(0.38, Math.min(1.2, Math.sqrt(60 / person.mass)));
    for (const offset of [0, -0.3, 0.3, -0.7, 0.7, -1.2, 1.2, Math.PI])
      for (const speed of [6, 11, 17]) {
        const a = base + offset,
          v = { x: Math.cos(a) * speed, y: Math.sin(a) * speed };
        let q = { ...p },
          vx = v.x * mobility,
          vy = v.y * mobility,
          blocked = false;
        for (let t = 0; t < 115; t++) {
          const next = { x: q.x + vx, y: q.y + vy };
          if (
            g.obstacles.some((o) => this.api.intersects(next, radius + 2, o))
          ) {
            blocked = true;
            break;
          }
          q = next;
          vx *= 0.976;
          vy *= 0.976;
        }
        let score = -dist(q, target) - (blocked ? 100 : 0);
        if (dist(q, z) + radius > z.r * 0.95) score -= 5000;
        if (threats.length)
          score += Math.min(600, dist(q, threats[0].body.position)) * 0.7;
        if (score > best.score) best = { ...v, score };
      }
    return { x: best.x, y: best.y };
  }
}
export function drawSurvivalFloor(ctx, g, time) {
  if (g.mode !== "survival" || !g.secretRules) return;
  const zone = survivalZone(g),
    rules = g.secretRules;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, g.w, g.h);
  ctx.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2, true);
  ctx.fillStyle = "#411321a8";
  ctx.fill("evenodd");
  ctx.beginPath();
  ctx.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2);
  ctx.strokeStyle = g.round >= 6 ? "#ff694c" : "#edd295";
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.font = "bold 20px Georgia";
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff1c9";
  ctx.shadowColor = "#111";
  ctx.shadowBlur = 8;
  ctx.fillText(
    g.round < 6
      ? `LE FESTIN NE REVIENDRA PAS · FERMETURE AU TOUR 6`
      : "REJOINS LE CERCLE · CONTRÔLE EN FIN DE TOUR",
    zone.x,
    zone.y - zone.r + 40,
  );
  for (const d of rules.drops) {
    const t = Math.min(1, (rules.clock - d.at) / 2600),
      bob = Math.sin(time * 0.005) * 3;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.beginPath();
    ctx.arc(0, 0, 45 + Math.sin(time * 0.006) * 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffd179b0";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = "#1b180e55";
    ctx.beginPath();
    ctx.ellipse(0, 4, 28, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(0, -180 * (1 - t) + bob);
    if (!d.landed) {
      ctx.fillStyle = "#e9d9b0";
      ctx.beginPath();
      ctx.ellipse(0, -40, 43, 23, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ede0c5";
      ctx.lineWidth = 2;
      for (const x of [-40, 40]) {
        ctx.beginPath();
        ctx.moveTo(x, -40);
        ctx.lineTo(0, 0);
        ctx.stroke();
      }
    }
    ctx.fillStyle = "#9f683d";
    ctx.fillRect(-18, -16, 36, 32);
    ctx.strokeStyle = "#e4bf75";
    ctx.lineWidth = 5;
    ctx.strokeRect(-18, -16, 36, 32);
    ctx.restore();
  }
  ctx.restore();
}
