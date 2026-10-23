// One layout drives physical walls, safe spawning and the visible rails / room edges.
export function arenaSize(mode, mapId) {
  if (mode === "survival") return { w: 18000, h: 13500 };
  if (mode === "classic" && mapId !== "volcan") return { w: 2400, h: 1800 };
  if (mode === "platform") return { w: 1600, h: 1200 };
  if (mode === "cannibal") return { w: 2000, h: 1500 };
  if (mode === "icecream") return { w: 2400, h: 1800 };
  return mode === "somalia" ? { w: 3200, h: 2200 } : { w: 3600, h: 2700 };
}

export function arenaOutline(id, w, h) {
  if (id === "volcan")
    return [
      [0.06, 0.075],
      [0.94, 0.075],
      [0.94, 0.925],
      [0.06, 0.925],
    ].map(([x, y]) => ({ x: x * w, y: y * h }));
  if (id === "icecream")
    return [
      [0.24, 0.1],
      [0.76, 0.1],
      [0.76, 0.9],
      [0.24, 0.9],
    ].map(([x, y]) => ({ x: x * w, y: y * h }));
  if (id === "cannibal")
    return Array.from({ length: 20 }, (_, i) => {
      const angle = -Math.PI / 2 + (i * Math.PI) / 10;
      return {
        x: (0.5 + Math.cos(angle) * 0.36) * w,
        y: (0.5 + Math.sin(angle) * 0.35) * h,
      };
    });
  if (["platform", "cannibal", "icecream"].includes(id)) {
    const m = id === "cannibal" ? 0.12 : id === "icecream" ? 0.15 : 0.08;
    return [
      [m, m],
      [1 - m, m],
      [1 - m, 1 - m],
      [m, 1 - m],
    ].map(([x, y]) => ({ x: x * w, y: y * h }));
  }
  const points =
    id === "pirate"
      ? [
          [0.2, 0.21],
          [0.8, 0.21],
          [0.83, 0.5],
          [0.85, 0.76],
          [0.15, 0.76],
          [0.17, 0.5],
        ]
      : id === "royal"
        ? [
            [0.11, 0.22],
            [0.45, 0.22],
            [0.45, 0.09],
            [0.55, 0.09],
            [0.55, 0.22],
            [0.89, 0.22],
            [0.89, 0.82],
            [0.11, 0.82],
          ]
        : ["garden", "underwater", "wok"].includes(id)
          ? Array.from({ length: 16 }, (_, i) => {
              const angle = -Math.PI / 2 + (i * Math.PI) / 8;
              return [
                0.5 + Math.cos(angle) * (id === "garden" ? 0.37 : 0.42),
                (id === "garden" ? 0.52 : 0.5) +
                  Math.sin(angle) * (id === "garden" ? 0.35 : 0.4),
              ];
            })
          : id === "beach"
            ? [
                [0.03, 0.03],
                [0.97, 0.03],
                [0.97, 0.67],
                [0.03, 0.67],
              ]
            : ["market", "nightmarket"].includes(id)
              ? [
                  [0.09, 0.1],
                  [0.91, 0.1],
                  [0.91, 0.88],
                  [0.09, 0.88],
                ]
              : id === "fair"
                ? [
                    [0.11, 0.12],
                    [0.89, 0.12],
                    [0.89, 0.88],
                    [0.11, 0.88],
                  ]
                : id === "cold"
                  ? [
                      [0.1, 0.13],
                      [0.9, 0.13],
                      [0.9, 0.87],
                      [0.1, 0.87],
                    ]
                  : [
                      [0.03, 0.03],
                      [0.97, 0.03],
                      [0.97, 0.97],
                      [0.03, 0.97],
                    ];
  return points.map(([x, y]) => ({ x: x * w, y: y * h }));
}
export function arenaBorderBodies(id, w, h) {
  if (id === "savanna") return [];
  const wall = (x, y, width, height, angle = 0) => ({
    x,
    y,
    w: width,
    h: height,
    angle,
    boundary: true,
  });
  if (id === "royal")
    return [
      wall(w * 0.055, h * 0.5, w * 0.11, h * 3),
      wall(w * 0.945, h * 0.5, w * 0.11, h * 3),
      wall(w * 0.5, h * 1.41, w * 3, h * 1.18),
      wall(w * 0.5, -h * 0.455, w * 3, h * 1.09),
      wall(w * 0.225, h * 0.11, w * 0.45, h * 0.22),
      wall(w * 0.775, h * 0.11, w * 0.45, h * 0.22),
    ];
  const polygon = arenaOutline(id, w, h),
    extent = Math.max(w, h) * 4;
  return polygon.map((p, i) => {
    const q = polygon[(i + 1) % polygon.length],
      dx = q.x - p.x,
      dy = q.y - p.y,
      d = Math.hypot(dx, dy);
    return wall(
      (p.x + q.x) / 2 + ((dy / d) * extent) / 2,
      (p.y + q.y) / 2 - ((dx / d) * extent) / 2,
      extent,
      extent,
      Math.atan2(dy, dx),
    );
  });
}
export function traceOutline(ctx, id, w, h) {
  const points = arenaOutline(id, w, h);
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
}
export function drawArenaBorders() {
  // Physical edges are supplied by the painted scenery, without an artificial rail.
}
export function containsArenaPoint(id, p, w, h) {
  const polygon = arenaOutline(id, w, h);
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}
