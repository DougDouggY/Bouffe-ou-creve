// Small visibility graph around the actual solid scenery, instead of searching a world-sized grid.
const caches = new WeakMap();
export function clearRoute(a, b, obstacles, radius = 0) {
  return !obstacles.some((o) => {
    const c = Math.cos(o.angle || 0),
      s = Math.sin(o.angle || 0),
      dx = b.x - a.x,
      dy = b.y - a.y;
    const x = (a.x - o.x) * c + (a.y - o.y) * s,
      y = -(a.x - o.x) * s + (a.y - o.y) * c;
    let near = 0,
      far = 1;
    for (const [p, d, h] of [
      [x, dx * c + dy * s, o.w / 2 + radius],
      [y, -dx * s + dy * c, o.h / 2 + radius],
    ]) {
      if (Math.abs(d) < 1e-8) {
        if (Math.abs(p) >= h) return false;
      } else {
        const t1 = (-h - p) / d,
          t2 = (h - p) / d;
        near = Math.max(near, Math.min(t1, t2));
        far = Math.min(far, Math.max(t1, t2));
      }
    }
    return near < far && far > 1e-6 && near < 1 - 1e-6;
  });
}
export function survivalWaypoint(g, from, target, radius) {
  if (clearRoute(from, target, g.obstacles, radius + 2)) return target;
  const bucket = Math.ceil(radius / 8) * 8;
  let cache = caches.get(g);
  if (!cache) caches.set(g, (cache = new Map()));
  let graph = cache.get(bucket);
  if (!graph) {
    const nodes = [];
    for (const o of g.obstacles.filter((o) => !o.boundary)) {
      const c = Math.cos(o.angle || 0),
        s = Math.sin(o.angle || 0);
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          const x = sx * (o.w / 2 + bucket + 16),
            y = sy * (o.h / 2 + bucket + 16),
            p = { x: o.x + x * c - y * s, y: o.y + x * s + y * c };
          if (
            p.x > bucket &&
            p.x < g.w - bucket &&
            p.y > bucket &&
            p.y < g.h - bucket &&
            clearRoute(
              p,
              { x: p.x + 0.001, y: p.y + 0.001 },
              g.obstacles,
              bucket,
            )
          )
            nodes.push(p);
        }
    }
    const edges = nodes.map(() => []);
    for (let i = 0; i < nodes.length; i++)
      for (let j = 0; j < i; j++)
        if (clearRoute(nodes[i], nodes[j], g.obstacles, bucket + 2)) {
          const length = Math.hypot(
            nodes[i].x - nodes[j].x,
            nodes[i].y - nodes[j].y,
          );
          edges[i].push([j, length]);
          edges[j].push([i, length]);
        }
    graph = { nodes, edges };
    cache.set(bucket, graph);
    if (cache.size > 24) cache.delete(cache.keys().next().value);
  }
  const nodes = [from, target, ...graph.nodes],
    edges = [
      [],
      [],
      ...graph.edges.map((list) => list.map(([i, d]) => [i + 2, d])),
    ];
  for (let i = 2; i < nodes.length; i++)
    for (const end of [0, 1])
      if (clearRoute(nodes[end], nodes[i], g.obstacles, bucket + 2)) {
        const d = Math.hypot(
          nodes[end].x - nodes[i].x,
          nodes[end].y - nodes[i].y,
        );
        edges[end].push([i, d]);
        edges[i].push([end, d]);
      }
  const costs = nodes.map(() => Infinity),
    prev = nodes.map(() => -1),
    done = new Set();
  costs[0] = 0;
  for (let count = 0; count < nodes.length; count++) {
    let at = -1;
    for (let i = 0; i < nodes.length; i++)
      if (!done.has(i) && (at < 0 || costs[i] < costs[at])) at = i;
    if (at < 0 || !Number.isFinite(costs[at])) break;
    if (at === 1) break;
    done.add(at);
    for (const [next, d] of edges[at])
      if (costs[next] > costs[at] + d) {
        costs[next] = costs[at] + d;
        prev[next] = at;
      }
  }
  if (prev[1] < 0) return target;
  let at = 1;
  while (prev[at] > 0) at = prev[at];
  return nodes[at];
}
