// Network-only compression: intermediate positions use 0.01 px, endpoints stay exact.
// No client simulation, AI or random decisions live in this module.
const round = (n, scale = 100) => Math.round((n || 0) * scale) / scale;
const fields = ["food", "zones", "effects", "announcement"];
export function encodeFrames(frames) {
  let previous;
  return frames.map((frame, i) => {
    const state = frame.state;
    if (i === 0 || i === frames.length - 1) {
      previous = state;
      return frame;
    }
    const changes = {},
      mechanics = {};
    for (const key of fields)
      if (JSON.stringify(state[key]) !== JSON.stringify(previous[key]))
        changes[key] = state[key];
    for (const key of Object.keys(state.mechanics))
      if (
        JSON.stringify(state.mechanics[key]) !==
        JSON.stringify(previous.mechanics[key])
      )
        mechanics[key] =
          key === "clock"
            ? Math.round(state.mechanics[key])
            : state.mechanics[key];
    const packed = {
      t: frame.t,
      round: state.round,
      phase: state.phase,
      elapsed: Math.round(state.elapsed),
      changes,
      mechanics,
      p: state.people.map((p) => [
        round(p.x),
        round(p.y),
        round(p.vx, 1000),
        round(p.vy, 1000),
        p.mass,
        p.alive ? 1 : 0,
        round(p.heading, 10000),
        round(p.pop, 1000),
        p.armored ? 1 : 0,
        p.infernoReady ? 1 : 0,
      ]),
    };
    previous = state;
    return packed;
  });
}
export function decodeFrame(frame, previous) {
  if (frame.state) return frame;
  if (!previous || frame.p.length !== previous.people.length)
    throw Error("Invalid replay");
  return {
    t: frame.t,
    state: {
      ...previous,
      ...frame.changes,
      round: frame.round,
      phase: frame.phase,
      elapsed: frame.elapsed,
      mechanics: { ...previous.mechanics, ...frame.mechanics },
      people: previous.people.map((p, i) => {
        const [x, y, vx, vy, mass, alive, heading, pop, armored, infernoReady] =
          frame.p[i];
        return {
          ...p,
          x,
          y,
          vx,
          vy,
          mass,
          alive: !!alive,
          heading,
          pop,
          armored: !!armored,
          infernoReady: !!infernoReady,
        };
      }),
    },
  };
}
