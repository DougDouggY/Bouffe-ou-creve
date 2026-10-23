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

test("real Dressing IDs, slot validation, human seats and cosmetics survive checkpoints", async () => {
  const { COSMETIC_CATALOG, normalizeCosmetics } =
    await import("../cosmetic-catalog.js");
  assert.equal(
    COSMETIC_CATALOG.find((c) => c.id === "cap").name,
    "Bouteille de ketchup",
  );
  for (const item of COSMETIC_CATALOG)
    assert.equal(
      normalizeCosmetics({ [item.slot]: item.id })[item.slot],
      item.id,
    );
  assert.deepEqual(
    normalizeCosmetics({
      hat: "tux",
      outfit: "chef",
      url: "https://example.com/a.png",
    }),
    { hat: "none", outfit: "plain" },
  );
  const r = new Room(),
    a = r.create(randomCode(), "Doug", 19, { hat: "cap", outfit: "sport" }),
    b = r.join("Tony", { hat: "chef", outfit: "cook" });
  r.connect(a);
  r.connect(b);
  r.action(a, { type: "ready", ready: true, version });
  r.action(a, {
    type: "appearance",
    cosmetics: { hat: "crown", outfit: "sport" },
    version,
  });
  assert.equal(a.ready, false);
  assert.deepEqual(r.publicState().members[0].cosmetics, {
    hat: "crown",
    outfit: "sport",
  });
  for (const m of [a, b]) r.action(m, { type: "ready", ready: true, version });
  r.action(a, { type: "start", version });
  assert.equal(r.game.people[0].memberId, a.id);
  assert.equal(r.game.people[1].memberId, b.id);
  assert(r.game.people[0].human && r.game.people[1].human);
  assert(r.game.people.slice(2).every((p) => !p.human && !p.cosmetics));
  assert.deepEqual(r.game.people[1].cosmetics, { hat: "chef", outfit: "cook" });
  assert.throws(
    () =>
      r.action(b, {
        type: "appearance",
        cosmetics: { hat: "burger", outfit: "tux" },
        version,
      }),
    { code: "APPEARANCE_LOCKED" },
  );
  const restored = new Room(structuredClone(r.data), () => 1000000);
  assert.deepEqual(snapshot(restored.game), snapshot(r.game));
  restored.leave(restored.data.members[0]);
  const again = new Room(structuredClone(restored.data));
  assert.equal(again.game.people[0].human, false);
  assert.equal(again.game.people[1].memberId, b.id);
  assert.deepEqual(again.game.people[1].cosmetics, {
    hat: "chef",
    outfit: "cook",
  });
});

test("nicknames are server-normalized, bounded Unicode text and do not change seats", () => {
  const r = new Room(),
    a = r.create(randomCode(), "  <Doug>\u202e   le gourmand\n", 19);
  assert.equal(a.name, "Doug le gourmand");
  const b = r.join("🍔".repeat(40));
  assert.equal(Array.from(b.name).length, 24);
  assert.throws(() => r.join({ name: "injected" }), { code: "NAME" });
  assert.throws(() => r.join(["Tony"]), { code: "NAME" });
  r.connect(a);
  r.connect(b);
  for (const m of [a, b]) r.action(m, { type: "ready", ready: true, version });
  r.action(a, { type: "start", version });
  const state = snapshot(r.game);
  assert.equal(state.people[0].name, a.name);
  assert.equal(state.people[1].name, b.name);
  assert.equal(state.people[0].memberId, a.id);
  assert.equal(state.people[1].memberId, b.id);
});

test("cosmetics and human labels do not affect propulsion, AI or physical outcomes", () => {
  const players = [
    { id: "a", name: "A", seat: 0 },
    { id: "b", name: "B", seat: 1 },
  ];
  const plain = createSimulation(24, 19, players),
    dressed = createSimulation(
      24,
      19,
      players.map((p, i) => ({
        ...p,
        cosmetics: { hat: i ? "chef" : "cap", outfit: i ? "cook" : "sport" },
      })),
    );
  const inputs = new Map([
    [0, { x: 12, y: 2 }],
    [1, { x: -12, y: 3 }],
  ]);
  const a = resolveTurn(plain, inputs).final,
    b = resolveTurn(dressed, inputs).final;
  for (let i = 0; i < 24; i++) {
    assert.equal(a.people[i].mass, b.people[i].mass);
    assert.equal(a.people[i].alive, b.people[i].alive);
    assert(Math.abs(a.people[i].x - b.people[i].x) < 1e-6);
    assert(Math.abs(a.people[i].y - b.people[i].y) < 1e-6);
  }
  plain.destroy();
  dressed.destroy();
});

