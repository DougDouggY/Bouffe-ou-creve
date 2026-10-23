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
          "\nwindow.__gameTest = { Game: zt, Body: eA, World: XA, overlaps: RA, get active() { return K; } };",
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
let checks = 0;
try {
  const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    }),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(
    () => document.querySelector(".burger-menu").dataset.masksReady === "true",
  );
  assert.equal(await page.locator(".ingredient-button").count(), 6);
  assert.equal(
    await page.locator("html").getAttribute("data-display"),
    "desktop",
  );
  await page.locator("#options-entry").focus();
  await page.keyboard.press("Enter");
  await page.locator('input[name="display-mode"][value="phone"]').check();
  assert.equal(
    await page.locator("html").getAttribute("data-display"),
    "phone",
  );
  assert((await page.locator("#title-screen").boundingBox()).width <= 640);
  await page.reload();
  await page.waitForFunction(
    () => document.querySelector(".burger-menu").dataset.masksReady === "true",
  );
  assert.equal(
    await page.locator("html").getAttribute("data-display"),
    "phone",
  );
  await page.locator("#options-entry").focus();
  await page.keyboard.press("Enter");
  await page.locator('input[name="display-mode"][value="desktop"]').check();
  await page.locator("#close-options").click();
  assert.equal(
    await page.locator("html").getAttribute("data-display"),
    "desktop",
  );
  checks += 3;

  async function mode(slot) {
    await page.locator(`[data-menu-mode="${slot}"]`).focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(260);
  }
  async function cover(group = "available") {
    await page.locator(`[data-group="${group}"] .book-cover`).click();
  }
  async function select(id, group = "available") {
    await cover(group);
    await page.locator(`[data-map="${id}"]`).click();
  }
  async function start(id, group = "available") {
    await select(id, group);
    await page.locator("#start-game").click();
    await page.locator("#map-briefing").waitFor({ state: "visible" });
    assert((await page.locator("#briefing-text").textContent()).length > 20);
    await page.locator("#close-briefing").click();
  }
  await mode("gros");
  assert(await page.locator("#title-screen").isVisible());
  assert(
    (await page.locator("#mode-unlock-note").textContent()).includes(
      "Classique",
    ),
  );
  checks++;
  await mode("somalia");
  assert(await page.locator("#title-screen").isVisible());
  assert(
    (await page.locator("#mode-unlock-note").textContent()).includes(
      "Grand Banquet",
    ),
  );
  checks++;
  await mode("classic");
  assert.equal(await page.locator(".book-cover:visible").count(), 2);
  assert.equal(await page.locator(".map-card:visible").count(), 0);
  assert(await page.locator("#start-game").isHidden());
  await page.screenshot({
    path: path.join(output, "deux-cartes-restaurant.png"),
  });
  checks++;
  await select("market");
  for (const id of ["cuisine", "foodcourt"])
    assert.equal(
      await page
        .locator(`[data-map="${id}"],#map-select option[value="${id}"]`)
        .count(),
      0,
    );
  const previews = await page.evaluate(async () => {
    const scan = async (id) => {
      const img = new Image();
      img.src = "./assets/previews/" + id + ".webp";
      await img.decode();
      const c = document.createElement("canvas");
      c.width = 120;
      c.height = 90;
      const x = c.getContext("2d");
      x.drawImage(img, 0, 0, 120, 90);
      const data = x.getImageData(0, 0, 120, 90).data;
      let luminance = 0,
        orange = 0,
        pink = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2];
        luminance += (r + g + b) / 3;
        const pixel = i / 4,
          px = pixel % 120,
          py = Math.floor(pixel / 120);
        if (
          px > 43 &&
          px < 77 &&
          py > 30 &&
          py < 60 &&
          r > 160 &&
          g > 65 &&
          b < 100
        )
          orange++;
        if (r > 180 && g < 130 && b > 90) pink++;
      }
      return { luminance: luminance / (120 * 90), orange, pink };
    };
    return {
      day: await scan("market"),
      night: await scan("nightmarket"),
      volcano: await scan("volcan"),
      fair: await scan("fair"),
    };
  });
  assert(previews.night.luminance < previews.day.luminance * 0.6);
  assert(previews.volcano.orange > 20);
  assert(previews.fair.pink > 20);
  checks++;

  const artwork = await page.evaluate(async () => {
    const { ILLUSTRATED_MAPS, mapArtURL } =
      await import("/map-art.js?v=wild-arenas-13");
    return Promise.all(
      ILLUSTRATED_MAPS.map(async (id) => {
        const image = new Image();
        image.src = mapArtURL(id);
        await image.decode();
        return { id, width: image.naturalWidth, height: image.naturalHeight };
      }),
    );
  });
  for (const art of artwork)
    assert(
      art.width >= 1000 && art.height >= 700,
      `${art.id}: missing or undersized background`,
    );
  checks++;

  // Every preview must retain its full image ratio, including narrow screens.
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    const fits = await page.evaluate(async () => {
      const img = document.querySelector(".restaurant-page .map-preview");
      const original = img.src;
      const ids = [
        "cantine",
        "hunger",
        "savanna",
        "volcan",
        "market",
        "nightmarket",
        "cold",
        "pirate",
        "beach",
        "station",
        "rooftop",
        "underwater",
        "wok",
        "fair",
        "picnic",
        "garden",
        "palace",
        "works",
        "mirror",
        "royal",
      ];
      const results = [];
      for (const id of ids) {
        img.src = `./assets/previews/${id}.webp`;
        await img.decode();
        const style = getComputedStyle(img);
        const width =
          img.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight);
        const height =
          img.clientHeight -
          parseFloat(style.paddingTop) -
          parseFloat(style.paddingBottom);
        results.push({
          id,
          error: Math.abs(
            height - (width * img.naturalHeight) / img.naturalWidth,
          ),
          fits: img.getBoundingClientRect().right <= innerWidth,
        });
      }
      img.src = original;
      await img.decode();
      return results;
    });
    for (const fit of fits)
      assert(
        fit.error <= 1 && fit.fits,
        `${fit.id}: preview bands or overflow at ${viewport.width}px`,
      );
    checks++;
    await page.locator('[data-map="cold"]').click();
    await page.screenshot({
      path: path.join(output, `apercu-sans-bandes-${viewport.width}.png`),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1280, height: 900 });

  assert(await page.locator("#menu-map-description").isHidden());
  assert.equal(
    await page.locator(".restaurant-page:visible .map-preview").count(),
    1,
  );
  assert(
    await page
      .locator('[data-group="in-progress"]')
      .evaluate((node) => node.classList.contains("discarded")),
  );
  await page.locator('.restaurant-page:visible [data-page="next"]').click();
  assert.equal(
    await page.locator('.map-card[aria-pressed="true"]:visible').count(),
    1,
  );
  await page.locator('[data-map="market"]').click();
  await page.screenshot({
    path: path.join(output, "restaurant-page-supermarche.png"),
  });
  checks++;
  await page.locator("#start-game").click();
  await page.locator("#map-briefing").waitFor({ state: "visible" });
  assert(
    (await page.locator("#briefing-text").textContent()).includes("chariots"),
  );
  await page.locator("#close-briefing").click();
  assert.equal(await page.evaluate(() => window.__game.count), 8);
  assert.equal(
    await page.evaluate(
      () => window.__game.obstacles.filter((o) => !o.boundary).length,
    ),
    0,
  );
  assert(
    await page.evaluate(
      () => window.__game.w >= 1900 && window.__game.h >= 1400,
    ),
  );
  const bounds = await page.locator("#game").boundingBox();
  assert.equal(Math.round(bounds.width), 1280);
  assert.equal(Math.round(bounds.height), 900);
  await page.setViewportSize({ width: 3440, height: 1440 });
  await page.waitForFunction(
    () =>
      window.__view.width <= window.__game.w &&
      window.__view.height <= window.__game.h,
  );
  const wide = await page.evaluate(() => ({
    world: window.__game.w,
    round: window.__game.round,
    camera: window.__view.camera,
    width: window.__view.width,
    height: window.__view.height,
  }));
  assert.equal(wide.world, 2400);
  assert(wide.camera.x >= 0 && wide.camera.y >= 0);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(100);
  checks++;
  for (const id of [
    "phase",
    "restart",
    "event-notice",
    "power",
    "round",
    "run-points",
  ])
    assert(await page.locator("#" + id).isHidden());
  assert(await page.locator("#survivors").isVisible());
  assert(await page.locator("#mass").isVisible());
  checks++;
  await page.screenshot({
    path: path.join(output, "jeu-immersif-supermarche.png"),
  });
  await page.evaluate(() => {
    window.__game.outcome = "win";
    window.__game.emit("end");
  });
  await page.locator("#end-menu").click();
  await mode("gros");
  await start("fair");
  assert.equal(await page.evaluate(() => window.__game.count), 24);
  checks++;
  await page.evaluate(() => {
    window.__game.outcome = "win";
    window.__game.emit("end");
  });
  await page.locator("#end-menu").click();
  await mode("somalia");
  await start("beach");
  assert.equal(await page.evaluate(() => window.__game.count), 50);
  checks++;
  await page.locator("#back-menu").click();
  await page.locator("#options-entry").focus();
  await page.keyboard.press("Enter");
  await page.locator("#shadow-entry").click();
  await page.locator("#shadow-password").fill("faux");
  await page.locator('#shadow-form button[type="submit"]').click();
  assert((await page.locator("#shadow-error").textContent()).length > 0);
  await page.locator("#shadow-password").fill("Pologne");
  await page.locator('#shadow-form button[type="submit"]').click();
  assert(await page.locator("#shadow-message").isVisible());
  await page.locator("#enter-shadow").click();
  assert.equal(
    await page
      .locator('[data-menu-mode="somalia"] text:not(.ingredient-subtitle)')
      .textContent(),
    "SOMALIE",
  );
  checks++;
  await mode("somalia");
  await cover();
  assert.equal(await page.locator(".map-card:visible").count(), 1);
  await page.locator("#start-game").click();
  await page.locator("#close-briefing").click();
  assert.equal(await page.evaluate(() => window.__game.mapId), "savanna");
  assert.equal(await page.evaluate(() => window.__game.count), 50);
  checks++;
  await page.locator("#back-menu").click();
  await page.locator("#options-entry").focus();
  await page.keyboard.press("Enter");
  await page.locator("#return-classic").click();
  assert.equal(
    await page
      .locator('[data-menu-mode="classic"] text:not(.ingredient-subtitle)')
      .textContent(),
    "CLASSIQUE",
  );
  await page.reload();
  await page.waitForFunction(
    () => document.querySelector(".burger-menu").dataset.masksReady === "true",
  );
  assert.equal(
    await page
      .locator('[data-menu-mode="somalia"]')
      .getAttribute("aria-disabled"),
    "false",
  );
  checks++;
  await mode("classic");
  await cover();
  for (const id of ["fair", "royal", "beach"])
    assert(
      await page
        .locator(`[data-group="available"] [data-map="${id}"]`)
        .isVisible(),
    );
  checks++;
  await page.locator("#back-title").click();
  await page.locator("#menu-shop").focus();
  await page.keyboard.press("Enter");
  await page.locator("#shop-dialog").waitFor({ state: "visible" });
  assert.equal(await page.locator(".shop-card").count(), 46);
  await page.locator("#close-shop").click();
  checks++;
  await page.locator("#options-entry").focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#music-track option").count(), 3);
  assert.equal(await page.locator("#music-track").inputValue(), "bistrot");
  await page.locator("#close-options").click();
  checks++;
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
  assert.equal(
    await mobile.locator("html").getAttribute("data-display"),
    "phone",
  );
  await mobile.waitForFunction(
    () =>
      typeof document.querySelector("#options-entry").onclick === "function",
  );
  await mobile.locator("#options-entry").focus();
  await mobile.keyboard.press("Enter");
  await mobile.locator("#options-dialog").waitFor({ state: "visible" });
  const phoneDialog = await mobile.locator("#options-dialog").boundingBox();
  assert(phoneDialog.x >= 0 && phoneDialog.x + phoneDialog.width <= 390);
  assert(phoneDialog.height <= 844);
  await mobile.screenshot({ path: path.join(output, "options-telephone.png") });
  await mobile.locator("#close-options").click();
  assert(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  checks += 2;
  await mobile.locator('[data-menu-mode="classic"]').focus();
  await mobile.keyboard.press("Enter");
  await mobile.locator('[data-group="available"] .book-cover').click();
  await mobile.locator('[data-map="beach"]').click();
  await mobile.locator("#start-game").click();
  await mobile.locator("#close-briefing").click();
  const mb = await mobile.locator("#game").boundingBox();
  assert.equal(Math.round(mb.width), 390);
  assert.equal(Math.round(mb.height), 844);
  assert(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await mobile.screenshot({
    path: path.join(output, "plage-immersive-mobile.png"),
  });
  checks++;
  // Resizing changes only the viewport, never the world or the round.
  const state = await mobile.evaluate(() => ({
    w: window.__game.w,
    round: window.__game.round,
  }));
  await mobile.setViewportSize({ width: 844, height: 390 });
  await mobile.waitForTimeout(100);
  assert.deepEqual(
    await mobile.evaluate(() => ({
      w: window.__game.w,
      round: window.__game.round,
    })),
    state,
  );
  checks++;
  const aim = await mobile.evaluate(() => {
    const p = window.__game.people[0].body.position,
      c = window.__view.camera;
    return { x: p.x - c.x, y: p.y - c.y };
  });
  const touch = await mobile.context().newCDPSession(mobile);
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: aim.x, y: aim.y }],
  });
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: aim.x - 55, y: aim.y + 20 }],
  });
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await touch.detach();
  await mobile.waitForFunction(() => !!window.__game.people[0].roundStart);
  checks++;
  assert.deepEqual(errors, []);
  await mobile.close();
  console.log(
    `${checks} restaurant/progression/fullscreen browser checks passed.`,
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
