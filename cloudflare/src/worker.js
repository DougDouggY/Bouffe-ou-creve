import {
  profileRequest,
  validProfileId,
  validProfileToken,
} from "./player-profile.js";
import { encodeFrames } from "../../multiplayer-protocol.js";
import {
  Room,
  RoomError,
  normalizeCode,
  randomCode,
  validCode,
} from "./room.js";
import { SIMULATION_VERSION, snapshot } from "../../multiplayer-simulation.js";
const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
function errorResponse(error) {
  return json(
    {
      error: error instanceof RoomError ? error.code : "SERVER",
      message:
        error instanceof RoomError
          ? error.message
          : "Le salon est momentanément indisponible.",
    },
    error.status || 503,
  );
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim());
    const cors = allowed.includes(origin)
      ? {
          "Access-Control-Allow-Origin": origin,
          Vary: "Origin",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      : {};
    if (request.method === "OPTIONS")
      return new Response(null, {
        status: allowed.includes(origin) ? 204 : 403,
        headers: cors,
      });
    if (["/", "/health"].includes(url.pathname) && request.method === "GET")
      return json(
        {
          service: "bouffe-private-rooms",
          version: SIMULATION_VERSION,
          roomLimit: 8,
          invitationLength: 4,
          teamSizes: [1, 2, 3, 4],
          trophies: true,
          rivalries: true,
          ceremony: true,
          audioCosmetics: true,
          economy: true,
          progressCounters: true,
          sizes: [8, 24, 50],
        },
        200,
        cors,
      );
    if (!allowed.includes(origin))
      return json({ error: "ORIGIN", message: "Origine non autorisée." }, 403);
    try {
      let response;
      if (
        request.method === "POST" &&
        ["/api/profile", "/api/profile/state"].includes(url.pathname)
      ) {
        const raw = await request.text();
        if (raw.length > 512)
          throw new RoomError("SIZE", "Requête trop grande.", 413);
        let credentials;
        try {
          credentials = JSON.parse(raw);
        } catch {
          throw new RoomError("JSON", "Requête invalide.");
        }
        const creating = url.pathname === "/api/profile";
        if (creating) {
          const digest = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(
              request.headers.get("CF-Connecting-IP") || "local",
            ),
          );
          const ip = Array.from(new Uint8Array(digest).slice(0, 12), (b) =>
            b.toString(16).padStart(2, "0"),
          ).join("");
          const admission = await env.ROOMS.get(
            env.ROOMS.idFromName("admission"),
          ).fetch("https://internal/admit", {
            method: "POST",
            body: JSON.stringify({ ip, creating: false }),
          });
          if (!admission.ok)
            return new Response(admission.body, {
              status: admission.status,
              headers: { ...cors, "Content-Type": "application/json" },
            });
          credentials = {
            profileId: crypto.randomUUID(),
            profileToken: Array.from(
              crypto.getRandomValues(new Uint8Array(32)),
              (b) => b.toString(16).padStart(2, "0"),
            ).join(""),
          };
        }
        if (
          !validProfileId(credentials?.profileId) ||
          !validProfileToken(credentials?.profileToken)
        )
          throw new RoomError("PROFILE", "Profil multijoueur invalide.", 401);
        response = await env.ROOMS.get(
          env.ROOMS.idFromName("profile:" + credentials.profileId),
        ).fetch("https://internal/profile/" + (creating ? "create" : "state"), {
          method: "POST",
          body: JSON.stringify(credentials),
        });
        if (creating && response.ok)
          response = json({ ...credentials, state: await response.json() });
      } else if (
        request.method === "POST" &&
        ["/api/rooms", "/api/join"].includes(url.pathname)
      ) {
        if (Number(request.headers.get("content-length") || 0) > 1024)
          throw new RoomError("SIZE", "Requête trop grande.", 413);
        const raw = await request.text();
        if (raw.length > 1024)
          throw new RoomError("SIZE", "Requête trop grande.", 413);
        let body;
        try {
          body = JSON.parse(raw);
        } catch {
          throw new RoomError("JSON", "Requête invalide.");
        }
        if (!body || typeof body !== "object" || Array.isArray(body))
          throw new RoomError("JSON", "Requête invalide.");
        if (body.version !== SIMULATION_VERSION)
          throw new RoomError(
            "VERSION",
            "Recharge le jeu pour mettre le multijoueur à jour.",
          );
        const creating = url.pathname === "/api/rooms";
        let code = creating ? randomCode() : normalizeCode(body.code);
        if (!validCode(code))
          throw new RoomError(
            "CODE",
            "Le code contient 4 lettres ou chiffres. Les anciennes invitations restent acceptées.",
          );
        const digest = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(
            request.headers.get("CF-Connecting-IP") || "local",
          ),
        );
        const ip = Array.from(new Uint8Array(digest).slice(0, 12), (b) =>
          b.toString(16).padStart(2, "0"),
        ).join("");
        const gate = env.ROOMS.get(env.ROOMS.idFromName("admission"));
        const admission = await gate.fetch("https://internal/admit", {
          method: "POST",
          body: JSON.stringify({ ip, creating }),
        });
        if (!admission.ok)
          return new Response(admission.body, {
            status: admission.status,
            headers: { ...cors, "Content-Type": "application/json" },
          });
        let profileId = null,
          statistics = null;
        if (body.profile !== undefined) {
          if (
            !validProfileId(body.profile?.profileId) ||
            !validProfileToken(body.profile?.profileToken)
          )
            throw new RoomError("PROFILE", "Profil multijoueur invalide.", 401);
          const verified = await env.ROOMS.get(
            env.ROOMS.idFromName("profile:" + body.profile.profileId),
          ).fetch("https://internal/profile/state", {
            method: "POST",
            body: JSON.stringify({ profileToken: body.profile.profileToken }),
          });
          if (!verified.ok)
            throw new RoomError("PROFILE", "Profil multijoueur invalide.", 401);
          const verifiedState = await verified.json();
          profileId = verifiedState.profileId;
          statistics = {
            wins: verifiedState.wins,
            maxMass: verifiedState.maxMass || 0,
          };
        }
        // A short code is allocated atomically by its Durable Object. A collision
        // never joins or overwrites another room; try a fresh random code instead.
        for (let attempt = 0; attempt < 16; attempt++) {
          const room = env.ROOMS.get(env.ROOMS.idFromName("room:" + code));
          response = await room.fetch(
            "https://internal/" + (creating ? "create" : "join"),
            {
              method: "POST",
              body: JSON.stringify({ ...body, code, profileId, statistics }),
            },
          );
          if (
            !creating ||
            response.status !== 409 ||
            (await response.clone().json()).error !== "EXISTS"
          )
            break;
          code = randomCode();
        }
      } else if (
        request.method === "GET" &&
        url.pathname.startsWith("/api/socket/")
      ) {
        const code = normalizeCode(url.pathname.slice("/api/socket/".length));
        if (
          !validCode(code) ||
          request.headers.get("Upgrade")?.toLowerCase() !== "websocket"
        )
          throw new RoomError("SOCKET", "Connexion invalide.");
        response = await env.ROOMS.get(
          env.ROOMS.idFromName("room:" + code),
        ).fetch(request);
        if (response.status === 101) return response;
      } else
        return json(
          { error: "NOT_FOUND", message: "Adresse inconnue." },
          404,
          cors,
        );
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(cors)) headers.set(key, value);
      return new Response(response.body, { status: response.status, headers });
    } catch (error) {
      const response = errorResponse(error);
      for (const [key, value] of Object.entries(cors))
        response.headers.set(key, value);
      return response;
    }
  },
};
export class PrivateRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.queue = Promise.resolve();
    ctx.blockConcurrencyWhile(async () => {
      const data = await ctx.storage.get("room");
      this.room = new Room(data || null);
      // Hibernation keeps sockets and attachments; genuine eviction with no sockets
      // starts a reconnection grace period instead of leaving ghost players online.
      const connected = new Set(
        ctx.getWebSockets().map((ws) => ws.deserializeAttachment()?.memberId),
      );
      for (const member of this.room.data?.members || [])
        if (member.connected && !connected.has(member.id))
          this.room.disconnect(member);
    });
  }
  serial(fn) {
    const pending = this.queue.then(fn);
    this.queue = pending.catch(() => {});
    return pending;
  }
  async persist() {
    if (!this.room.data) return;
    await this.ctx.storage.put("room", this.room.data);
    await this.ctx.storage.setAlarm(
      this.room.data.trophyOutbox?.length
        ? Math.min(this.room.nextAlarm(), Date.now() + 5000)
        : this.room.nextAlarm(),
    );
    // Deliver rewards after the gameplay packets: profile writes must not delay a replay.
    if (this.room.data.trophyOutbox?.length && !this.profileFlushPending) {
      this.profileFlushPending = true;
      this.ctx.waitUntil(
        this.serial(async () => {
          try {
            await this.flushTrophies();
          } finally {
            this.profileFlushPending = false;
          }
        }),
      );
    }
  }
  async flushTrophies() {
    if (!this.room.data?.trophyOutbox?.length) return;
    const remaining = [];
    for (const grant of this.room.data.trophyOutbox) {
      try {
        const result = await this.env.ROOMS.get(
          this.env.ROOMS.idFromName("profile:" + grant.profileId),
        ).fetch("https://internal/profile/apply", {
          method: "POST",
          body: JSON.stringify(grant),
        });
        if (!result.ok) throw Error("Profile receipt pending");
        const state = await result.json();
        for (const member of this.room.data.members)
          if (member.profileId === grant.profileId)
            member.statistics = {
              wins: state.wins,
              maxMass: state.maxMass || 0,
            };
        for (const ws of this.ctx.getWebSockets()) {
          const member = this.room.data.members.find(
            (m) => m.id === ws.deserializeAttachment()?.memberId,
          );
          if (member?.profileId === grant.profileId)
            this.send(ws, { type: "profile", state });
        }
      } catch {
        remaining.push(grant);
      }
    }
    this.room.data.trophyOutbox = remaining;
    this.room.data.revision++;
    await this.ctx.storage.put("room", this.room.data);
    await this.ctx.storage.setAlarm(
      this.room.data.trophyOutbox.length
        ? Date.now() + 5000
        : this.room.nextAlarm(),
    );
    try {
      this.publish();
    } catch {}
  }
  send(ws, message) {
    try {
      ws.send(JSON.stringify(message));
    } catch {}
  }
  broadcast(message) {
    for (const ws of this.ctx.getWebSockets()) this.send(ws, message);
  }
  publish(replay = null) {
    if (replay) {
      // Small packets avoid oversized WebSocket frames and avoid a running timer
      // inside the DO: browsers interpolate this one authoritative recording.
      const { frames: rawFrames, ...meta } = replay;
      const encodeStart = performance.now();
      const frames = encodeFrames(rawFrames);
      meta.metrics = {
        ...meta.metrics,
        encodeMs: performance.now() - encodeStart,
      };
      this.broadcast({ type: "resolution", ...meta });
      for (let i = 0; i < frames.length; i += 10)
        this.broadcast({
          type: "frames",
          turn: replay.turn,
          frames: frames.slice(i, i + 10),
          last: i + 10 >= frames.length,
        });
    }
    this.broadcast({ type: "room", room: this.room.publicState() });
  }
  async fetch(request) {
    return this.serial(async () => {
      try {
        const url = new URL(request.url);
        if (url.pathname.startsWith("/profile/"))
          return json(
            await profileRequest(
              this.ctx.storage,
              url.pathname.slice("/profile/".length),
              await request.json(),
            ),
          );
        if (url.pathname === "/admit") return this.admit(await request.json());
        if (url.pathname === "/create" || url.pathname === "/join") {
          const body = await request.json();
          if (url.pathname === "/join") this.room.maintenance();
          const m =
            url.pathname === "/create"
              ? this.room.create(
                  body.code,
                  body.name,
                  crypto.getRandomValues(new Uint32Array(1))[0],
                  body.cosmetics,
                  body.profileId,
                  body.statistics,
                )
              : this.room.join(
                  body.name,
                  body.cosmetics,
                  body.profileId,
                  body.statistics,
                );
          await this.persist();
          this.publish();
          return json({
            code: this.room.data.code,
            memberId: m.id,
            token: m.token,
            version: SIMULATION_VERSION,
          });
        }
        const protocols = (request.headers.get("Sec-WebSocket-Protocol") || "")
          .split(",")
          .map((s) => s.trim());
        const ticket = protocols
          .find((p) => /^ticket\.[a-f0-9]{64}$/.test(p))
          ?.slice(7);
        if (!protocols.includes("bouffe-v1") || !ticket)
          throw new RoomError("AUTH", "Reconnexion invalide.", 401);
        const m = this.room.authenticate(ticket);
        if (m.profileId) {
          const summary = await this.env.ROOMS.get(
            this.env.ROOMS.idFromName("profile:" + m.profileId),
          ).fetch("https://internal/profile/summary", {
            method: "POST",
            body: "{}",
          });
          if (summary.ok) m.statistics = await summary.json();
        }
        for (const old of this.ctx.getWebSockets())
          if (old.deserializeAttachment()?.memberId === m.id)
            old.close(4001, "Connexion remplacée");
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);
        this.ctx.acceptWebSocket(server);
        m.connection = crypto.randomUUID();
        server.serializeAttachment({
          memberId: m.id,
          connection: m.connection,
          window: Date.now(),
          messages: 0,
        });
        this.room.connect(m);
        await this.persist();
        this.send(server, {
          type: "welcome",
          memberId: m.id,
          room: this.room.publicState(),
          state: this.room.game ? snapshot(this.room.game) : null,
        });
        this.publish();
        return new Response(null, {
          status: 101,
          webSocket: client,
          headers: { "Sec-WebSocket-Protocol": "bouffe-v1" },
        });
      } catch (error) {
        return errorResponse(error);
      }
    });
  }
  async admit({ ip, creating }) {
    const now = Date.now(),
      minute = Math.floor(now / 60000),
      day = Math.floor(now / 86400000);
    let limits = await this.ctx.storage.get("limits");
    if (!limits || limits.day !== day)
      limits = { day, created: 0, minute, ips: {} };
    if (limits.minute !== minute) {
      limits.minute = minute;
      limits.ips = {};
    }
    const bucket = (limits.ips[ip] ||= { create: 0, join: 0 });
    if (
      (creating && (bucket.create >= 6 || limits.created >= 100)) ||
      (!creating && bucket.join >= 30) ||
      Object.keys(limits.ips).length > 2048
    )
      return json(
        {
          error: "RATE_LIMIT",
          message: "Trop de demandes. Réessaie un peu plus tard.",
        },
        429,
      );
    if (creating) {
      bucket.create++;
      limits.created++;
    } else bucket.join++;
    await this.ctx.storage.put("limits", limits);
    return json({ ok: true });
  }
  async webSocketMessage(ws, raw) {
    return this.serial(async () => {
      try {
        const attachment = ws.deserializeAttachment();
        const m = this.room.data?.members.find(
          (m) => m.id === attachment.memberId,
        );
        if (!m || !m.connected)
          throw new RoomError("AUTH", "Ce joueur a quitté le salon.", 401);
        // A fresh connection replaces the previous socket for this seat.
        if (m.connection !== attachment.connection) return;
        const now = Date.now();
        if (now - attachment.window > 10000) {
          attachment.window = now;
          attachment.messages = 0;
        }
        attachment.messages++;
        ws.serializeAttachment(attachment);
        if (attachment.messages > 40)
          throw new RoomError("RATE_LIMIT", "Trop de commandes.");
        if (typeof raw !== "string" || raw.length > 1024)
          throw new RoomError("MESSAGE", "Message invalide.");
        let message;
        try {
          message = JSON.parse(raw);
        } catch {
          throw new RoomError("JSON", "Message invalide.");
        }
        if (message.type === "rivalry") {
          if (message.version !== SIMULATION_VERSION)
            throw new RoomError("VERSION", "Recharge le jeu.");
          const target = this.room.data.members.find(
            (x) => x.id === message.targetId && x.id !== m.id,
          );
          if (!target)
            throw new RoomError(
              "RIVALRY",
              "Ce gourmand n’est plus à cette table.",
            );
          if (!m.profileId || !target.profileId) {
            this.send(ws, {
              type: "rivalry",
              targetId: target.id,
              selfName: m.name,
              opponentName: target.name,
              available: false,
            });
            return;
          }
          const response = await this.env.ROOMS.get(
            this.env.ROOMS.idFromName("profile:" + m.profileId),
          ).fetch("https://internal/profile/rivalry", {
            method: "POST",
            body: JSON.stringify({ otherProfileId: target.profileId }),
          });
          if (!response.ok)
            throw new RoomError(
              "RIVALRY",
              "Historique momentanément indisponible.",
            );
          this.send(ws, {
            type: "rivalry",
            targetId: target.id,
            selfName: m.name,
            opponentName: target.name,
            available: true,
            records: await response.json(),
          });
          return;
        }
        const replay = this.room.action(m, message);
        await this.persist();
        if (!this.room.data.members.length) {
          await this.expire();
          return;
        }
        this.send(ws, {
          type: "ack",
          action: message.type,
          turn: message.turn,
        });
        this.publish(replay);
        if (message.type === "start")
          this.broadcast({ type: "state", state: snapshot(this.room.game) });
        if (message.type === "leave") ws.close(1000, "Salon quitté");
      } catch (error) {
        if (error.code === "RATE_LIMIT")
          try {
            ws.close(1008, "Trop de commandes");
          } catch {}
        this.send(ws, {
          type: "error",
          error: error.code || "SERVER",
          message:
            error instanceof RoomError
              ? error.message
              : "Le serveur n’a pas pu traiter cette commande.",
        });
      }
    });
  }
  async webSocketClose(ws) {
    return this.serial(async () => {
      const id = ws.deserializeAttachment()?.memberId;
      if (
        this.ctx
          .getWebSockets()
          .some(
            (other) =>
              other !== ws &&
              other.readyState === 1 &&
              other.deserializeAttachment()?.memberId === id,
          )
      )
        return;
      const member = this.room.data?.members.find((m) => m.id === id);
      if (member) {
        this.room.disconnect(member);
        await this.persist();
        try {
          this.publish();
        } catch {}
      }
      try {
        ws.close(1000, "Déconnecté");
      } catch {}
    });
  }
  webSocketError(ws) {
    return this.webSocketClose(ws);
  }
  async expire() {
    if (this.room.data?.trophyOutbox?.length) {
      await this.persist();
      if (this.room.data.trophyOutbox.length) return;
    }
    this.broadcast({ type: "expired", message: "Le salon a expiré." });
    for (const ws of this.ctx.getWebSockets())
      try {
        ws.close(4004, "Salon expiré");
      } catch {}
    this.room.game?.destroy();
    this.room = new Room();
    await this.ctx.storage.deleteAll();
    await this.ctx.storage.deleteAlarm();
  }
  async alarm() {
    return this.serial(async () => {
      try {
        const replay = this.room.maintenance();
        await this.persist();
        this.publish(replay);
      } catch (error) {
        if (error.code === "EXPIRED") await this.expire();
        else {
          await this.ctx.storage.setAlarm(Date.now() + 5000);
          throw error;
        }
      }
    });
  }
}
