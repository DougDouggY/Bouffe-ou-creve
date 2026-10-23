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
  for (const size of [2, 3, 4]) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    await page.waitForFunction(
      () =>
        document.querySelector(".burger-menu").dataset.masksReady === "true",
    );
    await page.locator('[data-actual-mode="classic"]').focus();
    await page.keyboard.press("Enter");
    await page.locator("#solo-team-size").selectOption(String(size));
    await page.locator('[data-group="in-progress"] .book-cover').click();
    await page.locator('[data-map="trampoline"]').click();
    await page.locator("#start-game").click();
    await page.locator("#close-briefing").click();
    await page.waitForFunction(
      (size) => window.__gameTest.active.teamSize === size,
      size,
    );
    const expected = size === 3 ? 24 : 8;
    assert.equal(
      await page.evaluate(() => window.__gameTest.active.count),
      expected,
    );
    assert.equal(
      await page.evaluate(
        () =>
          new Set(window.__gameTest.active.people.map((p) => p.teamId)).size,
      ),
      expected / size,
    );
    await page.waitForFunction(() =>
      document
        .querySelector('.character-badge[data-player="true"]')
        ?.textContent.includes("Éq.1"),
    );
    await page.screenshot({
      path: path.join(output, `trampoline-equipes-${size}.png`),
    });
    await page.evaluate(() => {
      const g = window.__gameTest.active;
      g.mechanics.kill(g.people[0], "test");
    });
    await page.locator("#spectator-panel").waitFor({ state: "visible" });
    assert(await page.locator("#overlay").isHidden());
    assert.match(await page.locator("#online-death").textContent(), /équipe/);
    await page.waitForFunction(
      () => window.__gameTest.active.phase === "moving",
    );
    await page.evaluate(() => {
      const g = window.__gameTest.active;
      for (const p of g.people)
        if (p.alive && p.teamId !== 0) g.mechanics.kill(p, "test");
    });
    await page.waitForFunction(
      () => window.__gameTest.active.phase === "ended",
    );
    assert.equal(
      await page.evaluate(() => window.__gameTest.active.outcome),
      "win",
    );
    await page.locator("#overlay").waitFor({ state: "visible" });
    assert.match(await page.locator("#result-title").textContent(), /ÉQUIPE 1/);
    assert.deepEqual(errors, []);
    checks += 7;
    await context.close();
  }
  console.log(
    `${checks} solo team UI / automatic spectator / allied victory checks passed.`,
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
