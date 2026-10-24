import { openGourmand } from "./restaurant-navigation.mjs";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const output = path.join(root, "test-results");
await mkdir(output, { recursive: true });
const types = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".png": "image/png",
  ".webp": "image/webp",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
};
const server = createServer(async (request, response) => {
  try {
    const relative = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    const filename = path.resolve(
      root,
      "." + (relative === "/" ? "/index.html" : relative),
    );
    if (!filename.startsWith(root + path.sep)) throw new Error("Invalid path");
    let content = await readFile(filename);
    if (filename === path.join(root, "game.js")) {
      // Test-only access to the actual running engine, never included in the app.
      content = Buffer.concat([
        content,
        Buffer.from(
          "\nwindow.__gameTest = { Game: zt, Body: eA, World: XA, overlaps: RA, render: Se, showPodium, clearPodium, renderPodiumAvatar, catalog: KA, get active() { return K; } };",
        ),
      ]);
    }
    response.writeHead(200, {
      "content-type":
        types[path.extname(filename)] || "application/octet-stream",
    });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_EXECUTABLE ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  headless: true,
  args: ["--no-sandbox"],
});

try {
  const context = await browser.newContext({
      viewport: { width: 1366, height: 900 },
    }),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    localStorage.setItem(
      "bouffe-profile-v1",
      JSON.stringify({
        points: 20000,
        owned: ["none", "plain", "hat_pancakes", "outfit_royal"],
        equipped: { hat: "hat_pancakes", outfit: "outfit_royal" },
      }),
    );
  });
  await page.goto(url);
  await page.waitForFunction(
    () => document.querySelector(".burger-menu").dataset.masksReady === "true",
  );
  await openGourmand(page);
  await page.locator("#shop-dialog").waitFor({ state: "visible" });
  await page.waitForFunction(() =>
    [...document.images].every((i) => i.complete),
  );
  await page.locator("#wardrobe-weight").fill("4000");
  await page.locator("#wardrobe-weight").dispatchEvent("input");
  assert.match(
    await page.locator("#wardrobe-weight-value").textContent(),
    /4.*000 kg/,
  );
  await page.locator('[data-cosmetics-filter="aura"]').click();
  await page.locator('[data-item="aura_gold"]').click();
  await page.locator('[data-cosmetics-filter="podium"]').click();
  await page.locator('[data-item="podium_jump"]').click();
  await page.locator('[data-cosmetics-filter="title"]').click();
  await page.locator('[data-item="title_3"]').click();
  const save = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bouffe-profile-v1")),
  );
  assert.equal(save.equipped.aura, "aura_gold");
  assert.equal(save.equipped.podium, "podium_jump");
  assert.equal(save.equipped.title, "title_3");
  assert.equal(save.points, 20000 - 280 - 300 - 190);
  await page.waitForFunction(
    () =>
      document.querySelectorAll('.equipment-thumb[data-illustrated="true"]')
        .length === 27,
  );
  for (const name of [
    "L’Abonné du buffet",
    "La Boule",
    "Produit par MVP",
    "Celui qui a accepté les cookies",
  ])
    assert(
      await page
        .locator(".shop-card h3")
        .allTextContents()
        .then((names) => names.includes(name)),
    );
  await page.locator("#preview-podium-animation").click();
  assert.match(
    await page.locator("#avatar-preview").getAttribute("class"),
    /podium_jump/,
  );
  await page.locator('[data-cosmetics-filter="podium"]').click();
  await page.screenshot({
    path: path.join(output, "boutique-animations-illustrees.png"),
  });
  await page.locator('[data-cosmetics-filter="title"]').click();
  await page.screenshot({
    path: path.join(output, "dressing-croissance-4000.png"),
  });
  await page.locator("#close-shop").click();
  const visual = await page.evaluate(async () => {
    const { COSMETIC_CATALOG } =
      await import("./cosmetic-catalog.js?v=ceremony-38");
    const { extraCosmeticImage } = await import("./cosmetics.js?v=podium-35");
    await Promise.all(
      COSMETIC_CATALOG.map((c) => extraCosmeticImage(c.id))
        .filter(Boolean)
        .map((im) =>
          im.complete
            ? Promise.resolve()
            : new Promise((r) =>
                im.addEventListener("load", r, { once: true }),
              ),
        ),
    );
    const t = window.__gameTest,
      canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 900;
    const c = canvas.getContext("2d");
    let n = 0;
    for (const mass of [8, 60, 500, 4000])
      for (const hat of COSMETIC_CATALOG.filter((x) => x.slot === "hat")) {
        t.render(
          c,
          {
            id: 0,
            preview: true,
            mass,
            body: {
              position: {
                x: 70 + (n % 10) * 96,
                y: 125 + Math.floor(n / 10) * 95,
              },
              circleRadius: 30,
              speed: 0,
            },
          },
          0,
          { hat: hat.id, outfit: "outfit_royal" },
        );
        n++;
      }
    document.body.append(canvas);
    canvas.id = "all-hats-test";
    return n;
  });
  assert.equal(visual, 96);
  await page
    .locator("#all-hats-test")
    .screenshot({ path: path.join(output, "chapeaux-tous-les-poids.png") });
  await page.evaluate(() => document.querySelector("#all-hats-test").remove());
  const outfitsChecked = await page.evaluate(() => {
    const t = window.__gameTest,
      canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 210;
    const c = canvas.getContext("2d", { willReadFrequently: true });
    let checks = 0;
    for (const mass of [8, 60, 500, 4000])
      for (const outfit of t.catalog.filter(
        (x) => x.slot === "outfit" && x.id !== "plain",
      )) {
        const render = (skin) => {
          c.clearRect(0, 0, 160, 210);
          t.render(
            c,
            {
              id: 0,
              preview: true,
              mass,
              skin,
              body: { position: { x: 80, y: 120 }, circleRadius: 45, speed: 0 },
            },
            0,
            { hat: "hat_pancakes", outfit: outfit.id },
          );
          return [...c.getImageData(0, 120, 160, 90).data];
        };
        const a = render("#ff0000"),
          b = render("#0000ff");
        if (a.some((x, i) => x !== b[i]))
          throw Error("Base skin leaked through " + outfit.id + " at " + mass);
        checks++;
      }
    return checks;
  });
  assert.equal(outfitsChecked, 84);
  const visibility = await page.evaluate(async () => {
    const { drawAura } = await import("./cosmetic-effects.js?v=ceremony-38");
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const c = canvas.getContext("2d", { willReadFrequently: true });
    c.translate(50, 40);
    c.scale(10, 10);
    drawAura(c, "aura_gold", 0, "simple");
    const data = c.getImageData(0, 0, 100, 100).data;
    let visible = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 220) visible++;
    return visible;
  });
  assert(
    visibility > 60,
    "Aura should stay clearly visible at phone-sized avatar scale",
  );
  const trampoline = await page.evaluate(async () => {
    const { drawArenaFloor } = await import("./arena-render.js?v=ceremony-38");
    const { setCosmeticMotion } =
      await import("./cosmetic-effects.js?v=ceremony-38");
    const g = new window.__gameTest.Game(1400, 900, () => 0.5, {
      mapId: "trampoline",
      count: 8,
    });
    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = 900;
    const c = canvas.getContext("2d", { willReadFrequently: true });
    drawArenaFloor(c, g, 0);
    await new Promise((r) => setTimeout(r, 250));
    const pad = g.zones.find((z) => z.kind === "trampoline");
    function pixels(time) {
      c.clearRect(0, 0, 1400, 900);
      drawArenaFloor(c, g, time);
      return [
        ...c.getImageData(
          Math.floor(pad.x - pad.r - 15),
          Math.floor(pad.y - pad.r - 15),
          Math.ceil(pad.r * 2 + 30),
          Math.ceil(pad.r * 2 + 30),
        ).data,
      ];
    }
    setCosmeticMotion("full");
    const a = pixels(0),
      b = pixels(450);
    let changed = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) changed++;
    setCosmeticMotion("simple");
    const fixed = pixels(0),
      fixed2 = pixels(450);
    const stable = fixed.every((value, i) => value === fixed2[i]);
    setCosmeticMotion("full");
    g.destroy();
    return { changed, stable };
  });
  assert(trampoline.changed > 100);
  assert(trampoline.stable);
  const timings = await page.evaluate(() => {
    const t = window.__gameTest,
      canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const c = canvas.getContext("2d"),
      rows = [];
    for (const count of [8, 24, 50])
      for (const aura of [
        undefined,
        ...t.catalog
          .filter((x) => x.slot === "aura" && x.price > 0)
          .map((x) => x.id),
      ]) {
        const people = Array.from({ length: count }, (_, id) => ({
          id,
          preview: true,
          mass: 500,
          body: {
            position: {
              x: 50 + (id % 10) * 70,
              y: 100 + Math.floor(id / 10) * 90,
            },
            circleRadius: 26,
            speed: 0,
          },
        }));
        for (const p of people)
          t.render(c, p, 0, {
            hat: "hat_pancakes",
            outfit: "outfit_royal",
            aura,
          });
        const start = performance.now();
        for (let frame = 0; frame < 60; frame++) {
          c.clearRect(0, 0, 800, 600);
          for (const p of people)
            t.render(c, p, frame * 16, {
              hat: "hat_pancakes",
              outfit: "outfit_royal",
              aura,
            });
        }
        rows.push({
          count,
          aura: aura || "none",
          meanMsPerFrame: (performance.now() - start) / 60,
        });
      }
    return rows;
  });
  console.log(
    "Actual avatar render benchmark (not whole game FPS):",
    JSON.stringify(timings),
  );
  await page.evaluate(() => {
    const t = window.__gameTest;
    const people = Array.from({ length: 8 }, (_, id) => ({
      id,
      name: id === 0 ? "<Doug>" : "Gourmand " + id,
      mass: 60 + id * 150,
      teamId: Math.floor(id / 2),
      cosmetics: {
        hat: id % 2 ? "chef" : "hat_pancakes",
        outfit: "outfit_royal",
        aura: "aura_gold",
        podium: "podium_jump",
      },
    }));
    t.showPodium(
      {
        champions: [0, 1],
        predators: [0],
        predatorKills: 4,
        first: 3,
        teamSize: 2,
        teamId: 0,
      },
      people,
      t.renderPodiumAvatar,
    );
    document.body.classList.add("online-playing");
    document.querySelector("#overlay").hidden = false;
    document.querySelector("#play-area").hidden = false;
    document.querySelector("#main-menu").hidden = true;
  });
  assert.equal(await page.locator(".podium-course").count(), 3);
  assert.match(
    await page.locator(".podium-course--first h3").textContent(),
    /LE BURGER DU JOUR/,
  );
  assert.equal(
    await page.locator(".podium-course--champion figure").count(),
    2,
  );
  assert.equal(
    await page
      .locator("#match-podium canvas[data-animation=celebration]")
      .count(),
    3,
  );
  assert.equal(await page.locator("Doug").count(), 0);
  await page.locator(".ceremony-skip").click();
  await page.waitForTimeout(120);
  await page
    .locator("#overlay")
    .screenshot({ path: path.join(output, "podium-burger-du-jour.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(
    await page
      .locator("#overlay > div")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  );
  await page.evaluate(() => window.__gameTest.clearPodium());
  assert(await page.locator("#match-podium").isHidden());
  assert.deepEqual(errors, []);
  await context.close();
  console.log(
    "All hats at four weights, actual Dressing purchases/save, three podium distinctions, duplicate animation guard and mobile layout passed.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
