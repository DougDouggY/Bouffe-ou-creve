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
          "\nwindow.__arenaTest={Game:zt,Body:eA,Bodies:yA,World:XA,Engine:he,catalog:CA,renderFloor:dt,get active(){return K;}};",
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
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.__arenaTest);
  const results = await page.evaluate(async () => {
    const { Game, Body, Bodies, World, Engine } = window.__arenaTest;
    const out = [];
    function check(name, condition, data) {
      if (!condition) throw Error(name + " " + JSON.stringify(data));
      out.push({ name, data });
    }
    function seeded() {
      let seed = 17491;
      return () =>
        (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    }
    function game(mapId) {
      const g = new Game(1000, 600, seeded(), { mapId, count: 8, chef: true });
      g.food = [];
      g.mechanics.items = [];
      g.onEvent = () => {};
      for (const p of g.people) {
        Body.setPosition(p.body, { x: 80 + p.id * 110, y: 550 });
        Body.setVelocity(p.body, { x: 0, y: 0 });
      }
      g.phase = "moving";
      return g;
    }
    function ticks(g, count) {
      for (let i = 0; i < count; i++) {
        g.mechanics.update(1000 / 60, (dt) => Engine.update(g.engine, dt));
        g.elapsed += 1000 / 60;
      }
    }
    function move(p, x, y, vx = 0, vy = 0) {
      Body.setPosition(p.body, { x, y });
      Body.setVelocity(p.body, { x: vx, y: vy });
    }
    // Real Matter cart impact and secondary transfer.
    {
      const g = game("market"),
        m = g.mechanics,
        c = m.actors[0],
        p = g.people[0],
        q = g.people[1];
      for (const a of m.actors.slice(1)) World.remove(g.engine.world, a.body);
      m.actors = [c];
      c.runawayUntil = 1e9;
      move(c, 400, 300);
      move(p, 340, 300, 12, 0);
      move(q, 500, 300);
      let maxCart = 0,
        maxOther = 0;
      for (let i = 0; i < 60; i++) {
        ticks(g, 1);
        maxCart = Math.max(maxCart, c.body.speed);
        maxOther = Math.max(maxOther, q.body.speed);
      }
      check(
        "cart receives momentum and pushes another gourmand",
        maxCart > 3 && maxOther > 0.5,
        { maxCart, maxOther },
      );
      check("client visibly reacts to losing control", c.reactUntil > 0, {
        reactUntil: c.reactUntil,
      });
      move(c, 955, 300, 15, 0);
      ticks(g, 80);
      check(
        "cart rebounds from wall and stays finite",
        c.body.position.x < 990 && Number.isFinite(c.body.position.x),
        c.body.position,
      );
      move(c, 190, 180, 12, 0);
      ticks(g, 40);
      check(
        "cart respects shelf collision",
        c.body.position.x < 222 || c.body.position.x > 278,
        c.body.position,
      );
      g.destroy();
    }
    {
      const g = game("nightmarket"),
        m = g.mechanics,
        p = g.people[0],
        agent = m.actors[0];
      check(
        "night agents use small preplanned impulses",
        m.actors.length === 2 && Math.hypot(agent.plan.x, agent.plan.y) <= 3.21,
        agent.plan,
      );
      move(agent, 400, 300);
      move(p, 350, 300, 9, 0);
      p.armored = true;
      ticks(g, 10);
      check(
        "security kills even an armored gourmand",
        !p.alive && p.deathReason === "security",
        { alive: p.alive, reason: p.deathReason },
      );
      g.destroy();
    }
    {
      const g = game("nightmarket"),
        m = g.mechanics,
        p = g.people[0],
        agent = m.actors[0];
      move(agent, 400, 300);
      move(p, 350, 300, 9, 0);
      p.securityUntil = g.round;
      ticks(g, 10);
      check(
        "night protection preserves life and physically repels guard",
        p.alive && agent.body.position.x > 405,
        { alive: p.alive, agent: agent.body.position },
      );
      m.pickup(p, { kind: "lamp" });
      m.pickup(p, { kind: "securityShield" });
      g.round = 2;
      m.beginRound();
      check(
        "both exclusive powers cover next complete turn",
        p.lightBoost === 1.8 && p.securityUntil >= g.round,
        { lamp: p.lightBoost, shield: p.securityUntil },
      );
      g.round = 3;
      m.beginRound();
      check(
        "security protection expires after one complete turn; lamp lasts two",
        !p.securityUntil && p.lightBoost === 1.8,
        { shield: p.securityUntil, lamp: p.lightBoost },
      );
      g.round = 4;
      m.beginRound();
      check(
        "lamp returns to normal after two turns",
        p.lightBoost === 1,
        p.lightBoost,
      );
      move(agent, 200, 180, 5, 0);
      ticks(g, 30);
      check(
        "agents cannot pass through shelves",
        agent.body.position.x < 224,
        agent.body.position,
      );
      g.destroy();
    }
    {
      const g = game("fair"),
        p = g.people[0],
        b = g.obstacles[0];
      move(p, b.x - b.r - p.body.circleRadius - 8, b.y, 8, 0);
      let rebound = 0;
      for (let i = 0; i < 15; i++) {
        ticks(g, 1);
        if (p.body.velocity.x < 0) rebound = Math.max(rebound, p.body.speed);
      }
      check(
        "fixed bumper reverses and amplifies impact",
        p.body.velocity.x < 0 && rebound > 8,
        { v: p.body.velocity, rebound, hit: b.hitUntil },
      );
      check(
        "bumper compression animation is triggered",
        b.hitUntil > 0,
        b.hitUntil,
      );
      g.destroy();
    }
    {
      const g = game("royal"),
        m = g.mechanics,
        p = g.people[0],
        q = g.people[1];
      move(p, 450, 320);
      move(q, 550, 320);
      g.resize(q, 600);
      move(q, 550, 320);
      g.food = [{ x: 500, y: 145, type: "burger", size: "normal" }];
      check(
        "royal odd turn begins progressive suction",
        !m.finishReady() && m.environment.kind === "suction",
        m.environment,
      );
      ticks(g, 30);
      check(
        "lighter gourmands are pulled farther",
        320 - p.body.position.y > 320 - q.body.position.y,
        { light: p.body.position.y, heavy: q.body.position.y },
      );
      check("food is physically drawn into mouth", g.food.length === 0, g.food);
      move(p, 500, 190);
      ticks(g, 120);
      check(
        "mouth eliminates every weight",
        !p.alive && p.deathReason === "king",
        { alive: p.alive, reason: p.deathReason },
      );
      check(
        "suction completes before next aiming phase",
        m.finishReady(),
        m.environment,
      );
      g.round = 2;
      m.beginRound();
      check(
        "royal even turn is cosmetic burp",
        !m.finishReady() && m.environment.kind === "burp",
        m.environment,
      );
      ticks(g, 75);
      check("burp completes cleanly", m.finishReady(), m.environment);
      g.destroy();
    }
    {
      const g = game("beach"),
        m = g.mechanics,
        p = g.people[0],
        q = g.people[1];
      g.round = 3;
      move(p, 160, 240);
      move(q, 190, 360);
      m.launch();
      let jumps = 0,
        last = { ...p.body.position };
      for (let i = 0; i < 180; i++) {
        ticks(g, 1);
        jumps = Math.max(
          jumps,
          Math.hypot(p.body.position.x - last.x, p.body.position.y - last.y),
        );
        last = { ...p.body.position };
      }
      check(
        "third-turn wave physically pushes and groups gourmands",
        p.body.position.x > 300 && q.body.position.x > 300,
        { a: p.body.position, b: q.body.position, hit: [...m.waveHit] },
      );
      check("wave movement is gradual, without teleport", jumps < 20, jumps);
      g.destroy();
    }
    {
      const g = game("cantine"),
        p = g.people[0],
        q = g.people[1];
      g.resize(q, 250);
      move(p, 350, 300);
      move(q, 390, 300);
      p.armored = true;
      const mass = q.mass;
      g.eat(q, p);
      check(
        "armored burger absorbs one lethal predation",
        p.alive && !p.armored && q.mass === mass,
        { alive: p.alive, armor: p.armored, mass: q.mass },
      );
      g.eat(q, p);
      check("second predation works normally", !p.alive && q.mass > mass, {
        alive: p.alive,
        mass: q.mass,
      });
      g.destroy();
    }
    {
      const g = game("cantine"),
        m = g.mechanics,
        p = g.people[0],
        q = g.people[1];
      move(p, 200, 300, 10, 0);
      move(q, 600, 400);
      p.infernoReady = true;
      m.launch();
      ticks(g, 18);
      check(
        "fire is emitted along actual movement and owner initially survives",
        p.alive && m.trails.length > 0,
        { alive: p.alive, segments: m.trails.length },
      );
      const trail = m.trails[Math.floor(m.trails.length / 3)];
      move(q, trail.a.x, trail.a.y - 45, 0, 10);
      ticks(g, 6);
      check(
        "crossing fire kills another gourmand",
        !q.alive && q.deathReason === "fire",
        { alive: q.alive, reason: q.deathReason },
      );
      Body.setVelocity(p.body, { x: -12, y: 0 });
      ticks(g, 30);
      check(
        "owner dies after returning across own fire",
        !p.alive && p.deathReason === "fire",
        { alive: p.alive, reason: p.deathReason },
      );
      m.finishRound();
      check(
        "fire disappears at end of turn",
        m.trails.length === 0 && !p.fireActive,
        m.trails.length,
      );
      g.destroy();
    }
    {
      const g = game("cantine"),
        m = g.mechanics;
      let draws = 0;
      g.random = () => {
        draws++;
        return 0.01;
      };
      m.beginRound();
      check("same round cannot repeat global rarity roll", draws === 0, draws);
      g.round++;
      m.beginRound();
      check(
        "new round has exactly one unsuccessful global roll",
        draws === 1,
        draws,
      );
      g.destroy();
    }
    {
      const a = new Game(1000, 600, seeded(), { mapId: "market" }),
        b = new Game(1000, 600, seeded(), { mapId: "nightmarket" });
      check(
        "day and night share exactly the same physical shelf layout",
        JSON.stringify(a.obstacles) === JSON.stringify(b.obstacles),
        a.obstacles.length,
      );
      check(
        "local night objects are actually served at game start",
        b.mechanics.items.some((i) => i.kind === "lamp") &&
          b.mechanics.items.some((i) => i.kind === "securityShield"),
        b.mechanics.items.map((i) => i.kind),
      );
      a.destroy();
      b.destroy();
    }
    for (const id of ["nightmarket", "royal"]) {
      const g = new Game(2200, 1600, seeded(), {
        mapId: id,
        count: 24,
        mode: "gros",
      });
      g.spectate = true;
      for (let round = 0; round < 4 && g.phase === "aim"; round++) {
        g.launch({ x: 8, y: 3 });
        for (let i = 0; i < 1100 && g.phase === "moving"; i++) g.step();
      }
      check(
        id + " 24 simultaneous bodies finish bounded multi-turn simulation",
        g.phase !== "moving" &&
          g.people.every(
            (p) =>
              Number.isFinite(p.body.position.x) &&
              Number.isFinite(p.body.position.y),
          ),
        {
          phase: g.phase,
          round: g.round,
          alive: g.people.filter((p) => p.alive).length,
        },
      );
      g.destroy();
    }
    // Exercise the actual simultaneous launch and finish lifecycle on every changed arena.
    {
      const g = game("fair"),
        p = g.people[0],
        q = g.people[1];
      g.resize(p, 220);
      move(p, 600, 90, 2, 0);
      move(q, 660, 90);
      ticks(g, 30);
      check(
        "predation keeps original speed thresholds inside Matter substeps",
        !q.alive && p.mass > 220,
        { alive: q.alive, mass: p.mass },
      );
      g.destroy();
    }
    for (const id of ["market", "nightmarket", "fair", "royal", "beach"]) {
      const g = new Game(1000, 600, seeded(), {
        mapId: id,
        count: 8,
        chef: true,
      });
      const before = g.people.map((p) => ({ ...p.body.position }));
      g.launch({ x: 5, y: -3 });
      check(
        id + " all living players launched simultaneously",
        g.people.every(
          (p) => p.roundStart && Number.isFinite(p.body.velocity.x),
        ),
        null,
      );
      for (let i = 0; i < 1000 && g.phase === "moving"; i++) g.step();
      check(
        id + " simulation finishes without infinite collisions",
        g.phase === "aim" || g.phase === "ended" || g.phase === "cinematic",
        { phase: g.phase, elapsed: g.elapsed },
      );
      check(
        id + " all positions and masses remain finite",
        g.people.every(
          (p) =>
            Number.isFinite(p.mass) &&
            Number.isFinite(p.body.position.x) &&
            Number.isFinite(p.body.position.y),
        ),
        null,
      );
      g.destroy();
    }
    return out;
  });
  await mkdir(path.join(root, "test-results"), { recursive: true });
  await page.waitForFunction(
    () => document.querySelector(".burger-menu").dataset.masksReady === "true",
  );
  for (const id of ["market", "nightmarket", "fair", "royal", "beach"]) {
    await page.locator('[data-menu-mode="classic"]').focus();
    await page.keyboard.press("Enter");
    await page.locator("#map-screen").waitFor({ state: "visible" });
    await page.locator(`[data-map="${id}"]`).click();
    await page.locator("#start-game").click();
    await page.locator("#close-briefing").click();
    await page.waitForTimeout(250);
    await page.screenshot({
      path: path.join(root, "test-results", `nouvelle-arene-${id}.png`),
    });
    if (id === "royal" || id === "beach") {
      await page.evaluate((id) => {
        const g = window.__arenaTest.active;
        if (id === "beach") g.round = 3;
        g.launch({ x: 0, y: 0 });
        if (id === "royal") g.mechanics.finishReady();
      }, id);
      await page.waitForTimeout(700);
      await page.screenshot({
        path: path.join(root, "test-results", `animation-${id}.png`),
      });
    }
    if (id === "nightmarket") {
      await page.evaluate(() => {
        const g = window.__arenaTest.active;
        g.mechanics.pickup(g.people[0], { kind: "lamp" });
        g.mechanics.pickup(g.people[0], { kind: "securityShield" });
      });
      await page.waitForTimeout(100);
      await page.screenshot({
        path: path.join(root, "test-results", "lampe-protection-nocturne.png"),
      });
    }
    await page.locator("#back-menu").click();
  }
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto(`http://127.0.0.1:${server.address().port}`);
  await mobile.waitForFunction(
    () => document.querySelector(".burger-menu").dataset.masksReady === "true",
  );
  await mobile.locator("#options-entry").focus();
  await mobile.keyboard.press("Enter");
  await mobile.locator("#special-objects-guide summary").click();
  assert(
    (await mobile.locator("#special-objects-guide").textContent()).includes(
      "1 %",
    ),
  );
  await mobile.screenshot({
    path: path.join(root, "test-results", "guide-pouvoirs-mobile.png"),
  });
  await mobile.locator("#close-options").click();
  await mobile.locator('[data-menu-mode="classic"]').focus();
  await mobile.keyboard.press("Enter");
  await mobile.locator('[data-map="nightmarket"]').click();
  await mobile.locator("#start-game").click();
  await mobile.locator("#close-briefing").click();
  await mobile.waitForTimeout(200);
  await mobile.screenshot({
    path: path.join(root, "test-results", "nouveau-nocturne-mobile.png"),
  });
  assert(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await mobile.close();
  console.log("2 additional mobile guide / arena checks passed.");
  console.log(`${results.length} real-engine arena checks passed.`);
  console.log(JSON.stringify(results, null, 2));
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
