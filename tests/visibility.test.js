import test from "node:test";
import assert from "node:assert/strict";
import { isVisible, lightOpacity, lightRadius } from "../visibility.js";

test("night visibility covers all directions, independent of the last shot", () => {
  for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const observer = { x: 600, y: 600, r: 19, heading };
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
      const target = {
        x: 600 + Math.cos(angle) * 400,
        y: 600 + Math.sin(angle) * 400,
      };
      assert(isVisible("nightmarket", observer, target));
    }
    assert.equal(
      isVisible("nightmarket", observer, { x: 1071, y: 600 }),
      false,
    );
    assert.equal(isVisible("market", observer, { x: 901, y: 600 }), false);
  }
});

test("shelves still obstruct vision; removing a shelf opens its shadow", () => {
  const observer = { x: 0, y: 0, r: 19 };
  const shelf = { x: 150, y: 0, w: 40, h: 180, angle: 0 };
  for (const map of ["market", "nightmarket"]) {
    assert.equal(isVisible(map, observer, { x: 250, y: 0 }, [shelf]), false);
    assert.equal(isVisible(map, observer, { x: 250, y: 0 }, []), true);
    assert.equal(isVisible(map, observer, { x: 0, y: -250 }, [shelf]), true);
  }
  assert(isVisible("cold", observer, { x: 2000, y: 0 }, [shelf]));
});

test("light fades continuously outward and keeps a bright core around larger players", () => {
  const observer = { x: 0, y: 0, r: 19 };
  let previous = 1;
  for (let distance = 0; distance <= 470; distance++) {
    const value = lightOpacity("nightmarket", observer, { x: distance, y: 0 });
    assert(value <= previous);
    assert(previous - value < 0.01);
    previous = value;
  }
  assert.equal(lightOpacity("nightmarket", observer, { x: 50, y: 0 }), 1);
  assert(lightOpacity("nightmarket", observer, { x: 470, y: 0 }) < 0.06);
  const giant = { x: 0, y: 0, r: 500 };
  assert(lightRadius("nightmarket", giant) > giant.r + 55);
  assert.equal(lightOpacity("nightmarket", giant, { x: 500, y: 0 }), 1);
});
