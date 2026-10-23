import { performance } from "node:perf_hooks";
import { createSimulation, resolveTurn } from "../multiplayer-simulation.js";
import { eA as Body } from "../simulation-core.js";
import { encodeFrames, decodeFrame } from "../multiplayer-protocol.js";
import { ReplayClock } from "../replay-clock.js";
const rows = [];
for (const count of [8, 24, 50]) {
  const g = createSimulation(
    count,
    378,
    Array.from({ length: 4 }, (_, i) => ({
      id: "h" + i,
      name: "Humain " + i,
      seat: i,
    })),
    "cantine",
  );
  const cx = g.w / 2,
    cy = g.h / 2;
  for (const [i, p] of g.people.entries()) {
    g.resize(p, 60 + (i % 5) * 45);
    Body.setPosition(p.body, {
      x: cx + Math.cos(i * 2.4) * 90,
      y: cy + Math.sin(i * 2.4) * 90,
    });
  }
  g.food = Array.from({ length: 80 }, (_, i) => ({
    x: cx + Math.cos(i) * 100,
    y: cy + Math.sin(i) * 100,
    type: "burger",
    size: "xl",
  }));
  const steps = [],
    growth = [];
  const actualStep = g.step.bind(g),
    actualResize = g.resize.bind(g);
  g.step = (...args) => {
    const start = performance.now();
    const value = actualStep(...args);
    steps.push(performance.now() - start);
    return value;
  };
  g.resize = (...args) => {
    const start = performance.now();
    const value = actualResize(...args);
    growth.push(performance.now() - start);
    return value;
  };
  const start = performance.now();
  const replay = resolveTurn(
    g,
    new Map(
      Array.from({ length: 4 }, (_, i) => [i, { x: i % 2 ? 8 : -8, y: 3 }]),
    ),
  );
  const simulationMs = performance.now() - start;
  const enc = performance.now(),
    frames = encodeFrames(replay.frames),
    encodeMs = performance.now() - enc;
  const wire = JSON.stringify(frames),
    dec = performance.now();
  let prev;
  for (const f of JSON.parse(wire)) prev = decodeFrame(f, prev?.state);
  const decodeMs = performance.now() - dec;
  const delayed = replay.duration + 1200;
  const oldFirstMs = delayed,
    newFirstMs = new ReplayClock().sample(delayed, true);
  rows.push({
    count,
    humans: 4,
    simulationMs: +simulationMs.toFixed(2),
    maximumStepMs: +Math.max(...steps).toFixed(2),
    meanStepMs: +(steps.reduce((a, b) => a + b, 0) / steps.length).toFixed(2),
    growthMs: +growth.reduce((a, b) => a + b, 0).toFixed(2),
    encodeMs: +encodeMs.toFixed(2),
    decodeMs: +decodeMs.toFixed(2),
    bytes: Buffer.byteLength(wire),
    frames: frames.length,
    eliminations: replay.events.filter((e) => e.kind === "elimination").length,
    meals: replay.events.filter((e) => e.kind === "food").length,
    duration: replay.duration,
    oldFirstMs,
    newFirstMs,
  });
  g.destroy();
}
console.log(JSON.stringify(rows, null, 2));
