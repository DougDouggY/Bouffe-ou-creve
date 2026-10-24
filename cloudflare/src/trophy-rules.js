import { eventPoints, matchPoints, MATCH_POINTS_CAP } from "../../economy.js";
import {
  ONLINE_TROPHY_IDS,
  onlineProfile,
} from "../../multiplayer-trophy-catalog.js?v=wardrobe-41";
// Invoked only by the authoritative Room; never accepts client achievement claims.
export function applyProfileGrant(previous, grant, now = Date.now()) {
  const p = onlineProfile(previous);
  p.revision++;
  for (const key of Object.keys(p.normalStats)) {
    const amount = grant.normalStats?.[key];
    if (Number.isSafeInteger(amount) && amount > 0 && amount <= 100000)
      p.normalStats[key] += amount;
  }
  if (grant.win && ["classic", "gros", "usa"].includes(grant.mode))
    p.modeWins[grant.mode]++;

  if (
    Number.isSafeInteger(grant.currency) &&
    grant.currency > 0 &&
    grant.currency <= MATCH_POINTS_CAP
  )
    p.pointsEarned += grant.currency;
  if (Number.isFinite(grant.maxMass) && grant.maxMass >= 0)
    p.maxMass = Math.max(p.maxMass, grant.maxMass);
  for (const change of grant.rivals || []) {
    if (
      !change.profileId ||
      change.profileId === p.profileId ||
      !/^[a-f0-9-]{36}$/.test(change.profileId)
    )
      continue;
    const rival = (p.rivals[change.profileId] ||= {
      name: "Gourmand",
      together: 0,
      eaten: 0,
      wasEaten: 0,
    });
    if (typeof change.name === "string")
      rival.name = Array.from(change.name).slice(0, 24).join("");
    for (const field of ["together", "eaten", "wasEaten"])
      if (change[field] === 1) rival[field]++;
    if (rival.together >= 10) p.trophies["mp-regulars"] ||= now;
  }
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
  if (
    !profileId ||
    (!awards.length &&
      !extra.win &&
      !extra.currency &&
      !extra.normalStats &&
      !extra.rivals?.length &&
      !Number.isFinite(extra.maxMass))
  )
    return;
  const d = room.data;
  const seen = ((d.trophyRoomAwards ||= {})[profileId] ||= {});
  awards = awards.filter((id) => ONLINE_TROPHY_IDS.has(id) && !seen[id]);
  for (const id of awards) seen[id] = true;
  if (
    !awards.length &&
    !extra.win &&
    !extra.currency &&
    !extra.normalStats &&
    !extra.rivals?.length &&
    !Number.isFinite(extra.maxMass)
  )
    return;
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
    trackingVersion: 2,
    humans: Object.fromEntries(
      d.members
        .filter((m) => m.seat !== null)
        .map((m) => [
          m.seat,
          { profileId: m.profileId, memberId: m.id, name: m.name },
        ]),
    ),
    alive: Object.fromEntries(g.people.map((p) => [p.id, true])),
    kills: {},
    allKills: {},
    currency: {},
    burgers: {},
    earlyLone: {},
    peakSent: {},
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
function queueNormalProgress(room) {
  const m = room.data.trophyMatch,
    g = room.game;
  if (!m || !g) return;
  m.normalSent ||= {};
  const byProfile = new Map();
  for (const [seat, human] of Object.entries(m.humans)) {
    if (!human.profileId) continue;
    const stats = g.stats?.people?.[seat];
    if (!stats) continue;
    const record = byProfile.get(human.profileId) || {};
    for (const key of ["burgers", "salads", "douggy", "fondue", "eaten"])
      record[key] = Math.max(record[key] || 0, stats[key] || 0);
    byProfile.set(human.profileId, record);
  }
  for (const [profileId, stats] of byProfile) {
    const sent = m.normalSent[profileId] || {},
      delta = {};
    for (const key of Object.keys(stats))
      if (stats[key] > (sent[key] || 0))
        delta[key] = stats[key] - (sent[key] || 0);
    if (Object.keys(delta).length) {
      queue(room, profileId, [], { normalStats: delta });
      m.normalSent[profileId] = stats;
    }
  }
}
export function trophyTurn(room, replay) {
  const d = room.data,
    g = room.game,
    m = d.trophyMatch;
  if (!m || m.done) return;
  m.allKills ||= {};
  m.currency ||= {};
  m.burgers ||= {};
  m.earlyLone ||= {};
  m.peakSent ||= {};
  for (const [seat, member] of Object.entries(m.humans)) {
    const peak = replay.massPeaks?.[seat] ?? g.people[seat]?.mass;
    const prior =
      m.peakSent[seat] ||
      d.members.find((x) => x.id === member.memberId)?.statistics?.maxMass ||
      0;
    if (Number.isFinite(peak) && peak > prior) {
      m.peakSent[seat] = peak;
      queue(room, member.profileId, [], { maxMass: peak });
    }
  }
  const byId = new Map(g.people.map((p) => [p.id, p]));
  const teamSeats = (p) =>
    g.people.filter((q) => q.teamId === p.teamId).map((q) => q.id);
  const human = (seat) => m.humans[seat];
  for (const event of replay.events) {
    if (event.kind === "food" && event.food && event.person !== undefined)
      m.currency[event.person] = Math.min(
        MATCH_POINTS_CAP,
        (m.currency[event.person] || 0) + eventPoints("food", event.food),
      );
    if (event.kind === "food" && event.food?.type === "salad")
      m.salads[event.person] = true;
    if (event.kind === "food" && event.food?.type === "burger")
      m.burgers[event.person] = (m.burgers[event.person] || 0) + 1;
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
    if (killer && opponents) {
      m.allKills[killer.id] = (m.allKills[killer.id] || 0) + 1;
      m.currency[killer.id] = Math.min(
        MATCH_POINTS_CAP,
        (m.currency[killer.id] || 0) + eventPoints("eat"),
      );
    }
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
        queue(room, k.profileId, ids, {
          rivals: [{ profileId: v.profileId, name: v.name, eaten: 1 }],
        });
        queue(room, v.profileId, [], {
          rivals: [{ profileId: k.profileId, name: k.name, wasEaten: 1 }],
        });
      }
    }
    if (killer && opponents) m.lastVictims[killer.id] = victim.id;
    if (g.teamSize > 1) {
      const seats = teamSeats(victim),
        survivors = seats.filter((s) => m.alive[s]);
      if (
        survivors.length === 1 &&
        Object.values(m.alive).filter(Boolean).length >= Math.ceil(g.count / 2)
      )
        m.earlyLone[survivors[0]] = true;
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
      if (g.teamSize === 4 && seats.every((s) => m.allKills[s] > 0))
        awardSeats(room, seats, ["team-quad-meals"]);
      if (seats.every((s) => m.kills[s] > 0))
        awardSeats(room, seats, ["team-shared-bill"]);
      if (seats.every((s) => m.salads[s]))
        awardSeats(room, seats, ["team-salads"]);
    }
  queueNormalProgress(room);
  if (g.phase === "ended") finishTrophyMatch(room);
}
export function finishTrophyMatch(room) {
  const d = room.data,
    g = room.game,
    m = d.trophyMatch;
  if (!m || m.done) return;
  queueNormalProgress(room);
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
      const seats = g.people
        .filter((q) => q.teamId === p.teamId)
        .map((q) => q.id);
      if (g.teamSize === 2 && seats.every((s) => m.kills[s] > 0))
        ids.push("team-duo-human-win");
      const zero = seats.filter((s) => !(m.allKills?.[s] > 0));
      if (m.trackingVersion === 2 && zero.length === 1 && zero[0] === p.id)
        ids.push("team-weak-link");
      if (p.alive) {
        if (m.trackingVersion === 2 && !(m.allKills?.[p.id] > 0))
          ids.push("team-stowaway");
        if (m.trackingVersion === 2 && !(m.burgers?.[p.id] > 0))
          ids.push("team-no-burger");
        if (m.earlyLone?.[p.id]) ids.push("team-against-all");
      }
      const alive = survivors.filter((q) => q.teamId === p.teamId);
      if (alive.length === 1) {
        if (p.alive) ids.push("team-last-win");
        if (g.teamSize === 2 && p.alive) ids.push("team-duo-alone");
        if (g.teamSize === 4 && p.alive) ids.push("team-quad-last");
      }
      if (g.teamSize === 3 && alive.length === 3) ids.push("team-trio-intact");
      if (g.teamSize === 4 && alive.length === 4) ids.push("team-quad-intact");
    }
    results.set(member.profileId, {
      win: win || previous?.win,
      currency: Math.max(
        previous?.currency || 0,
        matchPoints(
          m.currency?.[seat] || 0,
          win,
          g.count > 8 ? "gros" : "classic",
        ),
      ),
      awards: [...new Set([...(previous?.awards || []), ...ids])],
    });
  }
  for (const [profileId, result] of results)
    queue(room, profileId, result.awards, {
      win: result.win,
      mode: g.count >= 50 ? "usa" : g.count > 8 ? "gros" : "classic",
      teamSize: g.teamSize,
      currency: result.currency,
      rivals: [
        ...new Map(
          Object.values(m.humans)
            .filter((h) => h.profileId && h.profileId !== profileId)
            .map((h) => [
              h.profileId,
              { profileId: h.profileId, name: h.name, together: 1 },
            ]),
        ).values(),
      ],
    });
}
