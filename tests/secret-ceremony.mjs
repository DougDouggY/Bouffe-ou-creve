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
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});

try {
  const context = await browser.newContext({
      viewport: { width: 1366, height: 1000 },
    }),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.__gameTest);
  assert.equal(await page.locator(".ceremony-webgl").count(), 0);
  await page.locator("#options-entry").press("Enter");
  await page.locator("#shadow-entry").click();
  await page.locator("#shadow-password").fill("Pologne");
  await page.locator("#shadow-form button[type=submit]").click();
  await page.locator("#enter-shadow").click();
  await page.waitForFunction(() =>
    document
      .querySelector("#title-screen")
      .style.backgroundImage.includes("burger-chicken-bloody"),
  );
  await page.locator("#solo-entry").press("Enter");
  await page.locator("#solo-menu").waitFor({ state: "visible" });
  assert.deepEqual(
    await page.locator("[data-solo-mode] strong").allTextContents(),
    [
      "Somalie",
      "Le Plateau",
      "Burger Games",
      "Le Festin cannibale",
      "Le Marchand de glaces",
    ],
  );
  await page.locator("[data-solo-mode=platform]").click();
  assert.match(
    await page.locator("#map-mode-title").textContent(),
    /LE PLATEAU/,
  );
  assert.equal(
    await page
      .locator("#map-screen h3")
      .allTextContents()
      .then((a) => a.filter((s) => s === "Burger Games").length),
    0,
  );
  await page.locator("#back-title").click();
  await page.locator("#solo-entry").press("Enter");
  await page.locator("[data-solo-mode=survival]").click();
  assert.match(
    await page.locator("#map-mode-title").textContent(),
    /BURGER GAMES/,
  );
  await page.locator("#back-title").click();
  const show = async (team = false) =>
    page.evaluate((team) => {
      const t = window.__gameTest,
        people = Array.from({ length: 8 }, (_, id) => ({
          id,
          name: id === 0 ? "Doug" : "Gourmand " + id,
          mass: 60 + id * 180,
          teamId: Math.floor(id / 2),
          cosmetics: {
            hat: ["hat_pancakes", "chef", "crown", "pirate"][id % 4],
            outfit: "outfit_royal",
            podium: id === 3 ? "podium_despair" : "podium_jump",
          },
        }));
      t.showPodium(
        {
          champions: team ? [0, 1] : [0],
          predators: [0],
          predatorKills: 4,
          first: 3,
          teamSize: team ? 2 : 1,
          teamId: 0,
        },
        people,
        t.renderPodiumAvatar,
      );
      document.body.classList.add("online-playing");
      document.querySelector("#overlay").hidden = false;
      document.querySelector("#play-area").hidden = false;
      document.querySelector("#main-menu").hidden = true;
    }, team);
  await show();
  await page.waitForSelector("[data-renderer=webgl]");
  await page.locator(".ceremony-skip").click();
  await page.waitForTimeout(600);
  assert(
    (await page.locator("#match-podium").getAttribute("data-triangles")) > 1000,
  );
  const snap = () => page.locator(".ceremony-webgl").screenshot();
  const a = await snap();
  await page.waitForTimeout(250);
  const b = await snap();
  assert(!a.equals(b), "3D motion changes real rendered pixels");
  await page
    .locator("#match-podium")
    .screenshot({ path: path.join(output, "secret42-podium-desktop.png") });

  await page.locator(".podium-course--first .ceremony-person").click();
  assert.equal(
    await page
      .locator(".podium-course--first canvas")
      .getAttribute("data-animation"),
    "celebration",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(180);
  assert(
    await page
      .locator("#overlay>div")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  );
  await page
    .locator("#match-podium")
    .screenshot({ path: path.join(output, "secret42-podium-mobile.png") });
  await page.evaluate(() => window.__gameTest.clearPodium());
  assert.equal(await page.locator(".ceremony-webgl").count(), 0);
  await page.setViewportSize({ width: 1366, height: 1000 });
  await show(true);
  await page.waitForSelector("[data-renderer=webgl]");
  await page.waitForTimeout(1600);
  await page
    .locator("#match-podium")
    .screenshot({ path: path.join(output, "secret42-podium-team.png") });
  // A lost GPU context releases 3D resources and restores the articulated Canvas ceremony.
  await page
    .locator(".ceremony-webgl")
    .evaluate((c) =>
      c.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  assert.equal(await page.locator(".ceremony-webgl").count(), 0);
  assert.equal(
    await page.locator("#match-podium").getAttribute("data-renderer"),
    "canvas",
  );
  await page.evaluate(() => window.__gameTest.clearPodium());
  assert.deepEqual(errors, []);
  console.log(
    "Five direct secret games, bloody complete illustration, isolated maps, real WebGL moving pixels, duplicate award, click replay, portrait layout, team podium, GPU-loss fallback and cleanup passed.",
  );
  await context.close();
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
