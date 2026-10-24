import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const legacy = await readFile(
  new URL("./fixtures/silhouette-before.js.txt", import.meta.url),
  "utf8",
);
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
let baseline = false;
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
      if (baseline)
        content = Buffer.from(
          content
            .toString()
            .replace('progressSave(l === "end")', "a()")
            .replace('L("#shop-dialog").open && k()', "k()"),
        );
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
  const results = [];
  for (const old of [true, false]) {
    baseline = old;
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    });
    page.setDefaultTimeout(15000);
    console.log("Case baseline", old);
    await page.goto(url);
    await page.waitForFunction(
      () =>
        document.querySelector(".burger-menu").dataset.masksReady === "true",
    );
    if (!old) {
      const masks = await page.evaluate(async (legacy) => {
        const before = Function(legacy + ";return Be")();
        const { extractSilhouette: after } = await import("./silhouette.js");
        const source = document.createElement("canvas");
        source.width = 240;
        source.height = 180;
        const c = source.getContext("2d");
        c.fillStyle = "red";
        c.fillRect(30, 20, 120, 130);
        c.clearRect(70, 60, 25, 20);
        c.fillRect(190, 20, 10, 10);
        const pixels = (canvas) =>
          canvas
            .getContext("2d")
            .getImageData(0, 0, canvas.width, canvas.height).data;
        for (const rect of [
          [0, 0, 240, 180],
          [20, 10, 160, 160],
          [180, 0, 230, 80],
        ]) {
          const a = pixels(before(source, rect)),
            b = pixels(after(source, rect));
          if (a.length !== b.length || a.some((v, i) => v !== b[i]))
            throw Error("Silhouette changed");
        }
        return "Three RGBA crops identical including holes and disconnected islands";
      }, legacy);
      console.log(masks);
      // Both prototypes are actual artwork interactions and open the real multiplayer dialog.
      for (const variant of ["characters", "steak"]) {
        await page.locator("#options-entry").press("Enter");
        await page.locator("#multi-entry-style").selectOption(variant);
        await page.locator("#close-options").click();
        const point = await page.locator(".burger-menu").evaluate((svg) => {
          const p = new DOMPoint(768, 972).matrixTransform(svg.getScreenCTM());
          return { x: p.x, y: p.y };
        });
        await page.mouse.click(point.x, point.y);
        await page.locator("#multiplayer-dialog").waitFor({ state: "visible" });
        await page.locator("#multiplayer-close").click();
      }
    }
    await page.locator('[data-actual-mode="classic"]').press("Enter");
    await page.locator('[data-group="available"] .book-cover').click();
    await page.locator('[data-map="cantine"]').click();
    await page.locator("#start-game").click();
    await page.locator("#close-briefing").click();
    const measured = await page.evaluate(async () => {
      const g = window.__gameTest.active,
        p = g.people[0],
        Body = window.__gameTest.Body;
      g.food = Array.from({ length: 80 }, () => ({
        x: p.body.position.x,
        y: p.body.position.y,
        type: "burger",
        size: "normal",
      }));
      for (const q of g.people) Body.setVelocity(q.body, { x: 0, y: 0 });
      let writes = 0;
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        if (k === "bouffe-profile-v1") writes++;
        return original.call(this, k, v);
      };
      const start = performance.now();
      g.phase = "moving";
      g.step();
      await Promise.resolve();
      const ms = performance.now() - start;
      Storage.prototype.setItem = original;
      const save = JSON.parse(localStorage.getItem("bouffe-profile-v1"));
      return {
        writes,
        ms,
        mass: p.mass,
        remaining: g.food.length,
        stats: g.stats.people[0],
        points: save.points,
        earned: save.earned,
      };
    });
    results.push(measured);
    if (!old) {
      await page.locator("#in-game-options").click();
      await page.locator("#options-dialog").waitFor({ state: "visible" });
      await page.locator("#effects-volume").fill("15");
      await page.locator("#effects-volume").dispatchEvent("input");
      await page.locator("#close-options").click();
      assert(await page.locator("#options-dialog").isHidden());
    }
    await page.close();
  }
  console.log(
    "Actual 80-food physics step and profile saving:",
    JSON.stringify(results),
  );
  assert.equal(results[0].remaining, 0);
  assert.equal(results[1].remaining, 0);
  assert(results[0].writes >= 80);
  assert.equal(results[1].writes, 1);
  for (const key of ["mass", "stats", "points", "earned"])
    assert.deepEqual(results[0][key], results[1][key]);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
