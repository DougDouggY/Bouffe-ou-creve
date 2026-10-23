import { MULTIPLAYER_MAPS } from "./multiplayer-maps.js?v=lobby-26";
import {
  normalizeCosmetics,
  COSMETIC_CATALOG,
} from "./cosmetic-catalog.js?v=identity-22";
import { decodeFrame } from "./multiplayer-protocol.js?v=lobby-26";
const VERSION = "multi-20";
const SERVER = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://127.0.0.1:8787"
  : "https://bouffeoucrevemulti.jeferson-patry-sin.workers.dev";
const TICKET_KEY = "bouffe-private-room-v1";
const $ = (selector) => document.querySelector(selector);
const formatted = (code) => code.match(/.{1,4}/g).join("-");
export function setupMultiplayer({
  onStart,
  onFrame,
  onLeave,
  onEnd,
  onEvent,
  getCosmetics = () => ({ hat: "none", outfit: "plain" }),
  onRoster = () => {},
  renderAvatar = () => {},
  openShop = () => {},
}) {
  let ticket = null,
    ws = null,
    room = null,
    active = false,
    replay = null,
    lastState = null,
    pendingTurn = null,
    offset = 0,
    retry = null,
    disconnectedAt = 0,
    retries = 0,
    ended = false,
    frameIndex = 0,
    eventIndex = 0,
    healthy = false;
  const dialog = $("#multiplayer-dialog");
  function openDialog() {
    dialog.showModal();
    $("#multiplayer-title").focus({ preventScroll: true });
    dialog.scrollTop = 0;
  }
  const status = $("#multiplayer-status");
  for (const map of MULTIPLAYER_MAPS) {
    const option = document.createElement("option");
    option.value = map.id;
    option.textContent = map.name;
    $("#multiplayer-map").append(option);
  }
  const hud = $("#multiplayer-hud");
  const message = (text) => {
    status.textContent = text;
  };
  function persist() {
    try {
      ticket
        ? sessionStorage.setItem(TICKET_KEY, JSON.stringify(ticket))
        : sessionStorage.removeItem(TICKET_KEY);
    } catch {}
  }
  function send(data) {
    if (ws?.readyState !== WebSocket.OPEN) {
      message("Connexion en cours…");
      return false;
    }
    ws.send(JSON.stringify({ ...data, version: VERSION }));
    return true;
  }
  function update() {
    const self = room?.members.find((m) => m.id === ticket?.memberId);
    $("#multiplayer-connect").hidden = !!ticket;
    $("#multiplayer-lobby").hidden = !ticket;
    $("#multiplayer-close").textContent = ticket
      ? "Quitter le salon"
      : "Retour au burger";
    $("#multiplayer-code").textContent = room
      ? formatted(room.code)
      : "Connexion…";
    $("#multiplayer-size").disabled =
      room?.host !== self?.id || room?.phase !== "lobby";
    $("#multiplayer-size").value = String(room?.count || 24);
    $("#multiplayer-map").value = room?.mapId || "cantine";
    $("#multiplayer-map").disabled =
      room?.host !== self?.id || room?.phase !== "lobby";
    $("#multiplayer-shop").hidden = room?.phase !== "lobby";
    const canRematch = active && !!room?.canRematch;
    $("#multiplayer-rematch").hidden = !canRematch;
    $("#multiplayer-rematch-status").hidden = !canRematch;
    $("#multiplayer-rematch").textContent = self?.rematch
      ? "Annuler mon vote"
      : "Voter pour rejouer";
    $("#multiplayer-rematch-status").textContent = canRematch
      ? `${room.rematchVotes}/${room.members.length} votes · Tous les gourmands doivent voter pour retourner au salon.`
      : "";
    $("#multiplayer-ready").disabled =
      !self?.connected || room?.phase !== "lobby";
    $("#multiplayer-ready").textContent = self?.ready
      ? "Je ne suis plus prêt"
      : "Je suis prêt";
    $("#multiplayer-start").hidden = room?.host !== self?.id;
    $("#multiplayer-start").disabled =
      room?.phase !== "lobby" ||
      !room?.members.every((m) => m.connected && m.ready);
    $("#multiplayer-fill").textContent = room
      ? `${room.members.length} humain${room.members.length > 1 ? "s" : ""} + ${room.aiCount} IA · ${MULTIPLAYER_MAPS.find((m) => m.id === room.mapId)?.name || "Cantine du chaos"}`
      : "";
    $("#multiplayer-players").replaceChildren(
      ...(room?.members || []).map((m) => {
        const li = document.createElement("li");
        const cosmetics = normalizeCosmetics(m.cosmetics);
        li.dataset.member = m.id;
        li.dataset.hat = cosmetics.hat;
        li.dataset.outfit = cosmetics.outfit;
        li.title = [cosmetics.hat, cosmetics.outfit]
          .map((id) => COSMETIC_CATALOG.find((item) => item.id === id)?.name)
          .join(" · ");
        li.dataset.self = String(m.id === ticket.memberId);
        li.dataset.ready = String(m.ready);
        const label = document.createElement("span");
        label.className = "lobby-identity";
        const name = document.createElement("strong");
        name.textContent = m.name;
        const status = document.createElement("small");
        status.textContent = `${m.id === room.host ? "Hôte · " : ""}${m.id === ticket.memberId ? "Toi · " : ""}${!m.connected ? "reconnexion…" : !m.alive ? "spectateur" : room.phase === "lobby" ? (m.ready ? "prêt" : "pas encore prêt") : m.locked ? "tir verrouillé" : "en jeu"}`;
        label.append(name, status);
        const avatar = document.createElement("canvas");
        avatar.width = 288;
        avatar.height = 360;
        avatar.className = "lobby-avatar";
        avatar.setAttribute("aria-label", "Apparence de " + m.name);
        li.append(avatar, label);
        renderAvatar(avatar, { ...m, cosmetics });
        return li;
      }),
    );
    hud.hidden = !active;
    if (!active) return;
    if (ws?.readyState !== WebSocket.OPEN)
      hud.textContent = "Connexion interrompue · reconnexion…";
    else if (!self?.alive)
      hud.textContent = "Spectateur · les gourmands continuent";
    else if (Date.now() + offset < room.readyAt)
      hud.textContent = "Les gourmands se propulsent !";
    else if (room.phase === "ended") hud.textContent = "Fin du festin";
    else {
      const needed = room.members.filter((m) => m.alive),
        locked = needed.filter((m) => m.locked).length;
      const seconds = Math.max(
        0,
        Math.ceil((room.deadline - Date.now() - offset) / 1000),
      );
      hud.textContent = `${self?.locked || pendingTurn === room.turn ? "Tir secret verrouillé" : "À toi de viser"} · ${locked}/${needed.length} prêts · ${seconds} s`;
    }
  }
  function acceptRoom(data) {
    if (room && data.revision < room.revision) return;
    room = data;
    if (active && data.phase === "lobby") {
      active = false;
      replay = null;
      lastState = null;
      pendingTurn = null;
      ended = false;
      onLeave();
      openDialog();
      syncAppearance();
    }
    onRoster(data.members);
    offset = data.serverTime - Date.now();
    if (pendingTurn !== room.turn) pendingTurn = null;
    update();
  }
  function enter(state) {
    lastState = state;
    if (!active) {
      active = true;
      ended = false;
      const self = room.members.find((m) => m.id === ticket.memberId);
      onStart(state, self.seat);
      dialog.close();
    }
    onFrame(state);
  }
  async function health() {
    healthy = false;
    $("#multiplayer-create").disabled = true;
    $("#multiplayer-join").disabled = true;
    message("Vérification du service multijoueur…");
    try {
      const response = await fetch(SERVER + "/health", {
        signal: AbortSignal.timeout(6000),
      });
      const data = await response.json();
      if (
        !response.ok ||
        data.service !== "bouffe-private-rooms" ||
        data.version !== VERSION
      )
        throw Error();
      healthy = true;
      message("Salons privés · jusqu’à 8 humains. Aucune inscription.");
    } catch {
      message(
        "Le serveur multijoueur n’est pas encore disponible ou doit être mis à jour. Tu peux continuer à jouer en solo.",
      );
    }
    $("#multiplayer-create").disabled = !healthy;
    $("#multiplayer-join").disabled = !healthy;
  }
  function connect() {
    if (!ticket) return;
    clearTimeout(retry);
    const socket = new WebSocket(
      SERVER.replace(/^http/, "ws") + "/api/socket/" + ticket.code,
      ["bouffe-v1", "ticket." + ticket.token],
    );
    ws = socket;
    socket.onopen = () => {
      if (ws !== socket) return;
      retries = 0;
      disconnectedAt = 0;
      message("Connecté au salon privé.");
      update();
    };
    socket.onmessage = (event) => {
      if (ws !== socket) return;
      let packet;
      try {
        packet = JSON.parse(event.data);
      } catch {
        return;
      }
      if (packet.type === "welcome") {
        acceptRoom(packet.room);
        if (packet.state) enter(packet.state);
        else syncAppearance();
      } else if (packet.type === "room") acceptRoom(packet.room);
      else if (packet.type === "state") enter(packet.state);
      else if (packet.type === "resolution") {
        replay = { ...packet, frames: [], complete: false };
        frameIndex = 0;
        eventIndex = 0;
        pendingTurn = null;
      } else if (packet.type === "frames" && replay?.turn === packet.turn) {
        for (const frame of packet.frames) {
          const decoded = decodeFrame(frame, replay.frames.at(-1)?.state);
          replay.frames.push(decoded);
        }
        replay.complete = packet.last;
      } else if (packet.type === "error") {
        message(packet.message);
        if (active) hud.textContent = packet.message;
        if (packet.error !== "LOCKED") pendingTurn = null;
      } else if (packet.type === "expired") {
        message(packet.message);
        leave();
      }
    };
    socket.onclose = (event) => {
      if (ws !== socket || !ticket) return;
      update();
      if ([4001, 4004].includes(event.code)) {
        const text =
          event.code === 4001
            ? "Ce salon est ouvert dans un autre onglet."
            : "Ce salon a expiré.";
        leave();
        message(text);
        return;
      }
      disconnectedAt ||= Date.now();
      if (Date.now() - disconnectedAt > 90000) {
        leave();
        message(
          "Le délai de reconnexion est dépassé. Rejoins un nouveau salon.",
        );
        return;
      }
      message(
        "Connexion interrompue. Reconnexion automatique pendant 90 secondes…",
      );
      retry = setTimeout(connect, Math.min(10000, 1000 * 2 ** retries++));
    };
    socket.onerror = () => {}; // onclose provides the actionable status, including failed upgrades.
  }
  async function join(creating) {
    if (!healthy || ticket) return;
    const name = $("#multiplayer-name").value.trim() || "Gourmand";
    const code = $("#multiplayer-join-code").value;
    $("#multiplayer-create").disabled = true;
    $("#multiplayer-join").disabled = true;
    message(creating ? "Préparation de la table…" : "Recherche du salon…");
    try {
      const response = await fetch(
        SERVER + (creating ? "/api/rooms" : "/api/join"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            code,
            cosmetics: normalizeCosmetics(getCosmetics()),
            version: VERSION,
          }),
          signal: AbortSignal.timeout(10000),
        },
      );
      const data = await response.json();
      if (!response.ok) throw Error(data.message || "Salon indisponible.");
      ticket = data;
      persist();
      update();
      connect();
    } catch (error) {
      message(
        error.message === "Failed to fetch"
          ? "Le serveur est injoignable. Réessaie dans un instant."
          : error.message,
      );
    } finally {
      $("#multiplayer-create").disabled = !healthy;
      $("#multiplayer-join").disabled = !healthy;
    }
  }
  function leave() {
    clearTimeout(retry);
    if (ws?.readyState === WebSocket.OPEN) send({ type: "leave" });
    const old = ws;
    ws = null;
    old?.close(1000, "Salon quitté");
    ticket = null;
    room = null;
    replay = null;
    pendingTurn = null;
    persist();
    const wasActive = active;
    active = false;
    lastState = null;
    hud.hidden = true;
    update();
    if (wasActive) onLeave();
  }
  function canShoot() {
    const self = room?.members.find((m) => m.id === ticket?.memberId);
    const now = Date.now() + offset;
    return (
      active &&
      ws?.readyState === WebSocket.OPEN &&
      room.phase === "playing" &&
      self?.alive &&
      !self.locked &&
      pendingTurn !== room.turn &&
      now >= room.readyAt &&
      now < room.deadline
    );
  }
  function tick() {
    if (!active || !room) return;
    if (replay?.frames.length) {
      const t = Math.max(0, Date.now() + offset - replay.startedAt);
      while (
        frameIndex + 1 < replay.frames.length &&
        replay.frames[frameIndex + 1].t <= t
      )
        frameIndex++;
      const a = replay.frames[frameIndex],
        b = replay.frames[frameIndex + 1];
      const ratio = b ? Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t))) : 0;
      const interpolated = b
        ? {
            ...a.state,
            people: a.state.people.map((p, i) => ({
              ...p,
              x: p.x + (b.state.people[i].x - p.x) * ratio,
              y: p.y + (b.state.people[i].y - p.y) * ratio,
            })),
          }
        : a.state;
      lastState = interpolated;
      onFrame(interpolated);
      while (
        eventIndex < replay.events.length &&
        replay.events[eventIndex].t <= t
      )
        onEvent(replay.events[eventIndex++]);
      if (t >= replay.duration && replay.complete) {
        lastState = replay.final;
        onFrame(lastState);
        replay = null;
      }
    }
    if (
      room.canRematch &&
      !replay &&
      lastState &&
      !ended &&
      Date.now() + offset >= room.readyAt
    ) {
      ended = true;
      onEnd(lastState);
    }
  }
  $("#multiplayer-entry").onclick = () => {
    openDialog();
    update();
    if (!ticket) health();
  };
  $("#multiplayer-map").onchange = () =>
    send({ type: "map", mapId: $("#multiplayer-map").value });
  $("#multiplayer-rematch").onclick = () =>
    send({
      type: "rematch",
      vote: !room?.members.find((m) => m.id === ticket?.memberId)?.rematch,
    });
  $("#multiplayer-shop").onclick = () => openShop();
  $("#shop-dialog").addEventListener("close", syncAppearance);
  $("#multiplayer-create").onclick = () => join(true);
  $("#multiplayer-join").onclick = () => join(false);
  $("#multiplayer-join-code").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      join(false);
    }
  });
  function syncAppearance() {
    if (!ticket || room?.phase !== "lobby" || ws?.readyState !== WebSocket.OPEN)
      return;
    const cosmetics = normalizeCosmetics(getCosmetics());
    const member = room.members.find((m) => m.id === ticket.memberId);
    if (
      JSON.stringify(cosmetics) !==
      JSON.stringify(normalizeCosmetics(member?.cosmetics))
    )
      send({ type: "appearance", cosmetics });
  }
  window.addEventListener("focus", syncAppearance);
  window.addEventListener("storage", (event) => {
    if (event.key === "bouffe-profile-v1" || event.key === null)
      syncAppearance();
  });
  $("#multiplayer-ready").onclick = () => {
    syncAppearance();
    send({
      type: "ready",
      ready: !room?.members.find((m) => m.id === ticket.memberId)?.ready,
    });
  };
  $("#multiplayer-size").onchange = (e) =>
    send({ type: "size", count: Number(e.target.value) });
  $("#multiplayer-start").onclick = () => send({ type: "start" });
  $("#multiplayer-close").onclick = () => {
    leave();
    dialog.close();
  };
  dialog.addEventListener("cancel", () => leave());
  $("#multiplayer-copy").onclick = async () => {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(formatted(room.code));
      message("Code copié : envoie-le à ton ami.");
    } catch {
      message("Code à transmettre : " + formatted(room.code));
    }
  };
  setInterval(update, 500);
  try {
    const saved = JSON.parse(sessionStorage.getItem(TICKET_KEY));
    if (
      saved?.version === VERSION &&
      /^[A-HJ-NP-Z2-9]{12}$/.test(saved.code) &&
      /^[a-f0-9]{64}$/.test(saved.token)
    ) {
      ticket = saved;
      connect();
    }
  } catch {}
  update();
  return {
    get active() {
      return active;
    },
    canShoot,
    tick,
    leave,
    shoot(vector) {
      if (!canShoot()) return false;
      pendingTurn = room.turn;
      const sent = send({ type: "shot", turn: room.turn, ...vector });
      update();
      return sent;
    },
  };
}
