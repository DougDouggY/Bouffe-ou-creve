import { chooseSolo, closeBriefing } from "./restaurant-navigation.mjs";
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
    await chooseSolo(page, "classic");
    await page.locator("#solo-team-size").selectOption(String(size));
    await page.locator('[data-group="available"] .book-cover').click();
    await page.locator('[data-map="trampoline"]').click();
    await page.locator("#start-game").click();
    await closeBriefing(page);
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
    await page.locator('[data-inspect="survivors"]').hover();
    assert.equal(
      await page.locator('[data-inspect="survivors"] .hud-team-member').count(),
      expected,
    );
    assert.equal(
      await page.locator('[data-inspect="survivors"] .hud-team-title').count(),
      expected / size,
    );
    await page.locator('[data-inspect="weight"]').focus();
    assert.equal(
      await page.locator('[data-inspect="weight"] .hud-team-member').count(),
      size,
    );
    assert(
      await page
        .locator('.character-badge[data-player="true"]')
        .evaluate(
          (el) => getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)",
        ),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-inspect="weight"]').click();
    const panelBox = await page
      .locator('[data-inspect="weight"] .hud-breakdown')
      .boundingBox();
    assert(panelBox.x >= 0 && panelBox.x + panelBox.width <= 391);
    await page.keyboard.press("Escape");
    assert(
      await page.locator('[data-inspect="weight"] .hud-breakdown').isHidden(),
    );
    const notice = await page.evaluate(async () => {
      const { deathNotice } = await import("./team-hud.js?v=rivalries-33");
      const row = deathNotice(
        {
          name: "<victim>",
          person: 0,
          teamId: 0,
          eliminatedBy: { name: "<killer>", id: 1, teamId: 1 },
        },
        [],
        2,
      );
      return {
        text: row.textContent,
        tags: [...row.querySelectorAll(".death-name")].map((el) => [
          el.dataset.team,
          el.style.backgroundColor,
        ]),
        unsafe: !!row.querySelector("victim, killer"),
        background: row.style.backgroundColor,
      };
    });
    assert.equal(notice.unsafe, false);
    assert.match(notice.text, /<victim>.*<killer>/);
    assert.equal(notice.tags.length, 2);
    assert.notEqual(notice.tags[0][1], notice.tags[1][1]);
    assert(notice.background);
    await page.setViewportSize({ width: 1280, height: 900 });
    checks += 10;
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
