import test from "node:test";
import assert from "node:assert/strict";
import { consumeShelves } from "../shelves.js";

function fixture(mapId = "market", mass = 350) {
  const shelf = { shelf: true, x: 20, y: 30 };
  const wall = { x: 0, y: 0 };
  const body = { id: "shelf-body" };
  const events = [], removed = [];
  const game = { mapId, obstacles: [shelf, wall], obstacleBodies: [body, { id: "wall" }], effects: [], emit: (...args) => events.push(args) };
  const person = { id: 0, alive: true, mass, body: { position: { x: 20, y: 30 }, circleRadius: 46 } };
  const dependencies = { intersects: () => true, removeBody: body => removed.push(body) };
  return { game, person, dependencies, events, removed };
}

test("350 kg threshold, both markets, collision and rendering stay synchronized", () => {
  for (const map of ["market", "nightmarket"]) {
    const f = fixture(map, 349);
    assert.equal(consumeShelves(f.game, f.person, f.dependencies), 0);
    f.person.mass = 350;
    assert.equal(consumeShelves(f.game, f.person, f.dependencies), 1);
    assert.equal(f.game.obstacles.length, 1);
    assert.equal(f.game.obstacleBodies.length, 1);
    assert.equal(f.game.obstacleBodies[0].id, "wall");
    assert.equal(f.removed[0].id, "shelf-body");
    assert.equal(f.events[0][0], "shelf");
    assert.equal(consumeShelves(f.game, f.person, f.dependencies), 0);
  }
});

test("other maps, distant shelves and dead people are unaffected; AI has same rule", () => {
  let f = fixture("cantine");
  assert.equal(consumeShelves(f.game, f.person, f.dependencies), 0);
  f = fixture(); f.dependencies.intersects = () => false;
  assert.equal(consumeShelves(f.game, f.person, f.dependencies), 0);
  f = fixture(); f.person.alive = false;
  assert.equal(consumeShelves(f.game, f.person, f.dependencies), 0);
  f = fixture(); f.person.id = 1;
  assert.equal(consumeShelves(f.game, f.person, f.dependencies), 1);
});
