import test from "node:test";
import assert from "node:assert/strict";
import { modeUnlocked } from "../restaurant-menu.js";
test("progression unlocks 24 after classic win and 50 after 24 win, preserving old profiles", () => {
  for (const profile of [{}, { modeWins: { classic: 0, gros: 0 } }]) {
    assert(modeUnlocked("classic", profile));
    assert.equal(modeUnlocked("gros", profile), false);
    assert.equal(modeUnlocked("usa", profile), false);
  }
  assert(modeUnlocked("gros", { modeWins: { classic: 1 } }));
  assert.equal(modeUnlocked("usa", { modeWins: { classic: 1 } }), false);
  assert(modeUnlocked("usa", { modeWins: { gros: 1 } }));
});

import { mapArtURL } from "../map-art.js";
import { WORK_IN_PROGRESS_MAPS } from "../map-catalog.js";
test("validated arenas stay approved and night shares the exact daytime illustration", () => {
  for (const id of ["market", "nightmarket", "beach", "fair", "royal"])
    assert.equal(WORK_IN_PROGRESS_MAPS.has(id), false);
  assert.equal(mapArtURL("market"), mapArtURL("nightmarket"));
});
