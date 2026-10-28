import { equippedTitle } from "./cosmetic-effects.js?v=auras-47";
import { ReplayClock } from "./replay-clock.js?v=podium-35";
import { createOnlineProfileClient } from "./multiplayer-profile-client.js?v=rivalries-33";
import {
  validTeamSetup,
  teamColor,
  teamSurface,
} from "./teams.js?v=rivalries-33";
import { MULTIPLAYER_MAPS } from "./multiplayer-maps.js?v=collection-37";
import {
  normalizeCosmetics,
  COSMETIC_CATALOG,
} from "./cosmetic-catalog.js?v=auras-47";
import { decodeFrame } from "./multiplayer-protocol.js?v=social-28";
const VERSION = "multi-21";
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
  onProfile = () => {},
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
    healthy = false,
    lastChatKey = "",
    lastRosterKey = "";
  let selectedFormula = 24,
    pendingFormula = null;
  let requestedMap = null,
    lastRequests = "";
  const dialog = $("#multiplayer-dialog");
  function openDialog() {
    dialog.showModal();
    $("#multiplayer-title").focus({ preventScroll: true });
    dialog.scrollTop = 0;
  }
  const profile = createOnlineProfileClient(SERVER, onProfile);
  let pendingProfile = null,
    welcomed = false;
  const status = $("#multiplayer-status");
  for (const map of MULTIPLAYER_MAPS) {
    const option = document.createElement("option");
    option.value = map.id;
    option.textContent = map.name;
    $("#multiplayer-map").append(option);
  }
  const rivalryDialog = $("#rivalry-dialog"),
    rivalryContent = $("#rivalry-content");
  let rivalryTarget = null;
  $("#close-rivalry").onclick = () => rivalryDialog.close();
  function openRivalry(member) {
    rivalryTarget = member.id;
    $("#rivalry-title").textContent = "Nos rivalités";
    rivalryContent.textContent = "La maison retrouve votre addition…";
    rivalryDialog.showModal();
    send({ type: "rivalry", targetId: member.id });
  }
  function showRivalry(packet) {
    if (packet.targetId !== rivalryTarget) return;
    $("#rivalry-title").textContent =
      `${packet.selfName} VS ${packet.opponentName}`;
    rivalryContent.replaceChildren();
    if (!packet.available || packet.records?.sameProfile) {
      rivalryContent.textContent = packet.records?.sameProfile
        ? "Ces deux gourmands utilisent le même profil de navigateur. Il n’y a pas de rivalité entre deux copies du même profil."
        : "Cet historique sera disponible dans un nouveau salon avec les profils multijoueurs.";
      return;
    }
    for (const [label, value] of [
      [
        `${packet.selfName} a mangé ${packet.opponentName}`,
        packet.records.eaten,
      ],
      [
        `${packet.opponentName} a mangé ${packet.selfName}`,
        packet.records.wasEaten,
      ],
      ["Parties disputées ensemble", packet.records.together],
    ]) {
      const row = document.createElement("div");
      row.className = "rivalry-row";
      const text = document.createElement("span"),
        number = document.createElement("b");
      text.textContent = label;
      number.textContent = String(value);
      row.append(text, number);
      rivalryContent.append(row);
    }
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
  const chatPanels = [...document.querySelectorAll("[data-chat-panel]")];
  function renderChat() {
    chatPanels.forEach((panel) => (panel.hidden = !ticket || !room));
    const messages = room?.chat || [];
    const key = JSON.stringify(messages.map((m) => m.id));
    if (key === lastChatKey) return;
    lastChatKey = key;
    for (const panel of chatPanels) {
      const list = panel.querySelector("[data-chat-messages]");
      const atBottom =
        list.scrollHeight - list.scrollTop - list.clientHeight < 30;
      list.replaceChildren(
        ...messages.map((m) => {
          const row = document.createElement("li"),
            name = document.createElement("strong"),
            text = document.createElement("span");
          name.textContent = m.name + " : ";
          text.textContent = m.text;
          row.append(name, text);
          return row;
        }),
      );
      panel.querySelector("[data-chat-count]").textContent = messages.length
        ? `(${messages.length})`
        : "";
      if (atBottom) list.scrollTop = list.scrollHeight;
    }
  }
  chatPanels.forEach((panel) =>
    panel
      .querySelector("[data-chat-form]")
      .addEventListener("submit", (event) => {
        event.preventDefault();
        const input = panel.querySelector("[data-chat-input]");
        if (
          input.value.trim() &&
          send({ type: "chat", text: input.value.trim() })
        ) {
          input.value = "";
          panel.querySelector("[data-chat-status]").textContent = "";
        }
      }),
  );
  function update() {
    renderChat();
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
    const teamSize = room?.teamSize || 1;
    $("#multiplayer-team-size").value = String(teamSize);
    $("#multiplayer-team-size").disabled =
      room?.host !== self?.id || room?.phase !== "lobby";
    for (const option of $("#multiplayer-size").options)
      option.disabled = !validTeamSetup(Number(option.value), teamSize);
    $("#multiplayer-team-choice").hidden =
      teamSize === 1 || (self?.seat === null && room?.phase !== "lobby");
    const teamSelect = $("#multiplayer-team");
    teamSelect.disabled = room?.phase !== "lobby";
    const teamKey = JSON.stringify([
      teamSize,
      room?.count,
      room?.members.map((m) => [m.id, m.team]),
    ]);
    if (teamSelect.dataset.roster !== teamKey) {
      teamSelect.replaceChildren();
      if (teamSize > 1)
        for (let i = 0; i < room.count / teamSize; i++) {
          const count = room.members.filter((m) => m.team === i).length;
          const option = document.createElement("option");
          option.value = i;
          option.textContent = `Équipe ${i + 1} · ${count} humain${count > 1 ? "s" : ""} / ${teamSize}`;
          option.disabled = count >= teamSize && self?.team !== i;
          teamSelect.append(option);
        }
      teamSelect.dataset.roster = teamKey;
    }
    teamSelect.value = String(self?.team ?? "");
    const host = room?.host === self?.id;
    $("#multiplayer-map").value =
      !host && requestedMap ? requestedMap : room?.mapId || "cantine";
    $("#multiplayer-map").disabled = room?.phase !== "lobby";
    $("#multiplayer-request-map").hidden = host || room?.phase !== "lobby";
    const requestsKey = JSON.stringify([room?.host, room?.mapRequests || []]);
    if (requestsKey !== lastRequests) {
      lastRequests = requestsKey;
      const list = $("#multiplayer-map-requests");
      list.replaceChildren();
      for (const request of room?.mapRequests || []) {
        const row = document.createElement("div"),
          label = document.createElement("span");
        label.textContent =
          request.name +
          " propose " +
          (MULTIPLAYER_MAPS.find((map) => map.id === request.mapId)?.name ||
            "une carte");
        row.append(label);
        if (host) {
          const accept = document.createElement("button");
          accept.type = "button";
          accept.textContent = "Choisir";
          accept.onclick = () => send({ type: "map", mapId: request.mapId });
          row.append(accept);
        }
        list.append(row);
      }
    }
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
    const rosterKey = JSON.stringify([
      room?.phase,
      room?.host,
      room?.teamSize,
      ticket?.memberId,
      room?.members,
    ]);
    if (rosterKey !== lastRosterKey) {
      lastRosterKey = rosterKey;
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
          if (room.teamSize > 1 && Number.isInteger(m.team)) {
            li.dataset.team = m.team;
            li.style.setProperty("--team-color", teamColor(m.team));
            li.style.setProperty("--team-surface", teamSurface(m.team));
          }
          const label = document.createElement("span");
          label.className = "lobby-identity";
          const name = document.createElement("strong");
          name.textContent = m.name;
          const status = document.createElement("small");
          status.textContent = `${m.id === room.host ? "Hôte · " : ""}${m.id === ticket.memberId ? "Toi · " : ""}${!m.connected ? "reconnexion…" : !m.alive ? "spectateur" : room.phase === "lobby" ? (m.ready ? "prêt" : "pas encore prêt") : m.locked ? "tir verrouillé" : "en jeu"}`;
          label.append(name);
          const nickname = equippedTitle(cosmetics);
          if (nickname) {
            const title = document.createElement("small");
            title.className = "cosmetic-title";
            title.textContent = nickname;
            label.append(title);
          }
          label.append(status);
          const statistics = document.createElement("small");
          statistics.className = "lobby-statistics";
          statistics.textContent = m.statistics
            ? `${m.statistics.wins} victoire${m.statistics.wins > 1 ? "s" : ""} · Record ${m.statistics.maxMass > 0 ? `${Number(m.statistics.maxMass.toFixed(1)).toLocaleString("fr-FR")} kg` : "non enregistré"}`
            : "Statistiques non enregistrées";
          label.append(statistics);
          if (m.id !== ticket.memberId) {
            li.tabIndex = 0;
            li.setAttribute("role", "button");
            li.setAttribute("aria-label", `Voir notre passif avec ${m.name}`);
            li.onclick = () => openRivalry(m);
            li.onkeydown = (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openRivalry(m);
              }
            };
          }
          if (room.teamSize > 1 && Number.isInteger(m.team)) {
            const team = document.createElement("small");
            team.className = "lobby-team";
            team.textContent = `Équipe ${m.team + 1}`;
            label.append(team);
          }
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
    }
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
    if (
      pendingFormula !== null &&
      data.phase === "lobby" &&
      data.host === ticket?.memberId
    ) {
      const count = pendingFormula;
      pendingFormula = null;
      if (data.count !== count) send({ type: "size", count });
    }
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
        // A reconnect supersedes a possibly incomplete recording from the old socket.
        replay = null;
        frameIndex = 0;
        eventIndex = 0;
        pendingTurn = null;
        acceptRoom(packet.room);
        if (welcomed) profile.refresh().catch(() => {});
        welcomed = true;
        if (packet.state) enter(packet.state);
        else syncAppearance();
      } else if (packet.type === "rivalry") showRivalry(packet);
      else if (packet.type === "profile") pendingProfile = packet.state;
      else if (packet.type === "room") acceptRoom(packet.room);
      else if (packet.type === "state") {
        // A newer terminal snapshot supersedes an older non-terminal replay.
        // Keep the real final-turn recording when its own final state is ended.
        if (packet.state.phase === "ended" && replay?.final?.phase !== "ended")
          replay = null;
        enter(packet.state);
      } else if (packet.type === "resolution") {
        replay = {
          ...packet,
          frames: [],
          complete: false,
          clock: new ReplayClock(),
          receivedAt: performance.now(),
          decodeMs: 0,
        };
        frameIndex = 0;
        eventIndex = 0;
        pendingTurn = null;
      } else if (packet.type === "frames" && replay?.turn === packet.turn) {
        const decodeStart = performance.now();
        for (const frame of packet.frames) {
          const decoded = decodeFrame(frame, replay.frames.at(-1)?.state);
          replay.frames.push(decoded);
        }
        replay.decodeMs += performance.now() - decodeStart;
        replay.complete = packet.last;
      } else if (packet.type === "error") {
        if (packet.error === "RIVALRY")
          rivalryContent.textContent = packet.message;
        message(packet.message);
        if (["CHAT", "CHAT_RATE"].includes(packet.error))
          chatPanels.forEach(
            (panel) =>
              (panel.querySelector("[data-chat-status]").textContent =
                packet.message),
          );
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
    pendingFormula = creating ? selectedFormula : null;
    const name = $("#multiplayer-name").value.trim() || "Gourmand";
    const code = $("#multiplayer-join-code").value;
    $("#multiplayer-create").disabled = true;
    $("#multiplayer-join").disabled = true;
    message(creating ? "Préparation de la table…" : "Recherche du salon…");
    try {
      const credentials = await profile.ensure();
      const response = await fetch(
        SERVER + (creating ? "/api/rooms" : "/api/join"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            code,
            cosmetics: normalizeCosmetics(getCosmetics()),
            profile: credentials,
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
    rivalryDialog.close();
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
      !replay &&
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
      const t = replay.clock.sample(
        performance.now(),
        replay.complete,
        performance.now() + Math.max(0, replay.startedAt - Date.now() - offset),
      );
      if (t === null) return;
      window.__bouffeReplayMetrics = {
        turn: replay.turn,
        server: replay.metrics,
        decodeMs: replay.decodeMs,
        bufferMs: performance.now() - replay.receivedAt - t,
        playbackMs: t,
        duration: replay.duration,
        renderStalls: replay.clock.stalls,
      };
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
      (room.canRematch || room.phase === "ended") &&
      !replay &&
      lastState &&
      (!ended || (ended === "provisional" && lastState?.phase === "ended")) &&
      Date.now() + offset >= room.readyAt
    ) {
      ended = lastState.phase === "ended" ? "final" : "provisional";
      onEnd(lastState);
    }
  }
  $("#multiplayer-entry").onclick = () => {
    openDialog();
    update();
    if (!ticket) health();
  };
  $("#multiplayer-map").onchange = () => {
    const mapId = $("#multiplayer-map").value;
    if (room?.host === ticket?.memberId) send({ type: "map", mapId });
    else requestedMap = mapId;
  };
  $("#multiplayer-request-map").onclick = () =>
    send({ type: "map-request", mapId: $("#multiplayer-map").value });
  $("#multiplayer-rematch").onclick = () =>
    send({
      type: "rematch",
      vote: !room?.members.find((m) => m.id === ticket?.memberId)?.rematch,
    });
  $("#multiplayer-shop").onclick = () => openShop();
  $("#shop-dialog").addEventListener("close", syncAppearance);
  for (const button of document.querySelectorAll("[data-multi-count]"))
    button.onclick = () => {
      selectedFormula = Number(button.dataset.multiCount);
      for (const other of document.querySelectorAll("[data-multi-count]"))
        other.setAttribute("aria-pressed", String(other === button));
    };
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
  $("#multiplayer-team-size").onchange = (e) =>
    send({ type: "teamSize", teamSize: Number(e.target.value) });
  $("#multiplayer-team").onchange = (e) =>
    send({ type: "team", team: Number(e.target.value) });
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
  setInterval(() => {
    if (
      pendingProfile &&
      !replay &&
      (!room || Date.now() + offset >= room.readyAt)
    ) {
      profile.accept(pendingProfile);
      pendingProfile = null;
    }
    tick();
    update();
  }, 500);
  document.addEventListener("visibilitychange", () => {
    tick();
    update();
  });
  try {
    const saved = JSON.parse(sessionStorage.getItem(TICKET_KEY));
    if (
      saved?.version === VERSION &&
      /^(?:[A-HJ-NP-Z2-9]{4}|[A-HJ-NP-Z2-9]{12})$/.test(saved.code) &&
      /^[a-f0-9]{64}$/.test(saved.token)
    ) {
      ticket = saved;
      connect();
    }
  } catch {}
  profile.refresh().catch(() => {});
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
