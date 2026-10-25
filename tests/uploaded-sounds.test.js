import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { SLIDE_SOUNDS, COLLISION_SOUNDS } from "../sound-catalog.js";
import { normalizeCosmetics } from "../cosmetic-catalog.js";
import { createMotionAudio } from "../motion-audio.js";
import { changeEffects } from "../audio-settings.js?v=ceremony-38";
const wait = () => new Promise((r) => queueMicrotask(r));
class Voice extends EventTarget {
  static all = [];
  constructor(src) {
    super();
    this.src = src;
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
test("15 supplied recordings have real resources and 8 correct slide IDs, including the previously unavailable Prout", () => {
  const manifest = JSON.parse(
    readFileSync(
      new URL("../assets/audio/USER-SOUNDS-44.json", import.meta.url),
    ),
  );
  assert.equal(manifest.length, 15);
  assert.equal(manifest.filter((r) => r.category === "slide").length, 8);
  assert.equal(manifest.filter((r) => r.category === "collision").length, 5);
  for (const row of manifest) {
    assert(existsSync(new URL("../assets/audio/" + row.file, import.meta.url)));
    assert(row.duration > 0.1);
    assert(row.duration <= row.original_duration + 0.1);
    assert.equal(row.sha256_original.length, 64);
  }
  const supplied = SLIDE_SOUNDS.filter((s) => s.file?.endsWith("-44.mp3"));
  assert.equal(supplied.length, 8);
  for (const item of supplied) {
    assert.equal(normalizeCosmetics({ slide: item.id }).slide, item.id);
    assert(!item.disabled);
  }
  assert.equal(COLLISION_SOUNDS.length, 5);
  assert.equal(new Set(COLLISION_SOUNDS.map((s) => s.file)).size, 5);
});
test("all uploaded slides preview actual recordings, AI stay silent, human launches remain deduplicated", async () => {
  Voice.all = [];
  changeEffects({ volume: 0.5, others: true });
  const bus = createMotionAudio({ AudioClass: Voice });
  for (const item of SLIDE_SOUNDS.filter((s) => s.file?.endsWith("-44.mp3"))) {
    assert(bus.preview(item.id));
    await wait();
    assert(Voice.all.some((v) => v.playing && v.src.endsWith(item.file)));
    bus.reset();
  }
  bus.slide({ id: 0, human: false, cosmetics: { slide: "slide_prout" } }, 1);
  await wait();
  assert.equal(Voice.all.filter((v) => v.playing).length, 0);
  bus.slide({ id: 0, human: true, cosmetics: { slide: "slide_prout" } }, 1);
  bus.slide({ id: 0, human: true, cosmetics: { slide: "slide_prout" } }, 1);
  await wait();
  assert.equal(Voice.all.filter((v) => v.playing).length, 1);
  bus.reset();
});
test("collision voices include the second human, skip AI-only pairs, throttle chatter and respect peer mute", async () => {
  Voice.all = [];
  changeEffects({ volume: 0.5, others: true });
  let clock = 1000;
  const bus = createMotionAudio({ AudioClass: Voice, now: () => clock });
  const ai = { id: 8, human: false },
    self = { id: 0, networkSeat: 3, human: true },
    peer = { id: 2, human: true };
  assert.equal(bus.collision(ai, { id: 9, human: false }, 1), false);
  assert(bus.collision(ai, self, 1, 1200));
  await wait();
  const voice = Voice.all.find((v) => v.playing);
  assert(COLLISION_SOUNDS.some((s) => voice.src.endsWith(s.file)));
  assert(voice.volume <= 0.65 * 0.25);
  assert.equal(bus.collision(ai, self, 1, 1300), false);
  voice.finish();
  clock += 500;
  assert.equal(bus.collision(ai, self, 1, 1400), false);
  clock += 500;
  assert(bus.collision(ai, self, 1, 1500));
  await wait();
  bus.reset();
  changeEffects({ others: false });
  clock += 1000;
  assert.equal(bus.collision(ai, peer, 2), false);
  assert(bus.collision(peer, self, 2));
  await wait();
  bus.reset();
  changeEffects({ volume: 0 });
  clock += 1000;
  assert.equal(bus.collision(self, peer, 3), false);
  changeEffects({ volume: 0.5, others: true });
});

import { zt as Game, eA as Body } from "../simulation-core.js";
test("real engine collisions carry both gourmands and emit wall impact without changing their physics", () => {
  const g = new Game(2400, 1800, () => 0.5, {
    mode: "classic",
    mapId: "cantine",
    count: 8,
    headless: true,
  });
  try {
    for (const [i, p] of g.people.entries())
      Body.setPosition(p.body, { x: 400 + i * 150, y: 1300 });
    const [a, b] = g.people,
      r = a.body.circleRadius + b.body.circleRadius,
      events = [];
    Body.setPosition(a.body, { x: 900, y: 900 });
    Body.setPosition(b.body, { x: 900 + r - 3, y: 900 });
    Body.setVelocity(a.body, { x: 3, y: 0 });
    Body.setVelocity(b.body, { x: -3, y: 0 });
    g.phase = "moving";
    g.food = [];
    g.onEvent = (kind, p, q) =>
      events.push({ kind, person: p?.id, other: q?.id });
    g.step(1000 / 60);
    assert(
      events.some(
        (e) => e.kind === "bounce" && e.person === 0 && e.other === 1,
      ),
    );
    const wall = g.obstacles[0];
    Body.setPosition(a.body, {
      x: g.w / 2,
      y: wall.y + wall.h / 2 + a.body.circleRadius - 2,
    });
    Body.setVelocity(a.body, { x: 0, y: -4 });
    g.step(1000 / 60);
    assert(events.some((e) => e.kind === "impact" && e.person === 0));
  } finally {
    g.destroy();
  }
});
