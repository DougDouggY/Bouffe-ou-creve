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
      viewport: { width: 1366, height: 900 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.__arenaTest);
  await page.locator("#options-entry").press("Enter");
  await page.locator("#shadow-entry").click();
  await page.locator("#shadow-password").fill("Pologne");
  await page.locator("#shadow-form button[type=submit]").click();
  await page.locator("#enter-shadow").click();
  await page.locator("#solo-entry").press("Enter");
  await page.locator("#solo-menu").waitFor({ state: "visible" });
  assert.equal(
    await page.locator("[data-solo-mode=somalia] small b u").textContent(),
    "noir",
  );
  assert.equal(
    await page.locator("[data-solo-mode=survival] small").textContent(),
    "Joyeux",
  );
  assert.equal(await page.locator(".home-mode-description").count(), 5);
  await page.screenshot({
    path: path.join(root, "test-results", "burger43-secret-menu.png"),
  });
  for (const mode of [
    "survival",
    "platform",
    "somalia",
    "cannibal",
    "icecream",
  ]) {
    if (mode !== "survival") {
      await page.locator("#solo-entry").press("Enter");
      await page.locator("#solo-menu").waitFor({ state: "visible" });
    }
    await page.locator(`[data-solo-mode=${mode}]`).click();
    await page.locator("#map-briefing").waitFor({ state: "visible" });
    assert(await page.locator("#map-screen").isHidden());
    assert.equal(
      await page.evaluate(() => window.__arenaTest.active.mode),
      mode,
    );
    await page.locator("#close-briefing").click();
    if (mode === "survival") {
      assert.deepEqual(
        await page.evaluate(() => ({
          w: window.__arenaTest.active.w,
          h: window.__arenaTest.active.h,
        })),
        { w: 20000, h: 20000 },
      );
      await page.waitForTimeout(350);
      await page.screenshot({
        path: path.join(root, "test-results", "burger43-start.png"),
      });
      await page.evaluate(async () => {
        const t = window.__arenaTest,
          g = t.active;
        const canvas = document.createElement("canvas");
        canvas.id = "world43";
        canvas.width = 1600;
        canvas.height = 1600;
        canvas.style =
          "position:fixed;inset:0;z-index:9999;background:#333;width:800px;height:800px";
        document.body.append(canvas);
        const ctx = canvas.getContext("2d");
        ctx.scale(1600 / g.w, 1600 / g.h);
        t.renderFloor(ctx, g, t.catalog.survival, 0);
        await new Promise((r) => setTimeout(r, 200));
        t.renderFloor(ctx, g, t.catalog.survival, 0);
      });
      await page.locator("#world43").screenshot({
        path: path.join(root, "test-results", "burger43-world.png"),
      });
      await page.locator("#world43").evaluate((c) => c.remove());
      await page.evaluate(() => {
        const g = window.__arenaTest.active;
        g.round = 6;
        g.secretRules.beginRound();
        g.emit("round");
      });
      await page.waitForFunction(() =>
        document
          .querySelector("#event-notice")
          .textContent.includes("FIN DE CE TOUR"),
      );
      assert(await page.locator("#event-notice").isVisible());
      await page.screenshot({
        path: path.join(root, "test-results", "burger43-warning.png"),
      });
    }
    await page.locator("#back-menu").click();
  }
  assert.equal(
    await page.locator("#multiplayer-join-code").getAttribute("placeholder"),
    "A7K2",
  );
  assert.deepEqual(errors, []);
  console.log(
    "Five secret descriptions, bold-underlined noir, direct real game launches, square 20000 terrain, forest/rivers render and four-character invite hint passed.",
  );
  await page.close();
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
