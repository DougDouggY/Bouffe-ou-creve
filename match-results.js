// Server-only accumulation from chronological engine events. No client claims.
export function beginResults(game) {
  return {
    kills: Object.fromEntries(game.people.map((p) => [p.id, 0])),
    first: null,
    seen: [],
    completed: false,
  };
}
export function recordResults(tracker, game, events) {
  if (!tracker || tracker.completed) return null;
  for (const event of events) {
    if (event.kind !== "elimination" || tracker.seen.includes(event.person))
      continue;
    tracker.seen.push(event.person);
    if (tracker.first === null) tracker.first = event.person;
    const killer = event.eliminatedBy?.id;
    if (
      Number.isInteger(killer) &&
      killer !== event.person &&
      game.people[killer] &&
      !(
        game.teamSize > 1 &&
        game.people[killer].teamId === game.people[event.person]?.teamId
      )
    )
      tracker.kills[killer]++;
  }
  if (game.phase !== "ended") return null;
  tracker.completed = true;
  const alive = game.people.filter((p) => p.alive),
    team =
      game.teamSize > 1 && new Set(alive.map((p) => p.teamId)).size === 1
        ? alive[0]?.teamId
        : null;
  const champions =
    game.outcome === "draw"
      ? []
      : game.teamSize > 1
        ? game.people.filter((p) => p.teamId === team).map((p) => p.id)
        : alive.map((p) => p.id);
  const max = Math.max(0, ...Object.values(tracker.kills));
  const predators =
    max > 0
      ? game.people
          .filter((p) => tracker.kills[p.id] === max)
          .sort(
            (a, b) =>
              Number(b.human === true) - Number(a.human === true) ||
              a.id - b.id,
          )
          .map((p) => p.id)
      : [];
  return {
    champions,
    predators,
    predatorKills: max,
    first: tracker.first,
    teamId: team,
    teamSize: game.teamSize,
    round: game.round,
  };
}
