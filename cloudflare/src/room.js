import { validMultiplayerMap } from "../../multiplayer-maps.js?v=lobby-26";
import { normalizeCosmetics } from "../../cosmetic-catalog.js?v=identity-22";
import {
  createSimulation,
  resolveTurn,
  snapshot,
  checkpoint,
  restoreSimulation,
  SIMULATION_VERSION,
} from "../../multiplayer-simulation.js";
export const MAX_HUMANS = 8;
export const TURN_MS = 45000;
export const RECONNECT_MS = 90000;
export const IDLE_MS = 30 * 60000;
const MAX_AGE = 4 * 60 * 60000;
const codePattern = /^[A-HJ-NP-Z2-9]{12}$/;
export const validCode = (code) =>
  typeof code === "string" && codePattern.test(code);
export function normalizeCode(code) {
  return String(code || "")
    .replace(/[\s-]/g, "")
    .toUpperCase();
}
export function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    crypto.getRandomValues(new Uint8Array(12)),
    (b) => alphabet[b & 31],
  ).join("");
}
function token() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
function cleanName(name) {
  if (name !== undefined && name !== null && typeof name !== "string")
    throw new RoomError("NAME", "Le pseudo doit être du texte.");
  return (
    Array.from(
      String(name || "")
        .normalize("NFC")
        .replace(/[\p{Cc}\p{Cf}<>]/gu, "")
        .replace(/\s+/gu, " ")
        .trim(),
    )
      .slice(0, 24)
      .join("") || "Gourmand"
  );
}
export class RoomError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
const fail = (code, message, status) => {
  throw new RoomError(code, message, status);
};

