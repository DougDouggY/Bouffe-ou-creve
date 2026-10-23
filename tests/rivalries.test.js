import test from "node:test";
import assert from "node:assert/strict";
import { Room, randomCode } from "../cloudflare/src/room.js";
import {
  trophyTurn,
  applyProfileGrant,
  finishTrophyMatch,
} from "../cloudflare/src/trophy-rules.js";
import { profileRequest } from "../cloudflare/src/player-profile.js";
import {
  SIMULATION_VERSION as version,
  createSimulation,
  resolveTurn,
} from "../multiplayer-simulation.js";
import { eA as Body, XA as World } from "../simulation-core.js";
import {
  MULTIPLAYER_TROPHIES,
  onlineProfile,
} from "../multiplayer-trophy-catalog.js";
function make(size = 2, count = 8, humans = 4, profiles = []) {
  const r = new Room(),
    members = [];
  for (let i = 0; i < humans; i++) {
    const id = profiles[i] || crypto.randomUUID();
    members.push(
      i
        ? r.join("Ami " + i, {}, id)
        : r.create(randomCode(), "Doug", 24, {}, id),
    );
    r.connect(members[i]);
  }
  r.action(members[0], { type: "teamSize", teamSize: size, version });
  r.action(members[0], { type: "size", count, version });
  for (const m of members) r.action(m, { type: "ready", ready: true, version });
  r.action(members[0], { type: "start", version });
  return { r, members };
}
function eat(r, victim, killer, round = 1) {
  const p = r.game.people[victim];
  p.alive = false;
  trophyTurn(r, {
    turn: round,
    events: [
      {
        kind: "elimination",
        person: victim,
        human: p.human === true,
        eliminatedBy:
          killer === null
            ? null
            : { id: killer, name: r.game.people[killer].name },
      },
    ],
  });
}
function food(r, seat, type) {
  trophyTurn(r, {
    turn: 1,
    events: [{ kind: "food", person: seat, food: { type } }],
  });
}
function end(r, alive) {
  for (const p of r.game.people) p.alive = alive.includes(p.id);
  r.game.phase = "ended";
  r.game.outcome = "win";
  r.data.phase = "ended";
  finishTrophyMatch(r);
}
function has(r, member, id) {
  return r.data.trophyOutbox?.some(
    (g) => g.profileId === member.profileId && g.awards.includes(id),
  );
}
function apply(r, states = new Map(), seen = new Set()) {
  for (const grant of r.data.trophyOutbox || []) {
    if (seen.has(grant.key)) continue;
    seen.add(grant.key);
    states.set(
      grant.profileId,
      applyProfileGrant(
        states.get(grant.profileId) || { profileId: grant.profileId },
        grant,
      ),
    );
  }
  return states;
}
test("replacement catalog preserves original IDs/art and renamed revenge, removes obsolete betrayal, and has distinct human/general quartet goals", () => {
  assert.equal(MULTIPLAYER_TROPHIES.length, 33);
  assert.equal(
    MULTIPLAYER_TROPHIES.find((t) => t.id === "mp-revenge").name,
    "Le plat de la vengeance",
  );
  assert(!MULTIPLAYER_TROPHIES.some((t) => t.id === "team-betrayal"));
  assert.equal(
    MULTIPLAYER_TROPHIES.find((t) => t.id === "team-quad-intact").art,
    24,
  );
  assert.equal(
    MULTIPLAYER_TROPHIES.find((t) => t.id === "team-assist").enabled,
    false,
  );
  assert(
    onlineProfile({ trophies: { "mp-revenge": 123 } }).trophies["mp-revenge"],
  );
});
test("quartet meals count AI opponents, shared bill requires humans, and neither counts allies", () => {
  const { r, members: m } = make(4, 8, 4);
  for (let i = 0; i < 4; i++) eat(r, 4 + i, i);
  assert(m.every((p) => has(r, p, "team-quad-meals")));
  assert(!m.some((p) => has(r, p, "team-shared-bill")));
  r.game.destroy();
  const ally = make(4, 8, 4);
  eat(ally.r, 1, 0);
  assert(!ally.r.data.trophyMatch.allKills[0]);
  ally.r.game.destroy();
});
test("Duo human contributions require an actual shared victory; intact Trio wins are separate", () => {
  const { r, members: m } = make();
  eat(r, 2, 0);
  eat(r, 3, 1);
  assert(!has(r, m[0], "team-duo-human-win"));
  end(r, [0, 1]);
  assert(has(r, m[0], "team-duo-human-win"));
  assert(has(r, m[1], "team-duo-human-win"));
  r.game.destroy();
  const trio = make(3, 24, 3);
  end(trio.r, [0, 1, 2]);
  assert(trio.members.every((p) => has(trio.r, p, "team-trio-intact")));
  trio.r.game.destroy();
});
test("against-all uses survivor count at the actual lone-survivor moment, not elapsed time, and requires survival to victory", () => {
  const early = make();
  eat(early.r, 1, 2);
  end(early.r, [0]);
  assert(has(early.r, early.members[0], "team-against-all"));
  early.r.game.destroy();
  const late = make();
  for (const id of [3, 4, 5, 6, 7]) eat(late.r, id, 0);
  eat(late.r, 1, 2);
  end(late.r, [0]);
  assert(!has(late.r, late.members[0], "team-against-all"));
  late.r.game.destroy();
  const dead = make();
  eat(dead.r, 1, 2);
  eat(dead.r, 0, 2);
  end(dead.r, [2]);
  assert(!has(dead.r, dead.members[0], "team-against-all"));
  dead.r.game.destroy();
});
test("stowaway, no-burger and weak-link distinguish personal meals, AI meals, team contributions and being alive", () => {
  const { r, members: m } = make(3, 24, 3);
  eat(r, 3, 0);
  eat(r, 4, 1);
  food(r, 0, "burger");
  food(r, 2, "salad");
  end(r, [0, 1, 2]);
  assert(has(r, m[2], "team-weak-link"));
  assert(has(r, m[2], "team-stowaway"));
  assert(has(r, m[2], "team-no-burger"));
  assert(!has(r, m[0], "team-stowaway"));
  assert(!has(r, m[0], "team-no-burger"));
  assert(has(r, m[1], "team-no-burger"));
  r.game.destroy();
  const dead = make(3, 24, 3);
  eat(dead.r, 3, 0);
  eat(dead.r, 4, 1);
  eat(dead.r, 2, 5);
  end(dead.r, [0, 1]);
  assert(has(dead.r, dead.members[2], "team-weak-link"));
  assert(!has(dead.r, dead.members[2], "team-stowaway"));
  assert(!has(dead.r, dead.members[2], "team-no-burger"));
  dead.r.game.destroy();
});
test("mid-match upgrades never infer absence of earlier meals and cannot grant personal zero-meal goals", () => {
  const { r, members: m } = make();
  delete r.data.trophyMatch.trackingVersion;
  end(r, [0, 1]);
  assert(!has(r, m[0], "team-stowaway"));
  assert(!has(r, m[0], "team-no-burger"));
  r.game.destroy();
});
test("persistent rivalries count direct human meals in both directions and ten completed matches across rooms and renamed nicknames", () => {
  const profiles = [crypto.randomUUID(), crypto.randomUUID()];
  const states = new Map(),
    seen = new Set();
  for (let n = 0; n < 10; n++) {
    const { r, members } = make(1, 8, 2, profiles);
    if (n < 3) eat(r, 1, 0);
    else if (n < 5) eat(r, 0, 1);
    end(r, n < 3 ? [0] : [1]);
    apply(r, states, seen);
    r.game.destroy();
  }
  const a = states.get(profiles[0]),
    b = states.get(profiles[1]);
  assert.equal(a.rivals[profiles[1]].together, 10);
  assert.equal(b.rivals[profiles[0]].together, 10);
  assert.equal(a.rivals[profiles[1]].eaten, 3);
  assert.equal(a.rivals[profiles[1]].wasEaten, 2);
  assert.equal(b.rivals[profiles[0]].eaten, 2);
  assert.equal(b.rivals[profiles[0]].wasEaten, 3);
  assert(a.trophies["mp-regulars"]);
  assert(b.trophies["mp-regulars"]);
  const renamed = applyProfileGrant(a, {
    rivals: [{ profileId: profiles[1], name: "Nouveau pseudo", together: 1 }],
  });
  assert.equal(renamed.rivals[profiles[1]].eaten, 3);
  assert.equal(renamed.rivals[profiles[1]].name, "Nouveau pseudo");
});
test("late spectators and two copies of one profile never create invented co-participation or self rivalries", () => {
  const id = crypto.randomUUID(),
    { r, members } = make(1, 8, 2, [id, id]);
  const viewer = r.join("Spectateur", {}, crypto.randomUUID());
  r.connect(viewer);
  end(r, [0]);
  const state = apply(r).get(id);
  assert.equal(Object.keys(state.rivals).length, 0);
  assert(!apply(r).has(viewer.profileId));
  r.game.destroy();
});
test("durable stats and pair receipts deduplicate wins/weight/kills; rivalry lookup reveals only the requested pair", async () => {
  const map = new Map(),
    storage = {
      async get(k) {
        return structuredClone(map.get(k));
      },
      async put(v) {
        for (const [k, x] of Object.entries(v)) map.set(k, structuredClone(x));
      },
      async transaction(fn) {
        return fn(this);
      },
    };
  const profileId = crypto.randomUUID(),
    otherProfileId = crypto.randomUUID(),
    profileToken = "ef".repeat(32);
  await profileRequest(storage, "create", { profileId, profileToken });
  const grant = {
    profileId,
    key: "same-result",
    win: true,
    maxMass: 851.75,
    rivals: [
      { profileId: otherProfileId, name: "Tony", eaten: 1, together: 1 },
    ],
  };
  await profileRequest(storage, "apply", grant);
  await profileRequest(storage, "apply", grant);
  const read = await profileRequest(storage, "state", {
    profileToken,
    maxMass: 999999,
    wins: 100,
  });
  assert.equal(read.wins, 1);
  assert.equal(read.maxMass, 851.75);
  assert(!read.rivals);
  const stats = await profileRequest(storage, "summary", {});
  assert.deepEqual(stats, { wins: 1, maxMass: 851.75 });
  const rival = await profileRequest(storage, "rivalry", { otherProfileId });
  assert.deepEqual(rival, { together: 1, eaten: 1, wasEaten: 0 });
  const unrelated = await profileRequest(storage, "rivalry", {
    otherProfileId: crypto.randomUUID(),
  });
  assert.deepEqual(unrelated, { together: 0, eaten: 0, wasEaten: 0 });
  const self = await profileRequest(storage, "rivalry", {
    otherProfileId: profileId,
  });
  assert(self.sameProfile);
});
test("real server food events preserve an intermediate weight peak even when later salads reduce the final mass", () => {
  const g = createSimulation(8, 76, [{ id: "p", name: "Doug", seat: 0 }]);
  for (const p of g.people.slice(1)) {
    p.alive = false;
    World.remove(g.engine.world, p.body);
  }
  g.people[1].alive = true;
  World.add(g.engine.world, g.people[1].body);
  Body.setPosition(g.people[1].body, { x: 2000, y: 1400 });
  g.resize(g.people[0], 100);
  Body.setPosition(g.people[0].body, { x: 400, y: 500 });
  g.food = [
    { x: 425, y: 500, type: "burger", size: "xl" },
    { x: 490, y: 500, type: "salad", size: "xl" },
  ];
  const replay = resolveTurn(
    g,
    new Map([
      [0, { x: 6, y: 0 }],
      [1, { x: 0, y: 0 }],
    ]),
  );
  assert(
    replay.events.some(
      (e) => e.kind === "food" && e.person === 0 && e.food.type === "burger",
    ),
  );
  assert(
    replay.events.some(
      (e) => e.kind === "food" && e.person === 0 && e.food.type === "salad",
    ),
  );
  assert(replay.massPeaks[0] >= 140);
  assert(replay.massPeaks[0] > replay.final.people[0].mass);
  g.destroy();
});
