import test from "node:test";
import assert from "node:assert/strict";
import { trophyProgress, awardCumulativeTrophies } from "../trophy-progress.js";
import { Room, randomCode } from "../cloudflare/src/room.js";
import { SIMULATION_VERSION as version } from "../multiplayer-simulation.js";
import { eA as Body } from "../simulation-core.js";
import {
  applyProfileGrant,
  trophyTurn,
} from "../cloudflare/src/trophy-rules.js";
import { mergeProfileProgress } from "../profile-storage.js";
test("three real mode counters unlock Grand Banquet and all modes; past saves recover missing medal", () => {
  const p = {
    modeWins: { classic: 1, gros: 1, usa: 1 },
    trophies: {},
    trophyTotals: { burgers: 123, fondue: 4 },
    wins: 9,
  };
  const got = awardCumulativeTrophies(p, 100);
  assert(got.includes("gros-win"));
  assert(got.includes("all-modes"));
  assert.deepEqual(trophyProgress("burger1000", p), {
    value: 123,
    target: 1000,
  });
  assert.deepEqual(trophyProgress("fondue10", p), { value: 4, target: 10 });
  assert.deepEqual(trophyProgress("wins50", p), { value: 9, target: 50 });
  assert.deepEqual(awardCumulativeTrophies(p, 200), []);
  assert.equal(p.trophies["gros-win"], 100);
});
test("online progress snapshots combine with solo totals without replaying old counters on reconnect", () => {
  const local = {
    points: 0,
    earned: 0,
    owned: [],
    equipped: {},
    modeWins: { classic: 1 },
    trophyTotals: { burgers: 100, fondue: 1 },
    wins: 2,
  };
  const initial = structuredClone(local);
  local.online = {
    profileId: "p",
    revision: 2,
    wins: 3,
    pointsEarned: 0,
    normalStats: { burgers: 10, fondue: 2 },
    modeWins: { gros: 1, usa: 1 },
  };
  const merged = mergeProfileProgress(local, initial, initial);
  const again = mergeProfileProgress(merged, merged, merged);
  assert.deepEqual(trophyProgress("burger1000", again), {
    value: 110,
    target: 1000,
  });
  assert.deepEqual(trophyProgress("fondue10", again), { value: 3, target: 10 });
  assert.deepEqual(trophyProgress("all-modes", again), { value: 3, target: 3 });
  assert.deepEqual(trophyProgress("wins50", again), { value: 5, target: 50 });
});
test("real authoritative raclette consumption emits fondue and queues one persisted profile increment", () => {
  const r = new Room(),
    id = crypto.randomUUID(),
    host = r.create(randomCode(), "Doug", 11, {}, id);
  r.connect(host);
  r.action(host, { type: "size", count: 8, version });
  r.action(host, { type: "ready", ready: true, version });
  r.action(host, { type: "start", version });
  const g = r.game,
    p = g.people[0];
  g.resize(p, 2500);
  Body.setPosition(p.body, { x: 1000, y: 1000 });
  g.food = [];
  g.zones = [{ kind: "cheese", x: 1000, y: 1000, r: 12 }];
  const replay =
    r.action(host, { type: "shot", turn: 1, x: 0, y: 0, version }) ||
    r.resolve();
  assert(replay.events.some((e) => e.kind === "fondue" && e.person === 0));
  const grants = r.data.trophyOutbox.filter(
    (q) => q.profileId === id && q.normalStats?.fondue,
  );
  assert.equal(grants.length, 1);
  assert.equal(grants[0].normalStats.fondue, 1);
  const profile = applyProfileGrant({ profileId: id }, grants[0]);
  assert.equal(profile.normalStats.fondue, 1);
  trophyTurn(r, { turn: g.round, events: [] });
  assert.equal(
    r.data.trophyOutbox.filter(
      (q) => q.profileId === id && q.normalStats?.fondue,
    ).length,
    1,
  );
  g.destroy();
});

import { restoreModeWins } from "../trophy-progress.js";
import { modeUnlocked } from "../restaurant-menu.js";
test("one online USA victory never fabricates Classic or Grand Banquet victories on reload", () => {
  const p = {
    modeWins: { classic: 0, gros: 0, usa: 0 },
    online: { modeWins: { classic: 0, gros: 0, usa: 1 } },
    trophies: { "us-win": 10 },
  };
  p.modeWins = restoreModeWins(p, { online: p.online });
  assert.deepEqual(p.modeWins, { classic: 0, gros: 0, usa: 0 });
  assert.deepEqual(trophyProgress("all-modes", p), { value: 1, target: 3 });
  assert.equal(modeUnlocked("gros", p), false);
  p.online.modeWins.classic = 1;
  assert.equal(modeUnlocked("gros", p), true);
  p.online.modeWins.gros = 1;
  assert.equal(modeUnlocked("usa", p), true);
  assert.deepEqual(trophyProgress("all-modes", p), { value: 3, target: 3 });
  const legacy = {
    modeWins: { classic: 0, gros: 0, usa: 0 },
    trophies: { "us-win": 10 },
  };
  assert.deepEqual(restoreModeWins(legacy, {}), {
    classic: 1,
    gros: 1,
    usa: 1,
  });
});
