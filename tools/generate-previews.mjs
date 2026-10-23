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
          "\nwindow.__gameTest = { Game: zt, Body: eA, World: XA, overlaps: RA, renderFloor:dt,catalog:CA,get active() { return K; } };",
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
  });
  await page.goto(url);
  await page.waitForFunction(() => window.__gameTest);
  await mkdir(path.join(root, "assets/previews"), { recursive: true });
  const allIds = await page.evaluate(async () => {
    const { REMOVED_MAPS } = await import("/map-catalog.js?v=secrets-14");
    return Object.keys(window.__gameTest.catalog).filter(
      (id) => !REMOVED_MAPS.has(id),
    );
  });
  const requested = new Set(process.argv.slice(2));
  const ids = allIds.filter((id) => !requested.size || requested.has(id));
  for (const id of ids) {
    const data = await page.evaluate(async (id) => {
      const { Game, renderFloor, catalog } = window.__gameTest;
      const size =
        id === "survival" ? { w: 18000, h: 13500 } : { w: 2400, h: 1800 };
      const game = new Game(size.w, size.h, Math.random, {
        mapId: id,
        count: id === "survival" ? 24 : undefined,
        chef: true,
        mode: ["platform", "cannibal", "icecream", "survival"].includes(id)
          ? id
          : "classic",
        headless: true,
      });
      if (game.secretRules) game.secretRules.arrival = 0;
      const canvas = document.createElement("canvas");
      canvas.width = 960;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      ctx.scale(960 / size.w, 720 / size.h);
      for (let i = 0; i < 4; i++) {
        renderFloor(ctx, game, catalog[id], 0);
        await new Promise((r) => setTimeout(r, 140));
      }
      if (id === "survival") {
        for (const f of game.food) {
          ctx.fillStyle = f.size === "chef" ? "#ffe073" : "#dcab39";
          ctx.strokeStyle = "#34270d";
          ctx.lineWidth = 12;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.size === "chef" ? 30 : 21, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        for (const p of game.people) {
          ctx.fillStyle = "#e3c9e7";
          ctx.strokeStyle = "#4d314e";
          ctx.lineWidth = 15;
          ctx.beginPath();
          ctx.arc(p.body.position.x, p.body.position.y, 45, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
      if (id === "nightmarket") {
        ctx.fillStyle = "rgba(5,10,24,.62)";
        ctx.fillRect(0, 0, game.w, game.h);
      }
      game.destroy();
      return canvas.toDataURL("image/webp", 0.94).split(",")[1];
    }, id);
    await writeFile(
      path.join(root, "assets/previews", id + ".webp"),
      Buffer.from(data, "base64"),
    );
  }
  console.log("Complete arena previews:", ids.join(", "));
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
