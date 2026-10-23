// Run against a local production Wrangler worker. Four authenticated human seats
// per size; no fixture can award a result or override the simulation.
import assert from "node:assert/strict";
import WebSocket from "../cloudflare/node_modules/ws/index.js";
import { SIMULATION_VERSION } from "../multiplayer-simulation.js";
import { decodeFrame } from "../multiplayer-protocol.js";
const base = process.env.WORKER_BASE_URL || "http://127.0.0.1:8797",
  origin = "https://dougdouggy.github.io";
async function post(path, body) {
  const r = await fetch(base + path, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, version: SIMULATION_VERSION }),
  });
  assert(r.ok, "Worker HTTP " + r.status);
  return r.json();
}
async function peer(ticket) {
  const ws = new WebSocket(
    base.replace(/^http/, "ws") + "/api/socket/" + ticket.code,
    ["bouffe-v1", "ticket." + ticket.token],
    { origin },
  );
  const packets = [];
  ws.on("message", (b) => packets.push(JSON.parse(b.toString())));
  await new Promise((r, j) => {
    ws.once("open", r);
    ws.once("error", j);
  });
  return {
    packets,
    ws,
    send(m) {
      ws.send(JSON.stringify({ ...m, version: SIMULATION_VERSION }));
    },
    async wait(f) {
      for (let i = 0; i < 400; i++) {
        const p = packets.find(f);
        if (p) return p;
        const e = packets.find((p) => p.type === "error");
        if (e) throw Error(e.message);
        await new Promise((r) => setTimeout(r, 25));
      }
      throw Error("Timed out waiting for Worker");
    },
  };
}
for (const count of [8, 24, 50]) {
  const peers = [];
  try {
    const host = await post("/api/rooms", {
      name: "Humain 1",
      cosmetics: {
        hat: "chef",
        outfit: "cook",
        aura: "aura_gold",
        podium: "podium_jump",
        title: "title_0",
      },
    });
    peers.push(await peer(host));
    for (let i = 1; i < 4; i++)
      peers.push(
        await peer(
          await post("/api/join", {
            code: host.code,
            name: "Humain " + (i + 1),
            cosmetics: {
              hat: "hat_pancakes",
              outfit: "outfit_royal",
              aura: "aura_ketchup",
            },
          }),
        ),
      );
    await peers[0].wait(
      (p) =>
        p.type === "room" &&
        p.room.members.length === 4 &&
        p.room.members.every((m) => m.connected),
    );
    peers[0].send({ type: "size", count });
    await peers[0].wait((p) => p.type === "room" && p.room.count === count);
    for (const p of peers) p.send({ type: "ready", ready: true });
    await peers[0].wait(
      (p) =>
        p.type === "room" &&
        p.room.count === count &&
        p.room.members.every((m) => m.ready),
    );
    peers[0].send({ type: "start" });
    const starts = await Promise.all(
      peers.map((p) => p.wait((p) => p.type === "state")),
    );
    for (const p of starts) assert.deepEqual(p.state, starts[0].state);
    for (const [i, p] of peers.entries())
      p.send({ type: "shot", turn: 1, x: i % 2 ? 12 : -12, y: 3 });
    const resolutions = await Promise.all(
      peers.map((p) => p.wait((p) => p.type === "resolution")),
    );
    for (const p of resolutions)
      assert.deepEqual(p.final, resolutions[0].final);
    await Promise.all(
      peers.map((p) => p.wait((p) => p.type === "frames" && p.last)),
    );
    for (const p of peers) {
      let prev;
      for (const packet of p.packets.filter((p) => p.type === "frames"))
        for (const f of packet.frames) prev = decodeFrame(f, prev?.state);
      assert.deepEqual(prev.state, resolutions[0].final);
    }
    console.log(
      JSON.stringify({
        count,
        humans: 4,
        ai: count - 4,
        sharedFinal: true,
        cosmetics: starts[0].state.people[0].cosmetics,
        metrics: resolutions[0].metrics,
      }),
    );
  } finally {
    for (const p of peers) {
      p.send({ type: "leave" });
      p.ws.close();
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}
