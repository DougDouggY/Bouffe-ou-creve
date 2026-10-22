import test from "node:test";
import assert from "node:assert/strict";
import { createGameAudio, isPlayerMeal } from "../audio.js";

const player = { id: 0 }, ai = { id: 1 }, otherAI = { id: 2 };
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
    constructor(src) { super(); this.src = src; this.calls = 0; voices.push(this); }
    play() {
      this.calls++;
      if (this.src.endsWith("jingle.m4a") && blocked) {
        return Promise.reject(new DOMException("Gesture required", "NotAllowedError"));
      }
      this.paused = false;
      return Promise.resolve();
    }
    pause() { this.paused = true; }
  }
  const target = new EventTarget();
  let menuVisible = true;
  const audio = createGameAudio({ isMenuVisible: () => menuVisible, AudioClass: FakeAudio, target });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(voices[0].calls, 1);
  menuVisible = false;
  target.dispatchEvent(new Event("pointerdown"));
  assert.equal(voices[0].calls, 1);
  menuVisible = true;
  blocked = false;
  target.dispatchEvent(new Event("keydown"));
  await new Promise(resolve => setImmediate(resolve));
  target.dispatchEvent(new Event("pointerdown"));
  assert.equal(voices[0].calls, 2);
  assert.equal(voices[0].loop, false);
  audio.event("food", ai);
  assert.equal(voices.length, 1);
  audio.event("food", player);
  audio.event("eat", ai, player);
  assert.equal(voices.length, 3);
  audio.setMuted(true);
  assert(voices.every(voice => voice.paused));
  audio.event("food", player);
  assert.equal(voices.length, 3);
  audio.setMuted(false);
  assert.equal(voices[0].calls, 2);
});
