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
          "\nwindow.__gameTest = { Game: zt, Body: eA, World: XA, overlaps: RA, render: Se, showPodium, clearPodium, renderPodiumAvatar, catalog: KA, drawFood:uI,  get active() { return K; } };",
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
  await page.addInitScript(()=>{const NativeAudio=window.Audio;window.__audios44=[];window.Audio=function(src){const a=new NativeAudio(src);window.__audios44.push(a);return a;};window.Audio.prototype=NativeAudio.prototype;});
  await page.addInitScript(
    () =>
      !localStorage.getItem("bouffe-profile-v1") &&
      localStorage.setItem(
        "bouffe-profile-v1",
        JSON.stringify({
          points: 20000,
          owned: ["none", "plain", "outfit_royal"],
          equipped: { hat: "none", outfit: "outfit_royal" },
          modeWins: { classic: 1, gros: 1, usa: 1 },
          wins: 9,
          trophyTotals: { burgers: 123, fondue: 4 },
        }),
      ),
  );
  await page.goto(url);
  await page.waitForFunction(
    () => document.querySelector(".burger-menu").dataset.masksReady === "true",
  );
  await page.waitForFunction(async () => {
    const { drawEquippedHead } =
      await import("./head-sprites.js?v=audio-48");
    return drawEquippedHead(
      document.createElement("canvas").getContext("2d"),
      "none",
    );
  });
  await page.evaluate(async () => {
    const art = await import("./presentation-art.js?v=audio-48");
    await art.preparePresentationArt();
  });
  const render = await page.evaluate(() => {
    const render = window.__gameTest.render;
    const heads = window.__gameTest.catalog.filter((x) => x.slot === "hat");
    let checks = 0;
    const montage = document.createElement("canvas");
    montage.width = 640;
    montage.height = 880;
    const m = montage.getContext("2d");
    m.fillStyle = "#f1e8d2";
    m.fillRect(0, 0, 640, 880);
    for (const [j, mass] of [8, 60, 400, 1500].entries())
      for (const [i, hat] of heads.entries()) {
        const c = document.createElement("canvas");
        c.width = 160;
        c.height = 220;
        const ctx = c.getContext("2d");
        let count = 0;
        const draw = ctx.drawImage.bind(ctx);
        ctx.drawImage = (image, ...args) => {
          if (image.src?.includes("heads-equipped")) count++;
          draw(image, ...args);
        };
        render(
          ctx,
          {
            id: -1,
            mass,
            body: { position: { x: 80, y: 150 }, circleRadius: 38, speed: 0 },
          },
          0,
          { hat: hat.id, outfit: "outfit_royal", aura: "aura_gold" },
        );
        if (count !== 1)
          throw Error(
            "Expected one integrated head per avatar: " + hat.id + "/" + mass,
          );
        checks++;
        const row = ["chef", "crown", "hat_pancakes", "hat_teapot"].indexOf(
          hat.id,
        );
        if (row >= 0) {
          m.drawImage(c, j * 160, row * 220);
          m.fillStyle = "#3c2b1c";
          m.font = "12px sans-serif";
          m.fillText(
            hat.id + " · " + mass + "kg",
            j * 160 + 8,
            row * 220 + 210,
          );
        }
      }
    const drawAuraImage = (id, time) => {
      const c = document.createElement("canvas");
      c.width = 180;
      c.height = 220;
      render(
        c.getContext("2d"),
        {
          id: -1,
          mass: 60,
          body: { position: { x: 90, y: 140 }, circleRadius: 36, speed: 0 },
        },
        time,
        { hat: "none", outfit: "plain", aura: id },
      );
      return c.getContext("2d").getImageData(0, 0, 180, 220).data;
    };
    const no = drawAuraImage("aura_none", 0),
      yes = drawAuraImage("aura_ketchup", 0),
      next = drawAuraImage("aura_ketchup", 500);
    let minY = 220,
      changed = 0,
      animated = 0;
    for (let i = 0; i < no.length; i += 4) {
      if (no.slice(i, i + 4).some((v, k) => v !== yes[i + k])) {
        minY = Math.min(minY, Math.floor(i / 4 / 180));
        changed++;
      }
      if (yes.slice(i, i + 4).some((v, k) => v !== next[i + k])) animated++;
    }
    return { checks, png: montage.toDataURL(), minY, changed, animated };
  });
  assert.equal(render.checks, 96);
  assert(render.minY >= 150, JSON.stringify({ minY: render.minY, changed: render.changed }));
  assert(render.changed > 30);
  assert(render.animated > 10);
  await writeFile(
    path.join(output, "equipped-heads-four-weights.png"),
    Buffer.from(render.png.split(",")[1], "base64"),
  );
  await page.locator("#gourmand-entry").press("Enter");
  await page.locator("#shop-dialog").waitFor({ state: "visible" });
  await page.locator('[data-item="hat_pancakes"]').click();
  const prout = page.locator('[data-item="slide_prout"]');
  await prout.click();
  if (await prout.isEnabled()) await prout.click();
  await prout
    .locator("xpath=ancestor::article")
    .locator(".sound-listen")
    .click();
  assert.match(
    await page.locator("#sound-preview-status").textContent(),
    /Le Prout/,
  );

  await page.waitForFunction(()=>window.__audios44.some(a=>a.src.includes('slide-prout-48')&&a.currentTime>0));
  assert(await page.evaluate(()=>window.__audios44.filter(a=>a.src.includes('slide-prout-48')).every(a=>a.loop===false)));
  await page.locator('#shop-dialog [data-gourmand-page="trophies"]').click();
  await page.locator("#trophies-dialog").waitFor({ state: "visible" });
  assert(
    await page
      .locator('[data-trophy="gros-win"]')
      .evaluate((el) => el.classList.contains("unlocked")),
  );
  assert(
    await page
      .locator('[data-trophy="all-modes"]')
      .evaluate((el) => el.classList.contains("unlocked")),
  );
  await page.locator('[data-trophy="burger1000"]').hover();
  assert.match(
    await page
      .locator('[data-trophy="burger1000"] .trophy-progress-detail')
      .textContent(),
    /123.*1.?000/,
  );
  await page.screenshot({
    path: path.join(output, "trophy-progress-hover.png"),
  });
  await page.locator("#close-trophies").click();
  await page.locator("#options-entry").press("Enter");
  await page.locator("#options-dialog").waitFor({ state: "visible" });
  assert(await page.locator("#music-enabled").isHidden());
  assert(await page.locator("#display-status").isHidden());
  assert(await page.locator(".display-options #option-fullscreen").isVisible());
  await page.locator("#music-volume").fill("12");
  await page.locator("#music-volume").dispatchEvent("input");
  assert.equal(await page.locator("#music-enabled").isChecked(), true);
  assert.match(await page.locator("#music-volume-value").textContent(), /12/);
  await page.screenshot({ path: path.join(output, "compact-options.png") });
  await page.locator("#close-options").click();
  await page.locator("#multiplayer-entry").press("Enter");
  await page.locator("#multiplayer-dialog").waitFor({ state: "visible" });
  assert.equal(await page.locator("[data-multi-count]").count(), 3);
  await page.locator('[data-multi-count="8"]').click();
  assert.equal(
    await page.locator('[data-multi-count="8"]').getAttribute("aria-pressed"),
    "true",
  );
  await page.screenshot({
    path: path.join(output, "multiplayer-formula-card.png"),
  });
  await page.locator("#multiplayer-close").click();
  const durations = await page.evaluate(async () => {
    const { SLIDE_SOUNDS } = await import("./sound-catalog.js?v=audio-48");
    const ctx = new AudioContext(),
      result = [];
    for (const s of SLIDE_SOUNDS.filter((s) => !s.disabled)) {
      const b = await ctx.decodeAudioData(
        await (await fetch("./assets/audio/" + s.file)).arrayBuffer(),
      );
      result.push({ id: s.id, duration: b.duration });
    }
    await ctx.close();
    return result;
  });
  assert.equal(durations.length, 16);
  assert(durations.every((d) => d.duration > 0 && d.duration < 4));
  const supplied = await page.evaluate(async () => {
    const manifest = await (
      await fetch("./assets/audio/USER-SOUNDS-44.json")
    ).json();
    const ctx = new AudioContext();
    const result = [];
    for (const item of manifest) {
      const response = await fetch("./assets/audio/" + item.file);
      if (!response.ok) throw Error(item.file);
      const decoded = await ctx.decodeAudioData(await response.arrayBuffer());
      result.push({ file: item.file, duration: decoded.duration });
    }
    await ctx.close();
    return result;
  });
  await page.waitForFunction(()=>window.__audios44.some(a=>a.src.includes('menu-jingle-44')&&a.currentTime>0));
  assert.equal(supplied.length, 15);
  assert(supplied.every((s) => s.duration > 0));
  await page.reload();
  await page.waitForFunction(
    () => document.querySelector(".burger-menu").dataset.masksReady === "true",
  );
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("bouffe-profile-v1")).equipped.hat,
    ),
    "hat_pancakes",
  );
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("bouffe-profile-v1")).equipped.slide,
    ),
    "slide_prout",
  );
  await page.locator('#options-entry').press('Enter');await page.locator('#shadow-entry').click();await page.locator('#shadow-password').fill('Pologne');await page.locator('#shadow-form button[type=submit]').click();await page.locator('#enter-shadow').click();
  await page.waitForFunction(()=>window.__audios44.some(a=>a.src.includes('secret-jingle-44')&&a.currentTime>0));
  assert(await page.evaluate(()=>window.__audios44.filter(a=>a.src.includes('secret-jingle-44')).every(a=>a.loop===false)));
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      headRenders: render.checks,
      auraMinY: render.minY,
      auraAnimatedPixels: render.animated,
      durations,
      ui: true,
    }),
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
