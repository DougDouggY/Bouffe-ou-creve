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
  const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    window.__played = [];
    HTMLMediaElement.prototype.play = function () {
      window.__played.push(this);
      return play.call(this);
    };
  });
  await page.goto(url);
  await page.waitForFunction(
    () => document.querySelector(".burger-menu").dataset.masksReady === "true",
  );
  await openGourmand(page);
  await page.locator("#shop-dialog").waitFor({ state: "visible" });
  await page.locator('[data-cosmetics-filter="slide"]').click();
  await page
    .locator('[data-item="slide_standard"]')
    .locator("..")
    .locator("button")
    .last()
    .click();
  await page.waitForFunction(() =>
    window.__played.some(
      (a) => a.src.includes("natural-slide") && a.currentTime > 0,
    ),
  );
  const audio = await page.evaluate(async () => {
    const { SLIDE_SOUNDS } = await import("./sound-catalog.js?v=sounds-44");
    const ctx = new AudioContext(),
      durations = [];
    for (const s of SLIDE_SOUNDS.filter((s) => !s.disabled)) {
      const data = await (
        await fetch("./assets/audio/" + s.file)
      ).arrayBuffer();
      const b = await ctx.decodeAudioData(data);
      durations.push(b.duration);
    }
    await ctx.close();
    return durations;
  });
  assert.equal(audio.length, 16);
  assert(audio.every((d) => d > 0.1 && d < 4));
  await page.locator("#close-shop").click();
  for (const mobile of [false, true]) {
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    );
    await page.locator("#multiplayer-entry").press("Enter");
    await page.locator("#multiplayer-dialog").waitFor({ state: "visible" });
    await page.locator("#multiplayer-close").click();
  }

  await page.locator("#options-entry").press("Enter");
  await page.locator("#shadow-entry").click();
  await page.locator("#shadow-password").fill("Pologne");
  await page.locator('#shadow-form button[type="submit"]').click();
  await page.locator("#enter-shadow").click();
  await page.locator("#multiplayer-entry").press("Enter");
  await page.locator("#multiplayer-dialog").waitFor({ state: "visible" });
  await page.locator("#multiplayer-close").click();
  assert.deepEqual(errors, []);
  console.log(
    "Eight actual MP3 files decoded; live preview played; integrated character entrance opened multiplayer on desktop/mobile; hidden-side access passed.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
