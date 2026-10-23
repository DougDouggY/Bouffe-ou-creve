// Runs inside Cloudflare Builds after wrangler deploy; never logs room tickets/codes.
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import WebSocket from "ws";
import { SIMULATION_VERSION } from "../../multiplayer-simulation.js";

const DEFAULT_SERVER =
  "https://bouffeoucrevemulti.jeferson-patry-sin.workers.dev";
const ORIGIN = "https://dougdouggy.github.io";
class Peer {
  constructor(url, ticket) {
    this.packets = [];
    this.waiters = [];
    this.closed = false;
    this.socket = new WebSocket(url, ["bouffe-v1", "ticket." + ticket.token], {
      origin: ORIGIN,
      handshakeTimeout: 10000,
      maxPayload: 1024 * 1024,
    });
    this.socket.on("message", (raw) => {
      let packet;
      try {
        packet = JSON.parse(raw.toString());
      } catch {
        this.fail("Réponse WebSocket invalide.");
        return;
      }
      this.packets.push(packet);
      if (packet.type === "error")
        this.fail("Le serveur a refusé une commande de vérification.");
      for (const waiter of [...this.waiters])
        if (waiter.predicate(packet)) waiter.resolve(packet);
    });
    this.socket.on("error", () =>
      this.fail(
        "Connexion WebSocket impossible. Vérifier les journaux Cloudflare.",
      ),
    );
    this.socket.on("close", () => {
      this.closed = true;
      this.fail("Connexion WebSocket fermée avant la vérification attendue.");
    });
    this.socket.on("unexpected-response", (_, response) => {
      response.resume();
      this.fail(`Connexion WebSocket refusée (HTTP ${response.statusCode}).`);
      this.socket.terminate();
    });
  }
  fail(message) {
    this.error = new Error(message);
    for (const waiter of [...this.waiters]) waiter.reject(this.error);
  }
  wait(predicate, timeout = 15000) {
    const found = this.packets.find(predicate);
    if (found) return Promise.resolve(found);
    if (this.error || this.closed)
      return Promise.reject(this.error || new Error("Socket fermée."));
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        this.waiters = this.waiters.filter((w) => w !== waiter);
      };
      const waiter = {
        predicate,
        resolve(value) {
          cleanup();
          resolve(value);
        },
        reject(error) {
          cleanup();
          reject(error);
        },
      };
      const timer = setTimeout(
        () => waiter.reject(new Error("Le serveur n’a pas répondu à temps.")),
        timeout,
      );
      this.waiters.push(waiter);
    });
  }
  send(message) {
    assert.equal(
      this.socket.readyState,
      WebSocket.OPEN,
      "Le WebSocket doit être ouvert.",
    );
    this.socket.send(
      JSON.stringify({ ...message, version: SIMULATION_VERSION }),
    );
  }
  async close() {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.send({ type: "leave" });
      // Last member closes on expiry instead of receiving an ack.
      await this.wait(
        (p) =>
          (p.type === "ack" && p.action === "leave") || p.type === "expired",
        3000,
      ).catch(() => {});
    }
    if (this.socket.readyState !== WebSocket.CLOSED) {
      this.socket.close();
      await new Promise((resolve) => {
        if (this.socket.readyState === WebSocket.CLOSED) return resolve();
        const timer = setTimeout(() => {
          this.socket.terminate();
          resolve();
        }, 1000);
        this.socket.once("close", () => {
          clearTimeout(timer);
          resolve();
        });
      });
    }
  }
}
export async function verifyDeployment(
  baseURL = process.env.WORKER_BASE_URL || DEFAULT_SERVER,
) {
  const base = new URL(baseURL);
  assert(
    base.protocol === "https:" ||
      (base.protocol === "http:" &&
        ["127.0.0.1", "localhost"].includes(base.hostname)),
    "Utiliser HTTPS pour le Worker public.",
  );
  const endpoint = (path) => new URL(path, base);
  async function request(path, options = {}) {
    const response = await fetch(endpoint(path), {
      ...options,
      headers: { Origin: ORIGIN, ...options.headers },
      signal: AbortSignal.timeout(10000),
    });
    assert(
      response.ok,
      `Le serveur répond HTTP ${response.status} sur ${path}.`,
    );
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      ORIGIN,
      "Origine GitHub Pages absente de la réponse CORS.",
    );
    return response;
  }
  async function post(path, body) {
    const response = await request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, version: SIMULATION_VERSION }),
    });
    try {
      return await response.json();
    } catch {
      throw new Error(`Réponse JSON invalide sur ${path}.`);
    }
  }
  let health;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      health = await (await request("/health")).json();
      assert.equal(health.service, "bouffe-private-rooms");
      assert.equal(health.version, SIMULATION_VERSION);
      assert.deepEqual(health.teamSizes, [1, 2, 3, 4]);
      assert.equal(health.trophies, true);
      break;
    } catch {
      if (attempt === 5)
        throw new Error(
          "Le Worker ne répond pas avec le service multijoueur attendu sur /health. Le déploiement n’est pas vérifié.",
        );
      await delay(2000);
    }
  }
  assert.equal(health.roomLimit, 8);
  assert.deepEqual(health.sizes, [8, 24, 50]);
  const preflight = await request("/api/rooms", {
    method: "OPTIONS",
    headers: {
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "Content-Type",
    },
  });
  assert.equal(preflight.status, 204, "Prévol CORS invalide.");
  console.log("OK : /health, version et origine GitHub Pages.");
  const peers = [];
  try {
    const profileA = await post("/api/profile", {}),
      profileB = await post("/api/profile", {});
    const credentials = (p) => ({
      profileId: p.profileId,
      profileToken: p.profileToken,
    });
    assert.equal(profileA.state.wins, 0);
    assert.equal(profileB.state.wins, 0);
    const first = await post("/api/rooms", {
      name: "Test déploiement A",
      profile: credentials(profileA),
      cosmetics: { hat: "chef", outfit: "cook" },
    });
    assert.match(first.code, /^[A-HJ-NP-Z2-9]{12}$/);
    assert.match(first.token, /^[a-f0-9]{64}$/);
    const socketURL = new URL("/api/socket/" + first.code, base);
    socketURL.protocol = base.protocol === "https:" ? "wss:" : "ws:";
    const a = new Peer(socketURL, first);
    peers.push(a);
    await a.wait((p) => p.type === "welcome");
    const second = await post("/api/join", {
      name: "Test déploiement B",
      profile: credentials(profileB),
      cosmetics: { hat: "hat_pancakes", outfit: "outfit_royal" },
      code: first.code,
    });
    const b = new Peer(socketURL, second);
    peers.push(b);
    await b.wait((p) => p.type === "welcome");
    const roster = await a.wait(
      (p) =>
        p.type === "room" &&
        p.room.members.length === 2 &&
        p.room.members.every((m) => m.connected),
    );
    assert.equal(roster.room.count, 24);
    assert.equal(roster.room.aiCount, 22);
    console.log(
      "OK : salon SQLite, deux invités et deux WebSockets authentifiés.",
    );
    a.send({ type: "chat", text: "Le chat de la table fonctionne." });
    await b.wait(
      (p) =>
        p.type === "room" &&
        p.room.chat?.at(-1)?.text === "Le chat de la table fonctionne.",
    );
    const earned = await a.wait(
      (p) => p.type === "profile" && p.state.trophies["mp-chat"],
    );
    assert.equal(earned.state.profileId, profileA.profileId);
    const saved = await post("/api/profile/state", {
      ...credentials(profileA),
      win: true,
      awards: ["mp-wins5"],
    });
    assert(saved.trophies["mp-chat"]);
    assert.equal(saved.wins, 0);
    assert(!saved.trophies["mp-wins5"]);
    const other = await post("/api/profile/state", credentials(profileB));
    assert(!other.trophies["mp-chat"]);
    console.log(
      "OK : trophée de chat privé, sauvegarde de profil et revendication de victoire ignorée.",
    );
    a.send({ type: "map", mapId: "cold" });
    await b.wait((p) => p.type === "room" && p.room.mapId === "cold");
    a.send({ type: "ready", ready: true });
    b.send({ type: "ready", ready: true });
    await a.wait(
      (p) =>
        p.type === "room" &&
        p.room.members.length === 2 &&
        p.room.members.every((m) => m.ready),
    );
    a.send({ type: "start" });
    const startA = (await a.wait((p) => p.type === "state")).state;
    const startB = (await b.wait((p) => p.type === "state")).state;
    assert.deepEqual(startA, startB);
    assert.equal(startA.people.length, 24);
    assert.equal(startA.mapId, "cold");
    for (const [ticket, name, cosmetics] of [
      [first, "Test déploiement A", { hat: "chef", outfit: "cook" }],
      [
        second,
        "Test déploiement B",
        { hat: "hat_pancakes", outfit: "outfit_royal" },
      ],
    ]) {
      const person = startA.people.find((p) => p.memberId === ticket.memberId);
      assert(person?.human);
      assert.equal(person.name, name);
      assert.deepEqual(person.cosmetics, cosmetics);
    }
    console.log(
      "OK : identités et vrais cosmétiques partagés par les deux clients.",
    );
    a.send({ type: "shot", turn: 1, x: 8, y: 3 });
    const locked = await b.wait(
      (p) =>
        p.type === "room" &&
        p.room.turn === 1 &&
        p.room.members.some((m) => m.id === first.memberId && m.locked),
    );
    assert(
      !Object.hasOwn(locked.room, "shots"),
      "Les tirs doivent rester secrets.",
    );
    assert(
      !b.packets.some((p) => p.type === "resolution"),
      "Le serveur a résolu avant le second tir.",
    );
    b.send({ type: "shot", turn: 1, x: -8, y: 2 });
    const [resultA, resultB] = await Promise.all([
      a.wait((p) => p.type === "resolution"),
      b.wait((p) => p.type === "resolution"),
    ]);
    assert.deepEqual(
      resultA.final,
      resultB.final,
      "Les deux invités doivent recevoir le même résultat officiel.",
    );
    assert(
      resultA.final.people.slice(2).every((p) => p.roundStart),
      "Les IA doivent jouer dans le moteur serveur.",
    );
    assert(
      resultA.final.people.some(
        (p, i) => p.x !== startA.people[i].x || p.y !== startA.people[i].y,
      ),
      "Le moteur doit réellement résoudre le mouvement.",
    );
    await Promise.all([
      a.wait((p) => p.type === "frames" && p.last),
      b.wait((p) => p.type === "frames" && p.last),
    ]);
    console.log(
      "OK : 2 humains + 22 IA, tirs secrets, tour autoritaire et résultats identiques.",
    );
  } finally {
    // Leave in order so both memberships are removed, without leaving a live test game.
    for (const peer of peers) await peer.close();
  }
  console.log("Vérification réussie du Worker cible ; salon de test quitté.");
}
if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  verifyDeployment().catch((error) => {
    // Assertion diffs may contain invitation tickets; only emit the human-readable message.
    const message =
      error instanceof assert.AssertionError
        ? error.message.split("\n")[0]
        : error.message;
    console.error("ÉCHEC de vérification : " + message);
    process.exitCode = 1;
  });
}
