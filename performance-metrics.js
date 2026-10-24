const metrics = new Map();
export function recordPerformance(name, ms) {
  let data = metrics.get(name);
  if (!data) {
    data = { count: 0, total: 0, max: 0, recent: [] };
    metrics.set(name, data);
  }
  data.count++;
  data.total += ms;
  data.max = Math.max(data.max, ms);
  data.recent.push(ms);
  if (data.recent.length > 60) data.recent.shift();
}
export const performanceReport = () =>
  Object.fromEntries(
    [...metrics].map(([name, data]) => [
      name,
      {
        count: data.count,
        meanMs: data.total / data.count,
        maxMs: data.max,
        p95Ms:
          [...data.recent].sort((a, b) => a - b)[
            Math.max(0, Math.ceil(data.recent.length * 0.95) - 1)
          ] || 0,
      },
    ]),
  );
if (typeof window !== "undefined") {
  window.__gourmandsPerf = {
    snapshot: performanceReport,
    reset: () => metrics.clear(),
  };
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        recordPerformance("long-task", entry.duration);
    }).observe({ entryTypes: ["longtask"] });
  } catch {}
}
