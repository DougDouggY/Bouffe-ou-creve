import test from "node:test";
import assert from "node:assert/strict";
import { zt as Game, eA as Body } from "../simulation-core.js";
import { arenaSize } from "../arena-bounds.js";
import { survivalLayout, survivalZone, survivalScenery } from "../survival.js";
import {
  randomCode,
  validCode,
  normalizeCode,
} from "../cloudflare/src/room.js";
import worker from "../cloudflare/src/worker.js";
import { SIMULATION_VERSION } from "../multiplayer-simulation.js";
const seeded = (n) => () =>
  (n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296;
test("square Burger Games has accessible scattered food close to all 24 spawns, decorative trees and permanent rivers", () => {
  const size = arenaSize("survival", "survival");
  assert.equal(size.w, size.h);
  assert(size.h > 13500);
  const g = new Game(size.w, size.h, seeded(19), {
    mode: "survival",
    mapId: "survival",
    count: 24,
    headless: true,
  });
  try {
    const l = survivalLayout(g.w, g.h);
    assert.equal(g.food.length, 96);
    assert.equal(
      g.obstacles.filter((o) => o.scenery === "forest-grove").length,
      0,
    );
    assert(survivalScenery(g.w, g.h).length > 20);
    for (const p of g.people)
      assert(
        Math.min(
          ...g.food.map((f) =>
            Math.hypot(f.x - p.body.position.x, f.y - p.body.position.y),
          ),
        ) < 500,
      );
    for (const f of g.food)
      assert(Math.hypot(f.x - l.x, f.y - l.y) > l.coreRadius + 25);
    assert(
      new Set(g.food.map((f) => Math.round(Math.hypot(f.x - l.x, f.y - l.y))))
        .size > 40,
    );
    assert(g.zones.filter((z) => z.river && z.flow).length >= 80);
    const p = g.people[0],
      river = g.zones.find((z) => z.river);
    g.resize(p, 2500);
    Body.setPosition(p.body, river);
    const mass = p.mass,
      n = g.zones.length;
    g.consumeFondue();
    assert.equal(p.mass, mass);
    assert.equal(g.zones.length, n);
    g.zones.push({ kind: "cheese", x: river.x, y: river.y, r: 15 });
    g.consumeFondue();
    assert(p.mass > mass);
    assert.equal(g.zones.length, n);
    for (const round of [5, 6, 7, 12]) {
      g.round = round;
      g.secretRules.beginRound();
      assert.equal(g.announcement.kind, "zone");
      if (round >= 6) assert.match(g.announcement.text, /FIN DE CE TOUR/);
    }
    assert(survivalZone(g, 6).r < survivalZone(g, 5).r);
  } finally {
    g.destroy();
  }
});
test("flowing volcano cheese cannot be consumed; landed eruption piles remain edible", () => {
  const g = new Game(3600, 2700, seeded(20), {
    mode: "classic",
    mapId: "volcan",
    count: 8,
    headless: true,
  });
  try {
    const p = g.people[0],
      flow = g.zones.find((z) => z.flow);
    g.resize(p, 3000);
    Body.setPosition(p.body, flow);
    const mass = p.mass,
      n = g.zones.length;
    g.consumeFondue();
    assert.equal(p.mass, mass);
    assert.equal(g.zones.length, n);
    g.zones.push({
      kind: "cheese",
      eruption: true,
      x: flow.x,
      y: flow.y,
      r: 20,
    });
    g.consumeFondue();
    assert(p.mass > mass);
    assert(g.zones.includes(flow));
  } finally {
    g.destroy();
  }
});
test("four-character invitations keep legacy twelve-character invites and retry collisions atomically", async () => {
  for (let i = 0; i < 100; i++) {
    const code = randomCode();
    assert.equal(code.length, 4);
    assert(validCode(code));
  }
  assert(validCode(normalizeCode("ABCD-EFGH-JKLM")));
  assert(!validCode("AAA"));
  assert(!validCode("AAAAA"));
  const seen = [],
    env = {
      ALLOWED_ORIGINS: "https://dougdouggy.github.io",
      ROOMS: {
        idFromName: (n) => n,
        get: (n) => ({
          fetch: async (url, req) => {
            if (n === "admission") return Response.json({ ok: true });
            const body = JSON.parse(req.body);
            seen.push({ n, body });
            return seen.length < 3
              ? Response.json({ error: "EXISTS" }, { status: 409 })
              : Response.json({ code: body.code, token: "private-test-token" });
          },
        }),
      },
    };
  const response = await worker.fetch(
    new Request("https://worker/api/rooms", {
      method: "POST",
      headers: {
        Origin: "https://dougdouggy.github.io",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Doug", version: SIMULATION_VERSION }),
    }),
    env,
  );
  assert.equal(response.status, 200);
  assert.equal(seen.length, 3);
  assert.equal((await response.json()).code, seen[2].body.code);
  assert(seen.every((r) => r.n === "room:" + r.body.code));
});
