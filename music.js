const MUSIC_GAIN = 0.6;
const STORAGE_KEY = "bouffe-ambient-music-v1";
const clampVolume = (value) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.15;

export function createAmbientMusic({
  AudioClass = Audio,
  target = document,
  storage,
  isPageVisible = () => !document.hidden,
} = {}) {
  let saved = {};
  try {
    saved = JSON.parse(storage?.getItem(STORAGE_KEY) || "{}");
  } catch {}
  let enabled = saved?.enabled === true;
  let volume = clampVolume(saved?.volume);
  let muted = false,
    playing = false,
    starting = false,
    blocked = false,
    failed = false;
  let generation = 0;
  const listeners = new Set();
  const sound = new AudioClass(
    new URL("./assets/ambiance-douce.mp3", import.meta.url).href,
  );
  sound.loop = true;
  sound.preload = "none";
  sound.volume = volume * MUSIC_GAIN;
  const notify = () => {
    for (const listener of listeners) listener();
  };
  const persist = () => {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify({ enabled, volume }));
    } catch {}
  };
  const wanted = () => enabled && !muted && volume > 0 && isPageVisible();
  function pause() {
    generation++;
    starting = false;
    playing = false;
    sound.pause();
  }
  async function resume() {
    if (!wanted() || playing || starting) return;
    const request = ++generation;
    starting = true;
    try {
      await sound.play();
      if (request !== generation) return;
      playing = true;
      blocked = false;
      failed = false;
    } catch (error) {
      if (request !== generation) return;
      blocked = error.name === "NotAllowedError";
      failed = !blocked && error.name !== "AbortError";
    } finally {
      if (request === generation) {
        starting = false;
        notify();
      }
    }
  }
  sound.addEventListener("error", () => {
    failed = true;
    playing = false;
    notify();
  });
  target.addEventListener("pointerdown", resume, true);
  target.addEventListener("keydown", resume, true);
  target.addEventListener("visibilitychange", () => {
    if (isPageVisible()) resume();
    else pause();
  });
  resume();
  return {
    get state() {
      return { enabled, volume, muted, playing, blocked, failed };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setEnabled(value) {
      enabled = Boolean(value);
      persist();
      if (wanted()) resume();
      else pause();
      notify();
    },
    setVolume(value) {
      volume = clampVolume(value);
      sound.volume = volume * MUSIC_GAIN;
      persist();
      if (wanted()) resume();
      else pause();
      notify();
    },
    setMuted(value) {
      muted = Boolean(value);
      if (wanted()) resume();
      else pause();
      notify();
    },
  };
}

export function setupMusicControls() {
  let storage;
  try {
    storage = localStorage;
  } catch {}
  const music = createAmbientMusic({ storage });
  const toggle = document.querySelector("#music-enabled");
  const volume = document.querySelector("#music-volume");
  const output = document.querySelector("#music-volume-value");
  const status = document.querySelector("#music-status");
  function render() {
    const state = music.state;
    toggle.checked = state.enabled;
    const percent = Math.round(state.volume * 100);
    volume.value = String(percent);
    volume.setAttribute("aria-valuetext", `${percent} %`);
    output.value = `${percent} %`;
    status.textContent = !state.enabled
      ? "Musique désactivée."
      : state.muted
        ? "Le son général est coupé."
        : state.volume === 0
          ? "Volume à zéro."
          : state.failed
            ? "La musique n’a pas pu être chargée. Réessaie de l’activer."
            : state.blocked
              ? "Touche l’écran ou appuie sur une touche pour lancer la musique."
              : "Une ambiance légère, dans le menu et en partie.";
  }
  music.subscribe(render);
  toggle.addEventListener("change", () => music.setEnabled(toggle.checked));
  volume.addEventListener("input", () =>
    music.setVolume(Number(volume.value) / 100),
  );
  render();
  return music;
}
