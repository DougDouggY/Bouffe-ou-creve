import test from "node:test";
import assert from "node:assert/strict";
import { mergeProfileProgress } from "../profile-storage.js";
import { eventPoints, matchPoints } from "../economy.js";
import { applyProfileGrant } from "../cloudflare/src/trophy-rules.js";
import { createMotionAudio } from "../motion-audio.js";
import { changeEffects } from "../audio-settings.js?v=ceremony-38";
const profile = () => ({
  points: 1000,
  earned: 1000,
  owned: [],
  equipped: {},
  onlineCredits: {},
});
test("online earnings are credited once across stale tabs, purchases and reconnect", () => {
  const base = profile(),
    a = structuredClone(base),
    b = structuredClone(base);
  a.online = { profileId: "p", revision: 1, pointsEarned: 65 };
  const first = mergeProfileProgress(a, base, base);
  assert.equal(first.points, 1065);
  b.online = { profileId: "p", revision: 1, pointsEarned: 65 };
  b.points -= 200;
  b.owned = ["chef"];
  const second = mergeProfileProgress(b, base, first);
  assert.equal(second.points, 865);
  assert.equal(second.earned, 1065);
  const reconnect = mergeProfileProgress(second, second, second);
  assert.equal(reconnect.points, 865);
  const later = structuredClone(reconnect);
  later.online = { profileId: "p", revision: 2, pointsEarned: 145 };
  const next = mergeProfileProgress(later, reconnect, reconnect);
  assert.equal(next.points, 945);
  assert.equal(next.earned, 1145);
});
test("reduced rewards have a per-match cap and invalid grants cannot mint points", () => {
  assert.equal(eventPoints("food", { type: "salad" }), 0);
  assert.equal(eventPoints("food", { size: "normal" }), 1);
  assert.equal(eventPoints("eat"), 10);
  assert.equal(matchPoints(50, true, "classic"), 80);
  assert.equal(matchPoints(10, false, "classic"), 10);
  for (const currency of [-1, 81, Infinity, NaN, "80", 0.5])
    assert.equal(applyProfileGrant({}, { currency }).pointsEarned, 0);
  assert.equal(applyProfileGrant({}, { currency: 80 }).pointsEarned, 80);
});
class Voice extends EventTarget {
  static all = [];
  constructor(src) {
    super();
    this.src = src;
    this.playing = false;
    Voice.all.push(this);
  }
  play() {
    this.playing = true;
    return Promise.resolve();
  }
  pause() {
    this.playing = false;
  }
  finish() {
    this.playing = false;
    this.dispatchEvent(new Event("ended"));
  }
}
const tick = () => new Promise((resolve) => queueMicrotask(resolve));
test("real-file sound bus deduplicates launches, caps voices, mutes peers and reuses pools", async () => {
  changeEffects({ volume: 0.5, others: true });
  Voice.all = [];
  const bus = createMotionAudio({ AudioClass: Voice, now: () => 1000 });
  for (let id = 0; id < 50; id++) {
    const p = { id, human: id < 8, cosmetics: { slide: "slide_spring" } };
    bus.slide(p, 1);
    bus.slide(p, 1);
  }
  await tick();
  assert.equal(Voice.all.filter((v) => v.playing).length, 3);
  let played = 3;
  while (Voice.all.some((v) => v.playing)) {
    const playing = Voice.all.filter((v) => v.playing);
    playing.forEach((v) => v.finish());
    const next = Voice.all.filter((v) => v.playing);
    played += next.length;
    assert(next.length <= 3);
  }
  assert.equal(played, 8); // Only the eight humans: all AI are silent.
  assert.equal(bus.preview("slide_prout"), true);
  bus.reset();
  bus.slide({ id: 1, human: true, cosmetics: {} }, 2);
  await tick();
  assert(Voice.all.some((v) => v.playing));
  changeEffects({ others: false });
  assert.equal(Voice.all.filter((v) => v.playing).length, 0);
  bus.slide({ id: 1, human: true, cosmetics: {} }, 3);
  await tick();
  assert.equal(Voice.all.filter((v) => v.playing).length, 0);
  assert(bus.preview("slide_standard"));
  await tick();
  assert.equal(Voice.all.filter((v) => v.playing).length, 1);
  changeEffects({ volume: 0 });
  assert.equal(Voice.all.filter((v) => v.playing).length, 0);
  bus.reset();
  changeEffects({ volume: 0.5, others: true });
  bus.slide({ id: 0, human: false, cosmetics: {} }, 99);
  await tick();
  assert.equal(Voice.all.filter((v) => v.playing).length, 0);
});

