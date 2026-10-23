import { validMultiplayerMap } from "./multiplayer-maps.js?v=lobby-26";
import { arenaSize } from "./arena-bounds.js?v=filmovore-15";
import { normalizeCosmetics } from "./cosmetic-catalog.js?v=identity-22";
// Headless adapter. Only the server calls resolveTurn; clients render its snapshots.
import {
  zt as Game,
  eA as Body,
  XA as World,
  he as Engine,
  yA as Bodies,
} from "./simulation-core.js?v=multi-20";

export const SIMULATION_VERSION = "multi-20";
export function seededRandom(seed) {
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  random.getState = () => state;
  random.setState = (value) => {
    state = value >>> 0;
  };
  return random;
}
const clone = (value) => JSON.parse(JSON.stringify(value));
export function createSimulation(count, seed, humans, mapId = "cantine") {
  if (![8, 24, 50].includes(count)) throw new Error("Unsupported size");
  if (!validMultiplayerMap(mapId)) throw new Error("Unsupported map");
  const mode = count === 8 ? "classic" : count === 24 ? "gros" : "usa";
  const size = arenaSize(mode, mapId);
  const random = seededRandom(seed);
  const game = new Game(size.w, size.h, random, {
    mode,
    mapId,
    count,
  });
  game.spectate = true;
  // This is an online last-survivor match, including after seat zero dies.
  game.checkTruce = () => false;
  humans.forEach((member, index) => {
    const person = game.people[member.seat ?? index];
    person.name = member.name;
    person.human = true;
    person.memberId = member.id;
    person.cosmetics = normalizeCosmetics(member.cosmetics);
  });
  return game;
}
export function snapshot(game) {
  return {
    w: game.w,
    h: game.h,
    mode: game.mode,
    mapId: game.mapId,
    count: game.count,
    round: game.round,
    phase: game.phase,
    elapsed: game.elapsed,
    outcome: game.outcome || null,
    people: game.people.map((p) => {
      const { body, ...data } = p;
      return {
        ...data,
        x: body.position.x,
        y: body.position.y,
        vx: body.velocity.x,
        vy: body.velocity.y,
        angle: body.angle,
      };
    }),
    obstacles: game.obstacles,
    food: game.food,
    zones: game.zones,
    effects: game.effects,
    announcement: game.announcement,
    mechanics: {
      ...Object.fromEntries(
        Object.entries(game.mechanics).filter(
          ([key]) =>
            !["game", "api", "actors", "bumperImpulses", "waveHit"].includes(
              key,
            ),
        ),
      ),
      actors: game.mechanics.actors.map(({ body, ...actor }) => ({
        ...actor,
        body: {
          position: { ...body.position },
          velocity: { ...body.velocity },
          angle: body.angle,
          angularVelocity: body.angularVelocity,
        },
      })),
    },
  };
}
export function checkpoint(game) {
  return clone({
    state: snapshot(game),
    randomState: game.random.getState(),
    spawnClock: game.spawnClock,
    stats: game.stats,
  });
}
export function restoreSimulation(saved, seed, humans) {
  const game = createSimulation(
    saved.state.count,
    seed,
    humans,
    saved.state.mapId,
  );
  const s = saved.state;
  for (const data of s.people) {
    const p = game.people[data.id];
    const { x, y, vx, vy, angle, ...attributes } = data;
    game.resize(p, data.mass);
    Object.assign(p, attributes);
    Body.setPosition(p.body, { x, y });
    Body.setAngle(p.body, angle);
    Body.setVelocity(p.body, { x: vx, y: vy });
    Object.assign(p.body.position, { x, y });
    Object.assign(p.body.velocity, { x: vx, y: vy });
    if (!p.alive) World.remove(game.engine.world, p.body);
  }
  for (const field of [
    "round",
    "phase",
    "elapsed",
    "outcome",
    "food",
    "zones",
    "effects",
    "announcement",
  ])
    game[field] = clone(s[field]);
  const { actors, ...mechanics } = clone(s.mechanics);
  Object.assign(game.mechanics, mechanics);
  if (actors)
    actors.forEach((saved, i) => {
      const actor = game.mechanics.actors[i];
      if (!actor) return;
      const { body, ...attributes } = saved;
      if (attributes.soldier && !actor.soldier) {
        Body.scale(actor.body, 1.8, 1.8);
        Body.setMass(actor.body, 36);
      }
      Object.assign(actor, attributes);
      Body.setPosition(actor.body, body.position);
      Body.setAngle(actor.body, body.angle);
      Body.setVelocity(actor.body, body.velocity);
      Body.setAngularVelocity(actor.body, body.angularVelocity || 0);
      Object.assign(actor.body.position, body.position);
      Object.assign(actor.body.velocity, body.velocity);
    });
  if (s.obstacles) {
    game.obstacleBodies.forEach((body) =>
      World.remove(game.engine.world, body),
    );
    game.obstacles = clone(s.obstacles);
    game.obstacleBodies = game.obstacles.map((o) =>
      o.r
        ? Bodies.circle(o.x, o.y, o.r, {
            isStatic: true,
            restitution: o.scenery === "cornucopia-circle" ? 0.3 : 1.5,
            label: o.scenery === "cornucopia-circle" ? "obstacle" : "bumper",
          })
        : o.vertices
          ? Bodies.fromVertices(o.x, o.y, [o.vertices], {
              isStatic: true,
              restitution: 0.83,
              label: "crater",
            })
          : Bodies.rectangle(o.x, o.y, o.w, o.h, {
              isStatic: true,
              angle: o.angle,
              restitution: o.bumper ? 1.5 : 0.83,
              label: "obstacle",
            }),
    );
    World.add(game.engine.world, game.obstacleBodies);
  }
  game.random.setState(saved.randomState);
  game.spawnClock = saved.spawnClock;
  game.stats = clone(saved.stats);
  return game;
}
export function resolveTurn(game, shots) {
  const turn = game.round;
  const events = [];
  let time = 0;
  game.onEvent = (kind, person, food) => {
    if (["food", "eat", "burn", "power", "end"].includes(kind))
      events.push({
        t: time,
        kind,
        person: person?.id,
        food: food && { type: food.type, size: food.size, id: food.id },
      });
  };
  if (!game.launch(null, shots)) throw new Error("Cannot resolve turn");
  const frames = [{ t: 0, state: clone(snapshot(game)) }];
  // Fixed 60 Hz, exactly the same Matter/rules as solo; render at 10 Hz + interpolation.
  for (let i = 0; i < 720 && game.phase === "moving"; i++) {
    time += 1000 / 60;
    game.step(1000 / 60);
    if ((i + 1) % 6 === 0 || game.phase !== "moving")
      frames.push({ t: Math.round(time), state: clone(snapshot(game)) });
  }
  if (game.phase === "moving")
    throw new Error("Simulation exceeded turn budget");
  if (game.round > 300 && game.phase !== "ended") {
    game.phase = "ended";
    game.outcome = "draw";
  }
  const final = clone(snapshot(game));
  frames[frames.length - 1].state = final;
  return { turn, duration: Math.round(time), frames, final, events };
}
