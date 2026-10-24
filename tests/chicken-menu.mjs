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
          "\nwindow.__gameTest = { Game: zt, Body: eA, World: XA, overlaps: RA, render: Se, showPodium, clearPodium, renderPodiumAvatar, catalog: KA, drawFood:uI,  get active() { return K; } };",
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
  const page = await browser.newPage({
      viewport: { width: 1366, height: 1000 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() =>
    localStorage.setItem(
      "bouffe-profile-v1",
      JSON.stringify({
        points: 20000,
        owned: ["none", "plain"],
        equipped: { hat: "none", outfit: "plain" },
        modeWins: { classic: 1, gros: 1 },
      }),
    ),
  );
  await page.goto(url);
  await page.waitForFunction(
    () => document.querySelector(".burger-menu").dataset.masksReady === "true",
  );
  assert.deepEqual(errors, []);
  assert.equal(
    await page.locator("#title-screen .ingredient-button").count(),
    4,
  );
  assert.equal(await page.locator("#title-screen h1").count(), 0);
  assert.equal(
    await page.locator("#multiplayer-entry text").textContent(),
    "MULTIJOUEUR",
  );
  const clickFood = async (x, y) => {
    const p = await page.locator(".burger-menu").evaluate(
      (svg, [x, y]) => {
        const p = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM());
        return { x: p.x, y: p.y };
      },
      [x, y],
    );
    await page.mouse.move(p.x, p.y);
    await page.waitForTimeout(240);
    await page.mouse.click(p.x, p.y);
  };
  await page.screenshot({
    path: path.join(output, "chicken-menu-desktop.png"),
  });
  await clickFood(768, 235);
  await page.locator("#shop-dialog").waitFor({ state: "visible" });
  await page.locator('[data-item="chef"]').click();
  await page.locator('#shop-dialog [data-gourmand-page="trophies"]').click();
  await page.locator("#trophies-dialog").waitFor({ state: "visible" });
  await page.locator('#trophies-dialog [data-gourmand-page="look"]').click();
  await page.locator("#shop-dialog").waitFor({ state: "visible" });
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("bouffe-profile-v1")).equipped.hat,
    ),
    "chef",
  );
  await page.locator("#close-shop").click();
  await clickFood(768, 455);
  await page.locator("#solo-menu").waitFor({ state: "visible" });
  assert.equal(await page.locator("[data-solo-mode]").count(), 3);
  for (const mode of ["classic", "gros", "usa"])
    assert(await page.locator(`[data-solo-mode="${mode}"]`).isEnabled());
  await page.screenshot({ path: path.join(output, "chicken-solo-card.png") });
  await page.locator("[data-close-solo]").click();
  await clickFood(768, 657);
  await page.locator("#multiplayer-dialog").waitFor({ state: "visible" });
  assert.match(
    await page.locator("#multiplayer-size").textContent(),
    /Classique.*Grand Banquet.*États-Unis/s,
  );
  await page.locator("#multiplayer-close").click();
  await clickFood(768, 850);
  await page.locator("#options-dialog").waitFor({ state: "visible" });
  await page.locator("#shadow-entry").click();
  await page.locator("#shadow-password").fill("Pologne");
  await page.locator('#shadow-form button[type="submit"]').click();
  await page.locator("#enter-shadow").click();
  await page.locator("#solo-entry").press("Enter");
  await page.locator("#solo-menu").waitFor({ state: "visible" });
  assert.equal(await page.locator("[data-solo-mode]").count(), 5);
  await page.locator("[data-close-solo]").click();
  await page.locator("#gourmand-entry").press("Enter");
  await page.locator("#trophies-dialog").waitFor({ state: "visible" });
  assert(
    await page
      .locator('#trophies-dialog [data-gourmand-page="look"]')
      .isHidden(),
  );
  await page.locator("#close-trophies").click();
  await page.locator("#options-entry").press("Enter");
  await page.locator("#return-classic").click();
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  mobile.on("pageerror", (e) => errors.push(e.message));
  await mobile.goto(url);
  await mobile.waitForFunction(
    () => document.querySelector(".burger-menu").dataset.masksReady === "true",
  );
  await mobile.screenshot({
    path: path.join(output, "chicken-menu-phone.png"),
  });
  for (const [id, dialog] of [
    ["gourmand-entry", "shop-dialog"],
    ["solo-entry", "solo-menu"],
    ["multiplayer-entry", "multiplayer-dialog"],
    ["options-entry", "options-dialog"],
  ]) {
    const p = await mobile.locator("#" + id + " text").boundingBox();
    await mobile.touchscreen.tap(p.x + p.width / 2, p.y + p.height / 2);
    await mobile.locator("#" + dialog).waitFor({ state: "visible" });
    await mobile.locator("#" + dialog).evaluate((d) => d.close());
  }
  await mobile.locator("#solo-entry").press("Enter");
  await mobile.locator('[data-solo-mode="classic"]').click();
  await mobile.locator('[data-group="available"] .book-cover').click();
  await mobile.locator('[data-map="cantine"]').click();
  await mobile.locator("#start-game").click();
  await mobile.locator("#phone-rotate").waitFor({ state: "visible" });
  await mobile.locator("#phone-portrait").click();
  assert(await mobile.locator("#phone-rotate").isHidden());
  await mobile.locator("#close-briefing").click();
  await mobile.setViewportSize({ width: 844, height: 390 });
  await mobile.waitForTimeout(400);
  assert(await mobile.locator("#phone-rotate").isHidden());
  await mobile.screenshot({
    path: path.join(output, "chicken-game-landscape.png"),
  });
  assert.deepEqual(errors, []);
  console.log(
    "Four ingredient masks, real wardrobe purchase + trophy tabs, all solo modes, real multiplayer menu, five hidden modes, portrait touch targets and landscape fallback passed.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
