// Physics-only rules. All impulses run inside Matter substeps, never by moving a gourmand directly.
import { hungerZone, insideHungerZone } from "./hunger-games.js?v=secrets-14";
export const GLOBAL_SPECIAL_CHANCE = 0.01;
export const GLOBAL_SPECIALS = ["armored", "inferno"];
export function rollGlobalSpecial(random) {
  return random() < GLOBAL_SPECIAL_CHANCE
    ? GLOBAL_SPECIALS[Math.floor(random() * 2)]
    : null;
}
export function pointSegmentDistance(p, a, b) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    length = dx * dx + dy * dy;
  const t = length
    ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length))
    : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
export function segmentsDistance(a, b, c, d) {
  const cross = (p, q, r) =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  if (
    cross(a, b, c) * cross(a, b, d) < 0 &&
    cross(c, d, a) * cross(c, d, b) < 0
  )
    return 0;
  return Math.min(
    pointSegmentDistance(a, c, d),
    pointSegmentDistance(b, c, d),
    pointSegmentDistance(c, a, b),
    pointSegmentDistance(d, a, b),
  );
}
const length = (v) => Math.hypot(v.x, v.y);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export class ArenaMechanics {
  constructor(game, api) {
    this.game = game;
    this.api = api;
    this.actors = [];
    this.items = [];
    this.trails = [];
    this.clock = 0;
    this.pulses = [];
    this.bumperImpulses = [];
    this.dynamicMap =
      game.mode === "platform" ||
      ["market", "nightmarket", "fair", "royal", "beach"].includes(game.mapId);
    if (["market", "nightmarket"].includes(game.mapId)) {
      const guard = game.mapId === "nightmarket";
      for (let i = 0; i < (guard ? 2 : 3); i++) {
        const spot = this.freePoint(guard ? 36 : 40);
        if (!spot) continue;
        const body = guard
          ? api.Bodies.circle(spot.x, spot.y, 20, {
              frictionAir: 0.035,
              restitution: 0.45,
              label: "security",
            })
          : api.Bodies.rectangle(spot.x, spot.y, 30, 40, {
              chamfer: { radius: 7 },
              frictionAir: 0.012,
              friction: 0.015,
              restitution: 0.55,
              label: "cart",
            });
        api.Body.setMass(body, guard ? 9 : 3.5);
        const actor = {
          kind: guard ? "security" : "cart",
          body,
          heading: i * Math.PI * 0.7,
          runawayUntil: 0,
          reactUntil: 0,
          client: { x: spot.x, y: spot.y + 40 },
          plan: { x: 0, y: 0 },
        };
        body.arenaActor = actor;
        this.actors.push(actor);
        api.World.add(game.engine.world, body);
      }
    }
    this.beginRound();
  }
  freePoint(radius = 22) {
    const g = this.game;
    for (let i = 0; i < 160; i++) {
      const p = {
        x: radius + 25 + g.random() * (g.w - 2 * radius - 50),
        y: radius + 25 + g.random() * (g.h - 2 * radius - 50),
      };
      if (g.mapId === "royal" && p.y < g.h * 0.23) continue;
      if (
        g.mapId === "hunger" &&
        !insideHungerZone(p, radius + 8, hungerZone(g.w, g.h, g.round))
      )
        continue;
      if (
        !g.obstacles.some((o) => this.api.intersects(p, radius + 8, o)) &&
        !g.people.some(
          (o) =>
            o.alive &&
            distance(p, o.body.position) < radius + o.body.circleRadius + 35,
        ) &&
        !this.actors.some((o) => distance(p, o.body.position) < radius + 45) &&
        !this.items.some((o) => distance(p, o) < 55)
      )
        return p;
    }
    return null;
  }
  spawnItem(kind) {
    const p = this.freePoint();
    if (!p) return false;
    this.items.push({ ...p, kind, born: this.game.round });
    return true;
  }
  beginRound() {
    const g = this.game;
    this.environment = null;
    this.environmentDone = false;
    this.waveHit = new Set();
    this.trails = [];
    for (const p of g.people) {
      p.lightBoost = p.lampUntil >= g.round ? 1.8 : 1;
      if (p.securityUntil < g.round) p.securityUntil = 0;
    }
    g.secretRules?.beginRound();
    if (g.mode === "platform") return;
    // Exactly one global roll per round. Douggy's independent food roll is untouched.
    if (this.lastGlobalRollRound !== g.round) {
      this.lastGlobalRollRound = g.round;
      const special = rollGlobalSpecial(g.random);
      if (special) this.spawnItem(special);
    }
    if (g.mapId === "nightmarket") {
      this.items = this.items.filter(
        (item) =>
          !["lamp", "securityShield"].includes(item.kind) ||
          g.round - item.born < 4,
      );
      for (const kind of ["lamp", "securityShield"])
        if (
          !this.items.some((item) => item.kind === kind) &&
          (g.round === 1 || g.round % 2 === 1)
        )
          this.spawnItem(kind);
      this.planGuards();
    }
  }
  // Grid BFS routes agents around shelves; all following movement still uses physical velocity.
  waypoint(from, target, radius = 26) {
    const g = this.game,
      cell = 46,
      cols = Math.ceil(g.w / cell),
      rows = Math.ceil(g.h / cell);
    const index = (p) =>
      Math.max(0, Math.min(rows - 1, Math.floor(p.y / cell))) * cols +
      Math.max(0, Math.min(cols - 1, Math.floor(p.x / cell)));
    const start = index(from),
      goal = index(target),
      queue = [start],
      prev = new Map([[start, -1]]);
    const point = (n) => ({
      x: Math.min(g.w - radius, ((n % cols) + 0.5) * cell),
      y: Math.min(g.h - radius, (Math.floor(n / cols) + 0.5) * cell),
    });
    let best = start;
    for (let q = 0; q < queue.length; q++) {
      const n = queue[q];
      if (distance(point(n), target) < distance(point(best), target)) best = n;
      if (n === goal) {
        best = n;
        break;
      }
      const x = n % cols,
        y = Math.floor(n / cols);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx,
          ny = y + dy,
          next = ny * cols + nx;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || prev.has(next))
          continue;
        const p = point(next);
        if (
          p.x < radius ||
          p.y < radius ||
          g.obstacles.some((o) => this.api.intersects(p, radius, o))
        )
          continue;
        prev.set(next, n);
        queue.push(next);
      }
    }
    if (best === start) return target;
    while (prev.get(best) !== start && prev.get(best) !== -1)
      best = prev.get(best);
    return point(best);
  }
  planGuards() {
    const alive = this.game.people.filter((p) => p.alive);
    for (const actor of this.actors) {
      const target = alive.reduce(
        (best, p) =>
          !best ||
          distance(p.body.position, actor.body.position) <
            distance(best.body.position, actor.body.position)
            ? p
            : best,
        null,
      );
      if (!target) continue;
      const predicted = {
        x: target.body.position.x + (target.lastMove?.x || 0) * 0.15,
        y: target.body.position.y + (target.lastMove?.y || 0) * 0.15,
      };
      const p = this.waypoint(actor.body.position, predicted),
        d = distance(p, actor.body.position) || 1;
      actor.plan = {
        x: ((p.x - actor.body.position.x) / d) * 3.2,
        y: ((p.y - actor.body.position.y) / d) * 3.2,
      };
    }
  }
  launch() {
    this.game.secretRules?.launch();
    this.environment = null;
    this.environmentDone = false;
    this.waveHit.clear();
    for (const p of this.game.people) {
      p.fireActive = !!p.infernoReady;
      p.infernoReady = false;
      p.fireDistance = 0;
    }
    for (const actor of this.actors)
      if (actor.kind === "security")
        this.api.Body.setVelocity(actor.body, actor.plan);
    if (this.game.mapId === "beach" && this.game.round % 3 === 0)
      this.environment = {
        kind: "wave",
        elapsed: 0,
        duration: Math.min(6000, Math.max(2600, this.game.h * 4)),
      };
  }
  kill(person, reason) {
    if (!person.alive) return;
    person.alive = false;
    person.deathReason = reason;
    this.api.World.remove(this.game.engine.world, person.body);
    this.pulse(person.body.position, reason === "fire" ? "burn" : "death");
    this.game.effects.push({
      ...person.body.position,
      text:
        reason === "fire"
          ? "GRILLÉ !"
          : reason === "security"
            ? "ATTRAPÉ !"
            : reason === "zone"
              ? "HORS ZONE !"
              : "AU MENU DU ROI !",
      life: 1.3,
      color: "#b94522",
    });
    this.game.emit(reason === "fire" ? "burn" : "hazard", person, { reason });
  }
  pulse(p, kind) {
    this.pulses.push({ ...p, kind, until: this.clock + 650 });
  }
  protect(victim, attacker) {
    if (!victim.armored) return false;
    victim.armored = false;
    this.pulse(victim.body.position, "shield");
    const dx = victim.body.position.x - attacker.body.position.x,
      dy = victim.body.position.y - attacker.body.position.y,
      d = Math.hypot(dx, dy) || 1;
    const speed = Math.max(2, Math.min(6, length(attacker.body.velocity)));
    this.api.Body.setVelocity(victim.body, {
      x: (dx / d) * speed,
      y: (dy / d) * speed,
    });
    this.game.effects.push({
      ...victim.body.position,
      text: "BLINDAGE BRISÉ !",
      life: 1,
      color: "#338998",
    });
    this.game.emit("shield", victim);
    return true;
  }
  collision(pair) {
    const g = this.game,
      a = pair.bodyA,
      b = pair.bodyB,
      p = a.person || b.person,
      actor = a.arenaActor || b.arenaActor;
    if (!p?.alive) return;
    if (actor?.kind === "cart") {
      actor.runawayUntil = this.clock + 1600;
      actor.reactUntil = this.clock + 1800;
      // Matter supplies the collision impulse and secondary impacts, with a light rolling cart mass.
      this.pulse(actor.body.position, "cart");
    }
    if (actor?.kind === "security") this.guardContact(p, actor);
    const bumper = g.obstacleBodies.indexOf(a.person ? b : a);
    if (g.mapId === "fair" && bumper >= 0 && g.obstacles[bumper].bumper) {
      const obstacle = g.obstacles[bumper],
        key = "bumper" + bumper;
      if ((p[key] || 0) > this.clock) return;
      p[key] = this.clock + 220;
      const dx = p.body.position.x - obstacle.x,
        dy = p.body.position.y - obstacle.y,
        d = Math.hypot(dx, dy) || 1;
      const speed = Math.min(
        48,
        Math.max(23, length(this.api.Body.getVelocity(p.body)) * 2.8),
      );
      this.bumperImpulses.push({
        person: p,
        velocity: { x: (dx / d) * speed, y: (dy / d) * speed },
      });
      obstacle.hitUntil = this.clock + 360;
      this.pulse(obstacle, "bumper");
    }
  }
  guardContact(person, agent) {
    if (!person.alive) return;
    if (person.securityUntil >= this.game.round) {
      if ((agent.lastShield || -1000) + 200 > this.clock) return;
      agent.lastShield = this.clock;
      agent.reactUntil = this.clock + 800;
      const dx = agent.body.position.x - person.body.position.x,
        dy = agent.body.position.y - person.body.position.y,
        d = Math.hypot(dx, dy) || 1;
      this.api.Body.setVelocity(agent.body, {
        x: (dx / d) * 6,
        y: (dy / d) * 6,
      });
      this.pulse(agent.body.position, "shield");
    } else this.kill(person, "security");
  }
  pickup(person, item) {
    const g = this.game;
    if (item.kind === "armored") person.armored = true;
    if (item.kind === "inferno") person.infernoReady = true;
    // Acquisition turn is free; full effects last through the next two / one complete shots.
    if (item.kind === "lamp") {
      person.lampUntil = g.round + 2;
      person.lightBoost = 1.8;
    }
    if (item.kind === "securityShield") person.securityUntil = g.round + 1;
    const names = {
      armored: "BURGER BLINDÉ",
      inferno: "PIMENT DE L’ENFER · PROCHAIN TIR",
      lamp: "LAMPE · 2 TOURS",
      securityShield: "ANTI-SÉCURITÉ · 1 TOUR",
    };
    g.effects.push({
      ...person.body.position,
      text: names[item.kind],
      life: 1.5,
      color: "#ba7520",
    });
    g.emit("power", person, item);
  }
  update(ms, physicsStep) {
    const g = this.game;
    // Four short steps on affected maps and whenever fire is present prevent thin hazards tunnelling.
    const steps =
        this.dynamicMap ||
        this.trails.length ||
        g.people.some((p) => p.fireActive)
          ? 4
          : 1,
      dt = ms / steps;
    for (let i = 0; i < steps; i++) {
      const previous = new Map(
        g.people
          .filter((p) => p.alive)
          .map((p) => [p.id, { ...p.body.position }]),
      );
      this.before(dt);
      physicsStep(dt);
      this.clock += dt;
      this.after(dt, previous);
      if (g.phase === "cinematic") break;
    }
  }
  before(ms) {
    const g = this.game,
      scale = ms / (1000 / 60);
    for (const actor of this.actors) {
      if (
        actor.kind === "cart" &&
        this.clock > actor.runawayUntil &&
        g.elapsed < 1800
      ) {
        const speed = length(actor.body.velocity);
        if (speed < 0.1) actor.heading += 0.025 * scale;
        this.api.Body.setVelocity(actor.body, {
          x: actor.body.velocity.x + Math.cos(actor.heading) * 0.045 * scale,
          y: actor.body.velocity.y + Math.sin(actor.heading) * 0.045 * scale,
        });
      }
      if (length(actor.body.velocity) > 18) {
        const s = 18 / length(actor.body.velocity);
        this.api.Body.setVelocity(actor.body, {
          x: actor.body.velocity.x * s,
          y: actor.body.velocity.y * s,
        });
      }
    }
    if (!this.environment) return;
    const env = this.environment;
    env.elapsed += ms;
    if (env.kind === "suction") {
      for (const p of g.people.filter((p) => p.alive))
        if (this.inCone(p.body.position)) {
          const mouth = this.mouth(),
            dx = mouth.x - p.body.position.x,
            dy = mouth.y - p.body.position.y,
            d = Math.hypot(dx, dy) || 1;
          const force =
            0.65 *
            Math.max(0.18, 1 - d / (g.h * 1.05)) *
            Math.max(0.25, Math.min(1.8, Math.sqrt(60 / p.mass))) *
            scale;
          this.api.Body.setVelocity(p.body, {
            x: p.body.velocity.x + (dx / d) * force,
            y: p.body.velocity.y + (dy / d) * force,
          });
        }
      for (const food of g.food)
        if (this.inCone(food)) {
          const mouth = this.mouth(),
            dx = mouth.x - food.x,
            dy = mouth.y - food.y,
            d = Math.hypot(dx, dy) || 1;
          const velocity = food.royalVelocity || { x: 0, y: 0 };
          const foodMass =
            food.size === "chef" ? 120 : food.size === "xl" ? 40 : 15;
          const force =
            0.35 *
            Math.max(0.2, 1 - d / g.h) *
            Math.sqrt(15 / foodMass) *
            scale;
          velocity.x = velocity.x * 0.995 + (dx / d) * force;
          velocity.y = velocity.y * 0.995 + (dy / d) * force;
          food.royalVelocity = velocity;
          food.x += velocity.x * scale;
          food.y += velocity.y * scale;
        }
      const mouth = this.mouth();
      g.food = g.food.filter((f) => distance(f, mouth) > mouth.r);
    }
    if (env.kind === "wave") {
      const front =
        g.h + 40 - (g.h + 100) * Math.min(1, env.elapsed / env.duration);
      for (const p of g.people.filter((p) => p.alive))
        if (Math.abs(p.body.position.y - front) < 60 + p.body.circleRadius) {
          const resistance = Math.max(
            0.45,
            Math.min(1, Math.sqrt(60 / p.mass)),
          );
          this.api.Body.setVelocity(p.body, {
            x: p.body.velocity.x * 0.99,
            y: Math.max(
              -Math.max(
                5.8,
                ((g.h + 100) / (env.duration / (1000 / 60))) * 1.15,
              ),
              p.body.velocity.y - 0.7 * resistance * scale,
            ),
          });
          this.waveHit.add(p.id);
        }
    }
  }
  after(ms, previous) {
    const g = this.game;
    g.secretRules?.substep(ms);
    for (const impulse of this.bumperImpulses)
      if (impulse.person.alive)
        this.api.Body.setVelocity(impulse.person.body, impulse.velocity);
    this.bumperImpulses = [];
    for (const actor of this.actors) {
      const v = actor.body.velocity;
      if (length(v) > 0.15) actor.heading = Math.atan2(v.y, v.x);
      if (actor.kind === "cart") {
        const desired = {
          x: actor.body.position.x - Math.cos(actor.heading) * 38,
          y: actor.body.position.y - Math.sin(actor.heading) * 38,
        };
        actor.client.x += (desired.x - actor.client.x) * Math.min(1, ms / 240);
        actor.client.y += (desired.y - actor.client.y) * Math.min(1, ms / 240);
      }
      if (actor.kind === "security")
        for (const p of g.people)
          if (
            p.alive &&
            distance(p.body.position, actor.body.position) <
              p.body.circleRadius + 20
          )
            this.guardContact(p, actor);
    }
    for (const p of g.people.filter((p) => p.alive)) {
      const from = previous.get(p.id) || p.body.position,
        to = p.body.position;
      for (let i = this.items.length - 1; i >= 0; i--)
        if (
          pointSegmentDistance(this.items[i], from, to) <
          p.body.circleRadius + 16
        ) {
          this.pickup(p, this.items[i]);
          this.items.splice(i, 1);
        }
      if (p.fireActive) {
        const delta = distance(from, to),
          start = p.fireDistance || 0;
        p.fireDistance = start + delta;
        if (delta > 0.15)
          this.trails.push({
            a: { ...from },
            b: { ...to },
            owner: p.id,
            endDistance: p.fireDistance,
            at: this.clock,
          });
      }
      for (const trail of this.trails) {
        // A body does not burn on the fresh trail under its feet. Returning across older fire does kill its owner.
        if (
          trail.owner === p.id &&
          (p.fireDistance || 0) - trail.endDistance <
            p.body.circleRadius * 2 + 12
        )
          continue;
        if (
          segmentsDistance(from, to, trail.a, trail.b) <
          p.body.circleRadius + 5
        ) {
          this.kill(p, "fire");
          break;
        }
      }
      if (
        p.alive &&
        g.mapId === "royal" &&
        distance(p.body.position, this.mouth()) <
          this.mouth().r + p.body.circleRadius * 0.4
      )
        this.kill(p, "king");
    }
    this.pulses = this.pulses.filter((p) => p.until > this.clock);
  }
  mouth() {
    return {
      x: this.game.w * 0.5,
      y: this.game.h * 0.14,
      r: Math.min(this.game.w, this.game.h) * 0.052,
    };
  }
  inCone(p) {
    const m = this.mouth(),
      dy = p.y - m.y;
    return (
      dy >= -m.r &&
      dy < this.game.h * 0.86 &&
      Math.abs(p.x - m.x) < m.r + Math.max(0, dy) * 0.65
    );
  }
  finishReady() {
    const g = this.game;
    if (g.secretRules && !g.secretRules.finishReady()) return false;
    if (
      g.mapId === "hunger" &&
      g.round >= 4 &&
      this.zoneResolvedRound !== g.round
    ) {
      this.zoneResolvedRound = g.round;
      const zone = hungerZone(g.w, g.h, g.round);
      for (const p of g.people)
        if (
          p.alive &&
          !insideHungerZone(p.body.position, p.body.circleRadius, zone)
        )
          this.kill(p, "zone");
      g.food = g.food.filter((food) => insideHungerZone(food, 15, zone));
    }
    if (g.mapId === "royal" && !this.environment && !this.environmentDone) {
      const kind = g.round % 2 ? "suction" : "burp";
      this.environment = {
        kind,
        elapsed: 0,
        duration: kind === "suction" ? 2400 : 1100,
      };
      g.emit(kind);
      return false;
    }
    if (
      this.environment &&
      this.environment.elapsed < this.environment.duration
    )
      return false;
    if (this.environment) {
      this.environmentDone = true;
      this.environment = null;
    }
    return true;
  }
  blocksTruce() {
    return (
      [
        "nightmarket",
        "royal",
        "hunger",
        "platform",
        "cannibal",
        "icecream",
      ].includes(this.game.mapId) ||
      this.game.people.some((p) => p.alive && (p.fireActive || p.infernoReady))
    );
  }
  finishRound() {
    for (const food of this.game.food) delete food.royalVelocity;
    for (const p of this.game.people) p.fireActive = false;
    this.trails = [];
    this.pulses = [];
    for (const actor of this.actors) {
      this.api.Body.setVelocity(actor.body, { x: 0, y: 0 });
      this.api.Body.setAngularVelocity(actor.body, 0);
    }
  }
}
