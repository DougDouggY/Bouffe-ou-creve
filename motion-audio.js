import { SLIDE_SOUNDS, slideSound } from "./sound-catalog.js?v=wardrobe-41";
import {
  effectsGain,
  effectsSettings,
  watchEffects,
} from "./audio-settings.js?v=ceremony-38";
export function createMotionAudio({
  AudioClass = Audio,
  now = () => performance.now(),
} = {}) {
  const pools = new Map(),
    active = new Set(),
    queue = [],
    heard = new Set();
  let muted = false,
    boingAt = -Infinity,
    flushPending = false;
  const url = (file) => new URL("./assets/audio/" + file, import.meta.url).href;
  function pool(file) {
    if (!pools.has(file)) {
      const voice = new AudioClass(url(file));
      voice.preload = "auto";
      voice.loop = false;
      pools.set(file, [voice]);
    }
    return pools.get(file);
  }
  function balance() {
    const total = [...active].reduce((sum, v) => sum + v.weight, 0) || 1;
    for (const v of active)
      v.audio.volume = Math.min(1, (0.65 * effectsGain() * v.weight) / total);
  }
  function flush() {
    flushPending = false;
    if (muted || effectsGain() === 0) {
      queue.length = 0;
      return;
    }
    queue.sort((a, b) => Number(a.remote) - Number(b.remote));
    while (active.size < 3 && queue.length) {
      const job = queue.shift();
      if (job.remote && !effectsSettings().others && job.human) continue;
      const voices = pool(job.file);
      let audio = voices.find((a) => ![...active].some((v) => v.audio === a));
      if (!audio) {
        audio = new AudioClass(url(job.file));
        audio.loop = false;
        voices.push(audio);
      }
      audio.currentTime = 0;
      const voice = {
        audio,
        weight: job.weight || 1,
        remote: job.remote,
        human: job.human,
      };
      active.add(voice);
      balance();
      const release = () => {
        audio.removeEventListener("ended", release);
        audio.removeEventListener("error", release);
        active.delete(voice);
        balance();
        flush();
      };
      audio.addEventListener("ended", release, { once: true });
      audio.addEventListener("error", release, { once: true });
      audio.play().catch(release);
    }
  }
  function enqueue(job) {
    if (muted || effectsGain() === 0) return false;
    queue.push(job);
    if (!flushPending) {
      flushPending = true;
      queueMicrotask(flush);
    }
    return true;
  }
  watchEffects(() => {
    if (!effectsSettings().others) {
      for (let i = queue.length - 1; i >= 0; i--)
        if (queue[i].remote && queue[i].human) queue.splice(i, 1);
      for (const v of [...active])
        if (v.remote && v.human) {
          v.audio.pause();
          v.audio.dispatchEvent(new Event("ended"));
        }
    }
    balance();
    if (!effectsGain()) {
      queue.length = 0;
      for (const v of [...active]) {
        v.audio.pause();
        v.audio.dispatchEvent(new Event("ended"));
      }
    }
  });
  return {
    unlock() {
      if (muted) return;
      for (const voices of pools.values())
        for (const audio of voices) {
          if ([...active].some((v) => v.audio === audio)) continue;
          audio.volume = 0;
          audio
            .play()
            .then(() => {
              if (![...active].some((v) => v.audio === audio)) {
                audio.pause();
                audio.currentTime = 0;
              }
            })
            .catch(() => {});
        }
    },
    prime(cosmetics = []) {
      for (const c of cosmetics) pool(slideSound(c?.slide).file);
      pool("move-spring.mp3");
    },
    slide(person, turn) {
      if (person.human !== true) return;
      const key = turn + ":" + (person.networkSeat ?? person.id);
      if (heard.has(key)) return;
      heard.add(key);
      enqueue({
        file: slideSound(person.cosmetics?.slide).file,
        remote: person.id !== 0,
        human: !!person.human,
        weight: person.id === 0 ? 1 : 0.65,
      });
    },
    bounce() {
      const time = now();
      if (time - boingAt < 100 || active.size >= 3 || queue.length > 2) return;
      boingAt = time;
      enqueue({ file: "move-spring.mp3", weight: 0.65, remote: false });
    },
    preview(id) {
      const item = SLIDE_SOUNDS.find((s) => s.id === id && !s.disabled);
      if (!item || muted || !effectsGain()) return false;
      queue.length = 0;
      for (const v of active) {
        v.audio.pause();
        v.audio.dispatchEvent(new Event("ended"));
      }
      return enqueue({ file: item.file, weight: 1, remote: false });
    },
    reset() {
      heard.clear();
      queue.length = 0;
      for (const v of [...active]) {
        v.audio.pause();
        v.audio.dispatchEvent(new Event("ended"));
      }
    },
    setMuted(value) {
      muted = value;
      if (value) this.reset();
    },
  };
}
