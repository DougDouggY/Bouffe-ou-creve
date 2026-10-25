import test from "node:test";
import assert from "node:assert/strict";
import { createGameAudio, isPlayerMeal } from "../audio.js";

const player = { id: 0 },
  ai = { id: 1 },
  otherAI = { id: 2 };
test("rare edible powers use player meal audio; local utility objects do not", () => {
  for (const kind of ["armored", "inferno"]) {
    assert(isPlayerMeal("power", { id: 0 }, { kind }));
    assert.equal(isPlayerMeal("power", { id: 1 }, { kind }), false);
  }
  for (const kind of ["lamp", "securityShield"])
    assert.equal(isPlayerMeal("power", { id: 0 }, { kind }), false);
});

test("meals sound only when the player eats or is eaten", () => {
  for (const event of ["food", "fondue", "shelf"]) {
    assert.equal(isPlayerMeal(event, player), true);
    assert.equal(isPlayerMeal(event, ai), false);
  }
  assert.equal(isPlayerMeal("eat", player, ai), true);
  assert.equal(isPlayerMeal("eat", ai, player), true);
  assert.equal(isPlayerMeal("eat", ai, otherAI), false);
  for (const event of ["launch", "bounce", "grab", "end", "truce"]) {
    assert.equal(isPlayerMeal(event, player, ai), false);
  }
});

test("jingle retries blocked autoplay once unlocked, never loops; mute stops all sounds", async () => {
  const voices = [];
  let blocked = true;
  class FakeAudio extends EventTarget {
    constructor(src) {
      super();
      this.src = src;
      this.calls = 0;
      voices.push(this);
    }
    play() {
      this.calls++;
      if (this.src.endsWith("menu-jingle-44.mp3") && blocked) {
        return Promise.reject(
          new DOMException("Gesture required", "NotAllowedError"),
        );
      }
      this.paused = false;
      return Promise.resolve();
    }
    pause() {
      this.paused = true;
    }
  }
  const target = new EventTarget();
  let menuVisible = true;
  const audio = createGameAudio({
    isMenuVisible: () => menuVisible,
    AudioClass: FakeAudio,
    target,
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(voices[0].calls, 1);
  menuVisible = false;
  target.dispatchEvent(new Event("pointerdown"));
  assert.equal(voices[0].calls, 1);
  menuVisible = true;
  blocked = false;
  target.dispatchEvent(new Event("keydown"));
  await new Promise((resolve) => setImmediate(resolve));
  target.dispatchEvent(new Event("pointerdown"));
  assert.equal(voices[0].calls, 2);
  assert.equal(voices[0].loop, false);
  audio.event("food", ai);
  assert.equal(voices.length, 1);
  audio.event("food", player);
  audio.event("eat", ai, player);
  assert.equal(voices.length, 3);
  assert(
    voices[1].volume + voices[2].volume <= 0.060001,
    "overlapping meals share one quiet volume budget",
  );
  voices[1].dispatchEvent(new Event("ended"));
  assert.equal(voices[2].volume, 0.03);
  audio.setMuted(true);
  assert(voices[0].paused && voices[2].paused);
  audio.event("food", player);
  assert.equal(voices.length, 3);
  audio.setMuted(false);
  assert.equal(voices[0].calls, 2);
});

test("Face Cachée jingle plays once per entry, retries autoplay, stops on exit and respects mute", async () => {
  const voices = [];
  let shadow = false,
    blocked = true;
  class FakeAudio {
    constructor(src) {
      this.src = src;
      this.calls = 0;
      voices.push(this);
    }
    async play() {
      this.calls++;
      if (this.src.includes("secret-jingle-44.mp3") && blocked)
        throw new DOMException("gesture", "NotAllowedError");
      this.paused = false;
    }
    pause() {
      this.paused = true;
    }
  }
  const target = new EventTarget();
  const audio = createGameAudio({
    isMenuVisible: () => true,
    isShadowMenu: () => shadow,
    AudioClass: FakeAudio,
    target,
  });
  const settle = () => new Promise((resolve) => setImmediate(resolve));
  await settle();
  shadow = true;
  target.dispatchEvent(new Event("shadowchange"));
  await settle();
  const sound = voices[1];
  assert(sound.src.endsWith("/audio/secret-jingle-44.mp3"));
  assert.equal(sound.loop, false);
  assert(voices[0].paused);
  blocked = false;
  target.dispatchEvent(new Event("pointerdown"));
  await settle();
  target.dispatchEvent(new Event("keydown"));
  assert.equal(sound.calls, 2);
  target.dispatchEvent(new Event("shadowchange"));
  assert.equal(sound.calls, 2);
  assert.equal(sound.paused, false);
  shadow = false;
  target.dispatchEvent(new Event("shadowchange"));
  assert(sound.paused);
  assert.equal(sound.currentTime, 0);
  audio.setMuted(true);
  shadow = true;
  target.dispatchEvent(new Event("shadowchange"));
  assert.equal(sound.calls, 2);
  audio.setMuted(false);
  await settle();
  assert.equal(sound.calls, 3);
  audio.setMuted(true);
  assert(sound.paused);
});