test("host map selection is validated, shared and restored with dynamic actors", async () => {
  const { MULTIPLAYER_MAPS } = await import("../multiplayer-maps.js");
  for (const map of MULTIPLAYER_MAPS) {
    const r = new Room(),
      a = r.create(randomCode(), "Doug", 19),
      b = r.join("Tony");
    r.connect(a);
    r.connect(b);
    assert.throws(() => r.action(b, { version, type: "map", mapId: map.id }), {
      code: "HOST",
    });
    r.action(a, { version, type: "ready", ready: true });
    r.action(a, { version, type: "map", mapId: map.id });
    assert.equal(a.ready, false);
    assert.equal(r.publicState().mapId, map.id);
    for (const m of [a, b])
      r.action(m, { version, type: "ready", ready: true });
    r.action(a, { version, type: "start" });
    assert.equal(r.game.mapId, map.id);
    const replay = resolveTurn(
      r.game,
      new Map([
        [0, { x: 0, y: 0 }],
        [1, { x: 0, y: 0 }],
      ]),
    );
    const restored = restoreSimulation(checkpoint(r.game), 19, r.data.members);
    assert.deepEqual(
      JSON.parse(JSON.stringify(snapshot(restored))),
      JSON.parse(JSON.stringify(snapshot(r.game))),
      map.id + " checkpoint",
    );
    assert.doesNotThrow(() => JSON.stringify(replay));
    r.game.destroy();
    restored.destroy();
  }
  const r = new Room(),
    a = r.create(randomCode(), "Doug", 19);
  r.connect(a);
  assert.throws(() => r.action(a, { version, type: "map", mapId: "somalia" }), {
    code: "MAP",
  });
  assert.throws(() => r.action(a, { version, type: "map", mapId: "<img>" }), {
    code: "MAP",
  });
});
test("unanimous rematch retains room identities and map; votes survive checkpoint and clear on disconnect", () => {
  const { r, a, b } = fixture(8);
  const code = r.data.code,
    seed = r.data.seed;
  assert.throws(() => r.action(a, { version, type: "rematch", vote: true }), {
    code: "PHASE",
  });
  for (const member of [a, b]) {
    r.game.people[member.seat].alive = false;
    World.remove(r.game.engine.world, r.game.people[member.seat].body);
  }
  assert.equal(r.publicState().canRematch, true);
  r.action(a, { version, type: "rematch", vote: true });
  assert.equal(r.data.phase, "playing");
  assert.equal(r.publicState().rematchVotes, 1);
  r.data.checkpoint = checkpoint(r.game);
  const restored = new Room(structuredClone(r.data), () => 1000000);
  assert.equal(restored.publicState().rematchVotes, 1);
  restored.disconnect(restored.data.members[0]);
  assert.equal(restored.publicState().rematchVotes, 0);
  restored.game.destroy();
  r.action(a, { version, type: "rematch", vote: false });
  assert.equal(r.publicState().rematchVotes, 0);
  r.action(a, { version, type: "rematch", vote: true });
  r.action(b, { version, type: "rematch", vote: true });
  assert.equal(r.data.phase, "lobby");
  assert.equal(r.game, null);
  assert.equal(r.data.code, code);
  assert.notEqual(r.data.seed, seed);
  assert.equal(r.data.checkpoint, null);
  assert.deepEqual(
    r.data.members.map((m) => [m.id, m.name, m.seat, m.ready, m.rematch]),
    [
      [a.id, "Doug", null, false, false],
      [b.id, "Tony", null, false, false],
    ],
  );
  for (const m of [a, b]) r.action(m, { version, type: "ready", ready: true });
  r.action(a, { version, type: "start" });
  assert.equal(r.game.round, 1);
  assert(r.game.people.slice(0, 2).every((p) => p.alive));
  r.game.destroy();
});
