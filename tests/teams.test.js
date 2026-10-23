import test from "node:test";
import assert from "node:assert/strict";
import {
  sameTeam,
  lastTeamStanding,
  validTeamSetup,
  localTeamWon,
} from "../teams.js";
import {
  createSimulation,
  checkpoint,
  restoreSimulation,
  resolveTurn,
  SIMULATION_VERSION as version,
} from "../multiplayer-simulation.js";
import { Room, randomCode } from "../cloudflare/src/room.js";
import { eA as Body, XA as World } from "../simulation-core.js";
const humans = [
  { id: "doug", name: "Doug", seat: 0 },
  { id: "tony", name: "Tony", seat: 1 },
  { id: "ami", name: "Ami", seat: 4 },
];
for (const size of [2, 3, 4])
  test(`teams of ${size} share true identity, do not eat or spend an ally shield, persist and end with multiple survivors`, () => {
    const g = createSimulation(24, 41, humans, "cantine", size);
    assert.equal(g.teamSize, size);
    assert(sameTeam(g.people[0], g.people[1]));
    assert.equal(new Set(g.people.map((p) => p.teamId)).size, 24 / size);
    const [a, b] = g.people;
    g.resize(a, 500);
    b.armored = true;
    const mass = a.mass;
    g.eat(a, b);
    assert(b.alive);
    assert(b.armored);
    assert.equal(a.mass, mass);
    const enemy = g.people[size];
    enemy.armored = false;
    g.eat(a, enemy);
    assert(!enemy.alive);
    const restored = restoreSimulation(checkpoint(g), 41, humans);
    assert.equal(restored.teamSize, size);
    assert.deepEqual(
      restored.people.map((p) => p.teamId),
      g.people.map((p) => p.teamId),
    );
    for (const p of restored.people)
      if (p.teamId !== 0) {
        p.alive = false;
        World.remove(restored.engine.world, p.body);
      }
    assert(lastTeamStanding(restored));
    assert(localTeamWon(restored));
    restored.launch(
      { x: 0, y: 0 },
      new Map(
        restored.people
          .filter((p) => p.alive)
          .map((p) => [p.id, { x: 0, y: 0 }]),
      ),
    );
    restored.step();
    assert.equal(restored.phase, "ended");
    assert.equal(restored.outcome, "win");
    assert.equal(restored.people.filter((p) => p.alive).length, size);
    g.destroy();
    restored.destroy();
  });
test("dead local player earns team victory through living ally; default solo retains ordinary eating", () => {
  const g = createSimulation(8, 44, humans.slice(0, 2), "cantine", 2);
  g.people[0].alive = false;
  World.remove(g.engine.world, g.people[0].body);
  for (const p of g.people.slice(2)) {
    p.alive = false;
    World.remove(g.engine.world, p.body);
  }
  g.launch({ x: 0, y: 0 });
  g.step();
  assert.equal(g.outcome, "win");
  assert(!g.people[0].alive);
  g.destroy();
  const solo = createSimulation(8, 44, humans.slice(0, 2));
  assert.equal(solo.teamSize, 1);
  assert(!sameTeam(...solo.people));
  solo.eat(solo.people[0], solo.people[1]);
  assert(!solo.people[1].alive);
  solo.destroy();
});
test("equal teams support 8/24/50 duos, 24 trios, 8/24 quartets and reject unsupported combinations", () => {
  for (const [count, size] of [
    [8, 2],
    [24, 2],
    [50, 2],
    [24, 3],
    [8, 4],
    [24, 4],
  ])
    assert(validTeamSetup(count, size));
  for (const [count, size] of [
    [8, 3],
    [50, 3],
    [50, 4],
    [8, 5],
  ])
    assert(!validTeamSetup(count, size));
  assert.throws(() => createSimulation(8, 1, [], "cantine", 3));
});
test("team lobby enforces host controls, equal teams, quotas, fixed seats, readiness, reconnect and rematch", () => {
  const r = new Room(),
    a = r.create(randomCode(), "Doug", 88),
    b = r.join("Tony"),
    c = r.join("Ami"),
    d = r.join("Copain");
  for (const m of [a, b, c, d]) r.connect(m);
  assert.throws(() => r.action(b, { type: "teamSize", teamSize: 2, version }), {
    code: "HOST",
  });
  r.action(a, { type: "teamSize", teamSize: 2, version });
  assert.equal(r.publicState().teamSize, 2);
  assert.throws(() => r.action(c, { type: "team", team: 0, version }), {
    code: "TEAM_FULL",
  });
  r.action(c, { type: "team", team: 2, version });
  r.action(d, { type: "team", team: 2, version });
  r.action(a, { type: "map", mapId: "trampoline", version });
  for (const m of [a, b, c, d])
    r.action(m, { type: "ready", ready: true, version });
  r.action(a, { type: "start", version });
  assert.deepEqual(
    [a, b, c, d].map((m) => m.seat),
    [0, 1, 4, 5],
  );
  assert.deepEqual(
    [a, b, c, d].map((m) => r.game.people[m.seat].name),
    ["Doug", "Tony", "Ami", "Copain"],
  );
  assert.deepEqual(
    [a, b, c, d].map((m) => r.game.people[m.seat].teamId),
    [0, 0, 2, 2],
  );
  assert.equal(r.publicState().aiCount, 20);
  assert.throws(() => r.action(a, { type: "team", team: 3, version }), {
    code: "PHASE",
  });
  const viewer = r.join("Spectateur");
  r.connect(viewer);
  assert.equal(viewer.team, null);
  r.data.checkpoint = checkpoint(r.game);
  const restored = new Room(structuredClone(r.data));
  assert.equal(restored.game.teamSize, 2);
  assert.equal(restored.game.people[4].memberId, c.id);
  for (const m of restored.data.members) restored.connect(m);
  for (const p of restored.game.people) p.alive = false;
  for (const m of restored.data.members)
    restored.action(m, { type: "rematch", vote: true, version });
  assert.equal(restored.data.phase, "lobby");
  assert.deepEqual(
    restored.data.members.slice(0, 4).map((m) => m.team),
    [0, 0, 2, 2],
  );
  assert.equal(restored.data.members.at(-1).team, 1);
  restored.action(restored.data.members[0], {
    type: "teamSize",
    teamSize: 3,
    version,
  });
  assert.equal(restored.data.count, 24);
  assert(restored.data.members.every((m) => !m.ready));
  assert.throws(
    () =>
      restored.action(restored.data.members[0], {
        type: "size",
        count: 8,
        version,
      }),
    { code: "TEAM_SIZE" },
  );
  restored.game?.destroy();
  r.game.destroy();
});
test("AI does not hunt allies even when the ally is easy prey", () => {
  const g = createSimulation(8, 17, [], "cantine", 2);
  g.food = [];
  g.resize(g.people[1], 500);
  for (const p of g.people.slice(2)) {
    p.alive = false;
    World.remove(g.engine.world, p.body);
  }
  Body.setPosition(g.people[1].body, { x: 500, y: 500 });
  Body.setPosition(g.people[0].body, { x: 600, y: 500 });
  g.plan(g.people[1]);
  assert.notEqual(g.people[1].intent, "hunt");
  g.destroy();
});
