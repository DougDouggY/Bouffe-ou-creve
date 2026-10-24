import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const types = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".webp": "image/webp",
  ".png": "image/png",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
};
const server = createServer(async (req, res) => {
  try {
    const relative = new URL(req.url, "http://localhost").pathname;
    const filename = path.resolve(
      root,
      "." + (relative === "/" ? "/index.html" : relative),
    );
    if (!filename.startsWith(root + path.sep)) throw Error();
    let source = await readFile(filename);
    if (filename === path.join(root, "game.js"))
      source = Buffer.concat([
        source,
        Buffer.from(
          "\nwindow.__arenaTest={Game:zt,Body:eA,Bodies:yA,World:XA,Engine:he,catalog:CA,overlaps:RA,renderFloor:dt,parseProfile:Xe,defaults:Te,trophyEvent:UI,get active(){return K;}};",
        ),
      ]);
    res.writeHead(200, {
      "content-type":
        types[path.extname(filename)] || "application/octet-stream",
    });
    res.end(source);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage({
      viewport: { width: 1280, height: 1000 },
    }),
    errors = [];
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.error(e.message);
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.__arenaTest);
  const results = await page.evaluate(async () => {
    const { Game, Body, World, Engine, overlaps } = window.__arenaTest;
    const { shaft, overShaft } =
      await import("/secret-modes.js?v=filmovore-15");
    const { survivalZone } = await import("/survival.js?v=hunger-18");
    const { clearRoute, survivalWaypoint } =
      await import("/survival-navigation.js?v=hunger-18");
    const result = [];
    const check = (name, ok, data) => {
      if (!ok) throw Error(name + ": " + JSON.stringify(data));
      result.push({ name, data });
    };
    const seeded = (n) => () =>
      (n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296;
    const make = (mass = 60) => {
      const g = new Game(1600, 1200, seeded(41), {
        mode: "platform",
        mapId: "platform",
        count: 2,
        headless: true,
      });
      g.food = [];
      g.foodCap = 0;
      g.foodTarget = 0;
      g.plan = () => ({ x: 0, y: 0 });
      g.resize(g.people[0], mass);
      Body.setPosition(g.people[0].body, { x: 300, y: 250 });
      Body.setPosition(g.people[1].body, { x: 1300, y: 1000 });
      return g;
    };
    let baseline;
    for (const [mass, ratio] of [
      [60, 1],
      [500, 0.9],
      [1000, 0.85],
      [2000, 0.8],
    ]) {
      const g = make(mass),
        p = g.people[0];
      g.launch({ x: 0, y: 17 });
      for (let i = 0; i < 150; i++) g.step();
      const distance = p.body.position.y - 250;
      baseline ??= distance;
      check(
        "actual no-collision travel " + mass + "kg",
        Math.abs(distance / baseline - ratio) < 0.025,
        { distance, ratio: distance / baseline },
      );
      g.destroy();
    }
    for (const [a, b] of [
      [60, 60],
      [60, 500],
      [100, 1000],
      [500, 2000],
      [1000, 1000],
      [2000, 2000],
    ]) {
      const g = make(a),
        p = g.people[0],
        q = g.people[1];
      g.resize(q, b);
      const start = 300 + p.body.circleRadius + q.body.circleRadius + 35;
      Body.setPosition(q.body, { x: start, y: 250 });
      g.launch({ x: 17, y: 0 });
      let max = 0;
      for (let i = 0; i < 70; i++) {
        g.step();
        max = Math.max(max, q.body.speed);
      }
      check(
        "actual impact " + a + " vs " + b,
        Number.isFinite(q.body.position.x) &&
          max > 0.12 &&
          q.body.position.x > start + 3,
        { speed: max, pushed: q.body.position.x - start },
      );
      g.destroy();
    }
    {
      const g = new Game(1600, 1200, seeded(41), {
          mode: "platform",
          mapId: "platform",
          count: 2,
          headless: true,
        }),
        s = shaft(g),
        p = g.people[0];
      Body.setPosition(p.body, { x: s.x, y: s.y });
      check("visible platform centre supported", overShaft(g, p));
      Body.setPosition(p.body, { x: s.x + s.half + 1, y: s.y });
      check("outside platform is outside shaft", !overShaft(g, p));
      check(
        "platform food is scattered inside exact plate",
        g.food.length === 30 &&
          new Set(g.food.map((f) => f.x)).size === 30 &&
          g.food.every(
            (f) => Math.abs(f.x - s.x) < s.half && Math.abs(f.y - s.y) < s.half,
          ),
      );
      g.destroy();
    }
    {
      const g = new Game(2400, 1800, seeded(11), {
          mapId: "nightmarket",
          count: 8,
        }),
        m = g.mechanics,
        p = g.people[0],
        agent = m.actors[0];
      check(
        "more carts and guards",
        m.actors.length === 6 &&
          m.items.filter((i) => i.kind === "lamp").length === 3,
      );
      g.resize(p, 500);
      m.guardContact(p, agent);
      check(
        "500kg eats guard and gets inedible soldier",
        p.alive &&
          p.mass === 555 &&
          agent.soldier &&
          agent.body.circleRadius > 30,
      );
      m.guardContact(p, agent);
      check("soldier cannot be eaten", !p.alive);
      g.destroy();
    }
    {
      const g = new Game(18000, 13500, seeded(17), {
        mode: "survival",
        mapId: "survival",
        count: 24,
      });
      const separation = Math.hypot(
        g.people[0].body.position.x - g.people[1].body.position.x,
        g.people[0].body.position.y - g.people[1].body.position.y,
      );
      check(
        "large arena, spaced ring and final original size",
        separation > 300 &&
          survivalZone(g, 1).r === 5940 &&
          survivalZone(g, 60).r === 990,
        {
          separation,
          initial: survivalZone(g, 1).r,
          final: survivalZone(g, 60).r,
        },
      );
      check(
        "every gourmand has a direct accessible route to the food ring",
        g.people.every((p) =>
          g.food.some(
            (f) =>
              Math.hypot(f.x - p.body.position.x, f.y - p.body.position.y) <
                1800 && clearRoute(p.body.position, f, g.obstacles, 30),
          ),
        ),
      );
      g.plan = () => ({ x: 0, y: 0 });
      for (let shot = 0; shot < 3 && g.people[0].mass === 60; shot++) {
        g.launch({ x: 0, y: 17 });
        for (let i = 0; i < 240 && g.phase === "moving"; i++) g.step();
      }
      check(
        "real approach from spawn reaches and eats the central feast",
        g.people[0].mass > 60,
        { mass: g.people[0].mass, remaining: g.food.length },
      );
      const core = g.obstacles.find((o) => o.scenery === "cornucopia-circle"),
        p = g.people[0];
      check(
        "central decoration is one closed circular body",
        core.r === 420 &&
          g.obstacleBodies[g.obstacles.indexOf(core)].circleRadius === 420,
      );
      const start = { x: core.x - 800, y: core.y },
        target = { x: core.x + 800, y: core.y };
      check(
        "circle blocks straight navigation",
        !clearRoute(start, target, [core], 19),
      );
      const around = survivalWaypoint(g, start, target, 19);
      check(
        "AI finds a clear route around the circular monument",
        Math.abs(around.y - core.y) > 10 &&
          clearRoute(start, around, g.obstacles, 21),
        around,
      );
      g.food = [];
      g.phase = "aim";
      g.resize(p, 60);
      Body.setPosition(p.body, { x: core.x - 650, y: core.y });
      g.launch({ x: 17, y: 0 });
      let nearest = Infinity;
      for (let i = 0; i < 100 && g.phase === "moving"; i++) {
        g.step();
        nearest = Math.min(
          nearest,
          Math.hypot(p.body.position.x - core.x, p.body.position.y - core.y),
        );
      }
      check(
        "real physics never enters the central disk",
        nearest > core.r + p.body.circleRadius - 7,
        { nearest, radius: core.r },
      );
      g.destroy();
    }
    for (const seed of [17, 71, 190]) {
      const started = performance.now(),
        g = new Game(18000, 13500, seeded(seed), {
          mode: "survival",
          mapId: "survival",
          count: 24,
        });
      g.spectate = true;
      check(
        "24 equal ring starts seed " + seed,
        g.people.length === 24 &&
          g.people.every((p) => p.mass === 60) &&
          g.food.length === 96,
      );
      check(
        "ordinary food spawning disabled seed " + seed,
        !g.addFood("burger") && g.foodTarget === 0 && g.foodCap === 0,
      );
      check(
        "initial feast accessible seed " + seed,
        g.food.every((f) => !g.obstacles.some((o) => overlaps(f, 24, o))),
      );
      const history = [],
        intents = new Set();
      let frames = 0,
        lastRound = 0;
      while (g.phase !== "ended" && frames < 40000) {
        if (g.phase === "aim") {
          if (g.round !== lastRound) {
            history.push({
              round: g.round,
              alive: g.people.filter((p) => p.alive).length,
              food: g.food.length,
            });
            lastRound = g.round;
          }
          const p = g.people[0].alive
            ? g.people[0]
            : g.people.find((p) => p.alive);
          const shot = g.plan(p);
          g.launch(g.people[0].alive ? shot : { x: 0, y: 0 });
          for (const p of g.people) if (p.intent) intents.add(p.intent);
        }
        g.step(1000 / 30);
        frames++;
      }
      check(
        "complete survival match seed " + seed,
        g.phase === "ended" && g.people.filter((p) => p.alive).length <= 1,
        {
          round: g.round,
          frames,
          survivors: g.people.filter((p) => p.alive).length,
        },
      );
      check(
        "simultaneous elimination has explicit draw seed " + seed,
        g.people.some((p) => p.alive) || g.outcome === "draw",
      );
      check(
        "hunting and escape strategies seed " + seed,
        intents.has("hunt") && intents.has("flee"),
        [...intents],
      );
      result.push({
        name: "survival report " + seed,
        data: {
          ms: Math.round(performance.now() - started),
          simulatedSeconds: Math.round(g.secretRules.clock / 1000),
          history,
          drops: g.secretRules.dropHistory,
          intents: [...intents],
          final: g.people
            .filter((p) => p.alive)
            .map((p) => ({ id: p.id, mass: p.mass })),
        },
      });
      g.destroy();
    }
    return result;
  });
  console.log(JSON.stringify(results, null, 2));
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  server.close();
}
