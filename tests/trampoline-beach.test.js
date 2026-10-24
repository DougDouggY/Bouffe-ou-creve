import test from "node:test";
import assert from "node:assert/strict";
import {
  zt as Game,
  eA as Body,
  XA as World,
  he as Engine,
  RA,
} from "../simulation-core.js";
import { mapGroups } from "../map-catalog.js";
import { CA } from "../simulation-core.js";
function make(mapId) {
  let seed = 42;
  const g = new Game(
    1400,
    900,
    () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296,
    { mapId, count: 8 },
  );
  g.food = [];
  g.mechanics.items = [];
  g.checkTruce = () => false;
  for (const p of g.people.slice(2)) {
    p.alive = false;
    World.remove(g.engine.world, p.body);
  }
  return g;
}
test("Trampoline Park is approved with continuous bumper walls, middle bumpers and five pads", () => {
  assert(mapGroups(CA)[0].maps.some(([id]) => id === "trampoline"));
  const g = make("trampoline");
  assert.equal(g.zones.filter((z) => z.kind === "trampoline").length, 5);
  assert.equal(g.obstacles.filter((o) => o.bumper).length, 8);
  assert(g.obstacles.some((o) => o.x > g.w * 0.3 && o.x < g.w * 0.7));
  for (const pad of g.zones)
    assert(!g.obstacles.some((o) => RA(pad, pad.r, o)));
  g.destroy();
});
for (const [a, b, dead] of [
  [150, 60, 1],
  [60, 150, 0],
  [60, 60, null],
])
  test(`end-turn trampoline landing applies ordinary weight rule (${a}/${b}) exactly once`, () => {
    const g = make("trampoline"),
      [p, q] = g.people,
      m = g.mechanics,
      pad = g.zones[0];
    g.resize(p, a);
    g.resize(q, b);
    Body.setPosition(p.body, pad);
    const target = { x: g.w * 0.5, y: g.h * 0.22 };
    Body.setPosition(q.body, target);
    let calls = 0;
    const r = p.body.circleRadius;
    const values = [
      (target.x - r - g.w * 0.04) / (g.w - 2 * (r + g.w * 0.04)),
      (target.y - r - g.h * 0.04) / (g.h - 2 * (r + g.h * 0.04)),
    ];
    g.random = () => values[calls++ % 2];
    assert(m.finishReady());
    assert(
      Math.hypot(p.body.position.x - target.x, p.body.position.y - target.y) <
        0.001,
    );
    if (dead !== null) assert.equal(g.people[dead].alive, false);
    else assert(p.alive && q.alive);
    const used = calls;
    m.finishReady();
    assert.equal(calls, used);
    g.destroy();
  });
test("trampolines avoid obstacles, do not teleport before end-turn or when off a pad, and never chain", () => {
  const g = make("trampoline"),
    m = g.mechanics,
    p = g.people[0];
  Body.setPosition(p.body, { x: g.w * 0.5, y: g.h * 0.2 });
  const before = { ...p.body.position };
  m.finishReady();
  assert.deepEqual(p.body.position, before);
  g.round++;
  m.beginRound();
  Body.setPosition(p.body, g.zones[0]);
  const spot = { ...p.body.position };
  m.update(16, () => {});
  assert.deepEqual(p.body.position, spot);
  m.finishReady();
  assert(
    !g.obstacles.some((o) => RA(p.body.position, p.body.circleRadius + 8, o)),
  );
  const end = { ...p.body.position };
  m.finishReady();
  assert.deepEqual(p.body.position, end);
  g.destroy();
});
test("beach waves recur at random intervals of two or three rounds", () => {
  const g = make("beach"),
    m = g.mechanics,
    intervals = new Set();
  assert([2, 3].includes(m.nextWaveRound));
  for (let i = 0; i < 30; i++) {
    g.round = m.nextWaveRound;
    m.beginRound();
    assert(m.waveRound);
    m.launch();
    assert.equal(m.environment.kind, "wave");
    m.environment.elapsed = m.environment.duration;
    assert(m.finishReady());
    const interval = m.nextWaveRound - g.round;
    assert([2, 3].includes(interval));
    intervals.add(interval);
    g.round++;
    m.beginRound();
    assert(!m.waveRound);
    m.launch();
    assert(!m.environment);
  }
  assert.equal(intervals.size, 2);
  g.destroy();
});
test("beach sand has identical ordinary drag across the formerly icy bands", () => {
  const g = make("beach");
  assert.equal(g.zones.length, 1);
  assert.equal(g.zones[0].kind, "sand");
  assert(g.zones[0].regularSand);
  const p = g.people[0],
    speeds = [];
  for (const y of [0.28, 0.5, 0.72]) {
    Body.setPosition(p.body, { x: g.w * 0.3, y: g.h * y });
    Body.setVelocity(p.body, { x: 5, y: 0 });
    g.mechanics.update(1000 / 60, (dt) => Engine.update(g.engine, dt));
    speeds.push(p.body.velocity.x);
  }
  assert(
    Math.max(...speeds) - Math.min(...speeds) < 0.000001,
    JSON.stringify(speeds),
  );
  g.destroy();
});

