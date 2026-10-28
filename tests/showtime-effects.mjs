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
    if (filename === path.join(root, "podium.js"))
      content = Buffer.concat([
        content,
        Buffer.from(
          "\nexport function testFreezeFrame(age,celebration){if(!scene?.webgl)throw Error('3D not ready');cancelAnimationFrame(scene.raf);clearTimeout(scene.timer);const now=performance.now();for(const a of scene.actors)a.celebrateAt=now-celebration*1000;scene.webgl.restart(now-age*1000);scene.webgl.frame(now,poseAt,true);}\n",
        ),
      ]);
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
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});

try {
  const page = await browser.newPage({
      viewport: { width: 1366, height: 1000 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    if (!localStorage.getItem("bouffe-profile-v1"))
      localStorage.setItem(
        "bouffe-profile-v1",
        JSON.stringify({
          points: 30000,
          owned: ["none", "plain"],
          equipped: { hat: "none", outfit: "plain" },
        }),
      );
    localStorage.setItem("bouffe-cosmetic-motion", "full");
    localStorage.setItem(
      "gourmands-effects-v1",
      JSON.stringify({ volume: 0.5, others: true }),
    );
    const Native = window.Audio;
    window.__voices45 = [];
    window.Audio = function (src) {
      const a = new Native(src);
      window.__voices45.push(a);
      return a;
    };
    window.Audio.prototype = Native.prototype;
  });
  await page.goto(url);
  await page.waitForFunction(() => window.__gameTest);
  await page.evaluate(async () => {
    await (
      await import("./presentation-art.js?v=auras-47")
    ).preparePresentationArt();
  });
  await openGourmand(page);
  await page.locator("[data-cosmetics-filter=collision]").click();
  assert.equal(
    await page.locator("#shop-dialog .shop-card:visible").count(),
    6,
  );
  const buy = async (id) => {
    const b = page.locator(`[data-item=${id}]`);
    if (await b.isEnabled()) await b.click();
    if (await b.isEnabled()) await b.click();
  };
  await buy("collision_smack");
  await page
    .locator("[data-item=collision_smack]")
    .locator("xpath=ancestor::article")
    .locator(".sound-listen")
    .click();
  await page.waitForFunction(() =>
    window.__voices45.some(
      (a) => a.src.includes("collision-smack-44") && a.currentTime > 0,
    ),
  );
  await page.screenshot({
    path: path.join(output, "showtime45-collision-shop.png"),
  });
  await page.locator("[data-cosmetics-filter=podium]").click();
  await buy("podium_burp");
  await page.locator("#preview-podium-animation").click();
  await page.waitForFunction(() =>
    window.__voices45.some(
      (a) => a.src.includes("podium-burp-45") && a.currentTime > 0,
    ),
  );
  await page
    .locator("#avatar-preview")
    .screenshot({ path: path.join(output, "showtime45-shop-burp.png") });
  await page.locator("[data-cosmetics-filter=slide]").click();
  await buy("slide_kisscount");
  await page
    .locator("[data-item=slide_kisscount]")
    .locator("xpath=ancestor::article")
    .locator(".sound-listen")
    .click();
  await page.waitForFunction(() =>
    window.__voices45.some(
      (a) => a.src.includes("slide-kisscount-47") && a.currentTime > 0.1,
    ),
  );
  const kiss = await page.evaluate(() => {
    const a = window.__voices45.find((a) =>
      a.src.includes("slide-kisscount-47"),
    );
    return { duration: a.duration, rate: a.playbackRate, volume: a.volume };
  });
  assert(kiss.duration >= 1.216);
  assert(kiss.volume * 0.5 <= 0.082);
  assert.equal(kiss.rate, 1);
  await page.evaluate(async () => {
    const { createMotionAudio } =
      await import("./motion-audio.js?v=auras-47");
    window.__bus45 = createMotionAudio();
    window.__bus45.slide(
      { id: 0, human: true, cosmetics: { slide: "slide_kisscount" } },
      1,
      17,
    );
  });
  await page.waitForFunction(() =>
    window.__voices45
      .filter((a) => a.src.includes("slide-kisscount-47"))
      .some((a) => a.playbackRate < 0.9 && a.currentTime > 0),
  );
  await page.evaluate(() => window.__bus45.reset());
  await page.locator("#close-shop").click();
  await page.reload();
  await page.waitForFunction(() => window.__gameTest);
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("bouffe-profile-v1")).equipped
          .collision,
    ),
    "collision_smack",
  );
  await page.evaluate(() => {
    const t = window.__gameTest,
      people = [
        {
          id: 0,
          name: "Le Roi",
          mass: 400,
          cosmetics: {
            hat: "hat_pancakes",
            outfit: "outfit_royal",
            aura: "aura_ketchup",
            podium: "podium_burp",
          },
        },
        {
          id: 1,
          name: "Le Danseur",
          mass: 600,
          cosmetics: {
            hat: "chef",
            outfit: "cook",
            aura: "aura_gold",
            podium: "podium_belly",
          },
        },
        {
          id: 2,
          name: "Le Burger",
          mass: 60,
          cosmetics: {
            hat: "pirate",
            outfit: "sport",
            aura: "aura_toxic",
            podium: "podium_despair",
          },
        },
      ];
    t.showPodium(
      {
        champions: [0],
        predators: [1],
        predatorKills: 4,
        first: 2,
        teamSize: 1,
        teamId: 0,
      },
      people,
      t.renderPodiumAvatar,
    );
    document.body.classList.add("online-playing");
    document.querySelector("#overlay").hidden = false;
    document.querySelector("#play-area").hidden = false;
    document.querySelector("#main-menu").hidden = true;
  });
  await page.waitForSelector("[data-renderer=webgl]");
  await page.waitForFunction(
    () => Number(document.querySelector("#match-podium").dataset.walkers) > 0,
  );
  await page
    .locator("#match-podium")
    .screenshot({ path: path.join(output, "showtime45-walk.png") });
  await page.evaluate(() => {
    const b = document.querySelector(".ceremony-skip");
    if (!b.hidden) b.click();
    else
      document.querySelectorAll(".ceremony-person").forEach((b) => b.click());
  });
  await page.evaluate(async () => {
    document.querySelector("#match-podium").dataset.intro = "done";
    (await import("./podium.js?v=auras-47")).testFreezeFrame(4, 1.25);
  });
  assert(
    (await page.locator("#match-podium").getAttribute("data-expressions"))
      .split(",")
      .includes("2"),
  );
  assert(
    Number(await page.locator("#match-podium").getAttribute("data-smoke")) > 0,
  );
  await page
    .locator("#match-podium")
    .screenshot({ path: path.join(output, "showtime45-burp-and-belly.png") });
  const a = await page.locator(".ceremony-webgl").screenshot();
  await page.evaluate(async () => {
    (await import("./podium.js?v=auras-47")).testFreezeFrame(4.3, 1.47);
  });
  const b = await page.locator(".ceremony-webgl").screenshot();
  assert(!a.equals(b));
  await page.locator(".podium-course--predator .ceremony-person").click();
  await page.evaluate(async () => {
    (await import("./podium.js?v=auras-47")).testFreezeFrame(4, 0.15);
  });
  assert(
    (await page.locator("#match-podium").getAttribute("data-body-widths"))
      .split(",")
      .some((v) => Number(v) > 0.95),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  await page.evaluate(async () => {
    (await import("./podium.js?v=auras-47")).testFreezeFrame(4, 1.2);
  });
  assert(
    await page
      .locator("#overlay>div")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  );
  await page
    .locator("#match-podium")
    .screenshot({ path: path.join(output, "showtime45-mobile.png") });
  await page.evaluate(() => window.__gameTest.clearPodium());
  assert.equal(await page.locator(".ceremony-webgl").count(), 0);
  const fx = await page.evaluate(async () => {
    const { drawAura } = await import("./cosmetic-effects.js?v=auras-47"),
      { drawVFX, preparePresentationArt } =
        await import("./presentation-art.js?v=auras-47");
    await preparePresentationArt();
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 500;
    canvas.id = "fx45";
    canvas.style =
      "position:fixed;inset:0;width:1000px;height:500px;z-index:9999;background:#eee0c5";
    document.body.append(canvas);
    const ctx = canvas.getContext("2d");
    const ids = [
      "aura_ketchup",
      "aura_mayo",
      "aura_gold",
      "aura_flame",
      "aura_toxic",
    ];
    ids.forEach((id, i) => {
      ctx.save();
      ctx.translate(100 + i * 200, 30);
      ctx.scale(55, 55);
      drawAura(ctx, id, 0, "full");
      ctx.restore();
      ctx.save();
      ctx.translate(100 + i * 200, 150);
      ctx.scale(55, 55);
      drawAura(ctx, id, 180, "full");
      ctx.restore();
    });
    drawVFX(ctx, "fire", 0, 200, 440, 130, 170);
    drawVFX(ctx, "fire", 3, 420, 440, 130, 170);
    drawVFX(ctx, "burp", 2, 750, 440, 300, 170);
    const data = ctx.getImageData(0, 0, 1000, 500).data;
    return { pixels: [...data].filter((v, i) => i % 4 === 3 && v > 80).length };
  });
  assert(fx.pixels > 5000);
  await page
    .locator("#fx45")
    .screenshot({
      path: path.join(output, "showtime45-generated-effects.png"),
    });
  assert.deepEqual(errors, []);
  console.log(
    "Collision purchases/equipment/preview/persistence, quieter full Kisscount and slow long slide, generated auras/fire, real 3D walking, mouth frames, burp smoke, belly deformation, replay and mobile layout passed.",
  );
  await page.close();
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
