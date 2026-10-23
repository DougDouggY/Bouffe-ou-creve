// Merge a tab's changes into the latest local save; timestamps are never counters.
export function mergeProfileProgress(current, baseline, latest) {
  const merge = (a = {}, b = {}, c = {}, timestamps = false) => {
    const result = { ...c, ...a };
    for (const key of new Set([...Object.keys(c), ...Object.keys(a)])) {
      const value = a[key],
        other = c[key],
        old = b?.[key];
      if (typeof value === "number" || typeof other === "number") {
        const x = Number.isSafeInteger(value) ? value : 0;
        const y = Number.isSafeInteger(other) ? other : 0;
        result[key] = timestamps
          ? x && y
            ? Math.min(x, y)
            : x || y
          : baseline
            ? Math.max(0, y + Math.max(0, x - (old || 0)))
            : Math.max(x, y);
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        result[key] = merge(
          value,
          old,
          other,
          key === "trophies" || key === "legacy",
        );
      }
    }
    return result;
  };
  const result = merge(current, baseline, latest);
  // Purchases spend points: applying the delta avoids restoring spent money.
  result.points = baseline
    ? Math.max(0, latest.points + current.points - baseline.points)
    : current.points;
  result.owned = [
    ...new Set([...(latest.owned || []), ...(current.owned || [])]),
  ];
  result.equipped = { ...latest.equipped };
  for (const slot of ["hat", "outfit"])
    if (!baseline || current.equipped?.[slot] !== baseline.equipped?.[slot])
      result.equipped[slot] = current.equipped?.[slot];
  return result;
}
