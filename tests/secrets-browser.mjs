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
    const {
      Game,
      Body,
      World,
      Engine,
      overlaps,
      parseProfile,
      defaults,
      trophyEvent,
    } = window.__arenaTest;
    const { shaft, physicalMass } =
      await import("/secret-modes.js?v=secrets-14");
    const { SECRET_TROPHIES, secretProfile } =
      await import("/secret-trophies.js?v=secrets-14");
    const { simulateSecretTrophy } =
      await import("/secret-trophy-lab.js?v=secrets-14");
    const out = [];
    function check(name, ok, data) {
      if (!ok) throw Error(name + " " + JSON.stringify(data));
      out.push({ name, data });
    }
    function seeded(n = 1) {
      let seed = n;
      return () =>
        (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    }
    for (const t of SECRET_TROPHIES)
      check("sandbox trigger " + t.id, simulateSecretTrophy(t.id).selected);
    const profile = parseProfile(
      JSON.stringify({
        points: 750,
        owned: ["plain", "none", "tux"],
        equipped: { hat: "none", outfit: "tux" },
        modeWins: { classic: 2, gros: 3, usa: 4, somalia: 10 },
        trophies: { "somalia-win": 123, "classic-win": 456 },
      }),
    );
    check(
      "Somalia migration preserves old reward timestamp without normal listing",
      profile.shadow.legacy.somaliaWin === 123 &&
        !profile.trophies["somalia-win"] &&
        profile.trophies["classic-win"] === 456,
    );
    check(
      "migration preserves cosmetics wallet and existing mode wins",
      profile.points === 750 &&
        profile.equipped.outfit === "tux" &&
        profile.modeWins.somalia === 10,
    );
    check(
      "migration restores ten Somalia wins trophy",
      !!profile.shadow.trophies["shadow-somalia-wins10"],
    );
    const saved = JSON.stringify(profile),
      reloaded = parseProfile(saved);
    check(
      "shadow trophies survive reload independently",
      JSON.stringify(reloaded.shadow) === JSON.stringify(profile.shadow),
    );
    for (const mode of ["platform", "cannibal", "icecream"]) {
      const g = new Game(
        mode === "platform" ? 1600 : 2400,
        mode === "platform" ? 1200 : 1800,
        seeded(),
        {
          mode,
          mapId: mode,
          count: mode === "platform" ? 2 : 16,
          headless: true,
        },
      );
      check(
        mode + " uses correct food and actor count",
        g.people.length === (mode === "platform" ? 2 : 16) &&
          g.food.every((f) =>
            mode === "platform"
              ? f.type === "burger"
              : f.type === (mode === "cannibal" ? "victim" : "child"),
          ),
        { people: g.people.length, food: g.food.length },
      );
      const p = g.people[0],
        q = g.people[1];
      if (mode === "platform") {
        g.eat(p, q);
        check("platform forbids predation", q.alive && p.mass === 60);
        g.resize(p, 2000);
        check(
          "platform 2000kg has finite pushable sublinear mass",
          Math.abs(p.body.mass - physicalMass(2000, "platform")) < 1e-7 &&
            p.body.mass < 35,
          p.body.mass,
        );
        Body.setPosition(p.body, { x: 600, y: 900 });
        Body.setPosition(q.body, { x: 540, y: 900 });
        Body.setVelocity(q.body, { x: 17, y: 0 });
        const start = p.body.position.x;
        for (let i = 0; i < 30; i++) Engine.update(g.engine, 1000 / 60);
        check(
          "60kg impact really moves 2000kg body",
          p.body.position.x > start + 0.5,
          { start, end: p.body.position.x },
        );
        g.resize(p, 60);
        g.round = 3;
        Body.setPosition(p.body, { x: 800, y: 600 });
        Body.setPosition(q.body, { x: 1300, y: 600 });
        check(
          "third feast turn starts descending platform",
          g.mechanics.finishReady() === false &&
            g.phase === "lift" &&
            !p.alive &&
            q.alive,
        );
        g.secretRules.tick(1200);
        check(
          "departure finishes without blocking the turn",
          g.phase === "moving",
        );
        g.secretRules.resetDuel(
          [
            { id: 0, name: "A", mass: 1000 },
            { id: 1, name: "B", mass: 2000 },
          ],
          2,
        );
        check(
          "next duel keeps both accumulated weights",
          g.people[0].mass === 1000 &&
            g.people[1].mass === 2000 &&
            g.round === 1 &&
            g.food.length === 30,
        );
        g.round = 4;
        Body.setPosition(p.body, { x: 800, y: 600 });
        g.secretRules.substep(16);
        check(
          "first combat turn detects actual central fall",
          !p.alive && p.deathReason === "shaft",
        );
      } else {
        const f = g.food[0],
          start = { x: f.x, y: f.y };
        g.secretRules.launch();
        for (let i = 0; i < 80; i++) g.secretRules.substep(10);
        check(
          mode + " prey movement is short and obeys obstacles",
          Math.hypot(f.x - start.x, f.y - start.y) <= 60 &&
            !g.obstacles.some((o) => overlaps(f, 15, o)),
          { distance: Math.hypot(f.x - start.x, f.y - start.y) },
        );
        g.food = [
          {
            x: p.body.position.x,
            y: p.body.position.y,
            type: mode === "cannibal" ? "victim" : "child",
            size: "normal",
            motionLeft: 0,
          },
        ];
        g.phase = "moving";
        g.step();
        check(mode + " capture grants exactly 40kg", p.mass === 100, p.mass);
        if (mode === "icecream") {
          check(
            "van has illustrated rectangular collision hull",
            p.body.vertices.length !== 20 && p.body.circleRadius > 0,
            p.body.vertices.length,
          );
          g.resize(p, 1000);
          q.capturedChildren = 2;
          g.eat(p, q);
          check(
            "van absorbs normal 55 percent of rival mass including captured food",
            Math.abs(p.mass - 1033) < 0.01,
            p.mass,
          );
        }
      }
      g.destroy();
    }
    // Actual physical capture of five moving prey in one propulsion.
    for (const mode of ["cannibal", "icecream"]) {
      const g = new Game(2400, 1800, seeded(93), {
        mode,
        mapId: mode,
        count: 16,
      });
      const profile = defaults(),
        p = g.people[0],
        q = g.people[1];
      for (const other of g.people.slice(2)) {
        other.alive = false;
        World.remove(g.engine.world, other.body);
      }
      Body.setPosition(p.body, { x: 400, y: 1040 });
      Body.setPosition(q.body, { x: 1400, y: 1000 });
      g.food = [500, 560, 620, 680, 740].map((x) => ({
        x,
        y: 1040,
        type: mode === "cannibal" ? "victim" : "child",
        size: "normal",
      }));
      g.foodTarget = 0;
      g.foodCap = 0;
      g.plan = () => ({ x: 0, y: 0 });
      g.onEvent = (e, a, d) => trophyEvent(profile, e, a, d, g);
      g.launch({ x: 17, y: 0 });
      for (let i = 0; i < 100 && g.phase === "moving"; i++) g.step();
      check(
        mode + " five captures are physically achievable in one propulsion",
        p.mass === 260 && !!profile.shadow.trophies[`shadow-${mode}-five`],
        { mass: p.mass, food: profile.shadow.totals },
      );
      g.destroy();
    }
    {
      const g = new Game(1600, 1200, seeded(11), {
        mode: "platform",
        mapId: "platform",
        headless: true,
      });
      const p = g.people[0],
        q = g.people[1],
        profile = defaults();
      g.resize(p, 240);
      g.food = [];
      g.round = 3;
      g.secretRules.arrival = 0;
      Body.setPosition(p.body, { x: 500, y: 600 });
      Body.setPosition(q.body, { x: 560, y: 600 });
      Body.setVelocity(p.body, { x: 1.5, y: 0 });
      Body.setVelocity(q.body, { x: 0, y: 0 });
      g.phase = "moving";
      g.onEvent = (e, a, d) => trophyEvent(profile, e, a, d, g);
      for (let i = 0; i < 600 && g.phase !== "ended"; i++) g.step();
      check(
        "Service compris is achievable with real third-turn push and descending platform",
        g.outcome === "win" &&
          !!profile.shadow.trophies["shadow-platform-departure"],
        {
          outcome: g.outcome,
          round: g.round,
          player: p.body.position,
          opponent: q.body.position,
          push: q.fallData,
        },
      );
      g.destroy();
    }
    // All eight real physical duels run together, no simulated coin-flip results.
    let heavyFinals = 0;
    for (const seed of [17, 71]) {
      const g = new Game(1600, 1200, seeded(seed), {
        mode: "platform",
        mapId: "platform",
        count: 2,
        simulation: true,
      });
      let frames = 0,
        maxMass = 60;
      while (g.phase !== "ended" && frames < 100000) {
        if (g.phase === "aim" && g.secretRules.arrival === 0)
          g.launch(g.secretRules.plan(g.people[0]));
        g.step(1000 / 30);
        maxMass = Math.max(maxMass, ...g.people.map((p) => p.mass));
        frames++;
      }
      const tournament = g.secretRules.tournament;
      check(
        "full sixteen-entrant physical tournament terminates seed " + seed,
        g.phase === "ended" && tournament.stage === 4,
        {
          phase: g.phase,
          stage: tournament.stage,
          frames,
          round: g.round,
          results: tournament.results.length,
          maxMass,
          winnerMass: g.secretRules.lastResult.winner.mass,
        },
      );
      check(
        "all fourteen preceding matches have physical winners",
        tournament.results.length === 14 &&
          new Set(
            tournament.results
              .filter((r) => r.stage === 1)
              .map((r) => r.winner.id),
          ).size === 8,
        tournament.results.length,
      );
      const winner = g.people.find((p) => p.alive);
      if (winner.mass >= 2000) {
        const profile = defaults(),
          final = {
            mode: "platform",
            people: [winner],
            mechanics: { clock: 0 },
            outcome: "win",
          };
        trophyEvent(profile, "end", winner, null, final);
        check(
          "2000kg final trophy is attainable from a real tournament winner",
          !!profile.shadow.trophies["shadow-platform-2000"],
          winner.mass,
        );
        heavyFinals++;
      }
      g.destroy();
    }
    check(
      "at least one full physical tournament produced a 2000kg champion",
      heavyFinals > 0,
      heavyFinals,
    );
    return out;
  });
  console.log(JSON.stringify(results, null, 2));
  console.log(results.length + " secret engine/profile/trophy checks passed.");
  const uiChecks = [];
  async function enterShadow(target = page) {
    await target.waitForFunction(
      () =>
        document.querySelector(".burger-menu").dataset.masksReady === "true",
    );
    await target.locator("#options-entry").focus();
    await target.keyboard.press("Enter");
    await target.locator("#shadow-entry").click();
    await target.locator("#shadow-password").fill("Pologne");
    await target.locator('#shadow-form button[type="submit"]').click();
    await target.locator("#enter-shadow").click();
  }
  await enterShadow();
  assert(
    await page
      .locator("body")
      .evaluate((node) => node.classList.contains("shadow-realm")),
  );
  assert(
    (
      await page
        .locator("#title-screen")
        .evaluate((node) => node.style.backgroundImage)
    ).includes("secrets/burger.webp"),
  );
  await page.screenshot({
    path: path.join(root, "test-results", "face-cachee-burger.png"),
    fullPage: true,
  });
  await page.locator("#trophies-entry").focus();
  await page.keyboard.press("Enter");
  await page.locator("#trophies-dialog").waitFor({ state: "visible" });
  assert.equal(await page.locator("#trophy-grid .trophy-card").count(), 39);
  assert.equal(await page.locator('[data-trophy="somalia-win"]').count(), 0);
  const saveBefore = await page.evaluate(() =>
    localStorage.getItem("bouffe-profile-v1"),
  );
  await page.locator("#trophy-lab-open").click();
  await page.locator("#trophy-lab-select").selectOption("shadow-platform-2000");
  await page.locator("#trophy-lab-run").click();
  assert(
    (await page.locator("#trophy-lab-result").textContent()).includes(
      "Condition déclenchée",
    ),
  );
  assert.equal(
    await page.evaluate(() => localStorage.getItem("bouffe-profile-v1")),
    saveBefore,
  );
  await page.locator("#close-trophy-lab").click();
  await page.screenshot({
    path: path.join(root, "test-results", "trophees-face-cachee.png"),
    fullPage: true,
  });
  await page.locator("#close-trophies").click();
  uiChecks.push("39 separate trophies; sandbox never touches actual storage");
  for (const [slot, id] of [
    ["classic", "platform"],
    ["gros", "cannibal"],
    ["menu-shop", "icecream"],
  ]) {
    const selector =
      slot === "menu-shop" ? "#menu-shop" : `[data-menu-mode="${slot}"]`;
    await page.locator(selector).focus();
    await page.keyboard.press("Enter");
    await page.locator('[data-group="available"] .book-cover').click();
    assert.equal(await page.locator(".map-card:visible").count(), 1);
    assert.equal(await page.locator(`[data-map="${id}"]:visible`).count(), 1);
    await page.locator("#start-game").click();
    await page.locator("#close-briefing").click();
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => window.__game.mode), id);
    assert(await page.locator("#shop-dialog").isHidden());
    await page.screenshot({
      path: path.join(root, "test-results", `secret-${id}.png`),
    });
    if (id === "platform") {
      await page.locator("#tournament-open").click();
      assert.equal(await page.locator("#tournament-matches p").count(), 8);
      await page.locator("#close-tournament").click();
      await page.evaluate(() => {
        const g = window.__game;
        g.round = 3;
        g.secretRules.arrival = 0;
        g.food = [];
        g.mechanics.finishReady();
      });
      await page.waitForTimeout(350);
      await page.screenshot({
        path: path.join(root, "test-results", "secret-platform-descente.png"),
      });
    }
    const aim = await page.evaluate(() => {
      const g = window.__game,
        p = g.people[0];
      return { alive: p.alive, phase: g.phase };
    });
    if (aim.alive && aim.phase === "aim") {
      await page.evaluate(() => window.__game.launch({ x: 5, y: 2 }));
      await page.waitForTimeout(200);
    }
    await page.locator("#back-menu").click();
    uiChecks.push("real secret menu starts " + id);
  }
  // Actual capture -> save -> reload -> separate trophy room.
  await page.locator('[data-menu-mode="gros"]').focus();
  await page.keyboard.press("Enter");
  await page.locator('[data-group="available"] .book-cover').click();
  await page.locator("#start-game").click();
  await page.locator("#close-briefing").click();
  await page.evaluate(() => {
    const g = window.__game,
      p = g.people[0];
    g.food = [
      {
        x: p.body.position.x,
        y: p.body.position.y,
        type: "victim",
        size: "normal",
        motionLeft: 0,
      },
    ];
    g.phase = "moving";
    g.step();
  });
  const actualSave = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bouffe-profile-v1")),
  );
  assert(actualSave.shadow.trophies["shadow-cannibal-first"]);
  assert(!actualSave.trophies["shadow-cannibal-first"]);
  await page.reload();
  await enterShadow();
  await page.locator("#trophies-entry").focus();
  await page.keyboard.press("Enter");
  await page.locator("#trophies-dialog").waitFor({ state: "visible" });
  assert(
    await page
      .locator('[data-trophy="shadow-cannibal-first"]')
      .evaluate((node) => node.classList.contains("unlocked")),
  );
  await page.locator("#close-trophies").click();
  await page.locator("#options-entry").focus();
  await page.keyboard.press("Enter");
  await page.locator("#return-classic").click();
  await page.locator("#trophies-entry").focus();
  await page.keyboard.press("Enter");
  await page.locator("#trophies-dialog").waitFor({ state: "visible" });
  assert.equal(await page.locator('[data-trophy^="shadow-"]').count(), 0);
  assert.equal(await page.locator('[data-trophy="somalia-win"]').count(), 0);
  await page.locator("#close-trophies").click();
  uiChecks.push(
    "real capture saved and reloaded; hidden trophies absent from normal room",
  );
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  mobile.on("pageerror", (e) => errors.push(e.message));
  await mobile.goto(`http://127.0.0.1:${server.address().port}`);
  await enterShadow(mobile);
  await mobile.screenshot({
    path: path.join(root, "test-results", "face-cachee-mobile.png"),
    fullPage: true,
  });
  for (const [slot, id] of [
    ["classic", "platform"],
    ["gros", "cannibal"],
    ["menu-shop", "icecream"],
  ]) {
    const selector =
      slot === "menu-shop" ? "#menu-shop" : `[data-menu-mode="${slot}"]`;
    await mobile.locator(selector).focus();
    await mobile.keyboard.press("Enter");
    await mobile.locator('[data-group="available"] .book-cover').tap();
    await mobile.locator("#start-game").tap();
    await mobile.locator("#close-briefing").tap();
    const aim = await mobile.evaluate(() => {
      const p = window.__game.people[0].body.position,
        v = window.__view,
        c = document.querySelector("#game").getBoundingClientRect();
      return {
        x: c.left + ((p.x - v.camera.x) * c.width) / v.sceneW,
        y: c.top + ((p.y - v.camera.y) * c.height) / v.sceneH,
      };
    });
    await mobile.mouse.move(aim.x, aim.y);
    await mobile.mouse.down();
    await mobile.mouse.move(aim.x - 55, aim.y + 20, { steps: 4 });
    await mobile.mouse.up();
    await mobile.waitForFunction(() => !!window.__game.people[0].roundStart);
    await mobile.screenshot({
      path: path.join(root, "test-results", `secret-mobile-${id}.png`),
    });
    await mobile.locator("#back-menu").tap();
    uiChecks.push("mobile propulsion " + id);
  }
  await mobile.close();
  console.log(uiChecks);
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
