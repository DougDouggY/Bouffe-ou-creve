import test from "node:test";
import assert from "node:assert/strict";
import {
  royalMouth,
  insideRoyalMouth,
  crossesRoyalMouth,
  royalRisk,
} from "../royal-rules.js";
import {
  createSimulation,
  checkpoint,
  restoreSimulation,
} from "../multiplayer-simulation.js";
import { eA as Body } from "../simulation-core.js";
const game = () =>
  createSimulation(
    8,
    42,
    [
      { id: "a", name: "Doug" },
      { id: "b", name: "Tony" },
    ],
    "royal",
  );
test("royal mouth uses the inner artwork ellipse, not character-size padding, and only eats while visibly open", () => {
  const g = game(),
    m = g.mechanics,
    p = g.people[0],
    mouth = m.mouth();
  g.food = [];
  g.resize(p, 2000);
  const check = (position, environment) => {
    Body.setPosition(p.body, position);
    m.environment = environment;
    m.after(16, new Map([[p.id, position]]));
  };
  check({ x: mouth.x, y: mouth.y }, null);
  assert(p.alive, "closed mouth");
  check(
    { x: mouth.x, y: mouth.y },
    { kind: "burp", elapsed: 500, duration: 1100 },
  );
  assert(p.alive, "burp cannot eat");
  check(
    { x: mouth.x + mouth.rx + 1, y: mouth.y },
    { kind: "suction", elapsed: 500, duration: 2400 },
  );
  assert(p.alive, "a large body brushing the outside is safe");
  check(
    { x: mouth.x, y: mouth.y },
    { kind: "suction", elapsed: 500, duration: 2400 },
  );
  assert.equal(p.alive, false);
  assert.equal(p.deathReason, "king");
  g.destroy();
  assert.equal(
    insideRoyalMouth({ x: mouth.x + mouth.rx + 1, y: mouth.y }, mouth),
    false,
  );
  assert(
    crossesRoyalMouth(
      { x: mouth.x - mouth.rx * 2, y: mouth.y },
      { x: mouth.x + mouth.rx * 2, y: mouth.y },
      mouth,
    ),
  );
});
test("each royal meal is spaced by a seeded random two or three rounds and survives checkpoints", () => {
  const g = game(),
    m = g.mechanics,
    intervals = new Set();
  assert([2, 3].includes(m.nextRoyalMealRound));
  for (let i = 0; i < 30; i++) {
    const round = m.nextRoyalMealRound;
    g.round = round;
    m.beginRound();
    assert.equal(m.royalSuctionRound, true);
    assert.equal(m.finishReady(), false);
    assert.equal(m.environment.kind, "suction");
    m.environment.elapsed = m.environment.duration;
    assert.equal(m.finishReady(), true);
    intervals.add(m.nextRoyalMealRound - round);
    assert([2, 3].includes(m.nextRoyalMealRound - round));
    g.round = round + 1;
    m.beginRound();
    assert.equal(m.royalSuctionRound, false);
    m.finishReady();
    assert.equal(m.environment.kind, "burp");
    m.environment.elapsed = m.environment.duration;
    m.finishReady();
  }
  assert.deepEqual([...intervals].sort(), [2, 3]);
  const restored = restoreSimulation(checkpoint(g), 42, [
    { id: "a", name: "Doug" },
    { id: "b", name: "Tony" },
  ]);
  assert.equal(restored.mechanics.nextRoyalMealRound, m.nextRoyalMealRound);
  assert.equal(restored.mechanics.royalSuctionRound, m.royalSuctionRound);
  g.destroy();
  restored.destroy();
});
test("royal AI prefers an escape from the announced suction over food towards the king", () => {
  const g = game(),
    p = g.people[1],
    m = g.mechanics;
  g.round = m.nextRoyalMealRound;
  m.beginRound();
  Body.setPosition(p.body, { x: g.w * 0.5, y: g.h * 0.145 + 320 });
  g.food = [
    { x: g.w * 0.5, y: g.h * 0.145 + 100, type: "burger", size: "chef" },
  ];
  for (const other of g.people)
    if (other !== p)
      Body.setPosition(other.body, { x: 200 + other.id * 160, y: g.h * 0.75 });
  const shot = g.plan(p);
  assert(
    Math.abs(shot.x) > Math.abs(shot.y),
    "AI should aim sideways out of the cone, not at the tempting central food",
  );
  assert(
    royalRisk(p.body.position, { mouth: m.mouth(), suction: true }, g.h) > 0,
  );
  assert.equal(
    royalRisk(
      { x: g.w * 0.15, y: g.h * 0.5 },
      { mouth: m.mouth(), suction: true },
      g.h,
    ),
    0,
  );
  g.destroy();
});
