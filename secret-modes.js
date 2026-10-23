export const SECRET_MAPS = new Set([
  "platform",
  "cannibal",
  "icecream",
  "survival",
]);
export const SECRET_GAME_MODES = {
  survival: { name: "Hunger Games", count: 24, onlyMap: "survival" },
  platform: { name: "La Plateforme", count: 2, onlyMap: "platform" },
  cannibal: { name: "Le Festin Cannibale", count: 16, onlyMap: "cannibal" },
  icecream: { name: "Le Marchand de Glaces", count: 16, onlyMap: "icecream" },
};
export function physicalMass(mass, mode) {
  return mode === "platform" ? 6 * (Math.max(8, mass) / 60) ** 0.5 : mass / 10;
}
export function propulsionFactor(mass, mode) {
  if (mode !== "platform")
    return Math.max(0.38, Math.min(1.2, Math.sqrt(60 / mass)));
  const points = [
    [60, 1],
    [500, 0.9],
    [1000, 0.85],
    [2000, 0.8],
    [5000, 0.72],
  ];
  for (let i = 1; i < points.length; i++)
    if (mass <= points[i][0]) {
      const [lo, a] = points[i - 1],
        [hi, b] = points[i];
      return a + (b - a) * Math.max(0, (mass - lo) / (hi - lo));
    }
  return 0.72;
}
export function shaft(game) {
  const extra = Math.max(0, game.round - 16) * Math.min(game.w, game.h) * 0.016;
  return { x: game.w / 2, y: game.h / 2, half: game.w * 0.17 + extra };
}
export function overShaft(game, person) {
  const s = shaft(game),
    p = person.body.position;
  return Math.abs(p.x - s.x) < s.half && Math.abs(p.y - s.y) < s.half;
}
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export class SecretRules {
  constructor(g, api, options = {}) {
    this.g = g;
    this.api = api;
    this.clock = 0;
    this.turn = 1;
    this.duel = 1;
    this.foodCounts = [0, 0];
    this.pushes = new Map();
    this.departing = null;
    this.fallAnimations = [];
    this.headless = !!options.headless;
    this.simulation = !!options.simulation;
    if (g.mode === "platform") {
      this.resetDuel(
        [
          { id: 0, name: "TOI", mass: 60 },
          { id: 1, name: g.people[1].name, mass: 60 },
        ],
        1,
      );
      if (!this.headless) {
        g.secretRules = this;
        this.tournament = new Tournament(g, api, options);
      }
    } else this.makePrey();
  }
  resetDuel(entrants, stage) {
    const g = this.g,
      { Body, World } = this.api;
    this.entrants = entrants;
    this.duel = stage;
    this.foodCounts = [0, 0];
    this.departing = null;
    this.departureDone = false;
    this.fallSettledAt = 0;
    this.pushes.clear();
    this.lastResult = null;
    this.level = 1 + Math.floor(g.random() * 199);
    this.arrival = 700;
    this.fallAnimations = [];
    g.round = 1;
    g.elapsed = 0;
    g.phase = "aim";
    g.outcome = null;
    g.announcement = null;
    g.effects = [];
    g.zones = [];
    g.food = [];
    g.people.forEach((p, i) => {
      if (!p.alive) World.add(g.engine.world, p.body);
      p.alive = true;
      p.name = entrants[i].name;
      p.entrant = entrants[i].id;
      p.capturedChildren = 0;
      p.duelWallRound = 0;
      p.wentOnPlatform = false;
      g.resize(p, entrants[i].mass);
      Body.setMass(p.body, physicalMass(p.mass, "platform"));
      Body.setPosition(p.body, {
        x: g.w * (i === 0 ? 0.2 : 0.8),
        y: g.h * (0.43 + g.random() * 0.14),
      });
      Body.setVelocity(p.body, { x: 0, y: 0 });
    });
    const s = shaft(g);
    for (let i = 0; i < 30; i++) {
      let point;
      for (let trial = 0; trial < 200; trial++) {
        point = {
          x: s.x + (g.random() * 2 - 1) * (s.half - 32),
          y: s.y + (g.random() * 2 - 1) * (s.half - 32),
        };
        if (!g.food.some((f) => distance(f, point) < 40)) break;
      }
      g.food.push({
        ...point,
        type: "burger",
        size: i % 6 === 0 ? "chef" : "xl",
      });
    }
    g.foodTarget = 0;
    g.foodCap = 30;
  }
  makePrey() {
    const g = this.g;
    g.food = [];
    g.foodTarget = g.mode === "icecream" ? 42 : 36;
    g.foodCap = g.foodTarget + 10;
    for (let i = 0; i < g.foodTarget; i++)
      g.addFood(g.mode === "icecream" ? "child" : "victim", "normal");
  }
  tick(ms) {
    this.clock += ms;
    this.arrival = Math.max(0, (this.arrival || 0) - ms);
    this.fallAnimations = this.fallAnimations.filter(
      (f) => this.clock - f.at < 1000,
    );
    if (this.tournament) this.tournament.tick(ms);
    if (this.g.phase === "fall" && this.clock >= this.fallSettledAt) {
      this.g.phase = "moving";
      this.g.elapsed = 12001;
    }
    if (this.departing) {
      this.departing.elapsed += ms;
      if (this.departing.elapsed >= 1100) {
        this.departing = null;
        this.g.phase = "moving";
        this.g.elapsed = 12001;
      }
    }
  }
  onFood(person, food) {
    if (this.g.mode === "platform") {
      this.foodCounts[person.id]++;
      return;
    }
    if (this.g.mode === "icecream")
      person.capturedChildren = (person.capturedChildren || 0) + 1;
    food.fleeing = !!food.fleeing;
  }
  beginRound() {
    if (this.g.mode === "platform" && this.g.round === 3)
      for (const p of this.g.people) p.wentOnPlatform = overShaft(this.g, p);
  }
  launch() {
    if (this.g.mode === "platform") return;
    for (const food of this.g.food) {
      const nearest = this.g.people
        .filter((p) => p.alive)
        .sort(
          (a, b) =>
            distance(a.body.position, food) - distance(b.body.position, food),
        )[0];
      const away = {
        x: food.x - nearest.body.position.x,
        y: food.y - nearest.body.position.y,
      };
      const d = Math.hypot(away.x, away.y) || 1;
      const flee = d < 270;
      food.fleeing = flee;
      food.motionLeft = 650;
      const a = flee
        ? Math.atan2(away.y, away.x)
        : this.g.random() * Math.PI * 2;
      food.vx = Math.cos(a) * (flee ? 0.09 : 0.035);
      food.vy = Math.sin(a) * (flee ? 0.09 : 0.035);
      if (this.g.random() < 0.12) {
        food.fallUntil = this.clock + 700;
        food.lastFallAt = this.g.mechanics.clock;
        food.vx *= 0.2;
        food.vy *= 0.2;
      }
    }
  }
  substep(ms) {
    const g = this.g;
    if (g.mode === "platform") {
      if (g.round <= 3) {
        for (const p of g.people)
          if (p.alive && overShaft(g, p)) p.wentOnPlatform = true;
        return;
      }
      for (const p of g.people)
        if (p.alive && overShaft(g, p)) this.fall(p, false);
      return;
    }
    for (const food of g.food) {
      if (!(food.motionLeft > 0)) continue;
      const dt = Math.min(ms, food.motionLeft);
      food.motionLeft -= dt;
      const next = {
        x: food.x + (food.vx || 0) * dt,
        y: food.y + (food.vy || 0) * dt,
      };
      if (!g.obstacles.some((o) => this.api.intersects(next, 15, o))) {
        food.x = next.x;
        food.y = next.y;
      } else {
        food.vx = -(food.vx || 0) * 0.35;
        food.vy = -(food.vy || 0) * 0.35;
      }
    }
  }
  collision(pair) {
    const { bodyA: a, bodyB: b } = pair,
      p = a.person,
      q = b.person;
    if (p && q) {
      const dx = b.position.x - a.position.x,
        dy = b.position.y - a.position.y,
        d = Math.hypot(dx, dy) || 1;
      const va = this.api.Body.getVelocity(a),
        vb = this.api.Body.getVelocity(b);
      if ((va.x * dx + va.y * dy) / d > 0.6)
        this.pushes.set(q.id, {
          by: p.id,
          round: this.g.round,
          bank: p.duelWallRound === this.g.round,
        });
      if (-(vb.x * dx + vb.y * dy) / d > 0.6)
        this.pushes.set(p.id, {
          by: q.id,
          round: this.g.round,
          bank: q.duelWallRound === this.g.round,
        });
    } else {
      const person = p || q,
        wall = p ? b : a;
      if (person && wall.isStatic) {
        person.duelWallRound = this.g.round;
        this.g.emit("wall", person);
      }
    }
  }
  fall(p, departure) {
    const g = this.g,
      position = { ...p.body.position },
      pusher = this.pushes.get(p.id);
    this.fallAnimations.push({ person: { ...p }, position, at: this.clock });
    p.alive = false;
    p.deathReason = "shaft";
    this.api.World.remove(g.engine.world, p.body);
    p.fallData = { departure, pusher, at: g.mechanics.clock, mass: p.mass };
    g.effects.push({
      ...position,
      text: "DANS LE VIDE !",
      life: 1,
      color: "#d9b989",
    });
    g.emit("platformFall", p, { combatTurn: departure ? 0 : g.round - 3 });
  }
  finishReady() {
    const g = this.g;
    if (g.mode !== "platform") return true;
    if (g.round === 3 && !this.departureDone) {
      this.departureDone = true;
      for (const p of g.people) {
        if (p.alive && overShaft(g, p)) this.fall(p, true);
        else if (p.alive && p.wentOnPlatform)
          g.emit("platformExit", p, { turn: 3 });
      }
      g.food = [];
      this.departing = { elapsed: 0 };
      g.phase = "lift";
      return false;
    }
    return !this.departing;
  }
  onEnd() {
    if (this.g.mode !== "platform") return false;
    if (
      !this.fallSettledAt &&
      this.fallAnimations.some((f) => this.clock - f.at < 800)
    ) {
      this.fallSettledAt = this.clock + 800;
      this.g.phase = "fall";
      return true;
    }
    const g = this.g,
      alive = g.people.filter((p) => p.alive);
    if (!alive.length) {
      const fallen = [...g.people].sort(
        (a, b) => (b.fallData?.at || 0) - (a.fallData?.at || 0),
      );
      if (fallen[0].fallData?.at !== fallen[1].fallData?.at) {
        const winner = fallen[0];
        winner.alive = true;
        this.api.World.add(g.engine.world, winner.body);
        g.outcome = winner.id === 0 ? "win" : "loss";
      } else {
        this.departureDone = false;
        this.resetDuel(
          this.entrants.map((e, i) => ({ ...e, mass: g.people[i].mass })),
          this.duel,
        );
        g.effects.push({
          x: g.w / 2,
          y: g.h * 0.2,
          text: "DOUBLE CHUTE · DUEL REJOUÉ",
          life: 3,
          color: "#e7bd78",
        });
        return true;
      }
    }
    if (!this.lastResult) {
      const winner = g.people.find((p) => p.alive),
        loser = g.people.find((p) => !p.alive);
      this.lastResult = {
        winner: { ...this.entrants[winner.id], mass: winner.mass },
        loser: loser.entrant,
        stage: this.duel,
        rounds: g.round,
      };
      g.emit("platformDuel", g.people[0], {
        won: winner.id === 0,
        playerFood: this.foodCounts[0],
        opponentFood: this.foodCounts[1],
        playerMass: g.people[0].mass,
        opponentMass: g.people[1].mass,
        pushedByPlayer:
          loser.fallData?.pusher?.by === 0 &&
          loser.fallData?.pusher?.round === g.round,
        departure: loser.fallData?.departure,
        bank: loser.fallData?.pusher?.bank,
      });
    }
    if (this.tournament) return this.tournament.endDuel();
    return false;
  }
  plan(person) {
    const g = this.g,
      pos = person.body.position,
      opponent = g.people.find((p) => p !== person && p.alive);
    if (!opponent) return { x: 0, y: 0 };
    const s = shaft(g),
      r = person.body.circleRadius;
    let targets = [];
    if (g.round <= 2)
      targets = [...g.food]
        .sort((a, b) => distance(a, pos) - distance(b, pos))
        .slice(0, 5);
    else if (g.round === 3) {
      const dx = pos.x - s.x,
        dy = pos.y - s.y;
      if (overShaft(g, person))
        targets = [
          Math.abs(dx) > Math.abs(dy)
            ? { x: s.x + Math.sign(dx || 1) * (s.half + r + 65), y: pos.y }
            : { x: pos.x, y: s.y + Math.sign(dy || 1) * (s.half + r + 65) },
        ];
      else return { x: 0, y: 0 };
    } else {
      const q = opponent.body.position,
        dx = q.x - s.x,
        dy = q.y - s.y,
        d = Math.hypot(dx, dy) || 1;
      const behind = {
        x: q.x + (dx / d) * (opponent.body.circleRadius + r + 25),
        y: q.y + (dy / d) * (opponent.body.circleRadius + r + 25),
      };
      targets = distance(pos, behind) < r * 3 ? [q, behind] : [behind, q];
    }
    let best = { x: 0, y: 0, score: -Infinity };
    for (const target of targets) {
      const base = Math.atan2(target.y - pos.y, target.x - pos.x);
      for (const offset of [0, -0.35, 0.35, -0.8, 0.8])
        for (const speed of [5, 10, 17]) {
          const a = base + offset,
            weight = propulsionFactor(person.mass, "platform"),
            vx = Math.cos(a) * speed * weight,
            vy = Math.sin(a) * speed * weight;
          let x = pos.x,
            y = pos.y,
            fx = vx,
            fy = vy,
            risk = false,
            foods = 0,
            hit = false;
          for (let k = 0; k < 100; k++) {
            x += fx;
            y += fy;
            fx *= 0.976;
            fy *= 0.976;
            if (x < g.w * 0.08 + r || x > g.w * 0.92 - r) {
              fx = -fx * 0.83;
              x = clamp(x, g.w * 0.08 + r, g.w * 0.92 - r);
            }
            if (y < g.h * 0.08 + r || y > g.h * 0.92 - r) {
              fy = -fy * 0.83;
              y = clamp(y, g.h * 0.08 + r, g.h * 0.92 - r);
            }
            if (
              g.round > 3 &&
              Math.abs(x - s.x) < s.half &&
              Math.abs(y - s.y) < s.half
            )
              risk = true;
            if (
              Math.hypot(
                x - opponent.body.position.x,
                y - opponent.body.position.y,
              ) <
              r + opponent.body.circleRadius + 10
            )
              hit = true;
          }
          if (g.round <= 2)
            foods = g.food.filter(
              (f) => segmentDistance(f, pos, { x, y }) < r + 20,
            ).length;
          const on =
            Math.abs(x - s.x) < s.half + r * 0.3 &&
            Math.abs(y - s.y) < s.half + r * 0.3;
          let score =
            -distance({ x, y }, target) +
            (g.round <= 2 ? foods * 120 : 0) -
            (risk ? 1e6 : 0) -
            (g.round === 3 && on ? 1e6 : 0);
          if (g.round > 3 && hit) {
            const q = opponent.body.position,
              dot =
                ((s.x - q.x) * vx + (s.y - q.y) * vy) /
                (Math.hypot(s.x - q.x, s.y - q.y) || 1);
            score += dot * 70 + 200;
          }
          if (score > best.score)
            best = { x: Math.cos(a) * speed, y: Math.sin(a) * speed, score };
        }
    }
    return { x: best.x, y: best.y };
  }
}
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function segmentDistance(p, a, b) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    t = clamp(
      ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1),
      0,
      1,
    );
  return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t);
}
class Tournament {
  constructor(g, api, options) {
    this.g = g;
    this.api = api;
    this.simulation = !!options.simulation;
    this.stage = 1;
    this.results = [];
    this.playerTurns = 0;
    this.matches = [g];
    this.backgroundCursor = 0;
    for (let i = 1; i < 8; i++)
      this.matches.push(
        api.makeGame({
          mode: "platform",
          mapId: "platform",
          count: 2,
          headless: true,
        }),
      );
    const entrants = Array.from({ length: 16 }, (_, i) => ({
      id: i,
      name:
        i === 0
          ? "TOI"
          : ["La Dalle", "Croq-Mort", "Sauce Sam", "Patate", "Churros"][i % 5] +
            " " +
            i,
      mass: 60,
    }));
    this.matches.forEach((match, i) =>
      match.secretRules.resetDuel(entrants.slice(i * 2, i * 2 + 2), 1),
    );
  }
  tick(ms) {
    // One offscreen world during play; a short budget between rounds.
    // Catch up between duels with the existing four physics substeps (at most 8.34 ms each).
    const budget =
        this.g.phase === "bracket" ? 7 : this.g.phase === "aim" ? 2 : 1,
      started = performance.now();
    for (let i = 0; i < Math.min(budget, this.matches.length - 1); i++) {
      if (i > 0 && performance.now() - started > 2) break;
      this.backgroundCursor =
        1 + (this.backgroundCursor % (this.matches.length - 1));
      const match = this.matches[this.backgroundCursor];
      if (match.phase === "ended" || match.secretRules.lastResult) continue;
      if (match.phase === "aim" && match.secretRules.arrival === 0)
        match.launch(match.secretRules.plan(match.people[0]));
      match.step(Math.min(ms * 2, 1000 / 30));
    }
    if (
      this.g.phase === "bracket" &&
      this.matches.every((m) => m.secretRules.lastResult)
    )
      this.advance();
  }
  endDuel() {
    const g = this.g;
    this.playerTurns += g.round;
    if (g.outcome === "loss" && !this.simulation) return false;
    if (this.stage === 4) return false;
    g.phase = "bracket";
    return true;
  }
  advance() {
    const winners = this.matches.map((m) => m.secretRules.lastResult.winner);
    this.results.push(...this.matches.map((m) => m.secretRules.lastResult));
    this.stage++;
    const next = [this.g];
    for (let i = 1; i < winners.length / 2; i++) next.push(this.matches[i]);
    for (const old of this.matches) if (!next.includes(old)) old.destroy();
    this.matches = next;
    next.forEach((m, i) => {
      m.secretRules.departureDone = false;
      m.secretRules.resetDuel(winners.slice(i * 2, i * 2 + 2), this.stage);
    });
  }
  destroy() {
    for (const m of this.matches) if (m !== this.g) m.destroy();
  }
}
const images = new Map();
function asset(id) {
  if (!images.has(id)) {
    const im = new Image();
    im.src = new URL(`./assets/secrets/${id}.webp`, import.meta.url).href;
    images.set(id, im);
  }
  const im = images.get(id);
  return im.complete && im.naturalWidth ? im : null;
}
export function secretSprite(ctx, id, x, y, w, h, angle = 0) {
  const im = asset(id);
  if (!im) return false;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (!im.spriteBounds) {
    const canvas = document.createElement("canvas");
    canvas.width = im.naturalWidth;
    canvas.height = im.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(im, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width,
      top = canvas.height,
      right = 0,
      bottom = 0;
    for (let yy = 0; yy < canvas.height; yy++)
      for (let xx = 0; xx < canvas.width; xx++)
        if (pixels[(yy * canvas.width + xx) * 4 + 3] > 32) {
          left = Math.min(left, xx);
          top = Math.min(top, yy);
          right = Math.max(right, xx);
          bottom = Math.max(bottom, yy);
        }
    im.spriteBounds = {
      x: left,
      y: top,
      w: Math.max(1, right - left + 1),
      h: Math.max(1, bottom - top + 1),
    };
  }
  const b = im.spriteBounds;
  ctx.drawImage(im, b.x, b.y, b.w, b.h, -w / 2, -h / 2, w, h);
  ctx.restore();
  return true;
}
export function drawSecretFloor(ctx, g, time) {
  const r = g.secretRules;
  if (!r || g.mode !== "platform") return;
  const s = shaft(g),
    scale = r.departing
      ? Math.max(0.05, 1 - r.departing.elapsed / 1100)
      : r.arrival
        ? 1 - r.arrival / 700
        : 1;
  if (g.round <= 3 || r.departing) {
    ctx.save();
    ctx.globalAlpha = r.departing ? scale : 1;
    const lift = asset("lift-food");
    if (lift)
      ctx.drawImage(
        lift,
        s.x - s.half * scale,
        s.y - s.half * scale,
        s.half * 2 * scale,
        s.half * 2 * scale,
      );
    ctx.restore();
  }
  const stage = ["HUITIÈMES", "QUARTS", "DEMI-FINALE", "FINALE"][r.duel - 1];
  ctx.save();
  ctx.font = "bold 22px Georgia";
  ctx.textAlign = "center";
  ctx.fillStyle = "#f0d2aa";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 8;
  const message =
    g.phase === "bracket"
      ? "AUTRES DUELS EN COURS…"
      : g.round <= 3
        ? `FESTIN · TOUR ${g.round}/3${g.round === 3 ? " · QUITTE LA PLATEFORME !" : ""}`
        : `DUEL · TOUR ${g.round - 3}${g.round > 16 ? " · LE VIDE S’AGRANDIT" : ""}`;
  ctx.fillText(`${stage} · ÉTAGE ${r.level}`, g.w / 2, g.h * 0.13);
  ctx.fillStyle = g.round === 3 ? "#ffac75" : "#f0d2aa";
  ctx.fillText(message, g.w / 2, g.h * 0.17);
  ctx.restore();
}
export function drawSecretPerson(ctx, g, p, time) {
  if (g.mode !== "icecream") return false;
  const radius = p.body.circleRadius,
    angle = (p.heading ?? Math.PI / 2) + Math.PI / 2,
    pop = p.pop || 0;
  const squash =
    1 +
    Math.sin(time * 0.02 + p.id) * Math.min(0.05, p.body.speed * 0.007) +
    pop * 0.08;
  secretSprite(
    ctx,
    "icecream-truck-top",
    p.body.position.x,
    p.body.position.y,
    radius * 2.2 * squash,
    (radius * 2.9) / squash,
    angle,
  );
  return true;
}
export function drawSecretFood(ctx, g, food, time) {
  if (!["victim", "child"].includes(food.type)) return false;
  const remaining = (food.fallUntil || 0) - g.secretRules.clock;
  const running = (food.motionLeft || 0) > 0;
  const frame =
    remaining > 520
      ? 3
      : remaining > 200
        ? 4
        : remaining > 0
          ? 5
          : running
            ? Math.floor(g.secretRules.clock / 100) % 2
            : 2;
  const sheet = asset(food.type === "child" ? "child-sheet" : "adult-sheet");
  if (!sheet) return true;
  const cellW = sheet.naturalWidth / 3,
    cellH = sheet.naturalHeight / 2;
  const phase = g.secretRules.clock * 0.025 + food.x;
  const scale = food.type === "child" ? 1 : 1.1;
  ctx.save();
  ctx.translate(
    food.x,
    food.y + (running && remaining <= 0 ? Math.sin(phase) * 1.5 : 0),
  );
  // Mirrored alternating strides supplement the illustrated articulated poses.
  if (running && frame === 1) ctx.scale(-1, 1);
  ctx.drawImage(
    sheet,
    (frame % 3) * cellW,
    Math.floor(frame / 3) * cellH,
    cellW,
    cellH,
    -27 * scale,
    -30 * scale,
    54 * scale,
    60 * scale,
  );
  ctx.restore();
  return true;
}
export function drawSecretFalls(ctx, g, time, drawPerson) {
  const rules = g.secretRules;
  if (!rules) return;
  for (const f of rules.fallAnimations) {
    const t = (rules.clock - f.at) / 1000;
    ctx.save();
    ctx.translate(f.position.x, f.position.y);
    ctx.scale(1 - t, 1 - t);
    ctx.translate(-f.position.x, -f.position.y);
    ctx.globalAlpha = 1 - t;
    drawPerson(ctx, f.person, time);
    ctx.restore();
  }
}
