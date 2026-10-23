import test from "node:test";
import assert from "node:assert/strict";
import { Room, randomCode } from "../cloudflare/src/room.js";
import {
  SIMULATION_VERSION as version,
  checkpoint,
} from "../multiplayer-simulation.js";
import {
  trophyTurn,
  applyProfileGrant,
  beginTrophyMatch,
} from "../cloudflare/src/trophy-rules.js";
import {
  MULTIPLAYER_TROPHIES,
  ONLINE_TROPHY_IDS,
} from "../multiplayer-trophy-catalog.js";
import { profileRequest } from "../cloudflare/src/player-profile.js";
import { mergeProfileProgress } from "../profile-storage.js";
function fixture(size = 1, humanCount = 8) {
  const r = new Room(),
    members = [];
  for (let i = 0; i < humanCount; i++) {
    const id = crypto.randomUUID();
    members.push(
      i
        ? r.join("Ami " + i, {}, id)
        : r.create(randomCode(), "Doug", 19, {}, id),
    );
    r.connect(members[i]);
  }
  if (size > 1)
    r.action(members[0], { type: "teamSize", teamSize: size, version });
  r.action(members[0], { type: "size", count: size === 3 ? 24 : 8, version });
  start(r);
  return { r, members };
}
function start(r) {
  for (const m of r.data.members)
    r.action(m, { type: "ready", ready: true, version });
  r.action(r.data.members[0], { type: "start", version });
}
function grants(r, id) {
  return (r.data.trophyOutbox || []).filter((g) => g.profileId === id);
}
function ids(r, m) {
  return new Set(grants(r, m.profileId).flatMap((g) => g.awards));
}
function feed(r, entries, round = 1) {
  const events = entries.map(([victim, killer]) => {
    const p = r.game.people[victim];
    p.alive = false;
    return {
      kind: "elimination",
      person: victim,
      human: p.human === true,
      eliminatedBy:
        killer === null
          ? null
          : { id: killer, name: r.game.people[killer].name },
    };
  });
  trophyTurn(r, { turn: round, events });
}
function end(r, winners) {
  for (const p of r.game.people) p.alive = winners.includes(p.id);
  r.game.phase = "ended";
  r.game.outcome = winners.length ? "win" : "draw";
  r.data.phase = "ended";
  trophyTurn(r, { turn: r.game.round, events: [] });
}
function rematch(r) {
  for (const m of r.data.members)
    r.action(m, { type: "rematch", vote: true, version });
  assert.equal(r.data.phase, "lobby");
  start(r);
}
test("catalog has 25 masked online trophies, 24 active, with ally betrayal explicitly disabled", () => {
  assert.equal(MULTIPLAYER_TROPHIES.length, 25);
  assert.equal(ONLINE_TROPHY_IDS.size, 24);
  assert(!ONLINE_TROPHY_IDS.has("team-betrayal"));
  assert(MULTIPLAYER_TROPHIES.every((t) => t.secret && t.online));
});
test("human meals and first-human elimination exclude AI and teammates; real individual profiles own rewards", () => {
  const { r, members: m } = fixture(1, 4);
  feed(r, [[4, 0]]);
  assert(!ids(r, m[0]).has("mp-human1"));
  assert(!r.data.trophyMatch.firstHumanOut);
  feed(r, [
    [1, 0],
    [2, 0],
    [3, 0],
  ]);
  assert(ids(r, m[0]).has("mp-human1"));
  assert(ids(r, m[0]).has("mp-human3"));
  assert(ids(r, m[1]).has("mp-first-out"));
  assert(!ids(r, m[2]).has("mp-first-out"));
  assert(!ids(r, m[1]).has("mp-human1"));
  r.game.destroy();
  const a = fixture(2, 4);
  feed(a.r, [[1, 0]]);
  assert(!ids(a.r, a.members[0]).has("mp-human1"));
  a.r.game.destroy();
});
test("chat trophies require an accepted real message; eliminated spectators qualify, late viewers do not", () => {
  const { r, members: m } = fixture(1, 2);
  r.action(m[0], { type: "chat", text: "Bonjour", version });
  assert(ids(r, m[0]).has("mp-chat"));
  const before = grants(r, m[0].profileId).length;
  assert.throws(
    () => r.action(m[0], { type: "trophy", id: "mp-wins5", version }),
    { code: "MESSAGE" },
  );
  assert.equal(grants(r, m[0].profileId).length, before);
  feed(r, [[1, 0]]);
  r.action(m[1], { type: "chat", text: "Je regarde", version });
  assert(ids(r, m[1]).has("mp-ghost-chat"));
  const viewer = r.join("Nouveau", {}, crypto.randomUUID());
  r.connect(viewer);
  r.action(viewer, { type: "chat", text: "Salut", version });
  assert(ids(r, viewer).has("mp-chat"));
  assert(!ids(r, viewer).has("mp-ghost-chat"));
  r.game.destroy();
});
test("eight actual humans unlock full table; AI fill and late spectators never qualify", () => {
  const { r, members: m } = fixture();
  assert(m.every((p) => ids(r, p).has("mp-full-table")));
  r.game.destroy();
  const small = fixture(1, 2);
  assert(small.members.every((p) => !ids(small.r, p).has("mp-full-table")));
  small.r.game.destroy();
});
test("five completed games and revenge use stable profile identity across rematches and DO restore", () => {
  let { r, members: m } = fixture(1, 2);
  feed(r, [[0, 1]]);
  end(r, [1]);
  rematch(r);
  feed(r, [[1, 0]]);
  assert(ids(r, m[0]).has("mp-revenge"));
  end(r, [0]);
  for (let n = 2; n < 5; n++) {
    rematch(r);
    end(r, [0]);
  }
  assert(ids(r, m[0]).has("mp-five-servings"));
  assert(ids(r, m[1]).has("mp-five-servings"));
  const state = structuredClone(r.data);
  state.checkpoint = checkpoint(r.game);
  const restored = new Room(state);
  assert.equal(restored.data.trophyHistory[m[0].profileId].matches, 5);
  const before = restored.data.trophyOutbox.length;
  trophyTurn(restored, { turn: 1, events: [] });
  assert.equal(restored.data.trophyOutbox.length, before);
  restored.game.destroy();
  r.game.destroy();
});
test("unanimous replay after all humans die counts completed participation even when AI still play", () => {
  const { r, members: m } = fixture(1, 2);
  feed(r, [
    [0, null],
    [1, null],
  ]);
  assert(r.canRematch());
  for (const member of m)
    r.action(member, { type: "rematch", vote: true, version });
  assert.equal(r.data.phase, "lobby");
  assert.equal(r.data.trophyHistory[m[0].profileId].matches, 1);
  assert(!grants(r, m[0].profileId).some((g) => g.win));
});
test("Duo wins, dead partner, last survivor, Trio sole survivor and full Quartet have exact shared-victory rules", () => {
  const duo = fixture(2, 4);
  feed(duo.r, [[1, 2]]);
  end(duo.r, [0]);
  assert(ids(duo.r, duo.members[0]).has("team-duo-alone"));
  assert(ids(duo.r, duo.members[0]).has("team-last-win"));
  assert(grants(duo.r, duo.members[1].profileId).some((g) => g.win));
  assert(!ids(duo.r, duo.members[1]).has("team-last-win"));
  duo.r.game.destroy();
  const trio = fixture(3, 3);
  feed(trio.r, [
    [0, null],
    [1, null],
  ]);
  assert(ids(trio.r, trio.members[2]).has("team-trio-last"));
  assert(!ids(trio.r, trio.members[0]).has("team-trio-last"));
  trio.r.game.destroy();
  const quad = fixture(4);
  end(quad.r, [0, 1, 2, 3]);
  assert(
    quad.members
      .slice(0, 4)
      .every((m) => ids(quad.r, m).has("team-quad-intact")),
  );
  assert(!ids(quad.r, quad.members[4]).has("team-quad-intact"));
  quad.r.game.destroy();
  const last = fixture(4);
  feed(
    last.r,
    [
      [1, null],
      [2, null],
      [3, null],
    ],
    2,
  );
  end(last.r, [0]);
  assert(ids(last.r, last.members[0]).has("team-quad-last"));
  last.r.game.destroy();
});
test("collective human kills and salads span a complete game, not a single turn; AI team members must also contribute", () => {
  const { r, members: m } = fixture(4);
  for (let i = 0; i < 4; i++) {
    trophyTurn(r, {
      turn: i + 1,
      events: [{ kind: "food", person: i, food: { type: "salad" } }],
    });
    feed(r, [[4 + i, i]], i + 1);
  }
  for (const member of m.slice(0, 4)) {
    assert(ids(r, member).has("team-shared-bill"));
    assert(ids(r, member).has("team-salads"));
  }
  assert(!ids(r, m[4]).has("team-salads"));
  r.game.destroy();
  const ai = fixture(4, 2);
  trophyTurn(ai.r, {
    turn: 1,
    events: [
      { kind: "food", person: 0, food: { type: "salad" } },
      { kind: "food", person: 1, food: { type: "salad" } },
    ],
  });
  assert(!ids(ai.r, ai.members[0]).has("team-salads"));
  ai.r.game.destroy();
});
test("team avenging uses the human opponent’s last real victim; first-turn wipe and full-team loss respect real turn numbers", () => {
  const { r, members: m } = fixture(4);
  feed(
    r,
    [
      [1, 4],
      [4, 0],
    ],
    2,
  );
  assert(ids(r, m[0]).has("team-avenge"));
  r.game.destroy();
  const early = fixture(4);
  feed(
    early.r,
    [
      [0, null],
      [1, null],
      [2, null],
      [3, null],
    ],
    1,
  );
  assert(
    early.members
      .slice(0, 4)
      .every(
        (m) =>
          ids(early.r, m).has("team-quad-out") &&
          ids(early.r, m).has("team-first-out"),
      ),
  );
  early.r.game.destroy();
  const later = fixture(4);
  feed(later.r, [[0, null]], 1);
  feed(
    later.r,
    [
      [1, null],
      [2, null],
      [3, null],
    ],
    2,
  );
  assert(ids(later.r, later.members[0]).has("team-quad-out"));
  assert(!ids(later.r, later.members[0]).has("team-first-out"));
  later.r.game.destroy();
});
test("verified profile counters accumulate across sessions and rooms, including all three team wins; disabled trophy cannot be granted", () => {
  let p = { profileId: crypto.randomUUID() };
  for (const [i, size] of [1, 2, 3, 4, 2].entries())
    p = applyProfileGrant(
      p,
      { win: true, teamSize: size, awards: ["team-betrayal"] },
      100 + i,
    );
  assert.equal(p.wins, 5);
  assert(p.trophies["mp-win1"]);
  assert(p.trophies["mp-wins5"]);
  assert(p.trophies["team-family"]);
  for (const id of ["team-duo-win", "team-trio-win", "team-quad-win"])
    assert(p.trophies[id]);
  assert(!p.trophies["team-betrayal"]);
  const merged = mergeProfileProgress(
    { online: p, points: 0 },
    { online: { ...p, wins: 4 }, points: 0 },
    { online: p, points: 0 },
  );
  assert.equal(merged.online.wins, 5);
});
test("profile authentication and durable receipts prevent duplicate wins after retries or reconnect", async () => {
  const data = new Map();
  const storage = {
    async get(k) {
      return structuredClone(data.get(k));
    },
    async put(values) {
      for (const [k, v] of Object.entries(values))
        data.set(k, structuredClone(v));
    },
    async transaction(fn) {
      return fn(this);
    },
  };
  const profileId = crypto.randomUUID(),
    profileToken = "ab".repeat(32);
  await profileRequest(storage, "create", { profileId, profileToken });
  await assert.rejects(
    profileRequest(storage, "state", { profileToken: "bad" }),
    { code: "PROFILE" },
  );
  const grant = {
    profileId,
    key: "room:match:result",
    win: true,
    teamSize: 2,
    awards: ["mp-chat"],
  };
  const first = await profileRequest(storage, "apply", grant);
  const again = await profileRequest(storage, "apply", grant);
  assert.equal(again.wins, 1);
  assert.equal(again.revision, first.revision);
  assert.deepEqual(again.trophies, first.trophies);
  const read = await profileRequest(storage, "state", {
    profileToken,
    awards: ["mp-wins5"],
    win: true,
  });
  assert.equal(read.wins, 1);
  assert(!read.trophies["mp-wins5"]);
  assert(!JSON.stringify(read).includes(profileToken));
});

