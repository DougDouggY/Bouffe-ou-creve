#!/usr/bin/env python3
"""Original 8-bar, 84 BPM lounge loop. Python 3 + ffmpeg; no third-party samples."""
from array import array
from pathlib import Path
import math
import random
import subprocess
import tempfile
import wave

RATE = 22050
BEAT = 60 / 84
LENGTH = round(32 * BEAT * RATE)
track = array('d', [0]) * LENGTH
rng = random.Random(20261022)


def note(beat, midi, gain, duration=1.3, kind='pluck'):
    frequency = 440 * 2 ** ((midi - 69) / 12)
    start = round(beat * BEAT * RATE)
    for index in range(round(duration * RATE)):
        t = index / RATE
        attack = min(1, t / (0.025 if kind == 'bass' else 0.009))
        release = min(1, (duration - t) / 0.12)
        phase = 2 * math.pi * frequency * t
        if kind == 'bass':
            sound = math.sin(phase) + 0.12 * math.sin(2 * phase)
            envelope = math.exp(-t * 2.5)
        else:
            # Rounded marimba/pizzicato timbre: harmonics fade before the fundamental.
            sound = math.sin(phase) + 0.28 * math.sin(2 * phase) * math.exp(-t * 8) + 0.09 * math.sin(3 * phase) * math.exp(-t * 12)
            envelope = math.exp(-t * (4.4 if kind == 'chord' else 3.0))
        track[(start + index) % LENGTH] += gain * sound * envelope * attack * release


chords = [
    (36, [60, 64, 67, 71]), (33, [57, 60, 64, 67]),
    (38, [62, 65, 69, 72]), (31, [55, 59, 62, 64]),
    (40, [59, 64, 67, 71]), (33, [57, 60, 64, 67]),
    (29, [57, 60, 64, 65]), (31, [55, 59, 62, 65]),
]
melodies = [
    [(0, 76), (1, 79), (2.5, 81), (3.5, 79)],
    [(0.5, 76), (2, 74), (3, 72)],
    [(0, 74), (1.5, 77), (2.5, 81), (3.5, 79)],
    [(0.5, 74), (1.5, 71), (3, 72)],
    [(0, 76), (1, 79), (2.5, 81), (3, 79)],
    [(0.5, 76), (1.5, 72), (3, 69)],
    [(0, 77), (1, 81), (2.5, 79), (3.5, 76)],
    [(0.5, 74), (2, 71), (3, 67)],
]
for bar, ((bass, chord), melody) in enumerate(zip(chords, melodies)):
    for beat, pitch in [(0, bass), (2, bass + 7)]:
        note(bar * 4 + beat, pitch, 0.11, 1.5, 'bass')
    for index, beat in enumerate([0.5, 1.5, 2.5, 3.25]):
        for voice in [chord[index % 4], chord[(index + 2) % 4]]:
            note(bar * 4 + beat, voice, 0.035, 0.7, 'chord')
    for beat, pitch in melody:
        note(bar * 4 + beat, pitch, 0.065, 1.1)
    for beat in [0.5, 1.5, 2.5, 3.5]:
        start = round((bar * 4 + beat) * BEAT * RATE)
        last = 0
        for index in range(round(0.065 * RATE)):
            t = index / RATE
            noise = rng.uniform(-1, 1)
            last += (noise - last) * 0.35
            track[(start + index) % LENGTH] += last * 0.014 * math.sin(math.pi * t / 0.065) ** 2

peak = max(abs(value) for value in track)
scale = 0.65 / peak
pcm = array('h', [round(max(-1, min(1, sample * scale)) * 32767) for sample in track])
root = Path(__file__).resolve().parent.parent
with tempfile.TemporaryDirectory(prefix='bouffe-music-') as directory:
    wav_path = Path(directory) / 'ambience.wav'
    with wave.open(str(wav_path), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(wav_path), '-codec:a', 'libmp3lame', '-q:a', '4', '-metadata', 'title=Le petit buffet', str(root / 'assets' / 'ambiance-douce.mp3')], check=True)
print(f'Original loop: {LENGTH / RATE:.2f}s, peak {peak * scale:.2f}, seam delta {abs(track[-1] - track[0]) * scale:.5f}')
