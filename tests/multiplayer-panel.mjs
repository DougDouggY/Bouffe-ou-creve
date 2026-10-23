// Public URLs/origin are preserved. Due to network restrictions, published files
// and the Worker are served through local relays; this is not a live Internet test.
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, mkdtemp } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import WebSocket from "../cloudflare/node_modules/ws/index.js";
const project = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const root = process.env.PUBLISHED_TREE_DIR || project;
const SITE = "https://dougdouggy.github.io/Bouffe-ou-creve/";
const ORIGIN = new URL(SITE).origin;
const WORKER = "https://bouffeoucrevemulti.jeferson-patry-sin.workers.dev";
const port = 8793;
const output = path.join(project, "test-results");
await mkdir(output, { recursive: true });
const state = await mkdtemp("/tmp/bouffe-panel-worker-");
const testConfig = path.join(state, "wrangler.json");
await writeFile(
  testConfig,
  JSON.stringify({
    name: "bouffe-lobby-tests",
    main: path.join(root, "tests/fixtures/multiplayer-test-worker.js"),
    compatibility_date: "2026-10-23",
    durable_objects: {
      bindings: [{ name: "ROOMS", class_name: "PrivateRoom" }],
    },
    migrations: [{ tag: "v1", new_sqlite_classes: ["PrivateRoom"] }],
    vars: { ALLOWED_ORIGINS: ORIGIN },
  }),
);
let workerLog = "";
const worker = spawn(
  path.join(project, "cloudflare/node_modules/.bin/wrangler"),
  [
    "dev",
    "--config",
    testConfig,
    "--local",
    "--ip",
    "127.0.0.1",
    "--port",
    String(port),
    "--persist-to",
    state,
  ],
  {
    cwd: path.join(root, "cloudflare"),
    env: {
      ...process.env,
      XDG_CONFIG_HOME: "/tmp/bouffe-panel-wrangler",
      WRANGLER_SEND_METRICS: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
worker.stdout.on("data", (b) => (workerLog += b));
worker.stderr.on("data", (b) => (workerLog += b));
let browser;
const errors = [],
  failures = [],
  resources = new Set(),
  httpRequests = [],
  bridges = [],
  pages = [],
  wires = [];
try {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) break;
    } catch {}
    if (worker.exitCode !== null || i === 119)
      throw Error("Worker local indisponible : " + workerLog);
    await new Promise((r) => setTimeout(r, 250));
  }
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const sizes = [
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ];
  for (const [i, viewport] of sizes.entries()) {
    const context = await browser.newContext({
      viewport,
      isMobile: i >= 2,
      hasTouch: i >= 2,
    });
    const wire = [];
    wires.push(wire);
    await context.route(SITE + "**", async (route) => {
      const url = new URL(route.request().url());
      const relative =
        decodeURIComponent(url.pathname.slice("/Bouffe-ou-creve/".length)) ||
        "index.html";
      const filename = path.resolve(root, relative);
      try {
        assert(filename.startsWith(root + path.sep));
        let body = await readFile(filename);
        if (relative === "game.js")
          body = Buffer.concat([
            body,
            Buffer.from(`
          window.__cosmeticTest = {
            ready(ids) { return lA.complete && lA.naturalWidth > 0 && DA.complete && DA.naturalWidth > 0 && ids.every(id => { const im = extraCosmeticImage(id); return !im || im.complete && im.naturalWidth > 0; }); },
            avatar(memberId) {
              const p = window.__game.people.find(p => p.memberId === memberId);
              const canvas = document.createElement('canvas'); canvas.width = 144; canvas.height = 180;
              Se(canvas.getContext('2d', {willReadFrequently:true}), {...p, id:-1, body:{position:{x:72,y:118}, circleRadius:32, speed:3}},1234,equippedFor(p));
              return { png:canvas.toDataURL(), pixels:Array.from(canvas.getContext("2d").getImageData(0,0,144,180).data) };
            }
          };
`),
          ]);

        resources.add(relative + url.search);
        await route.fulfill({
          status: 200,
          contentType:
            {
              ".js": "text/javascript",
              ".css": "text/css",
              ".html": "text/html",
              ".webp": "image/webp",
              ".m4a": "audio/mp4",
              ".mp3": "audio/mpeg",
            }[path.extname(filename)] || "application/octet-stream",
          body,
        });
      } catch {
        failures.push(relative);
        await route.fulfill({ status: 404, body: "Not found" });
      }
    });
    await context.route(WORKER + "/**", async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      assert.equal(req.headers().origin, ORIGIN);
      const headers = { Origin: ORIGIN };
      if (req.headers()["content-type"])
        headers["Content-Type"] = req.headers()["content-type"];
      const response = await fetch(`http://127.0.0.1:${port}${url.pathname}`, {
        method: req.method(),
        headers,
        body: ["GET", "HEAD"].includes(req.method())
          ? undefined
          : req.postDataBuffer(),
      });
      httpRequests.push({ path: url.pathname, status: response.status });
      assert.equal(response.headers.get("access-control-allow-origin"), ORIGIN);
      await route.fulfill({
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: Buffer.from(await response.arrayBuffer()),
      });
    });
    await context.routeWebSocket(
      WORKER.replace(/^https/, "wss") + "/**",
      (route) => {
        const url = new URL(route.url());
        const server = new WebSocket(
          `ws://127.0.0.1:${port}${url.pathname}`,
          route.protocols(),
          { origin: ORIGIN },
        );
        bridges.push(server);
        const pending = [];
        route.onMessage((message) =>
          server.readyState === WebSocket.OPEN
            ? server.send(message)
            : pending.push(message),
        );
        server.on("open", () => {
          for (const message of pending) server.send(message);
        });
        server.on("message", (message) => {
          wire.push(JSON.parse(message.toString()));
          route.send(message.toString());
        });
        server.on("error", () => errors.push("WebSocket relay failed"));
        server.on("close", () => route.close());
        route.onClose(() => server.close());
      },
    );
    await context.addInitScript(() => {
      if (!localStorage.getItem("cosmetic-test-seeded")) {
        localStorage.setItem(
          "bouffe-profile-v1",
          JSON.stringify({
            points: 5000,
            owned: ["none", "plain"],
            equipped: { hat: "none", outfit: "plain" },
          }),
        );
        localStorage.setItem("cosmetic-test-seeded", "1");
      }
    });
    const page = await context.newPage();
    pages.push(page);
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("requestfailed", (req) => {
      if (req.url().startsWith(SITE))
        failures.push(new URL(req.url()).pathname);
    });
    await page.goto(SITE + "?v=lobby-26");
    await page.waitForFunction(
      () =>
        typeof document.querySelector("#multiplayer-entry").onclick ===
          "function" &&
        document.querySelector(".burger-menu").dataset.masksReady === "true",
    );
    const box = await page.locator("#multiplayer-entry").boundingBox();
    assert(
      box.x >= 0 &&
        box.x + box.width / 2 > viewport.width / 2 &&
        box.x + box.width <= viewport.width &&
        box.y >= 0 &&
        box.y + box.height <= viewport.height,
    );
    assert(box.width <= 240 && box.height <= 90);
    assert.equal(await page.evaluate(() => scrollY), 0);
    assert(
      await page.locator("#multiplayer-entry").evaluate((el) => {
        const b = el.getBoundingClientRect();
        return el.contains(
          document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2),
        );
      }),
    );
    assert(await page.locator("#title-screen #multiplayer-entry").count());
    await page.screenshot({
      path: path.join(
        output,
        `multi-panel-${viewport.width}x${viewport.height}.png`,
      ),
    });
    await page.locator("#multiplayer-entry").click();
    await page.waitForFunction(
      () => !document.querySelector("#multiplayer-create").disabled,
    );
  }
  assert(resources.has("game.js?v=lobby-26"));
  assert(resources.has("style.css?v=lobby-26"));
  assert(resources.has("multiplayer-client.js?v=lobby-26"));
  assert(resources.has("multiplayer-protocol.js?v=lobby-26"));
  async function dress(page, hat, outfit) {
    await page.locator("#menu-shop").focus();
    await page.keyboard.press("Enter");
    await page.locator("#shop-dialog").waitFor({ state: "visible" });
    for (const id of [hat, outfit]) {
      const button = page.locator(`[data-item="${id}"]`);
      if (!(await button.isDisabled())) await button.click();
    }
    await page.locator("#close-shop").click();
    assert.deepEqual(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("bouffe-profile-v1")).equipped,
      ),
      { hat, outfit },
    );
  }
  const outfits = [
    { hat: "cap", outfit: "sport" },
    { hat: "chef", outfit: "cook" },
    { hat: "hat_pizza", outfit: "outfit_royal" },
    { hat: "hat_teapot", outfit: "outfit_chocolate" },
  ];
  // Equip through the real Dressing UI rather than inventing display-only skins.
  for (const [i, page] of pages.entries()) {
    await page.locator("#multiplayer-close").click();
    await dress(page, outfits[i].hat, outfits[i].outfit);
    await page.locator("#multiplayer-entry").click();
    await page.waitForFunction(
      () => !document.querySelector("#multiplayer-create").disabled,
    );
  }
  const names = ["Doug", "Tony", "Ami 3", "Ami 4"];
  for (const [i, page] of pages.entries()) {
    await page.locator("#multiplayer-name").fill(names[i]);
    if (i === 0) {
      await page.locator("#multiplayer-create").click();
      await page.waitForFunction(
        () =>
          document.querySelector("#multiplayer-code").textContent.length === 14,
      );
    } else {
      await page
        .locator("#multiplayer-join-code")
        .fill(await pages[0].locator("#multiplayer-code").textContent());
      await page.locator("#multiplayer-join").click();
    }
    await page.waitForFunction(
      (n) => document.querySelectorAll("#multiplayer-players li").length === n,
      i + 1,
    );
  }
  const host = pages[0];
  for (const count of [8, 50, 24]) {
    await host.locator("#multiplayer-size").selectOption(String(count));
    for (const page of pages)
      await page.waitForFunction(
        (ai) =>
          document
            .querySelector("#multiplayer-fill")
            .textContent.includes(`4 humains + ${ai} IA`),
        count - 4,
      );
  }
  for (const outfit of outfits)
    for (const page of pages)
      assert.equal(
        await page
          .locator(
            `#multiplayer-players li[data-hat="${outfit.hat}"][data-outfit="${outfit.outfit}"]`,
          )
          .count(),
        1,
      );
  await host.locator("#multiplayer-ready").click();
  await host.waitForFunction(() =>
    document
      .querySelector("#multiplayer-ready")
      .textContent.includes("plus prêt"),
  );
  await host.locator("#multiplayer-shop").click();
  await host.locator("#shop-dialog").waitFor({ state: "visible" });
  await host.locator('[data-item="crown"]').click();
  await host.locator("#close-shop").click();
  outfits[0] = { hat: "crown", outfit: "sport" };
  for (const page of pages)
    await page.locator('#multiplayer-players li[data-hat="crown"]').waitFor();
  assert.equal(
    await host.locator("#multiplayer-ready").textContent(),
    "Je suis prêt",
  );

  for (const page of pages) {
    assert.equal(await page.locator("#multiplayer-players canvas").count(), 4);
    await page.waitForFunction(() =>
      [...document.querySelectorAll("#multiplayer-players canvas")].every((c) =>
        c
          .getContext("2d")
          .getImageData(0, 0, c.width, c.height)
          .data.some((n, i) => i % 4 === 3 && n > 0),
      ),
    );
  }
  await host.locator("#multiplayer-map").selectOption("nightmarket");
  for (const page of pages) {
    await page.waitForFunction(
      () => document.querySelector("#multiplayer-map").value === "nightmarket",
    );
    if (page !== host)
      assert(await page.locator("#multiplayer-map").isDisabled());
  }
  for (const page of pages) await page.locator("#multiplayer-ready").click();
  await host.waitForFunction(
    () => !document.querySelector("#multiplayer-start").disabled,
  );
  await host.locator("#multiplayer-start").click();
  for (const [i, page] of pages.entries()) {
    await page.waitForFunction(() =>
      document.body.classList.contains("online-playing"),
    );
    assert.equal(
      await page.evaluate(() => window.__game.people[0].name),
      names[i],
    );
    assert(await page.locator("#multiplayer-entry").isHidden());
  }
  const start = wires[0].find((p) => p.type === "state").state;
  assert.equal(start.count, 24);
  assert.equal(start.mapId, "nightmarket");
  assert.equal(start.people.filter((p) => p.human).length, 4);
  for (let i = 0; i < 4; i++) {
    assert.equal(start.people[i].name, names[i]);
    assert.deepEqual(start.people[i].cosmetics, outfits[i]);
  }
  const identities = start.people
    .filter((p) => p.human)
    .map((p) => ({
      memberId: p.memberId,
      name: p.name,
      cosmetics: p.cosmetics,
      networkSeat: p.id,
    }));
  async function verifyIdentityRendering() {
    const renderIds = outfits.flatMap((o) => [o.hat, o.outfit]);
    let reference, referenceImages;
    for (const page of pages) {
      await page.waitForFunction(
        (ids) => window.__cosmeticTest.ready(ids),
        renderIds,
      );
      const people = await page.evaluate(() =>
        window.__game.people
          .filter((p) => p.human)
          .map((p) => ({
            memberId: p.memberId,
            name: p.name,
            cosmetics: p.cosmetics,
            networkSeat: p.networkSeat,
          }))
          .sort((a, b) => a.networkSeat - b.networkSeat),
      );
      assert.deepEqual(people, identities);
      const rendered = await page.evaluate(
        (ids) => ids.map((id) => window.__cosmeticTest.avatar(id)),
        identities.map((p) => p.memberId),
      );
      // Chromium may choose different WebP raster downsampling after thumbnail use.
      // Compare premultiplied pixels with a narrow edge tolerance, not PNG encoding.
      if (reference) {
        for (let j = 0; j < rendered.length; j++) {
          const x = rendered[j].pixels,
            y = reference[j].pixels;
          let total = 0,
            max = 0;
          for (let k = 0; k < x.length; k += 4)
            for (let c = 0; c < 4; c++) {
              const delta = Math.abs(
                c === 3
                  ? x[k + c] - y[k + c]
                  : (x[k + c] * x[k + 3]) / 255 - (y[k + c] * y[k + 3]) / 255,
              );
              total += delta;
              max = Math.max(max, delta);
            }
          assert(
            total / x.length < 0.75 && max <= 32,
            "Same costume, pose and proportions across clients",
          );
        }
      } else reference = rendered;
      assert.equal(new Set(rendered.map((r) => r.png)).size, 4);
      if (!(await page.evaluate(() => window.__game.people[0].alive))) continue;
      const badge = page.locator(
        '.character-badge[data-human="true"][data-player="true"]',
      );
      await badge.waitFor();
      assert.equal(
        await badge
          .locator(".badge-name")
          .evaluate((e) => getComputedStyle(e).color),
        "rgb(172, 226, 255)",
      );
      assert(
        Number(
          await badge
            .locator(".badge-name")
            .evaluate((e) => getComputedStyle(e).fontWeight),
        ) >= 700,
      );
      assert.equal(
        await badge.locator(".badge-name").textContent(),
        await page.evaluate(() => window.__game.people[0].name),
      );
    }
    assert.equal(
      new Set(reference).size,
      4,
      "Distinct Dressing appearances must not render as the same fallback.",
    );
  }
  await verifyIdentityRendering();
  await host.screenshot({
    path: path.join(output, "identity-online-host.png"),
  });
  for (const wire of wires)
    assert.deepEqual(wire.find((p) => p.type === "state").state, start);
  for (const [i, page] of pages.entries()) {
    const p = await page.evaluate(() => {
      const b = document.querySelector("#game").getBoundingClientRect(),
        p = window.__game.people[0].body.position,
        v = window.__view;
      return {
        x: b.x + ((p.x - v.camera.x + v.marginX) * b.width) / v.sceneW,
        y: b.y + ((p.y - v.camera.y + v.marginY) * b.height) / v.sceneH,
      };
    });
    if (i === 2) {
      const session = await page.context().newCDPSession(page);
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [p],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: p.x - 80, y: p.y + 15 }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await session.detach();
    } else {
      await page.mouse.move(p.x, p.y);
      await page.mouse.down();
      await page.mouse.move(p.x - 80, p.y + 15, { steps: 4 });
      await page.mouse.up();
    }
    if (i < 3) {
      await page.waitForFunction(() =>
        document
          .querySelector("#multiplayer-hud")
          .textContent.includes("verrouillé"),
      );
      assert(!wires.some((w) => w.some((p) => p.type === "resolution")));
    }
  }
  for (const page of pages)
    await page.waitForFunction(
      () => window.__game.round >= 2 && window.__game.phase === "aim",
    );
  const final = wires[0].find((p) => p.type === "resolution").final;
  for (const wire of wires)
    assert.deepEqual(wire.find((p) => p.type === "resolution").final, final);
  const rendered = async (page) =>
    page.evaluate(() =>
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
  const reference = await rendered(host);
  for (const page of pages) assert.deepEqual(await rendered(page), reference);
  // A changed Dressing during the match applies only to the next lobby.
  const nextLook = await host.context().newPage();
  nextLook.on("pageerror", (e) => errors.push(e.message));
  await nextLook.goto(SITE + "?v=lobby-26");
  await nextLook.waitForFunction(
    () =>
      window.__cosmeticTest &&
      document.querySelector(".burger-menu").dataset.masksReady === "true",
  );
  await dress(nextLook, "burger", "cosmic");
  await nextLook.close();
  for (const page of pages) {
    await page.reload();
    await page.waitForFunction(
      () =>
        document.body.classList.contains("online-playing") &&
        window.__game.round >= 2,
    );
  }
  await verifyIdentityRendering();
  const roomCode = (
    await host.locator("#multiplayer-code").textContent()
  ).replaceAll("-", "");
  assert.equal(
    (await fetch(`http://127.0.0.1:${port}/__test__/end/${roomCode}`)).status,
    200,
  );
  for (const page of pages)
    await page.locator("#multiplayer-rematch").waitFor({ state: "visible" });
  for (const [i, page] of pages.entries()) {
    await page.locator("#multiplayer-rematch").click();
    if (i < 3) {
      await host.waitForFunction(
        (n) =>
          document
            .querySelector("#multiplayer-rematch-status")
            .textContent.startsWith(n + "/"),
        i + 1,
      );
      assert(!(await host.locator("#multiplayer-dialog").isVisible()));
    }
  }
  for (const page of pages) {
    await page.locator("#multiplayer-dialog").waitFor({ state: "visible" });
    assert.equal(
      (await page.locator("#multiplayer-code").textContent()).replaceAll(
        "-",
        "",
      ),
      roomCode,
    );
    assert.equal(
      await page.locator("#multiplayer-map").inputValue(),
      "nightmarket",
    );
    assert.equal(await page.locator("#multiplayer-players canvas").count(), 4);
    assert.equal(
      await page.locator("#multiplayer-ready").textContent(),
      "Je suis prêt",
    );
  }
  await host.locator("#multiplayer-map").selectOption("volcan");
  for (const page of pages) await page.locator("#multiplayer-ready").click();
  await host.locator("#multiplayer-start").click();
  for (const page of pages)
    await page.waitForFunction(
      () =>
        document.body.classList.contains("online-playing") &&
        window.__game.mapId === "volcan" &&
        window.__game.round === 1,
    );
  for (const page of pages) {
    await page.locator("#back-menu").click();
    assert(await page.locator("#multiplayer-entry").isVisible());
  }
  assert.equal(
    httpRequests.filter((r) => r.path === "/api/join" && r.status === 200)
      .length,
    3,
  );
  assert.deepEqual(failures, []);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        source: root,
        origin: ORIGIN,
        workerURL: WORKER,
        network: "LOCAL RELAYS, not a public Internet verification",
        viewports: sizes,
        loaded: [...resources].filter((r) =>
          /^(game|style|multiplayer)/.test(r),
        ),
        humans: 4,
        ai: 20,
        partySizes: [8, 24, 50],
        synchronized: true,
        cosmetics: outfits,
        reconnectedHumans: 4,
        realDressingUI: true,
        equivalentAvatarRendering: true,
      },
      null,
      2,
    ),
  );
  console.log(
    "Four-client panel, production-path assets, CORS and WebSocket checks passed (local Cloudflare runtime).",
  );
} finally {
  for (const socket of bridges) socket.terminate();
  await browser?.close();
  worker.kill("SIGTERM");
}
