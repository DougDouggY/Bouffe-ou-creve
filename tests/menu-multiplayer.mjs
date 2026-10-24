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
  const page = await browser.newPage({
      viewport: { width: 1366, height: 1000 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // A previously selected steak prototype must not disable either group.
  await page.addInitScript(() =>
    localStorage.setItem("gourmands-multi-entry", "steak"),
  );
  await page.goto(url);
  await page.waitForFunction(
    () => document.querySelector(".burger-menu").dataset.masksReady === "true",
  );
  const sign = page.locator(".multiplayer-sign");
  assert.equal((await sign.textContent()).trim(), "Multijoueur !");
  assert(await sign.isHidden());
  assert.equal(
    await page
      .locator(".multi-menu-label, .extra-menu-steak, #multi-entry-style")
      .count(),
    0,
  );
  const move = async (x, y) => {
    const p = await page.locator(".burger-menu").evaluate(
      (svg, [x, y]) => {
        const p = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM());
        return { x: p.x, y: p.y };
      },
      [x, y],
    );
    await page.mouse.move(p.x, p.y);
    return p;
  };
  for (const dark of [false, true]) {
    if (dark) {
      await page.locator("#options-entry").press("Enter");
      await page.locator("#shadow-entry").click();
      await page.locator("#shadow-password").fill("Pologne");
      await page.locator('#shadow-form button[type="submit"]').click();
      await page.locator("#enter-shadow").click();
    }
    for (const [side, x] of [
      ["left", 200],
      ["right", 1350],
    ]) {
      // Defocus the keyboard trigger before checking pointer-only behavior.
      await page.locator("#multiplayer-entry").evaluate((el) => el.blur());
      await page.mouse.move(0, 0);
      await sign.waitFor({ state: "hidden" });
      const before = await sign.evaluate(
        (el) => getComputedStyle(el).transform,
      );
      const p = await move(x, 450);
      await sign.waitFor({ state: "visible" });
      await page.waitForTimeout(450);
      assert.equal(
        await page
          .locator("#multiplayer-entry")
          .evaluate((el) => el.classList.contains("is-hovered")),
        true,
      );
      assert.notEqual(
        await sign.evaluate((el) => getComputedStyle(el).transform),
        before,
      );
      const a = await sign.boundingBox(),
        b = await page.locator(".title-copy h1").boundingBox();
      assert(a.y >= b.y + b.height - 2);
      await page.screenshot({
        path: path.join(
          output,
          `menu-multi-${dark ? "secret" : "normal"}-${side}.png`,
        ),
      });
      await page.mouse.click(p.x, p.y);
      await page.locator("#multiplayer-dialog").waitFor({ state: "visible" });
      await page.locator("#multiplayer-close").click();
    }
  }
  await page.locator("#multiplayer-entry").press("Enter");
  await page.locator("#multiplayer-dialog").waitFor({ state: "visible" });
  await page.locator("#multiplayer-close").click();
  await page.locator("#multiplayer-entry").evaluate((el) => el.blur());
  await page.mouse.move(0, 0);
  await sign.waitFor({ state: "hidden" });
  // The former bottom label is neither visible nor a multiplayer hot spot.
  await move(768, 972);
  assert(await sign.isHidden());
  await page.mouse.click(0, 0);
  // Touch interaction uses the same silhouettes on a phone in landscape.
  const mobile = await browser.newPage({
    viewport: { width: 844, height: 390 },
    isMobile: true,
    hasTouch: true,
  });
  await mobile.goto(url);
  await mobile.waitForFunction(
    () => document.querySelector(".burger-menu").dataset.masksReady === "true",
  );
  for (const x of [200, 1350]) {
    const p = await mobile.locator(".burger-menu").evaluate((svg, x) => {
      const p = new DOMPoint(x, 450).matrixTransform(svg.getScreenCTM());
      return { x: p.x, y: p.y };
    }, x);
    await mobile.touchscreen.tap(p.x, p.y);
    await mobile.locator("#multiplayer-dialog").waitFor({ state: "visible" });
    await mobile.locator("#multiplayer-close").click();
  }
  assert.deepEqual(errors, []);
  console.log(
    "Both character groups: hover, falling sign, exit, actual lobby clicks, secret menu, old steak preference, keyboard and touch passed.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
