import { openGourmand } from "./restaurant-navigation.mjs";
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
          window.__replayStarts=[];let replayMetric;
          Object.defineProperty(window,'__bouffeReplayMetrics',{get(){return replayMetric},set(value){replayMetric=value;if(!window.__replayStarts.some(x=>x.turn===value.turn))window.__replayStarts.push({...value})}});
          window.__cosmeticTest = {
            shoot(v) { return online.shoot(v); },
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
        let framePackets = 0,
          delayDone = false,
          delayed = null;
        server.on("message", (message) => {
          const packet = JSON.parse(message.toString());
          wire.push(packet);
          if (delayed) {
            delayed.push(message.toString());
            return;
          }
          if (
            i === 3 &&
            !delayDone &&
            packet.type === "frames" &&
            ++framePackets === 2
          ) {
            delayDone = true;
            delayed = [message.toString()];
            setTimeout(() => {
              for (const raw of delayed) route.send(raw);
              delayed = null;
            }, 5500);
          } else route.send(message.toString());
        });
        let relayClosing = false;
        server.on("error", () => {
          if (!relayClosing) errors.push("WebSocket relay failed");
        });
        server.on("close", () => route.close());
        route.onClose(() => {
          relayClosing = true;
          server.close();
        });
      },
    );
    await context.addInitScript(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => window.__forceHidden === true,
      });
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
    await page.addLocatorHandler(page.locator("#phone-rotate"), async () => {
      await page.locator("#phone-portrait").click();
    });
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
    assert.equal(
      await page.locator("#multiplayer-entry").getAttribute("role"),
      "button",
    );
    assert.equal(
      await page.locator("#multiplayer-entry").getAttribute("tabindex"),
      "0",
    );
    assert(await page.locator("#title-screen #multiplayer-entry").count());
    await page.screenshot({
      path: path.join(
        output,
        `multi-panel-${viewport.width}x${viewport.height}.png`,
      ),
    });
    await page.locator("#multiplayer-entry").press("Enter");
    await page.waitForFunction(
      () => !document.querySelector("#multiplayer-create").disabled,
    );
  }
  assert(resources.has("game.js?v=chicken-menu-40"));
  assert(resources.has("style.css?v=chicken-menu-40"));
  assert(resources.has("multiplayer-client.js?v=ceremony-38"));
  assert(resources.has("multiplayer-protocol.js?v=social-28"));
  async function dress(page, hat, outfit, extra = {}) {
    await openGourmand(page);
    await page.locator("#shop-dialog").waitFor({ state: "visible" });
    for (const id of [hat, outfit, ...Object.values(extra)]) {
      const button = page.locator(`[data-item="${id}"]`);
      if (!(await button.isDisabled())) await button.click();
    }
    await page.locator("#close-shop").click();
    assert.deepEqual(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("bouffe-profile-v1")).equipped,
      ),
      { hat, outfit, ...extra },
    );
  }
  const outfits = [
    { hat: "cap", outfit: "sport" },
    {
      hat: "chef",
      outfit: "cook",
      aura: "aura_gold",
      podium: "podium_jump",
      title: "title_3",
    },
    { hat: "hat_pizza", outfit: "outfit_royal" },
    { hat: "hat_teapot", outfit: "outfit_chocolate" },
  ];
  // Equip through the real Dressing UI rather than inventing display-only skins.
  for (const [i, page] of pages.entries()) {
    await page.locator("#multiplayer-close").click();
    await dress(
      page,
      outfits[i].hat,
      outfits[i].outfit,
      i === 1
        ? {
            aura: outfits[i].aura,
            podium: outfits[i].podium,
            title: outfits[i].title,
          }
        : {},
    );
    await page.locator("#multiplayer-entry").press("Enter");
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
  for (const [i, page] of pages.entries()) {
    await page.waitForFunction(
      () =>
        document.querySelectorAll("#multiplayer-players canvas").length === 4,
    );
    const left = await page.locator(".lobby-guests").boundingBox();
    const right = await page.locator(".lobby-order").boundingBox();
    const portrait = await page.locator(".lobby-avatar").first().boundingBox();
    assert(
      portrait.width >= 140 && portrait.height >= 180,
      "Portraits must be substantially larger than old 64x80 thumbnails",
    );
    if (sizes[i].width > 760) assert(right.x > left.x + left.width - 2);
    else assert(right.y >= left.y + left.height);
    assert(
      await page
        .locator("#multiplayer-dialog")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    );
    await page.locator("#multiplayer-dialog").screenshot({
      path: path.join(output, `restaurant-lobby-${sizes[i].width}.png`),
    });
  }
  for (const page of pages) {
    assert.equal(await page.locator(".lobby-statistics").count(), 4);
    assert.match(
      await page.locator(".lobby-statistics").first().textContent(),
      /0 victoire.*Record/,
    );
    await page
      .locator('#multiplayer-players li[data-self="false"]')
      .first()
      .click();
    await page.locator("#rivalry-dialog").waitFor({ state: "visible" });
    await page.waitForFunction(
      () => document.querySelectorAll(".rivalry-row").length === 3,
    );
    assert.equal(
      await page
        .locator(".rivalry-row b")
        .allTextContents()
        .then((x) => x.join(",")),
      "0,0,0",
    );
    await page.locator("#close-rivalry").click();
  }
  const host = pages[0];
  const trophyPage = await host.context().newPage();
  trophyPage.on("pageerror", (e) => errors.push(e.message));
  await trophyPage.goto(SITE + "?v=trophies-32");
  await openGourmand(trophyPage, "trophies");
  await trophyPage.locator("#trophies-dialog").waitFor({ state: "visible" });
  assert.equal(
    await trophyPage
      .locator('[data-trophy^="mp-"], [data-trophy^="team-"]')
      .count(),
    33,
  );
  assert(
    await trophyPage
      .locator(".trophy-section-title")
      .allTextContents()
      .then((x) => x.includes("Multijoueur") && x.includes("En équipe")),
  );
  for (const name of await trophyPage
    .locator('[data-trophy^="mp-"] h3, [data-trophy^="team-"] h3')
    .allTextContents())
    assert.equal(name, "???");
  assert.equal(
    await trophyPage.locator('[data-trophy="team-assist"] small').textContent(),
    "INDISPONIBLE",
  );
  await trophyPage.screenshot({
    path: path.join(output, "trophees-multijoueur-masques.png"),
  });
  await trophyPage.close();
  const authenticated = await host.evaluate(async (worker) => {
    const credentials = JSON.parse(
      localStorage.getItem("bouffe-online-profile-v1"),
    );
    const response = await fetch(worker + "/api/profile/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...credentials, win: true, awards: ["mp-wins5"] }),
    });
    const state = await response.json();
    const bad = await fetch(worker + "/api/profile/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...credentials, profileToken: "00".repeat(32) }),
    });
    const forged = await fetch(worker + "/api/profile/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...credentials, win: true, awards: ["mp-wins5"] }),
    });
    return {
      wins: state.wins,
      unlocked: state.trophies["mp-wins5"],
      bad: bad.status,
      forged: forged.status,
    };
  }, WORKER);
  assert.equal(authenticated.wins, 0);
  assert(!authenticated.unlocked);
  assert.equal(authenticated.bad, 401);
  assert.equal(authenticated.forged, 404);
  const lobbyChat = host.locator("#multiplayer-lobby [data-chat-panel]");
  await lobbyChat.locator("summary").click();
  const greeting = "Salut les gourmands <img src=x onerror=alert(1)>";
  await lobbyChat.locator("[data-chat-input]").fill(greeting);
  await lobbyChat.locator("button[type=submit]").click();
  for (const page of pages) {
    await page.waitForFunction(
      (text) =>
        document
          .querySelector("#multiplayer-lobby [data-chat-messages]")
          .textContent.includes(text),
      greeting,
    );
    assert.equal(await page.locator("[data-chat-messages] img").count(), 0);
  }
  await host.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("bouffe-profile-v1"))?.online?.trophies?.[
        "mp-chat"
      ],
  );
  await host.locator("#trophy-toast").waitFor({ state: "visible" });
  assert.equal(
    await host.locator("#trophy-toast").evaluate((el) => el.parentElement.id),
    "multiplayer-dialog",
  );
  assert(
    !(await pages[1].evaluate(
      () =>
        JSON.parse(localStorage.getItem("bouffe-profile-v1"))?.online
          ?.trophies?.["mp-chat"],
    )),
  );
  const revealed = await host.context().newPage();
  revealed.on("pageerror", (e) => errors.push(e.message));
  await revealed.goto(SITE + "?v=trophies-32-reveal");
  await openGourmand(revealed, "trophies");
  await revealed
    .locator('[data-trophy="mp-chat"].unlocked')
    .waitFor({ state: "visible" });
  assert.equal(
    await revealed.locator('[data-trophy="mp-chat"] h3').textContent(),
    "La bouche pleine",
  );
  assert.equal(
    await revealed.locator('[data-trophy="mp-wins5"] h3').textContent(),
    "???",
  );
  await revealed
    .locator('[data-trophy="mp-chat"]')
    .screenshot({ path: path.join(output, "trophee-chat-debloque.png") });
  await revealed.close();
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
  await pages[1].locator("#multiplayer-map").selectOption("nightmarket");
  await pages[1].locator("#multiplayer-request-map").click();
  await host.locator("#multiplayer-map-requests button").waitFor();
  assert.notEqual(
    await host.locator("#multiplayer-map").inputValue(),
    "nightmarket",
  );
  await host.locator("#multiplayer-map-requests button").click();
  for (const page of pages) {
    await page.waitForFunction(
      () => document.querySelector("#multiplayer-map").value === "nightmarket",
    );
    if (page !== host)
      assert(await page.locator("#multiplayer-map").isEnabled());
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
    if (await page.locator("#phone-rotate").isVisible())
      await page
        .locator("#phone-portrait")
        .evaluate((button) => button.click());
    assert.equal(
      await page.evaluate(() => window.__game.people[0].name),
      names[i],
    );
    assert(await page.locator("#multiplayer-entry").isHidden());
  }
  const gameChat = host.locator("#game-shell > [data-chat-panel]");
  await gameChat.locator("summary").click();
  await gameChat
    .locator("[data-chat-input]")
    .fill("Bon appétit depuis la partie !");
  await gameChat.locator("button[type=submit]").click();
  for (const page of pages)
    await page.waitForFunction(() =>
      document
        .querySelector("#game-shell [data-chat-messages]")
        .textContent.includes("Bon appétit depuis la partie !"),
    );
  await gameChat.locator("summary").click();
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
          if (!(total / x.length < 0.75 && max <= 32)) {
            await writeFile(
              path.join(output, "avatar-diff-reference.png"),
              Buffer.from(reference[j].png.split(",")[1], "base64"),
            );
            await writeFile(
              path.join(output, "avatar-diff-current.png"),
              Buffer.from(rendered[j].png.split(",")[1], "base64"),
            );
          }
          assert(
            total / x.length < 0.75 && max <= 32,
            `Same costume, pose and proportions across clients: ${identities[j].name}, mean ${total / x.length}, max ${max}, page ${pages.indexOf(page)}`,
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
  const spectator = await host.context().newPage();
  spectator.on("pageerror", (e) => errors.push(e.message));
  await spectator.goto(SITE + "?v=teams-31-observer");
  await spectator.locator("#multiplayer-entry").press("Enter");
  await spectator.waitForFunction(
    () => !document.querySelector("#multiplayer-join").disabled,
  );
  await spectator.locator("#multiplayer-name").fill("Invité spectateur");
  await spectator
    .locator("#multiplayer-join-code")
    .fill(await host.locator("#multiplayer-code").textContent());
  await spectator.locator("#multiplayer-join").click();
  await spectator.waitForFunction(
    () =>
      document.body.classList.contains("online-spectator") &&
      window.__game.people.filter((p) => p.alive).length === 24,
  );
  assert(await spectator.locator("#spectator-panel").isVisible());
  assert(await spectator.locator("#overlay").isHidden());
  assert.match(
    await spectator.locator("#online-death").textContent(),
    /regardes/,
  );
  assert.equal(await spectator.locator("#spectator-target option").count(), 24);
  assert(await spectator.locator("#mass").isHidden());
  const viewed = await spectator.locator("#spectator-target").inputValue();
  await spectator.locator("#spectator-next").click();
  assert.notEqual(
    await spectator.locator("#spectator-target").inputValue(),
    viewed,
  );
  await spectator.reload();
  await spectator.waitForFunction(
    () =>
      document.body.classList.contains("online-spectator") &&
      !document.querySelector("#spectator-panel").hidden,
  );
  assert(await spectator.locator("#overlay").isHidden());
  const spectatorChat = spectator.locator("#game-shell > [data-chat-panel]");
  await spectatorChat.locator("summary").click();
  await spectatorChat.locator("[data-chat-input]").fill("Je vous regarde !");
  await spectatorChat.locator("button[type=submit]").click();
  await host.waitForFunction(() =>
    document
      .querySelector("#game-shell [data-chat-messages]")
      .textContent.includes("Je vous regarde !"),
  );
  await spectator.screenshot({ path: path.join(output, "late-spectator.png") });
  await spectator.locator("#back-menu").click();
  await host.waitForFunction(
    () => document.querySelectorAll("#multiplayer-players li").length === 4,
  );
  await spectator.close();
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
  for (const [i, page] of pages.entries()) {
    const first = await page.evaluate(() => window.__replayStarts[0]);
    assert.equal(
      first.playbackMs,
      0,
      "First visible frame must never skip the movement",
    );
    if (i === 3)
      assert(
        first.bufferMs >= 5000,
        "Delayed frame packets must be buffered before starting",
      );
  }
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
    (await fetch(`http://127.0.0.1:${port}/__test__/spectator/${roomCode}`))
      .status,
    200,
  );
  await host.locator("#spectator-panel").waitFor({ state: "visible" });
  assert.equal(
    await host.locator("#online-death").textContent(),
    "Dévoré par " + names[1],
  );
  await host.locator("#continue-spectating").click();
  assert(await host.locator("#overlay").isHidden());
  for (const page of pages)
    await page.waitForFunction(
      (name) =>
        document
          .querySelector("#kill-feed")
          .textContent.includes("a été dévoré par " + name),
      names[1],
    );
  for (const page of pages.slice(1)) {
    const alive = await page.evaluate(() => window.__game.people[0].alive);
    if (alive) assert(await page.locator("#overlay").isHidden());
    else {
      assert(await page.locator("#overlay").isVisible());
      assert(await page.locator("#spectator-panel").isVisible());
      assert((await page.locator("#online-death").textContent()).length > 0);
    }
  }
  const choices = await host
    .locator("#spectator-target option")
    .evaluateAll((options) => options.map((o) => o.value));
  assert(choices.length > 1);
  await host.locator("#spectator-target").selectOption(choices.at(-1));
  await host.waitForFunction(
    (seat) => window.__game.spectatorSeat === Number(seat),
    choices.at(-1),
  );
  await host.locator("#spectator-next").click();
  assert.notEqual(
    await host.locator("#spectator-target").inputValue(),
    choices.at(-1),
  );
  await host.reload();
  await host.locator("#spectator-panel").waitFor({ state: "visible" });
  assert.equal(
    await host.locator("#online-death").textContent(),
    "Dévoré par " + names[1],
  );
  assert(
    (
      await host.locator("#game-shell [data-chat-messages]").textContent()
    ).includes("Bon appétit depuis la partie !"),
  );
  await host.locator("#continue-spectating").click();
  const ghostChat = host.locator("#game-shell > [data-chat-panel]");
  await ghostChat.locator("summary").click();
  await ghostChat.locator("[data-chat-input]").fill("Même mort, je parle !");
  await ghostChat.locator("button[type=submit]").click();
  await host.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("bouffe-profile-v1"))?.online?.trophies?.[
        "mp-ghost-chat"
      ],
  );
  await host.locator("#trophy-toast").waitFor({ state: "visible" });
  const ghostAt = await host.evaluate(
    () =>
      JSON.parse(localStorage.getItem("bouffe-profile-v1")).online.trophies[
        "mp-ghost-chat"
      ],
  );
  await host.reload();
  await host.locator("#spectator-panel").waitFor({ state: "visible" });
  assert.equal(
    await host.evaluate(
      () =>
        JSON.parse(localStorage.getItem("bouffe-profile-v1")).online.trophies[
          "mp-ghost-chat"
        ],
    ),
    ghostAt,
  );
  await host.locator("#continue-spectating").click();
  assert(await host.locator("#trophy-toast").isHidden());
  await host.screenshot({ path: path.join(output, "social-spectator.png") });
  await pages[1].evaluate(() => (window.__forceHidden = true));
  assert.equal(
    (await fetch(`http://127.0.0.1:${port}/__test__/end/${roomCode}`)).status,
    200,
  );
  for (const page of pages) {
    await page.locator("#multiplayer-rematch").waitFor({ state: "visible" });
    assert(await page.locator("#overlay").isVisible());
  }
  for (const page of pages) {
    await page.locator("#match-podium").waitFor({ state: "visible" });
    assert.equal(await page.locator(".podium-course").count(), 3);
    assert.match(
      await page.locator(".podium-course--first h3").textContent(),
      /LE BURGER DU JOUR/,
    );
  }
  const sharedPodium = await host.locator("#match-podium").textContent();
  for (const page of pages)
    assert.equal(
      await page.locator("#match-podium").textContent(),
      sharedPodium,
    );
  await pages[1].evaluate(() => (window.__forceHidden = false));
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
  await host.locator("#multiplayer-team-size").selectOption("2");
  for (const page of pages)
    await page.waitForFunction(
      () => document.querySelector("#multiplayer-team-size").value === "2",
    );
  assert(await pages[1].locator("#multiplayer-team-size").isDisabled());
  await pages[2].locator("#multiplayer-team").selectOption("2");
  await pages[3].locator("#multiplayer-team").selectOption("2");
  await host.locator("#multiplayer-map").selectOption("trampoline");
  for (const page of pages) await page.locator("#multiplayer-ready").click();
  await host.locator("#multiplayer-start").click();
  for (const page of pages)
    await page.waitForFunction(
      () =>
        document.body.classList.contains("online-playing") &&
        window.__game.mapId === "trampoline" &&
        window.__game.teamSize === 2 &&
        window.__game.round === 1,
    );
  for (const [i, page] of pages.entries()) {
    assert.equal(
      await page.evaluate(() => window.__game.people[0].name),
      names[i],
    );
    assert.equal(
      await page.evaluate(() => window.__game.people[0].teamId),
      i < 2 ? 0 : 2,
    );
    await page.waitForFunction(() =>
      document
        .querySelector('.character-badge[data-player="true"]')
        ?.textContent.includes("Éq."),
    );
  }
  await host.screenshot({
    path: path.join(output, "teams-trampoline-online.png"),
  });
  for (const page of pages)
    assert(
      await page.evaluate(() => window.__cosmeticTest.shoot({ x: 0, y: 0 })),
    );
  for (const page of pages)
    await page.waitForFunction(
      () => window.__game.round === 2 || window.__game.phase === "ended",
    );
  const teamStates = await Promise.all(
    pages.map((p) =>
      p.evaluate(() =>
        window.__game.people
          .filter((p) => p.alive)
          .map((p) => [p.networkSeat, p.teamId])
          .sort((a, b) => a[0] - b[0]),
      ),
    ),
  );
  for (const state of teamStates) assert.deepEqual(state, teamStates[0]);
  await pages[2].reload();
  await pages[2].waitForFunction(
    () =>
      document.body.classList.contains("online-playing") &&
      window.__game.teamSize === 2 &&
      window.__game.people[0].teamId === 2,
  );
  assert.equal(
    await pages[2].evaluate(() => window.__game.people[0].name),
    names[2],
  );
  for (const page of pages) {
    await page.locator("#back-menu").click();
    assert(await page.locator("#multiplayer-entry").isVisible());
  }
  assert.equal(
    httpRequests.filter((r) => r.path === "/api/join" && r.status === 200)
      .length,
    4,
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