test("wave schedule and trampoline resolution survive authoritative checkpoints; allies cannot eat on landing", async () => {
  const { createSimulation, checkpoint, restoreSimulation } =
    await import("../multiplayer-simulation.js");
  const wave = createSimulation(8, 24, [], "beach");
  const restoredWave = restoreSimulation(checkpoint(wave), 24, []);
  assert.equal(
    restoredWave.mechanics.nextWaveRound,
    wave.mechanics.nextWaveRound,
  );
  wave.destroy();
  restoredWave.destroy();
  const g = createSimulation(8, 33, [], "trampoline", 2),
    p = g.people[0],
    ally = g.people[1],
    m = g.mechanics;
  g.resize(p, 500);
  Body.setPosition(p.body, g.zones[0]);
  for (const other of g.people.slice(2)) {
    other.alive = false;
    World.remove(g.engine.world, other.body);
  }
  const destination = { x: g.w * 0.5, y: g.h * 0.22 };
  Body.setPosition(ally.body, destination);
  const radius = p.body.circleRadius,
    mx = radius + g.w * 0.04,
    my = radius + g.h * 0.04;
  const original = g.random;
  let step = 0;
  g.random = () =>
    [
      (destination.x - mx) / (g.w - 2 * mx),
      (destination.y - my) / (g.h - 2 * my),
    ][step++ % 2];
  m.finishReady();
  g.random = original;
  assert(ally.alive);
  assert(p.alive);
  const restored = restoreSimulation(checkpoint(g), 33, []),
    before = { ...restored.people[0].body.position };
  restored.mechanics.finishReady();
  assert.deepEqual(restored.people[0].body.position, before);
  assert.equal(restored.mechanics.trampolineResolvedRound, g.round);
  g.destroy();
  restored.destroy();
});

test("continuous trampoline walls rebound at multiple points along all four sides and in corners", () => {
  for (const side of [0, 1, 2, 3])
    for (const fraction of [0.2, 0.5, 0.8]) {
      const g = make("trampoline"),
        p = g.people[0],
        walls = g.obstacles.filter((o) => o.bumperWall),
        wall = walls[side];
      assert.equal(walls.length, 4);
      const n = wall.wallNormal,
        a = wall.edge.a,
        b = wall.edge.b;
      g.launch(
        null,
        new Map([
          [0, { x: 0, y: 0 }],
          [1, { x: 0, y: 0 }],
        ]),
      );
      Body.setPosition(g.people[1].body, { x: g.w * 0.5, y: g.h * 0.55 });
      Body.setPosition(p.body, {
        x: a.x + (b.x - a.x) * fraction + n.x * (p.body.circleRadius + 2),
        y: a.y + (b.y - a.y) * fraction + n.y * (p.body.circleRadius + 2),
      });
      Body.setVelocity(p.body, { x: -n.x * 12, y: -n.y * 12 });
      for (let i = 0; i < 4; i++) g.step(1000 / 60);
      const velocity = Body.getVelocity(p.body);
      assert(
        velocity.x * n.x + velocity.y * n.y > 15,
        `Side ${side}, fraction ${fraction}: ${JSON.stringify(velocity)}`,
      );
      assert(Math.hypot(velocity.x, velocity.y) <= 48.01);
      g.destroy();
    }
  const g = make("trampoline"),
    p = g.people[0];
  g.launch(
    null,
    new Map([
      [0, { x: 0, y: 0 }],
      [1, { x: 0, y: 0 }],
    ]),
  );
  Body.setPosition(g.people[1].body, { x: g.w * 0.5, y: g.h * 0.55 });
  Body.setPosition(p.body, {
    x: g.w * 0.03 + p.body.circleRadius + 2,
    y: g.h * 0.03 + p.body.circleRadius + 2,
  });
  Body.setVelocity(p.body, { x: -12, y: -12 });
  for (let i = 0; i < 4; i++) g.step(1000 / 60);
  assert(p.body.velocity.x > 10 && p.body.velocity.y > 10);
  g.destroy();
});
