import test from "node:test";
import assert from "node:assert/strict";
import { poseAt } from "../podium.js";
import { COLLISION_SOUNDS, SLIDE_SOUNDS } from "../sound-catalog.js";
import { normalizeCosmetics } from "../cosmetic-catalog.js";
import { mergeProfileProgress } from "../profile-storage.js";
import { createMotionAudio } from "../motion-audio.js";
import { changeEffects } from "../audio-settings.js?v=ceremony-38";
const actor = (podium) => ({
  person: { id: 0, cosmetics: { podium } },
  kind: "champion",
  enabled: true,
  celebrateAt: 1000,
});
test("burp has an inhale, open-mouth expression, visible vapor and a proud finish; belly raises arms and deforms the torso", () => {
  const a = actor("podium_burp");
  assert.equal(poseAt(a, 1500).expression, 1);
  const exhale = poseAt(a, 2200);
  assert.equal(exhale.expression, 2);
  assert(exhale.burp > 0);
  assert.equal(exhale.mouth, 1);
  assert.equal(poseAt(a, 3600).expression, 3);
  const b = actor("podium_belly"),
    samples = Array.from({ length: 20 }, (_, i) => poseAt(b, 1400 + i * 60));
  assert(samples.every((p) => p.armL > 1.5 && p.armR < -1.5));
  assert(
    Math.max(...samples.map((p) => p.belly)) -
      Math.min(...samples.map((p) => p.belly)) >
      0.2,
  );
  assert.equal(poseAt({ ...a, enabled: false }, 2200).burp, 0);
  assert.equal(poseAt(a, 6000).expression, 0);
});
test("collision equipment normalizes only real IDs and survives a concurrent profile merge", () => {
  assert.equal(COLLISION_SOUNDS.filter((s) => s.file).length, 5);
  for (const c of COLLISION_SOUNDS)
    assert.equal(normalizeCosmetics({ collision: c.id }).collision, c.id);
  assert(!normalizeCosmetics({ collision: "invented" }).collision);
  const base = {
    points: 1000,
    earned: 1000,
    owned: ["none", "plain"],
    equipped: { hat: "none", outfit: "plain" },
  };
  const current = structuredClone(base);
  current.points -= 180;
  current.owned.push("collision_smack");
  current.equipped.collision = "collision_smack";
  const latest = structuredClone(base);
  latest.equipped.hat = "chef";
  const merged = mergeProfileProgress(current, base, latest);
  assert.equal(merged.equipped.hat, "chef");
  assert.equal(merged.equipped.collision, "collision_smack");
  assert(merged.owned.includes("collision_smack"));
});
class Voice extends EventTarget {
  static all = [];
  constructor(src) {
    super();
    this.src = src;
    this.duration = 2;
    this.currentTime = 0;
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
const flush = () => new Promise((r) => queueMicrotask(r)),
  pause = () => new Promise((r) => setTimeout(r, 35));
test("new slides are quieter, fade in and out, and stretch gently with synchronized launch speed", async () => {
  changeEffects({ volume: 0.5, others: true });
  let clock = 1000;
  Voice.all = [];
  const bus = createMotionAudio({ AudioClass: Voice, now: () => clock }),
    person = {
      id: 0,
      human: true,
      body: { speed: 17, velocity: { x: 17, y: 0 } },
      cosmetics: { slide: "slide_kisscount" },
    };
  const before = structuredClone(person);
  bus.slide(person, 1, 17);
  await flush();
  const voice = Voice.all.find((v) => v.playing);
  assert.equal(voice.volume, 0);
  assert.equal(voice.playbackRate, 0.86);
  assert.equal(voice.preservesPitch, true);
  clock += 90;
  await pause();
  assert(voice.volume > 0);
  assert(voice.volume <= 0.65 * 0.25);
  const high = voice.volume;
  voice.currentTime = 1.97;
  clock += 100;
  await pause();
  assert(voice.volume < high * 0.5);
  assert.deepEqual(person, before);
  voice.finish();
  bus.reset();
  assert.equal(SLIDE_SOUNDS.filter((s) => s.recordingGain === 0.5).length, 8);
});
test("both equipped humans contribute their own collision voice; none, AI and peer mute remain silent", async () => {
  changeEffects({ volume: 0.5, others: true });
  Voice.all = [];
  let clock = 1000;
  const bus = createMotionAudio({ AudioClass: Voice, now: () => clock });
  const a = { id: 0, human: true, cosmetics: { collision: "collision_smack" } },
    b = { id: 1, human: true, cosmetics: { collision: "collision_wouf" } };
  assert(bus.collision(a, b, 1));
  await flush();
  assert.equal(Voice.all.filter((v) => v.playing).length, 2);
  assert(Voice.all.some((v) => v.src.endsWith("collision-smack-44.mp3")));
  assert(Voice.all.some((v) => v.src.endsWith("collision-wouf-44.mp3")));
  bus.reset();
  clock += 1000;
  assert.equal(
    bus.collision({ ...a, human: false }, { ...b, human: false }, 2),
    false,
  );
  assert.equal(
    bus.collision({ ...a, cosmetics: {} }, { ...b, human: false }, 2),
    false,
  );
  changeEffects({ others: false });
  assert(bus.collision(a, b, 3));
  await flush();
  assert.equal(Voice.all.filter((v) => v.playing).length, 1);
  bus.reset();
  changeEffects({ others: true });
});
