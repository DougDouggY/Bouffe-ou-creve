import {
  ONLINE_TROPHY_IDS,
  onlineProfile,
} from "../../multiplayer-trophy-catalog.js?v=trophies-32";
// Invoked only by the authoritative Room; never accepts client achievement claims.
export function applyProfileGrant(previous, grant, now = Date.now()) {
  const p = onlineProfile(previous);
  p.revision++;
  for (const id of grant.awards || [])
    if (ONLINE_TROPHY_IDS.has(id)) p.trophies[id] ||= now;
  if (grant.win) {
    p.wins++;
    p.trophies["mp-win1"] ||= now;
    if ([2, 3, 4].includes(grant.teamSize)) {
      p.teamWins[grant.teamSize]++;
      p.trophies[
        { 2: "team-duo-win", 3: "team-trio-win", 4: "team-quad-win" }[
          grant.teamSize
        ]
      ] ||= now;
    }
  }
  if (p.wins >= 5) p.trophies["mp-wins5"] ||= now;
  if ([2, 3, 4].every((size) => p.teamWins[size] > 0))
    p.trophies["team-family"] ||= now;
  return p;
}
function queue(room, profileId, awards = [], extra = {}) {
  if (!profileId || (!awards.length && !extra.win)) return;
  const d = room.data;
  const seen = ((d.trophyRoomAwards ||= {})[profileId] ||= {});
  awards = awards.filter((id) => ONLINE_TROPHY_IDS.has(id) && !seen[id]);
  for (const id of awards) seen[id] = true;
  if (!awards.length && !extra.win) return;
  (d.trophyOutbox ||= []).push({
    profileId,
    key: `${d.code}:${d.trophyMatch?.id || "lobby"}:${++d.trophySequence}`,
    awards,
    ...extra,
  });
}
function awardSeats(room, seats, ids) {
  const m = room.data.trophyMatch;
  for (const seat of seats)
    if (room.game.people[seat]?.human)
      queue(room, m.humans[seat]?.profileId, ids);
}
export function beginTrophyMatch(room) {
  const d = room.data,
    g = room.game;
  d.trophySequence ||= 0;
  d.trophyHistory ||= {};
  d.trophyMatch = {
    id: crypto.randomUUID(),
    humans: Object.fromEntries(
      d.members
        .filter((m) => m.seat !== null)
        .map((m) => [m.seat, { profileId: m.profileId, memberId: m.id }]),
    ),
    alive: Object.fromEntries(g.people.map((p) => [p.id, true])),
    kills: {},
    salads: {},
    deaths: {},
    lastVictims: {},
    firstHumanOut: false,
    done: false,
  };
  if (Object.keys(d.trophyMatch.humans).length === 8)
    awardSeats(room, Object.keys(d.trophyMatch.humans), ["mp-full-table"]);
}
export function trophyChat(room, member) {
  room.data.trophySequence ||= 0;
  const eliminated =
    member.seat !== null && room.game && !room.game.people[member.seat]?.alive;
  queue(room, member.profileId, [
    "mp-chat",
    ...(eliminated ? ["mp-ghost-chat"] : []),
  ]);
}
export function trophyTurn(room, replay) {
  const d = room.data,
    g = room.game,
    m = d.trophyMatch;
  if (!m || m.done) return;
  const byId = new Map(g.people.map((p) => [p.id, p]));
  const teamSeats = (p) =>
    g.people.filter((q) => q.teamId === p.teamId).map((q) => q.id);
  const human = (seat) => m.humans[seat];
  for (const event of replay.events) {
    if (event.kind === "food" && event.food?.type === "salad")
      m.salads[event.person] = true;
    if (event.kind !== "elimination") continue;
    const victim = byId.get(event.person);
    if (!victim || !m.alive[victim.id]) continue;
    m.alive[victim.id] = false;
    m.deaths[victim.id] = { round: replay.turn, killerProfileId: null };
    const v = event.human ? human(victim.id) : null;
    if (v && !m.firstHumanOut) {
      queue(room, v.profileId, ["mp-first-out"]);
      m.firstHumanOut = true;
    }
    const killer = byId.get(event.eliminatedBy?.id),
      k = killer?.human ? human(killer.id) : null;
    const opponents =
      killer && (g.teamSize === 1 || killer.teamId !== victim.teamId);
    if (v && killer && opponents) {
      const kills = (m.kills[killer.id] = (m.kills[killer.id] || 0) + 1);
      if (k) {
        m.deaths[victim.id].killerProfileId = k.profileId;
        const ids = ["mp-human1"];
        if (kills >= 3) ids.push("mp-human3");
        if (d.trophyHistory[k.profileId]?.lastKillerProfileId === v.profileId)
          ids.push("mp-revenge");
        const last = m.lastVictims[victim.id];
        if (
          g.teamSize > 1 &&
          last !== undefined &&
          byId.get(last)?.teamId === killer.teamId
        )
          ids.push("team-avenge");
        queue(room, k.profileId, ids);
      }
    }
    if (killer && opponents) m.lastVictims[killer.id] = victim.id;
    if (g.teamSize > 1) {
      const seats = teamSeats(victim),
        survivors = seats.filter((s) => m.alive[s]);
      if (g.teamSize === 3 && survivors.length === 1)
        awardSeats(room, survivors, ["team-trio-last"]);
      if (!survivors.length) {
        if (g.teamSize === 4) awardSeats(room, seats, ["team-quad-out"]);
        if (seats.every((s) => m.deaths[s]?.round === 1))
          awardSeats(room, seats, ["team-first-out"]);
      }
    }
  }
  if (g.teamSize > 1)
    for (const team of new Set(g.people.map((p) => p.teamId))) {
      const seats = g.people.filter((p) => p.teamId === team).map((p) => p.id);
      if (seats.every((s) => m.kills[s] > 0))
        awardSeats(room, seats, ["team-shared-bill"]);
      if (seats.every((s) => m.salads[s]))
        awardSeats(room, seats, ["team-salads"]);
    }
  if (g.phase === "ended") finishTrophyMatch(room);
}
export function finishTrophyMatch(room) {
  const d = room.data,
    g = room.game,
    m = d.trophyMatch;
  if (!m || m.done) return;
  const byId = new Map(g.people.map((p) => [p.id, p]));
  m.done = true;
  const survivors = g.people.filter((p) => p.alive);
  const winningTeam =
    g.teamSize > 1 && new Set(survivors.map((p) => p.teamId)).size === 1
      ? survivors[0]?.teamId
      : null;
  const results = new Map();
  for (const [seatText, member] of Object.entries(m.humans)) {
    if (!member.profileId) continue;
    const seat = +seatText,
      p = byId.get(seat),
      history = (d.trophyHistory[member.profileId] ||= {
        matches: 0,
        lastKillerProfileId: null,
      });
    // One profile may be open in several tabs: count a completed match only once.
    const previous = results.get(member.profileId);
    if (!previous) history.matches++;
    history.lastKillerProfileId = m.deaths[seat]?.killerProfileId || null;
    const win =
      g.phase === "ended" &&
      g.outcome !== "draw" &&
      p.human &&
      (g.teamSize > 1 ? p.teamId === winningTeam : p.alive);
    const ids = history.matches >= 5 ? ["mp-five-servings"] : [];
    if (win && g.teamSize > 1) {
      const alive = survivors.filter((q) => q.teamId === p.teamId);
      if (alive.length === 1) {
        if (p.alive) ids.push("team-last-win");
        if (g.teamSize === 2 && p.alive) ids.push("team-duo-alone");
        if (g.teamSize === 4 && p.alive) ids.push("team-quad-last");
      }
      if (g.teamSize === 4 && alive.length === 4) ids.push("team-quad-intact");
    }
    results.set(member.profileId, {
      win: win || previous?.win,
      awards: [...new Set([...(previous?.awards || []), ...ids])],
    });
  }
  for (const [profileId, result] of results)
    queue(room, profileId, result.awards, {
      win: result.win,
      teamSize: g.teamSize,
    });
}