import { Room, randomCode } from "../cloudflare/src/room.js";
import { SIMULATION_VERSION as version } from "../multiplayer-simulation.js";
test("guests suggest arenas without overriding the host choice", () => {
  const r = new Room(),
    a = r.create(randomCode(), "Doug", 19),
    b = r.join("Tony");
  r.connect(a);
  r.connect(b);
  const before = r.publicState().mapId;
  r.action(b, { type: "map-request", mapId: "trampoline", version });
  assert.equal(r.publicState().mapId, before);
  assert.equal(r.publicState().mapRequests[0].mapId, "trampoline");
  assert.throws(
    () => r.action(b, { type: "map", mapId: "trampoline", version }),
    { code: "HOST" },
  );
  assert.throws(
    () => r.action(b, { type: "map-request", mapId: "bad-map", version }),
    { code: "MAP" },
  );
  assert.throws(
    () => r.action(b, { type: "map-request", mapId: "market", version }),
    { code: "MAP_REQUEST_RATE" },
  );
  r.action(a, { type: "map", mapId: "trampoline", version });
  assert.equal(r.publicState().mapId, "trampoline");
  assert.equal(r.publicState().mapRequests.length, 0);
});

import { eA as Body } from "../simulation-core.js";
test("eight real human seats: engine results and capped rewards survive three rematches", () => {
  const r = new Room(),
    members = [];
  for (let i = 0; i < 8; i++) {
    const id = crypto.randomUUID();
    const m = i
      ? r.join("Ami " + i, { slide: "slide_spring" }, id)
      : r.create(randomCode(), "Doug", 19, { slide: "slide_standard" }, id);
    members.push(m);
    r.connect(m);
  }
  r.action(members[0], { type: "size", count: 8, version });
  for (let match = 0; match < 3; match++) {
    for (const m of members)
      r.action(m, { type: "ready", ready: true, version });
    r.action(members[0], { type: "start", version });
    const g = r.game;
    g.resize(g.people[0], 600);
    g.food = [];
    for (const [i, p] of g.people.entries())
      Body.setPosition(p.body, {
        x: 1000 + (i ? g.people[0].body.circleRadius + 18 + i * 0.1 : 0),
        y: 1000,
      });
    let replay;
    for (const [i, m] of members.entries())
      replay =
        r.action(m, {
          type: "shot",
          turn: 1,
          x: i === 0 ? 17 : 0,
          y: 0,
          version,
        }) || replay;
    assert.equal(replay.final.phase, "ended");
    assert.equal(
      replay.events.filter((e) => e.kind === "elimination").length,
      7,
    );
    assert.deepEqual(replay.final.results.champions, [0]);
    assert.deepEqual(replay.final.results.predators, [0]);
    assert.equal(replay.final.results.predatorKills, 7);
    assert.equal(replay.events.filter((e) => e.kind === "slide").length, 1);
    const rewards = r.data.trophyOutbox.filter(
      (grant) => grant.profileId === members[0].profileId && grant.currency,
    );
    assert.equal(rewards.length, match + 1);
    assert.equal(rewards.at(-1).currency, 80);
    if (match < 2)
      for (const m of members)
        r.action(m, { type: "rematch", vote: true, version });
  }
  r.game.destroy();
});
