import test from "node:test";
import assert from "node:assert/strict";
import {
  Room,
  TURN_MS,
  RECONNECT_MS,
  randomCode,
  normalizeCode,
  validCode,
} from "../cloudflare/src/room.js";
import {
  createSimulation,
  resolveTurn,
  snapshot,
  checkpoint,
  restoreSimulation,
  SIMULATION_VERSION as version,
} from "../multiplayer-simulation.js";
import { eA as Body, XA as World } from "../simulation-core.js";
function fixture(count = 24) {
  let now = 1000000;
  const r = new Room(null, () => now),
    a = r.create(randomCode(), "Doug", 19),
    b = r.join("Tony");
  r.connect(a);
  r.connect(b);
  r.action(a, { type: "size", count, version });
  for (const m of [a, b]) r.action(m, { type: "ready", ready: true, version });
  r.action(a, { type: "start", version });
  return {
    r,
    a,
    b,
    advance(ms) {
      now += ms;
    },
  };
}
test("private code, 8 human cap, host permissions and explicit readiness", () => {
  const r = new Room(),
    a = r.create(randomCode(), "<Doug>\n", 1);
  assert(validCode(r.data.code));
  assert.equal(
    normalizeCode(r.data.code.slice(0, 4) + "-" + r.data.code.slice(4)),
    r.data.code,
  );
  assert.equal(a.name, "Doug");
  const b = r.join("Tony");
  assert.throws(() => r.action(b, { type: "start", version }), {
    code: "HOST",
  });
  assert.throws(() => r.action(a, { type: "start", version }), {
    code: "NOT_READY",
  });
  for (let i = 2; i < 8; i++) r.join("Invité");
  assert.throws(() => r.join("Trop"), { code: "FULL" });
  assert(!JSON.stringify(r.publicState()).includes(a.token));
});
test("2 humans and 22 actual AI resolve exactly once with secret, immutable shots", () => {
  const { r, a, b } = fixture();
  assert.equal(r.game.people.length, 24);
  assert.equal(r.publicState().aiCount, 22);
  const before = snapshot(r.game).people.map((p) => [p.x, p.y]);
  assert.equal(
    r.action(a, { type: "shot", turn: 1, x: 13, y: 2, version }),
    null,
  );
  assert.equal(r.game.phase, "aim");
  const publicJSON = JSON.stringify(r.publicState());
  assert(!publicJSON.includes('"x":13'));
  assert(!publicJSON.includes("shots"));
  assert(!publicJSON.includes(a.token));
  assert.equal(
    r.action(a, { type: "shot", turn: 1, x: 13, y: 2, version }),
    null,
  );
  assert.throws(
    () => r.action(a, { type: "shot", turn: 1, x: 9, y: 3, version }),
    { code: "LOCKED" },
  );
  assert.throws(
    () => r.action(b, { type: "shot", turn: 0, x: 1, y: 1, version }),
    { code: "STALE_TURN" },
  );
  assert.throws(
    () => r.action(b, { type: "shot", turn: 1, x: 18, y: 0, version }),
    { code: "SHOT" },
  );
  assert.throws(
    () => r.action(b, { type: "shot", turn: 1, x: NaN, y: 0, version }),
    { code: "SHOT" },
  );
  const replay = r.action(b, { type: "shot", turn: 1, x: -12, y: 4, version });
  assert.equal(replay.turn, 1);
  assert(replay.frames.length > 2);
  assert.equal(r.game.round, 2);
  assert(r.game.people.slice(2).every((p) => p.roundStart));
  assert(
    replay.final.people
      .slice(2)
      .some(
        (p, i) =>
          Math.hypot(p.x - before[i + 2][0], p.y - before[i + 2][1]) > 1,
      ),
  );
  assert.throws(
    () => r.action(b, { type: "shot", turn: 1, x: -12, y: 4, version }),
    { code: "STALE_TURN" },
  );
  assert.throws(
    () => r.action(a, { type: "shot", turn: 2, x: 0, y: 0, version }),
    { code: "REPLAY" },
  );
});
test("disconnect, deadline fallback, durable checkpoint recovery and grace expiry", () => {
  const { r, a, b, advance } = fixture();
  r.disconnect(b);
  r.action(a, { type: "shot", turn: 1, x: 10, y: 0, version });
  const saved = structuredClone(r.data);
  const restored = new Room(saved, r.now);
  assert.deepEqual(snapshot(restored.game), snapshot(r.game));
  assert.equal(restored.authenticate(b.token).id, b.id);
  advance(TURN_MS + 1);
  const replay = restored.maintenance();
  assert(replay);
  assert(restored.game.people[1].roundStart);
  advance(RECONNECT_MS);
  restored.maintenance();
  assert(!restored.data.members.some((m) => m.id === b.id));
  assert.throws(() => restored.authenticate(b.token), { code: "AUTH" });
});
test("server physics determines growth, collision and elimination; eliminated humans spectate", () => {
  const { r, a, b } = fixture();
  const g = r.game;
  g.food = [];
  for (const p of g.people.slice(2)) {
    p.alive = false;
    World.remove(g.engine.world, p.body);
  }
  g.resize(g.people[0], 200);
  g.resize(g.people[1], 60);
  Body.setPosition(g.people[0].body, { x: 900, y: 1100 });
  Body.setPosition(g.people[1].body, { x: 980, y: 1100 });
  r.action(a, { type: "shot", turn: 1, x: 17, y: 0, version });
  const replay = r.action(b, { type: "shot", turn: 1, x: 0, y: 0, version });
  assert.equal(replay.final.phase, "ended");
  assert.equal(replay.final.people[1].alive, false);
  assert.equal(replay.final.people[0].mass, 233);
  assert(replay.events.some((e) => e.kind === "eat"));
  assert.equal(r.publicState().members.find((m) => m.id === b.id).alive, false);
});
test("seat zero dying does not end a match with surviving humans and AI", () => {
  const { r, a, b } = fixture();
  const p = r.game.people[0];
  p.alive = false;
  World.remove(r.game.engine.world, p.body);
  assert.throws(
    () => r.action(a, { type: "shot", turn: 1, x: 1, y: 0, version }),
    { code: "SPECTATOR" },
  );
  const replay = r.action(b, { type: "shot", turn: 1, x: 4, y: 2, version });
  assert(replay);
  assert.equal(r.data.phase, "playing");
});
test("8 and 50 seat simulations use the real core and stay within a DO CPU budget", () => {
  for (const count of [8, 50]) {
    const { r, a, b } = fixture(count);
    const start = performance.now();
    r.action(a, { type: "shot", turn: 1, x: 9, y: 3, version });
    const replay = r.action(b, { type: "shot", turn: 1, x: -9, y: 3, version });
    assert.equal(replay.final.people.length, count);
    assert(performance.now() - start < 10000);
  }
});
test("empty or expired rooms cannot be revived by an old token", () => {
  const { r, a, b, advance } = fixture();
  r.leave(a);
  r.leave(b);
  assert.throws(() => r.authenticate(a.token), { code: "EXPIRED" });
  const second = fixture();
  second.advance(30 * 60000 + 1);
  assert.throws(() => second.r.join("Retard"), { code: "EXPIRED" });
});

test("network recording compresses intermediate frames and preserves exact endpoints", async () => {
  const { encodeFrames, decodeFrame } =
    await import("../multiplayer-protocol.js");
  const { r, a, b } = fixture();
  r.action(a, { type: "shot", turn: 1, x: 10, y: 2, version });
  const replay = r.action(b, { type: "shot", turn: 1, x: -10, y: 2, version });
  const packed = encodeFrames(replay.frames);
  assert(
    JSON.stringify(packed).length < JSON.stringify(replay.frames).length * 0.6,
  );
  let previous;
  for (let i = 0; i < packed.length; i++) {
    const decoded = decodeFrame(packed[i], previous);
    previous = decoded.state;
    for (let p = 0; p < previous.people.length; p++) {
      assert.equal(
        previous.people[p].mass,
        replay.frames[i].state.people[p].mass,
      );
      assert.equal(
        previous.people[p].alive,
        replay.frames[i].state.people[p].alive,
      );
      assert(
        Math.abs(previous.people[p].x - replay.frames[i].state.people[p].x) <=
          0.005001,
      );
    }
    assert.deepEqual(previous.food, replay.frames[i].state.food);
  }
  assert.deepEqual(previous, replay.final);
});
