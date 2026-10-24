const KEY = "gourmands-effects-v1";
let state = { volume: 0.5, others: true };
try {
  const value = JSON.parse(globalThis.localStorage?.getItem(KEY) || "{}");
  if (Number.isFinite(value.volume))
    state.volume = Math.max(0, Math.min(1, value.volume));
  if (typeof value.others === "boolean") state.others = value.others;
} catch {}
const listeners = new Set();
export const effectsSettings = () => ({ ...state });
export const effectsGain = () => state.volume ** 2;
export function changeEffects(patch) {
  state = { ...state, ...patch };
  state.volume = Math.max(0, Math.min(1, Number(state.volume) || 0));
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  for (const fn of listeners) fn(state);
}
export function watchEffects(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function bindEffectsControls() {
  const volume = document.querySelector("#effects-volume"),
    label = document.querySelector("#effects-volume-value"),
    others = document.querySelector("#other-slide-sounds");
  const update = () => {
    volume.value = Math.round(state.volume * 100);
    label.textContent = volume.value + " %";
    others.checked = state.others;
  };
  volume.oninput = () => changeEffects({ volume: Number(volume.value) / 100 });
  others.onchange = () => changeEffects({ others: others.checked });
  watchEffects(update);
  update();
}
