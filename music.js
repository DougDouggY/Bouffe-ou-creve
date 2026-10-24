const MUSIC_GAIN = 0.2;
export const MUSIC_TRACKS = [
  {
    id: "bistrot",
    name: "Bistrot tranquille · piano jazzy",
    file: "music-bistrot.mp3",
  },
  {
    id: "balade",
    name: "Balade gourmande · cordes légères",
    file: "music-balade.mp3",
  },
  { id: "nuage", name: "Nuage sucré · valse douce", file: "music-nuage.mp3" },
];
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
  let trackId = MUSIC_TRACKS.some((track) => track.id === saved?.trackId)
    ? saved.trackId
    : MUSIC_TRACKS[0].id;
  const trackURL = (id) =>
    new URL(
      `./assets/${MUSIC_TRACKS.find((track) => track.id === id).file}`,
      import.meta.url,
    ).href;
  let muted = false,
    playing = false,
    starting = false,
    blocked = false,
    failed = false;
  let generation = 0;
  const listeners = new Set();
  const sound = new AudioClass(trackURL(trackId));
  sound.loop = true;
  sound.preload = "none";
  sound.volume = MUSIC_GAIN * volume ** 2;
  const notify = () => {
    for (const listener of listeners) listener();
  };
  const persist = () => {
    try {
      storage?.setItem(
        STORAGE_KEY,
        JSON.stringify({ enabled, volume, trackId }),
      );
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
      return { enabled, volume, trackId, muted, playing, blocked, failed };
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
      sound.volume = MUSIC_GAIN * volume ** 2;
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
    setTrack(id) {
      if (id === trackId || !MUSIC_TRACKS.some((track) => track.id === id))
        return;
      pause();
      trackId = id;
      sound.src = trackURL(id);
      sound.load?.();
      failed = false;
      blocked = false;
      persist();
      if (wanted()) resume();
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
  try {
    if (JSON.parse(storage?.getItem(STORAGE_KEY) || "{}").enabled === false)
      music.setVolume(0);
  } catch {}
  music.setEnabled(true);
  const toggle = document.querySelector("#music-enabled");
  const choice = document.querySelector("#music-track");
  for (const track of MUSIC_TRACKS) {
    const option = document.createElement("option");
    option.value = track.id;
    option.textContent = track.name;
    choice.append(option);
  }
  const volume = document.querySelector("#music-volume");
  const output = document.querySelector("#music-volume-value");
  const status = document.querySelector("#music-status");
  function render() {
    const state = music.state;
    toggle.checked = state.enabled;
    choice.value = state.trackId;
    const percent = Math.round(state.volume * 100);
    volume.value = String(percent);
    volume.setAttribute("aria-valuetext", `${percent} %`);
    output.value = `${percent} %`;
    status.hidden = !(state.failed || state.blocked);
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
              : "";
  }
  music.subscribe(render);

  choice.addEventListener("change", () => {
    music.setTrack(choice.value);
    music.setEnabled(true);
  });
  volume.addEventListener("input", () => {
    const next = Number(volume.value) / 100;
    music.setVolume(next);
    music.setEnabled(true);
  });
  render();
  return music;
}