test("AI teammates count for collective human eliminations, while rewards stay human-owned", () => {
  const { r, members: m } = fixture(4, 5);
  // Human members 0..3 are team 0, human 4 is on team 1, with AI 5,6,7.
  // Each member of team 1 genuinely kills a different human opponent.
  feed(r, [
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ]);
  assert(ids(r, m[4]).has("team-shared-bill"));
  assert.equal(r.data.trophyMatch.kills[5], 1);
  assert(!(r.data.trophyOutbox || []).some((g) => !g.profileId));
  r.game.destroy();
});

test("anonymous profile client reuses credentials across sessions and never rolls back a newer server revision", async () => {
  const { createOnlineProfileClient } =
    await import("../multiplayer-profile-client.js");
  const originalFetch = globalThis.fetch,
    originalStorage = globalThis.localStorage;
  const cache = new Map();
  globalThis.localStorage = {
    getItem: (k) => cache.get(k) || null,
    setItem: (k, v) => cache.set(k, v),
  };
  const profileId = crypto.randomUUID(),
    profileToken = "cd".repeat(32);
  let revision = 0,
    wins = 0,
    created = 0,
    resolveRead;
  globalThis.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    if (url.endsWith("/api/profile")) {
      created++;
      return Response.json({
        profileId,
        profileToken,
        state: { profileId, revision, wins },
      });
    }
    assert.equal(body.profileToken, profileToken);
    const state = { profileId, revision, wins };
    if (resolveRead) await new Promise((resolve) => resolveRead(resolve));
    return Response.json(state);
  };
  try {
    const updates = [],
      client = createOnlineProfileClient(
        "https://example.test",
        (state, options) => updates.push({ state, options }),
      );
    await client.ensure();
    assert.equal(created, 1);
    let release;
    resolveRead = (resolve) => {
      release = resolve;
    };
    const read = client.refresh();
    await new Promise((resolve) => setTimeout(resolve, 0));
    client.accept({ profileId, revision: 2, wins: 2 });
    release();
    await read;
    assert.equal(updates.at(-1).state.revision, 2);
    resolveRead = null;
    revision = 3;
    wins = 3;
    const next = createOnlineProfileClient("https://example.test", (state) =>
      updates.push({ state }),
    );
    await next.ensure();
    assert.equal(created, 1);
    assert.equal(updates.at(-1).state.wins, 3);
    client.accept({ profileId: crypto.randomUUID(), revision: 99, wins: 99 });
    assert.equal(updates.at(-1).state.wins, 3);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalStorage;
  }
});
