const FIELDS = ["burgers", "salads", "douggy", "fondue", "eaten"];
export function trophyCounters(profile) {
  const totals = Object.fromEntries(
    FIELDS.map((k) => [
      k,
      (profile.trophyTotals?.[k] || 0) +
        (profile.online?.normalStats?.[k] || 0),
    ]),
  );
  const modes = Object.fromEntries(
    ["classic", "gros", "usa"].map((k) => [
      k,
      (profile.modeWins?.[k] || 0) + (profile.online?.modeWins?.[k] || 0),
    ]),
  );
  return {
    totals,
    modes,
    wins: (profile.wins || 0) + (profile.online?.wins || 0),
  };
}
export function trophyProgress(id, profile) {
  const { totals, modes, wins } = trophyCounters(profile);
  const mode = {
    "classic-win": "classic",
    "gros-win": "gros",
    "us-win": "usa",
  }[id];
  if (mode) return { value: Math.min(1, modes[mode]), target: 1 };
  if (id === "all-modes")
    return {
      value: Object.values(modes).filter((n) => n > 0).length,
      target: 3,
    };
  if (id === "wins50") return { value: wins, target: 50 };
  if (id === "salad20") return { value: totals.salads, target: 20 };
  const m = /^(burger|douggy|fondue|eat)(\d+)$/.exec(id);
  if (m)
    return {
      value:
        totals[
          {
            burger: "burgers",
            douggy: "douggy",
            fondue: "fondue",
            eat: "eaten",
          }[m[1]]
        ],
      target: Number(m[2]),
    };
  return null;
}
export function awardCumulativeTrophies(profile, now = Date.now()) {
  const ids = [
    "classic-win",
    "gros-win",
    "us-win",
    "all-modes",
    "wins50",
    "salad20",
    ...[1, 10, 100, 1000].flatMap((n) => ["burger" + n, "eat" + n]),
    ...[1, 10, 100].flatMap((n) => ["douggy" + n, "fondue" + n]),
  ];
  const added = [];
  profile.trophies ||= {};
  for (const id of ids) {
    const p = trophyProgress(id, profile);
    if (p.value >= p.target && !profile.trophies[id]) {
      profile.trophies[id] = now;
      added.push(id);
    }
  }
  return added;
}
// Legacy badges predate online mode counters. New online badges must never be
// copied into solo counters or used to invent victories in the other formulas.
export function restoreModeWins(profile, raw = {}) {
  const wins = { ...profile.modeWins };
  for (const [mode, badge] of Object.entries({
    classic: "classic-win",
    gros: "gros-win",
    usa: "us-win",
  }))
    if (profile.trophies?.[badge] && !(profile.online?.modeWins?.[mode] > 0))
      wins[mode] = Math.max(1, wins[mode] || 0);
  const onlineHasModes=Object.values(profile.online?.modeWins||{}).some(n=>n>0);
  if (
    (!raw.online?.modeWins || !onlineHasModes) &&
    (wins.usa > 0 || profile.trophies?.["all-modes"])
  ) {
    wins.classic = Math.max(1, wins.classic || 0);
    wins.gros = Math.max(1, wins.gros || 0);
  }
  return wins;
}
