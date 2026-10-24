import { chooseSolo, closeBriefing } from "./restaurant-navigation.mjs";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const workerPort = 8789;
await mkdir(path.join(root, "test-results"), { recursive: true });
const server = createServer(async (request, response) => {
  try {
    const relative = new URL(request.url, "http://localhost").pathname;
    const file = path.resolve(
      root,
      "." + (relative === "/" ? "/index.html" : relative),
    );
    if (!file.startsWith(root + path.sep)) throw Error();
    let data = await readFile(file);
    if (file.endsWith("/multiplayer-client.js"))
      data = Buffer.from(
        data
          .toString()
          .replace("http://127.0.0.1:8787", `http://127.0.0.1:${workerPort}`),
      );
    response.writeHead(200, {
      "Content-Type":
        {
          ".js": "text/javascript",
          ".css": "text/css",
          ".html": "text/html",
          ".webp": "image/webp",
          ".m4a": "audio/mp4",
        }[path.extname(file)] || "application/octet-stream",
    });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}`;
const wrangler =
  process.env.WRANGLER_EXECUTABLE ||
  path.join(root, "cloudflare/node_modules/.bin/wrangler");
assert(existsSync(wrangler), "Run npm ci --prefix cloudflare first.");
let workerLog = "";
const worker = spawn(
  wrangler,
  [
    "dev",
    "--config",
    "../wrangler.jsonc",
    "--local",
    "--ip",
    "127.0.0.1",
    "--port",
    String(workerPort),
    "--persist-to",
    "/tmp/bouffe-multi-browser-state",
    "--var",
    `ALLOWED_ORIGINS:${url}`,
  ],
  {
    cwd: path.join(root, "cloudflare"),
    env: {
      ...process.env,
      XDG_CONFIG_HOME: "/tmp/bouffe-wrangler-tests",
      WRANGLER_SEND_METRICS: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
worker.stdout.on("data", (b) => {
  workerLog += b;
});
worker.stderr.on("data", (b) => {
  workerLog += b;
});
let browser;
const checks = [];
try {
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${workerPort}/health`);
      if (r.ok) break;
    } catch {}
    if (worker.exitCode !== null) throw Error(workerLog);
    if (i === 119) throw Error("Worker did not start: " + workerLog);
    await new Promise((r) => setTimeout(r, 250));
  }
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const aContext = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    }),
    bContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
  const a = await aContext.newPage(),
    b = await bContext.newPage();
  const errors = [],
    wireA = [],
    wireB = [];
  for (const [page, wire] of [
    [a, wireA],
    [b, wireB],
  ]) {
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("websocket", (ws) =>
      ws.on("framereceived", (frame) => {
        try {
          wire.push(JSON.parse(frame.payload.toString()));
        } catch {}
      }),
    );
    await page.goto(url);
    await page.locator("#multiplayer-entry").press("Enter");
    await page.locator("#multiplayer-create").waitFor({ state: "visible" });
    await page.waitForFunction(
      () => !document.querySelector("#multiplayer-create").disabled,
    );
  }
  await a.locator("#multiplayer-name").fill("Doug");
  await a.locator("#multiplayer-create").click();
  await a.waitForFunction(
    () => document.querySelector("#multiplayer-code").textContent.length === 4,
  );
  const code = await a.locator("#multiplayer-code").textContent();
  await b.locator("#multiplayer-name").fill("Tony");
  await b.locator("#multiplayer-join-code").fill(code.toLowerCase());
  await b.locator("#multiplayer-join").click();
  await a.waitForFunction(
    () => document.querySelectorAll("#multiplayer-players li").length === 2,
  );
  await b.waitForFunction(
    () => document.querySelectorAll("#multiplayer-players li").length === 2,
  );
  assert(
    (await a.locator("#multiplayer-fill").textContent()).includes(
      "2 humains + 22 IA",
    ),
  );
  assert.equal(await b.locator("#multiplayer-code").textContent(), code);
  assert(await b.locator("#multiplayer-start").isHidden());
  checks.push(
    "two independent browsers create / enter an invitation, same roster, 2 humans + 22 AI",
  );
  await a.screenshot({
    path: path.join(root, "test-results/multiplayer-lobby.png"),
  });
  const phoneBounds = await b.locator("#multiplayer-dialog").boundingBox();
  assert(phoneBounds.x >= 0 && phoneBounds.x + phoneBounds.width <= 390);
  await b.screenshot({
    path: path.join(root, "test-results/multiplayer-lobby-phone.png"),
  });
  checks.push("invitation and roster fit a touch phone in portrait");
  await a.locator("#multiplayer-ready").click();
  await b.locator("#multiplayer-ready").click();
  await a.waitForFunction(
    () => !document.querySelector("#multiplayer-start").disabled,
  );
  await a.locator("#multiplayer-start").click();
  for (const p of [a, b])
    await p.waitForFunction(
      () =>
        document.body.classList.contains("playing") &&
        window.__game?.people.length === 24,
    );
  const positions = (p) =>
    p.evaluate(() =>
      window.__game.people
        .map((p) => ({
          name: p.name,
          x: p.body.position.x,
          y: p.body.position.y,
          mass: p.mass,
          alive: p.alive,
        }))
        .sort((a, b) => a.name.localeCompare(b.name) || a.x - b.x),
    );
  assert.deepEqual(await positions(a), await positions(b));
  assert.equal(await a.evaluate(() => window.__game.people[0].name), "Doug");
  assert.equal(await b.evaluate(() => window.__game.people[0].name), "Tony");
  checks.push(
    "each browser controls its own seat and receives the identical authoritative start",
  );
  async function shoot(page, dx, dy, touch = false) {
    const p = await page.evaluate(() => {
      const p = window.__game.people[0].body.position,
        v = window.__view;
      const rect = document.querySelector("#game").getBoundingClientRect();
      return {
        x: rect.x + ((p.x - v.camera.x + v.marginX) * rect.width) / v.sceneW,
        y: rect.y + ((p.y - v.camera.y + v.marginY) * rect.height) / v.sceneH,
      };
    });
    if (touch) {
      const session = await page.context().newCDPSession(page);
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: p.x, y: p.y }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: p.x - dx, y: p.y - dy }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await session.detach();
      return;
    }
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.mouse.move(p.x - dx, p.y - dy, { steps: 5 });
    await page.mouse.up();
  }
  const before = await positions(a);
  await shoot(a, 110, 15);
  await a.waitForFunction(() =>
    document
      .querySelector("#multiplayer-hud")
      .textContent.includes("verrouillé"),
  );
  await b.waitForTimeout(500);
  assert.deepEqual(await positions(a), before);
  assert.deepEqual(await positions(b), before);
  assert(!wireB.some((p) => p.type === "resolution"));
  const beforeResolution = wireB.filter((p) => p.type === "room");
  assert(beforeResolution.every((p) => !("shots" in p.room)));
  checks.push(
    "first human shot stays secret and does not run a client-side simulation",
  );
  await shoot(b, -100, 20, true);
  await a.waitForFunction(
    () => window.__game.round === 2 && window.__game.phase === "aim",
    { timeout: 30000 },
  );
  await b.waitForFunction(
    () => window.__game.round === 2 && window.__game.phase === "aim",
    { timeout: 30000 },
  );
  assert.deepEqual(await positions(a), await positions(b));
  const ra = wireA.find((p) => p.type === "resolution"),
    rb = wireB.find((p) => p.type === "resolution");
  assert.deepEqual(ra.final, rb.final);
  assert(ra.final.people.slice(2).some((p) => p.roundStart));
  assert.notDeepEqual(await positions(a), before);
  assert(wireA.some((p) => p.type === "frames" && p.last));
  checks.push(
    "two secret shots trigger one common physics recording, actual AI decisions, identical final positions / weights",
  );
  await mkdir(path.join(root, "test-results"), { recursive: true });
  await a.screenshot({
    path: path.join(root, "test-results/multiplayer-host.png"),
  });
  await b.screenshot({
    path: path.join(root, "test-results/multiplayer-tony.png"),
  });
  // Reload preserves only this tab's private ticket; it restores the authoritative seat.
  await b.reload();
  await b.waitForFunction(
    () =>
      document.body.classList.contains("playing") && window.__game?.round === 2,
  );
  assert.equal(await b.evaluate(() => window.__game.people[0].name), "Tony");
  assert.deepEqual(await positions(a), await positions(b));
  checks.push(
    "WebSocket disconnect / reload reconnects the same seat and state without a duplicate player",
  );
  // Out-of-order / cheating inputs are rejected by the real DO, not just a client guard.
  const bad = await b.evaluate(
    async ({ workerPort, url }) => {
      const t = JSON.parse(sessionStorage.getItem("bouffe-private-room-v1"));
      return await new Promise((resolve, reject) => {
        const ws = new WebSocket(
          `ws://127.0.0.1:${workerPort}/api/socket/${t.code}`,
          ["bouffe-v1", "ticket." + t.token],
        );
        ws.onopen = () =>
          ws.send(
            JSON.stringify({
              version: "multi-21",
              type: "shot",
              turn: 0,
              x: 17,
              y: 0,
            }),
          );
        ws.onmessage = (e) => {
          let p = JSON.parse(e.data);
          if (p.type === "error") {
            resolve(p.error);
            ws.close();
          }
        };
        ws.onerror = () => reject(Error("Bad test socket"));
      });
    },
    { workerPort, url },
  );
  assert.equal(bad, "STALE_TURN");
  checks.push("real Worker rejects a stale turn over WebSocket");
  // Host can leave while Tony remains; his seat becomes an AI and host transfers.
  await a.locator("#back-menu").click();
  await a.waitForFunction(() => !document.body.classList.contains("playing"));
  assert(await a.locator("#main-menu").isVisible());
  // Solo must still work after an online session.
  await chooseSolo(a, "classic");
  await a.locator('[data-group="available"] .book-cover').click();
  await a.locator('[data-map="cantine"]').click();
  await a.locator("#start-game").click();
  await closeBriefing(a);
  assert.equal(await a.evaluate(() => window.__game.people.length), 8);
  await shoot(a, 90, 15);
  await a.waitForFunction(
    () => window.__game.phase === "moving" || window.__game.round > 1,
  );
  checks.push(
    "leaving online returns to the menu and a real solo launch still works",
  );
  const blocked = await fetch(`http://127.0.0.1:${workerPort}/api/rooms`, {
    method: "POST",
    headers: {
      Origin: "https://evil.example",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(blocked.status, 403);
  checks.push("unapproved HTTP origins are rejected");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify(checks, null, 2));
  console.log(
    `${checks.length} real Worker / two-browser multiplayer checks passed.`,
  );
} finally {
  await browser?.close();
  worker.kill("SIGTERM");
  await new Promise((resolve) => server.close(resolve));
}
