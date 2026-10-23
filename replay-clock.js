// A recording must start at frame zero, even when transfer/decoding took longer
// than its server lead-in. Long render tasks pause playback instead of skipping it.
export class ReplayClock {
  constructor() {
    this.started = false;
    this.elapsed = 0;
    this.last = 0;
    this.stalls = 0;
  }
  sample(now, complete, scheduled = now) {
    if (!complete) return null;
    if (!this.started) {
      this.started = true;
      this.last = Math.max(now, scheduled);
      return 0;
    }
    const delta = Math.max(0, now - this.last);
    this.last = Math.max(this.last, now);
    if (delta > 100) this.stalls++;
    this.elapsed += Math.min(delta, 100);
    return this.elapsed;
  }
}
