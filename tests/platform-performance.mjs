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
      viewport: { width: 1280, height: 1000 },
    }),
    errors = [];
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.error(e.message);
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.__arenaTest);
  const result = await page.evaluate(() => {
    const { Game } = window.__arenaTest;
    let seed = 17;
    const rnd = () =>
      (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    const g = new Game(1600, 1200, rnd, {
      mode: "platform",
      mapId: "platform",
      simulation: true,
    });
    let times = [];
    for (let i = 0; i < 1800 && g.phase !== "ended"; i++) {
      const start = performance.now();
      if (g.phase === "aim" && g.secretRules.arrival === 0)
        g.launch(g.plan(g.people[0]));
      g.step(1000 / 60);
      times.push(performance.now() - start);
    }
    g.destroy();
    times.sort((a, b) => a - b);
    return {
      frames: times.length,
      total: times.reduce((a, b) => a + b, 0),
      p95: times[Math.floor(times.length * 0.95)],
      max: times.at(-1),
      over16ms: times.filter((t) => t > 16).length,
    };
  });
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
  server.close();
}
