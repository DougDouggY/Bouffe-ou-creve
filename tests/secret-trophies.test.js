import test from "node:test";
import assert from "node:assert/strict";
import {
  SECRET_TROPHIES,
  secretProfile,
  secretTrophyEvent,
} from "../secret-trophies.js";
import { simulateSecretTrophy } from "../secret-trophy-lab.js";
import { physicalMass } from "../secret-modes.js";
test("39 separate achievements, no repeated condition inside a mode, no rejected trophy", () => {
  assert.equal(SECRET_TROPHIES.length, 39);
  assert.equal(new Set(SECRET_TROPHIES.map((t) => t.id)).size, 39);
  assert.equal(
    new Set(SECRET_TROPHIES.map((t) => `${t.mode}:${t.condition}`)).size,
    39,
  );
  for (const forbidden of [
    "Descente aux enfers",
    "Rien dans l’assiette",
    "Buffet à volonté",
    "À point, saignant",
  ])
    assert(!SECRET_TROPHIES.some((t) => t.name === forbidden));
});
test("AI meals and normal games cannot increment hidden trophy progression", () => {
  const profile = { shadow: secretProfile() },
    game = {
      mode: "cannibal",
      people: [{ id: 0, mass: 60 }],
      mechanics: { clock: 0 },
    };
  assert.deepEqual(
    secretTrophyEvent(profile, "food", { id: 1 }, { type: "victim" }, game),
    [],
  );
  assert.equal(profile.shadow.totals.victims, 0);
  const before = JSON.stringify(profile);
  game.mode = "classic";
  secretTrophyEvent(profile, "end", { id: 0 }, null, {
    ...game,
    outcome: "win",
  });
  assert.equal(JSON.stringify(profile), before);
});
test("one win is saved once, corrupted fields are ignored, earned timestamps survive serialization", () => {
  const profile = { shadow: secretProfile() },
    game = {
      mode: "somalia",
      people: [{ id: 0, mass: 8 }],
      outcome: "win",
      mechanics: { clock: 0 },
    };
  secretTrophyEvent(profile, "end", null, null, game);
  secretTrophyEvent(profile, "end", null, null, game);
  assert.equal(profile.shadow.wins.somalia, 1);
  const earned = simulateSecretTrophy("shadow-cannibal-first").profile.shadow;
  const loaded = secretProfile(JSON.parse(JSON.stringify(earned)));
  assert.deepEqual(loaded, earned);
  const invalid = secretProfile({
    wins: { platform: -1 },
    totals: { victims: NaN, children: "50" },
    trophies: { "shadow-cannibal-first": "yes", unknown: 123 },
  });
  assert.equal(invalid.wins.platform, 0);
  assert.equal(invalid.totals.children, 0);
  assert.deepEqual(invalid.trophies, {});
});
test("every laboratory scenario passes using fresh isolated data", () => {
  for (const trophy of SECRET_TROPHIES)
    assert(simulateSecretTrophy(trophy.id).selected, trophy.id);
  const first = simulateSecretTrophy("shadow-cannibal-first").profile.shadow
    .trophies;
  first["shadow-cannibal-ten"] = 123;
  assert(
    !simulateSecretTrophy("shadow-cannibal-first").profile.shadow.trophies[
      "shadow-cannibal-ten"
    ],
  );
});
test("duel mass stays monotone and pushable without altering normal modes", () => {
  assert(physicalMass(2000, "platform") > physicalMass(1000, "platform"));
  assert(physicalMass(2000, "platform") / physicalMass(60, "platform") < 6);
  assert.equal(physicalMass(2000, "classic"), 200);
});
