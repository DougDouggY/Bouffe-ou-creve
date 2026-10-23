import test from "node:test";
import assert from "node:assert/strict";
import { gameplayViewport } from "../viewport.js";
test("phone expands both axes while desktop keeps its previous view", () => {
  const phone = gameplayViewport(390, 844, 2400, 1800, true, true),
    desktop = gameplayViewport(390, 844, 2400, 1800, false, true);
  assert.equal(desktop.width, 390);
  assert.equal(desktop.height, 844);
  assert.equal(phone.width, 720);
  assert(phone.height > 1500);
  assert(phone.width * phone.height > desktop.width * desktop.height * 3);
  const landscape = gameplayViewport(844, 390, 2400, 1800, true, true);
  assert.equal(landscape.height, 720);
  assert.equal(landscape.width, phone.height);
});
test("small arenas stay framed without exposing space beyond the world; large modes retain their centered camera", () => {
  for (const [width, height] of [
    [320, 932],
    [390, 844],
    [844, 390],
    [1024, 768],
  ]) {
    const v = gameplayViewport(width, height, 1600, 1200, true, true);
    assert(v.width <= 1600.001 && v.height <= 1200.001);
    assert(
      Math.abs(
        v.width / v.height - Math.max(320, width) / Math.max(320, height),
      ) < 1e-9,
    );
  }
  assert.deepEqual(gameplayViewport(1366, 900, 3600, 2700, false, false), {
    width: 1366,
    height: 900,
  });
});
