import { normalizeCosmetics } from "./cosmetic-catalog.js?v=identity-22";
// Headless adapter. Only the server calls resolveTurn; clients render its snapshots.
import {
  zt as Game,
  eA as Body,
  XA as World,
  he as Engine,
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
export function createSimulation(count, seed, humans) {
  if (![8, 24, 50].includes(count)) throw new Error("Unsupported size");
  const random = seededRandom(seed);
  const game = new Game(
    count === 8 ? 2400 : 3600,
    count === 8 ? 1800 : 2700,
    random,
    {
      mode: count === 8 ? "classic" : count === 24 ? "gros" : "usa",
      mapId: "cantine",
      count,
    },
  );
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
    food: game.food,
    zones: game.zones,
    effects: game.effects,
    announcement: game.announcement,
    mechanics: {
      items: game.mechanics.items,
      trails: game.mechanics.trails,
      pulses: game.mechanics.pulses,
      clock: game.mechanics.clock,
      lastGlobalRollRound: game.mechanics.lastGlobalRollRound,
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
  const game = createSimulation(saved.state.count, seed, humans);
  const s = saved.state;
  for (const data of s.people) {
    const p = game.people[data.id];
    const { x, y, vx, vy, angle, ...attributes } = data;
    game.resize(p, data.mass);
    Object.assign(p, attributes);
    Body.setPosition(p.body, { x, y });
    Body.setAngle(p.body, angle);
    Body.setVelocity(p.body, { x: vx, y: vy });
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
  Object.assign(game.mechanics, clone(s.mechanics));
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
