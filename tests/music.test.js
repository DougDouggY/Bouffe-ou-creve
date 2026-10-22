import test from "node:test";
import assert from "node:assert/strict";
import { createAmbientMusic } from "../music.js";

const settle = () => new Promise(resolve => setImmediate(resolve));
function fixture(initial) {
  const voices = [];
  let stored = initial === undefined ? null : JSON.stringify(initial);
  let visible = true;
  let blocked = false;
  class FakeAudio extends EventTarget {
    constructor(src) { super(); this.src = src; this.calls = 0; this.paused = true; voices.push(this); }
    play() {
      this.calls++;
      if (blocked) return Promise.reject(new DOMException("Gesture required", "NotAllowedError"));
      this.paused = false;
      return Promise.resolve();
    }
    pause() { this.paused = true; }
  }
  const target = new EventTarget();
  const storage = { getItem: () => stored, setItem: (_, value) => { stored = value; } };
  const options = { AudioClass: FakeAudio, target, storage, isPageVisible: () => visible };
  return { options, voices, target, get saved() { return JSON.parse(stored); }, set visible(value) { visible = value; }, set blocked(value) { blocked = value; } };
}

test("music is opt-in, loops once enabled, and volume is independent and persisted", async () => {
  const f = fixture();
  const music = createAmbientMusic(f.options);
  assert.equal(music.state.enabled, false);
  assert.equal(f.voices[0].calls, 0);
  assert.equal(f.voices[0].volume, 0.25);
  assert.equal(f.voices[0].loop, true);
  music.setEnabled(true); await settle();
  assert(music.state.playing);
  music.setVolume(0.4);
  assert.equal(f.voices[0].volume, 0.4);
  assert.deepEqual(f.saved, { enabled: true, volume: 0.4 });
  f.target.dispatchEvent(new Event("pointerdown"));
  assert.equal(f.voices[0].calls, 1, "gestures do not restart a running loop");
  music.setVolume(0); assert(f.voices[0].paused);
  music.setVolume(0.3); await settle(); assert(music.state.playing);
  music.setMuted(true); assert(f.voices[0].paused);
  assert(music.state.enabled, "global mute preserves the music preference");
  music.setMuted(false); await settle(); assert(music.state.playing);
  f.visible = false; f.target.dispatchEvent(new Event("visibilitychange"));
  assert(f.voices[0].paused);
  f.visible = true; f.target.dispatchEvent(new Event("visibilitychange"));
  await settle(); assert(music.state.playing);
  music.setEnabled(false); assert(f.voices[0].paused);
});

test("saved music retries blocked autoplay after a gesture and restores its volume", async () => {
  const f = fixture({ enabled: true, volume: 0.6 });
  f.blocked = true;
  const music = createAmbientMusic(f.options);
  await settle(); assert(music.state.blocked);
  assert.equal(f.voices[0].volume, 0.6);
  f.blocked = false; f.target.dispatchEvent(new Event("keydown"));
  await settle(); assert(music.state.playing);
  assert.equal(music.state.blocked, false);
});

test("invalid storage or volume cannot break audio setup", () => {
  const f = fixture({ enabled: "yes", volume: "loud" });
  const music = createAmbientMusic(f.options);
  assert.equal(music.state.enabled, false);
  assert.equal(music.state.volume, 0.25);
  music.setVolume(5); assert.equal(music.state.volume, 1);
  music.setVolume(-1); assert.equal(music.state.volume, 0);
  assert.doesNotThrow(() => createAmbientMusic({ ...f.options, storage: { getItem() { throw new Error("unavailable"); }, setItem() { throw new Error("unavailable"); } } }));
});
