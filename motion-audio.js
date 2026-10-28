import {
  SLIDE_SOUNDS,
  COLLISION_SOUNDS,
  slideSound,
  collisionSound,
} from "./sound-catalog.js?v=auras-47";
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
    heard = new Set(),
    impacts = new Map();
  let muted = false,
    boingAt = -Infinity,
    impactAt = -Infinity,
    flushPending = false;
  let envelopeTimer = null;
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
    for (const v of active) {
      const elapsed = Math.max(0, (now() - v.startedAt) / 1000),
        remaining = Number.isFinite(v.audio.duration)
          ? Math.max(
              0,
              (v.audio.duration - v.audio.currentTime) /
                (v.audio.playbackRate || 1),
            )
          : Infinity;
      const fade = v.fade ? Math.min(1, elapsed / 0.06, remaining / 0.12) : 1;
      v.audio.volume = Math.min(
        1,
        (0.65 * effectsGain() * v.weight * v.gain * Math.max(0, fade)) / total,
      );
    }
    if (!active.size && envelopeTimer !== null) {
      clearInterval(envelopeTimer);
      envelopeTimer = null;
    }
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
        gain:
          job.gain ?? SLIDE_SOUNDS.find((s) => s.file === job.file)?.gain ?? 1,
        fade: !!job.fade,
        startedAt: now(),
      };
      audio.playbackRate = job.rate || 1;
      audio.preservesPitch = true;
      active.add(voice);
      if (envelopeTimer === null) {
        envelopeTimer = setInterval(balance, 30);
        envelopeTimer.unref?.();
      }
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
      for (const c of cosmetics) {
        const sound = collisionSound(c?.collision);
        if (sound.file) pool(sound.file);
      }
      pool("podium-burp-45.mp3");
    },
    slide(person, turn, speed = person.body?.speed || 0) {
      if (person.human !== true) return;
      const key = turn + ":" + (person.networkSeat ?? person.id);
      if (heard.has(key)) return;
      heard.add(key);
      enqueue({
        file: slideSound(person.cosmetics?.slide).file,
        fade: true,
        rate: 1 - 0.14 * Math.max(0, Math.min(1, (Number(speed) || 0) / 17)),
        remote: person.id !== 0,
        human: !!person.human,
        weight: person.id === 0 ? 1 : 0.65,
      });
    },
    collision(person, other, turn = 0, stamp = 0) {
      if (!person || !other) return false;
      const humans = [person, other].filter(
        (p) =>
          p?.human === true &&
          collisionSound(p.cosmetics?.collision).file &&
          (p.id === 0 || effectsSettings().others),
      );
      if (!humans.length || muted || effectsGain() === 0) return false;
      const time = now(),
        a = person?.networkSeat ?? person?.id ?? -1,
        b = other?.networkSeat ?? other?.id ?? -1;
      const pair = turn + ":" + Math.min(a, b) + ":" + Math.max(a, b);
      if (
        time - impactAt < 400 ||
        time - (impacts.get(pair) ?? -Infinity) < 900 ||
        active.size >= 3 ||
        queue.length > 1
      )
        return false;
      impacts.set(pair, time);
      impactAt = time;
      const unique = new Map(humans.map((p) => [p.networkSeat ?? p.id, p]));
      for (const human of unique.values())
        enqueue({
          file: collisionSound(human.cosmetics.collision).file,
          remote: human.id !== 0,
          human: true,
          weight: 0.55,
          gain: 0.65,
          fade: true,
        });
      return true;
    },
    burp() {
      return enqueue({
        file: "podium-burp-45.mp3",
        weight: 0.5,
        gain: 0.6,
        fade: true,
      });
    },
    bounce() {
      const time = now();
      if (time - boingAt < 100 || active.size >= 3 || queue.length > 2) return;
      boingAt = time;
      enqueue({ file: "move-spring.mp3", weight: 0.65, remote: false });
    },
    preview(id) {
      const item = [...SLIDE_SOUNDS, ...COLLISION_SOUNDS].find(
        (s) => s.id === id && !s.disabled && s.file,
      );
      if (!item || muted || !effectsGain()) return false;
      queue.length = 0;
      for (const v of active) {
        v.audio.pause();
        v.audio.dispatchEvent(new Event("ended"));
      }
      return enqueue({
        file: item.file,
        weight: 1,
        gain: item.gain ?? 0.65,
        fade: true,
        remote: false,
      });
    },
    reset() {
      heard.clear();
      impacts.clear();
      impactAt = -Infinity;
      boingAt = -Infinity;
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