// Transport-independent state machine. Secrets only enter public data after resolution.
export class Room {
  constructor(saved = null, now = () => Date.now()) {
    this.now = now;
    this.data = saved;
    this.game = null;
    this.replay = null;
    if (saved && saved.version !== SIMULATION_VERSION) {
      saved.expiresAt = this.now();
      return;
    }
    if (saved?.checkpoint)
      this.game = restoreSimulation(
        saved.checkpoint,
        saved.seed,
        saved.members,
      );
  }
  exists() {
    if (
      !this.data ||
      this.now() >= this.data.expiresAt ||
      this.now() >= this.data.createdAt + MAX_AGE
    )
      fail("EXPIRED", "Ce salon a expiré. Crée un nouveau salon.", 410);
  }
  create(code, name, seed, cosmetics) {
    if (this.data) fail("EXISTS", "Ce salon existe déjà.", 409);
    const now = this.now();
    this.data = {
      version: SIMULATION_VERSION,
      code,
      seed,
      createdAt: now,
      expiresAt: now + IDLE_MS,
      phase: "lobby",
      count: 24,
      mapId: "cantine",
      members: [],
      host: null,
      revision: 0,
      shots: {},
      checkpoint: null,
      readyAt: 0,
      deadline: 0,
    };
    const member = this.join(name, cosmetics);
    this.data.host = member.id;
    return member;
  }
  join(name, cosmetics) {
    this.exists();
    if (this.data.phase !== "lobby")
      fail(
        "STARTED",
        "La partie a déjà commencé. Seuls ses joueurs peuvent se reconnecter.",
        409,
      );
    if (this.data.members.length >= MAX_HUMANS)
      fail("FULL", "Le salon accueille au maximum 8 humains.", 409);
    const m = {
      id: crypto.randomUUID(),
      token: token(),
      name: cleanName(name),
      cosmetics: normalizeCosmetics(cosmetics),
      connected: false,
      disconnectedAt: this.now(),
      ready: false,
      seat: null,
    };
    this.data.members.push(m);
    this.touch();
    return m;
  }
  authenticate(ticket) {
    this.exists();
    const m = this.data.members.find((m) => m.token === ticket);
    if (!m) fail("AUTH", "Invitation ou reconnexion invalide.", 401);
    return m;
  }
  connect(member) {
    member.connected = true;
    member.disconnectedAt = null;
    this.touch();
  }
  disconnect(member) {
    member.connected = false;
    member.disconnectedAt = this.now();
    member.ready = false;
    member.rematch = false;
    this.data.revision++;
  }
  touch() {
    this.data.expiresAt = this.data.members.length
      ? Math.min(this.now() + IDLE_MS, this.data.createdAt + MAX_AGE)
      : this.now();
    this.data.revision++;
  }
  required() {
    return this.data.members.filter(
      (m) => m.seat !== null && this.game?.people[m.seat]?.alive,
    );
  }
  publicState() {
    this.exists();
    const d = this.data;
    return {
      version: SIMULATION_VERSION,
      code: d.code,
      phase: d.phase,
      count: d.count,
      mapId: d.mapId || "cantine",
      canRematch: this.canRematch(),
      rematchVotes: d.members.filter((m) => m.rematch).length,
      aiCount: d.count - d.members.length,
      host: d.host,
      revision: d.revision,
      turn: this.game?.round || 0,
      readyAt: d.readyAt,
      deadline: d.deadline,
      serverTime: this.now(),
      expiresAt: d.expiresAt,
      members: d.members.map(
        ({ id, name, connected, ready, seat, cosmetics, rematch }) => ({
          id,
          name,
          cosmetics: normalizeCosmetics(cosmetics),
          rematch: rematch === true,
          connected,
          ready,
          seat,
          alive: seat === null || !!this.game?.people[seat]?.alive,
          locked: seat !== null && Object.hasOwn(d.shots, seat),
        }),
      ),
    };
  }
  action(member, message) {
    this.exists();
    if (!message || message.version !== SIMULATION_VERSION)
      fail("VERSION", "Recharge le jeu pour utiliser la même version.");
    const d = this.data;
    if (message.type === "appearance") {
      if (d.phase !== "lobby")
        fail(
          "APPEARANCE_LOCKED",
          "L’apparence est figée pour cette partie. Change-la avant de rejoindre le prochain salon.",
        );
      const cosmetics = normalizeCosmetics(message.cosmetics);
      if (JSON.stringify(cosmetics) !== JSON.stringify(member.cosmetics)) {
        member.cosmetics = cosmetics;
        member.ready = false;
      }
    } else if (message.type === "rematch") {
      if (!this.canRematch())
        fail(
          "PHASE",
          "Le vote est disponible à la fin de la partie ou quand tous les humains sont éliminés.",
        );
      member.rematch = message.vote === true;
      this.tryRematch();
    } else if (message.type === "map") {
      if (d.host !== member.id || d.phase !== "lobby")
        fail("HOST", "Seul l’hôte choisit la carte au salon.", 403);
      if (!validMultiplayerMap(message.mapId))
        fail("MAP", "Carte multijoueur indisponible.");
      d.mapId = message.mapId;
      d.members.forEach((m) => {
        m.ready = false;
      });
    } else if (message.type === "ready") {
      if (d.phase !== "lobby") fail("STARTED", "La partie a commencé.");
      member.ready = message.ready === true;
    } else if (message.type === "size") {
      if (d.host !== member.id || d.phase !== "lobby")
        fail(
          "HOST",
          "Seul l’hôte peut choisir la taille avant le départ.",
          403,
        );
      if (![8, 24, 50].includes(message.count))
        fail("SIZE", "Choisis 8, 24 ou 50 gourmands.");
      d.count = message.count;
      d.members.forEach((m) => {
        m.ready = false;
      });
    } else if (message.type === "start") {
      if (d.host !== member.id)
        fail("HOST", "Seul l’hôte peut lancer la partie.", 403);
      if (d.phase !== "lobby") fail("STARTED", "La partie a déjà commencé.");
      if (!d.members.every((m) => m.connected && m.ready))
        fail(
          "NOT_READY",
          "Tous les gourmands doivent être connectés et prêts.",
        );
      d.members.forEach((m, i) => {
        m.seat = i;
      });
      this.game = createSimulation(
        d.count,
        d.seed,
        d.members,
        d.mapId || "cantine",
      );
      d.phase = "playing";
      d.readyAt = this.now();
      d.deadline = this.now() + TURN_MS;
      d.checkpoint = checkpoint(this.game);
    } else if (message.type === "shot") {
      if (d.phase !== "playing" || this.game.phase !== "aim")
        fail("PHASE", "Aucun tir attendu.");
      if (!Number.isInteger(message.turn) || message.turn !== this.game.round)
        fail("STALE_TURN", "Ce tir appartient à un autre tour.");
      if (this.now() < d.readyAt)
        fail("REPLAY", "Le mouvement commun est encore en cours.");
      if (this.now() >= d.deadline)
        fail("DEADLINE", "Le délai de ce tour est terminé.");
      if (member.seat === null || !this.game.people[member.seat]?.alive)
        fail("SPECTATOR", "Tu regardes la fin de la partie.");
      const { x, y } = message;
      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        Math.hypot(x, y) > 17.00001
      )
        fail("SHOT", "Direction ou puissance invalide.");
      const prior = d.shots[member.seat];
      if (prior && (prior.x !== x || prior.y !== y))
        fail("LOCKED", "Ton tir est déjà verrouillé.");
      d.shots[member.seat] = { x, y };
    } else if (message.type === "leave") {
      this.leave(member);
    } else fail("MESSAGE", "Commande inconnue.");
    this.touch();
    return this.canResolve() ? this.resolve() : null;
  }
  canRematch() {
    return (
      !!this.game &&
      (this.data.phase === "ended" ||
        (this.data.phase === "playing" &&
          !this.data.members.some(
            (m) => m.seat !== null && this.game.people[m.seat]?.alive,
          )))
    );
  }
  tryRematch() {
    const d = this.data;
    if (
      !this.canRematch() ||
      !d.members.length ||
      !d.members.every((m) => m.connected && m.rematch)
    )
      return;
    this.game.destroy();
    this.game = null;
    this.replay = null;
    d.phase = "lobby";
    d.checkpoint = null;
    d.shots = {};
    d.readyAt = 0;
    d.deadline = 0;
    d.seed = crypto.getRandomValues(new Uint32Array(1))[0];
    d.members.forEach((m) => {
      m.seat = null;
      m.ready = false;
      m.rematch = false;
    });
  }
  canResolve() {
    if (this.data.phase !== "playing" || this.now() < this.data.readyAt)
      return false;
    const needed = this.required();
    return (
      this.now() >= this.data.deadline ||
      needed.every((m) => Object.hasOwn(this.data.shots, m.seat))
    );
  }
  resolve() {
    const inputs = new Map(
      Object.entries(this.data.shots).map(([seat, shot]) => [+seat, shot]),
    );
    // Missing / disconnected humans use the existing AI, never another client's decision.
    const replay = resolveTurn(this.game, inputs);
    const now = this.now();
    replay.startedAt = now + 300;
    this.data.readyAt = replay.startedAt + replay.duration;
    this.data.deadline = this.data.readyAt + TURN_MS;
    this.data.shots = {};
    if (this.game.phase === "ended") this.data.phase = "ended";
    this.data.checkpoint = checkpoint(this.game);
    this.touch();
    this.replay = replay;
    return replay;
  }
  leave(member) {
    if (this.game && member.seat !== null) {
      this.game.people[member.seat].human = false;
      this.data.checkpoint = checkpoint(this.game);
    }
    this.data.members = this.data.members.filter((m) => m.id !== member.id);
    if (this.data.host === member.id)
      this.data.host =
        this.data.members.find((m) => m.connected)?.id ||
        this.data.members[0]?.id ||
        null;
    if (!this.data.members.length) this.data.expiresAt = this.now();
    else this.tryRematch();
  }
  maintenance() {
    this.exists();
    for (const m of [...this.data.members])
      if (!m.connected && this.now() - m.disconnectedAt >= RECONNECT_MS)
        this.leave(m);
    this.exists();
    if (!this.data.members.some((m) => m.connected)) return null;
    return this.canResolve() ? this.resolve() : null;
  }
  nextAlarm() {
    const d = this.data;
    return Math.max(
      this.now() + 1000,
      Math.min(
        d.expiresAt,
        d.createdAt + MAX_AGE,
        d.phase === "playing"
          ? this.required().length
            ? d.deadline
            : Math.max(d.readyAt, this.now() + 1000)
          : Infinity,
        ...d.members
          .filter((m) => !m.connected)
          .map((m) => m.disconnectedAt + RECONNECT_MS),
      ),
    );
  }
}
