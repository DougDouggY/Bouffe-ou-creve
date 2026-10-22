import { isVisible } from "./visibility.js?v=wild-arenas-13";
import { hungerZone } from "./hunger-games.js?v=wild-arenas-13";
const images = new Map();
function asset(id) {
  if (!images.has(id)) {
    const image = new Image();
    image.src = new URL(`./assets/arenas/${id}.webp`, import.meta.url).href;
    images.set(id, image);
  }
  const image = images.get(id);
  return image.complete && image.naturalWidth ? image : null;
}
function sprite(ctx, id, x, y, w, h) {
  const image = asset(id);
  if (image) ctx.drawImage(image, x - w / 2, y - h / 2, w, h);
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
function observer(g) {
  const p = g.people[0];
  return {
    ...p.body.position,
    r: p.body.circleRadius,
    lightBoost: p.lightBoost || 1,
  };
}
function visible(g, p) {
  return isVisible(g.mapId, observer(g), p, g.obstacles);
}
function label(ctx, text, x, y, color = "#fff2bc") {
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#27332be6";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
export function drawArenaFloor(ctx, g, time) {
  const rules = g.mechanics;
  if (!rules) return;
  ctx.save();
  if (g.mapId === "hunger") {
    const zone = hungerZone(g.w, g.h, g.round);
    ctx.beginPath();
    ctx.rect(0, 0, g.w, g.h);
    ctx.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2, true);
    ctx.fillStyle = "#3e182585";
    ctx.fill("evenodd");
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2);
    ctx.strokeStyle = g.round >= 4 ? "#fa7358" : "#e6d9a0";
    ctx.lineWidth = 9;
    ctx.stroke();
    if (g.round >= 4)
      label(ctx, "ZONE SÛRE · FIN DU TOUR", zone.x, zone.y - zone.r + 35);
  }
  if (["market", "nightmarket"].includes(g.mapId)) {
    for (const shelf of g.obstacles) {
      if (shelf.boundary) continue;
      ctx.save();
      ctx.translate(shelf.x, shelf.y);
      ctx.rotate((shelf.angle || 0) + Math.PI / 2);
      ellipse(ctx, 4, 4, shelf.h * 0.54, shelf.w * 0.58, "#273d3540");
      sprite(ctx, "shelf", 0, 0, shelf.h, shelf.w);
      ctx.restore();
    }
  }
  if (g.mapId === "cold")
    for (const obstacle of g.obstacles) {
      if (obstacle.boundary) continue;
      ctx.save();
      ctx.translate(obstacle.x, obstacle.y);
      ctx.rotate(obstacle.angle);
      const w = obstacle.w,
        h = obstacle.h;
      ctx.shadowColor = "#19394677";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 10;
      const steel = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      steel.addColorStop(0, "#34596d");
      steel.addColorStop(0.18, "#a7cbd8");
      steel.addColorStop(0.75, "#d6e8eb");
      steel.addColorStop(1, "#567b8c");
      ctx.fillStyle = steel;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = "#e6f7fc";
      ctx.lineWidth = 5;
      ctx.strokeRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);
      ctx.strokeStyle = "#648699";
      ctx.lineWidth = 2;
      for (let y = -h / 2 + 20; y < h / 2 - 10; y += 13) {
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 10, y);
        ctx.lineTo(w / 2 - 10, y);
        ctx.stroke();
      }
      for (const x of [-w / 2 + 9, w / 2 - 9])
        for (const y of [-h / 2 + 10, h / 2 - 10])
          ellipse(ctx, x, y, 3, 3, "#e0f4fa");
      ctx.restore();
    }
  if (g.mapId === "fair")
    for (const bumper of g.obstacles) {
      if (!bumper.bumper) continue;
      const compressed = Math.max(
        0,
        ((bumper.hitUntil || 0) - rules.clock) / 360,
      );
      const squash = 1 - Math.sin(compressed * Math.PI) * 0.17;
      ctx.save();
      ctx.translate(bumper.x, bumper.y);
      ctx.scale(1 + (1 - squash) * 0.7, squash);
      ellipse(ctx, 0, 7, bumper.r * 1.08, bumper.r * 0.8, "#171a3a66");
      sprite(ctx, "bumper", 0, -3, bumper.r * 2.15, bumper.r * 2.15);
      ctx.restore();
    }
  if (g.mapId === "royal") {
    const mouth = rules.mouth(),
      suction = g.round % 2 === 1,
      env = rules.environment;
    if (suction) {
      ctx.beginPath();
      ctx.moveTo(mouth.x - mouth.r, mouth.y);
      ctx.lineTo(mouth.x - g.h * 0.6, g.h);
      ctx.lineTo(mouth.x + g.h * 0.6, g.h);
      ctx.lineTo(mouth.x + mouth.r, mouth.y);
      ctx.closePath();
      ctx.fillStyle = env?.kind === "suction" ? "#ffe1a22e" : "#ffd89916";
      ctx.fill();
      ctx.strokeStyle = "#ffd49c99";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 9]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (env?.kind === "suction") {
      for (let i = 0; i < 28; i++) {
        const t = 1 - ((time * 0.0007 + i * 0.073) % 1),
          spread = Math.sin(i * 21.2) * g.h * 0.48;
        ctx.strokeStyle = "#ffe4bb88";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(mouth.x + spread * t, mouth.y + g.h * 0.8 * t);
        ctx.lineTo(
          mouth.x + spread * (t + 0.045),
          mouth.y + g.h * 0.8 * (t + 0.045),
        );
        ctx.stroke();
      }
    }
    if (env?.kind === "burp") {
      const t = env.elapsed / env.duration;
      ctx.globalAlpha = 1 - t;
      for (let i = 0; i < 5; i++)
        ellipse(
          ctx,
          mouth.x + Math.sin(i * 4) * t * 65,
          mouth.y + t * 140 + i * 9,
          15 + t * 50,
          10 + t * 32,
          "#b2ce8270",
        );
      ctx.globalAlpha = 1;
      label(ctx, "BROOOÂÂÂRP !", mouth.x, mouth.y + 50 + t * 90, "#f5e88b");
    }
    if (g.phase === "aim")
      label(
        ctx,
        suction ? "CE TOUR : ASPIRATION DANS LE CÔNE" : "CE TOUR : ROT ROYAL",
        g.w * 0.5,
        g.h - 18,
      );
  }
  if (g.mapId === "beach") {
    const wave = rules.environment;
    if (wave?.kind === "wave") {
      const y =
        g.h + 40 - (g.h + 100) * Math.min(1, wave.elapsed / wave.duration);
      const gradient = ctx.createLinearGradient(0, y + 100, 0, y - 15);
      gradient.addColorStop(0, "#43b9cb00");
      gradient.addColorStop(0.65, "#54c1d399");
      gradient.addColorStop(1, "#effffff2");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, y + 100);
      ctx.lineTo(0, y);
      for (let x = 0; x <= g.w; x += 10)
        ctx.lineTo(x, y + Math.sin(x * 0.025 + time * 0.009) * 9);
      ctx.lineTo(g.w, y + 100);
      ctx.closePath();
      ctx.fill();
      for (let x = 0; x < g.w; x += 15)
        ellipse(
          ctx,
          x,
          y + Math.sin(x * 0.025 + time * 0.009) * 9,
          7,
          3,
          "#fffef5ee",
        );
    }
    if (g.phase === "aim")
      label(
        ctx,
        g.round % 3 === 0
          ? "GROSSE VAGUE CE TOUR  ↑"
          : `VAGUE DANS ${3 - (g.round % 3)} TOUR${3 - (g.round % 3) > 1 ? "S" : ""}  ↑`,
        g.w * 0.5,
        28,
        "#e4ffff",
      );
  }
  ctx.restore();
}
export function drawArenaActors(ctx, g, time) {
  const rules = g.mechanics;
  if (!rules) return;
  ctx.save();
  for (const actor of rules.actors) {
    const p = actor.body.position;
    if (!visible(g, p)) continue;
    if (actor.kind === "cart") {
      const client = actor.client,
        panic = actor.reactUntil > rules.clock,
        bob = g.phase === "moving" ? Math.sin(time * 0.012) * 2 : 0;
      ellipse(ctx, client.x, client.y + 17, 17, 7, "#22362c40");
      sprite(ctx, "customer", client.x, client.y + bob, 40, 50);
      if (panic) {
        label(ctx, "Oups !", client.x, client.y - 28, "#ffe696");
        ctx.strokeStyle = "#d2782c";
        ctx.lineWidth = 2;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(client.x + side * 20, client.y - 15);
          ctx.lineTo(client.x + side * 24, client.y - 22);
          ctx.lineTo(client.x + side * 28, client.y - 14);
          ctx.stroke();
        }
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(actor.body.angle);
      ellipse(ctx, 3, 5, 18, 22, "#23382c40");
      sprite(ctx, "cart", 0, 0, 34, 46);
      ctx.restore();
    } else {
      const bob = g.phase === "moving" ? Math.sin(time * 0.015) * 2 : 0;
      ellipse(ctx, p.x, p.y + 17, 20, 8, "#11172566");
      sprite(ctx, "security", p.x, p.y - 6 + bob, 49, 52);
      if (g.phase === "aim") {
        const plan = actor.plan;
        ctx.strokeStyle = "#efb465";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + plan.x * 22, p.y + plan.y * 22);
        ctx.stroke();
        const a = Math.atan2(plan.y, plan.x);
        ctx.save();
        ctx.translate(p.x + plan.x * 22, p.y + plan.y * 22);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-9, -5);
        ctx.lineTo(-9, 5);
        ctx.closePath();
        ctx.fillStyle = "#efb465";
        ctx.fill();
        ctx.restore();
      }
    }
  }
  for (const item of rules.items)
    if (visible(g, item)) {
      const bob = Math.sin(time * 0.004 + item.x) * 3;
      const glow = ctx.createRadialGradient(
        item.x,
        item.y,
        3,
        item.x,
        item.y,
        29,
      );
      glow.addColorStop(0, "#ffe6a588");
      glow.addColorStop(1, "#ffe6a500");
      ctx.fillStyle = glow;
      ctx.fillRect(item.x - 30, item.y - 30, 60, 60);
      sprite(ctx, item.kind, item.x, item.y - 3 + bob, 36, 40);
    }
  // Prewarm images while the menu / first arena frame is drawing.
  for (const id of [
    "customer",
    "cart",
    "security",
    "bumper",
    "armored",
    "inferno",
    "lamp",
    "securityShield",
    "shelf",
  ])
    asset(id);
  ctx.restore();
}
export function drawArenaPowers(ctx, g, time) {
  const rules = g.mechanics;
  if (!rules) return;
  ctx.save();
  ctx.lineCap = "round";
  for (const trail of rules.trails) {
    if (!visible(g, trail.a) && !visible(g, trail.b)) continue;
    ctx.strokeStyle = "#e85219";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(trail.a.x, trail.a.y);
    ctx.lineTo(trail.b.x, trail.b.y);
    ctx.stroke();
    ctx.strokeStyle = "#ffdc62";
    ctx.lineWidth = 4;
    ctx.stroke();
    if (Math.floor(trail.endDistance / 8) % 3 === 0) {
      const x = trail.b.x,
        y = trail.b.y,
        flame = 6 + Math.sin(time * 0.019 + x) * 3;
      ctx.fillStyle = "#ffd96b";
      ctx.beginPath();
      ctx.moveTo(x - 4, y);
      ctx.quadraticCurveTo(x - 6, y - flame * 0.6, x + 1, y - flame - 5);
      ctx.quadraticCurveTo(x, y - flame * 0.3, x + 4, y);
      ctx.fill();
    }
  }
  for (const p of g.people.filter((p) => p.alive)) {
    if (!visible(g, p.body.position)) continue;
    const pos = p.body.position,
      r = p.body.circleRadius;
    if (p.armored || p.securityUntil >= g.round) {
      ctx.strokeStyle = p.armored ? "#8ee8ff" : "#ffb673";
      ctx.lineWidth = 3;
      ctx.setLineDash(p.armored ? [] : [6, 4]);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r + 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (p.infernoReady) sprite(ctx, "inferno", pos.x + r, pos.y - r, 18, 22);
    if (p.lightBoost > 1) sprite(ctx, "lamp", pos.x - r, pos.y - r, 18, 22);
  }
  const player = g.people[0],
    powers = [];
  if (player.alive) {
    if (g.phase === "aim" && g.mapId === "beach" && g.round % 3 === 0)
      powers.push("VAGUE CE TOUR ↑");
    if (
      g.phase === "aim" &&
      g.mapId === "royal" &&
      g.round % 2 === 1 &&
      rules.inCone(player.body.position)
    )
      powers.push("ZONE D’ASPIRATION");
    if (player.armored) powers.push("BLINDAGE · 1 CHOC");
    if (player.infernoReady) powers.push("FEU · PROCHAIN TIR");
    if (player.fireActive) powers.push("FEU ACTIF · ATTENTION AU RETOUR");
    if (player.lampUntil >= g.round)
      powers.push(
        `LAMPE · ${Math.min(2, player.lampUntil - g.round + 1)} TOUR(S)`,
      );
    if (player.securityUntil >= g.round) powers.push("ANTI-SÉCURITÉ · 1 TOUR");
    ctx.font = "bold 12px sans-serif";
    for (const [index, power] of powers.entries()) {
      const half = ctx.measureText(power).width * 0.5 + 8;
      const x = Math.max(half, Math.min(g.w - half, player.body.position.x));
      const y = Math.min(
        g.h - 12 - (powers.length - 1 - index) * 15,
        player.body.position.y + player.body.circleRadius + 24 + index * 15,
      );
      label(ctx, power, x, y, "#fff2b0");
    }
  }
  for (const pulse of rules.pulses) {
    if (!visible(g, pulse)) continue;
    const t = 1 - (pulse.until - rules.clock) / 650;
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle =
      pulse.kind === "burn"
        ? "#ff8b32"
        : pulse.kind === "shield"
          ? "#9cecff"
          : "#ffe0a0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, 12 + t * 45, 0, Math.PI * 2);
    ctx.stroke();
    if (pulse.kind === "shield")
      for (let i = 0; i < 7; i++) {
        const a = (i * Math.PI * 2) / 7;
        ctx.save();
        ctx.translate(
          pulse.x + Math.cos(a) * t * 48,
          pulse.y + Math.sin(a) * t * 48,
        );
        ctx.rotate(a + t);
        ctx.fillStyle = "#c6f5ff";
        ctx.fillRect(-3, -5, 6, 10);
        ctx.restore();
      }
    if (pulse.kind === "burn")
      for (let i = 0; i < 9; i++)
        ellipse(
          ctx,
          pulse.x + Math.sin(i * 7) * t * 32,
          pulse.y - t * 60 + (i % 3) * 9,
          4 + t * 8,
          7 + t * 10,
          i % 2 ? "#ffab40" : "#69352d88",
        );
  }
  ctx.restore();
}
