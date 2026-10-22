#!/usr/bin/env python3
"""Three original, sample-free restaurant music loops. Requires Python 3 and FFmpeg."""
from array import array
from pathlib import Path
import math
import random
import subprocess
import tempfile
import wave

RATE = 22050
ROOT = Path(__file__).resolve().parent.parent


def render(name, title, tempo, meter, instrument, roots, chords, phrases):
    beat = 60 / tempo
    length = round(8 * meter * beat * RATE)
    track = array('d', [0]) * length
    rng = random.Random(name)

    def note(at, midi, gain, duration, voice=instrument):
        frequency = 440 * 2 ** ((midi - 69) / 12)
        start = round(at * beat * RATE)
        period = max(2, round(RATE / frequency))
        string = [rng.uniform(-1, 1) for _ in range(period)] if voice == 'guitar' else None
        for index in range(round(duration * RATE)):
            t = index / RATE
            phase = 2 * math.pi * frequency * t
            attack = min(1, t / (0.025 if voice in ['bass', 'pad'] else 0.008))
            release = min(1, (duration - t) / 0.12)
            if voice == 'guitar':
                slot = index % period
                sound = string[slot]
                string[slot] = (sound + string[(slot + 1) % period]) * 0.497
                envelope = math.exp(-t * 0.7)
            elif voice == 'piano':
                sound = math.sin(phase) + 0.35 * math.sin(phase * 2.001) * math.exp(-t * 3) + 0.16 * math.sin(phase * 3.003) * math.exp(-t * 5)
                envelope = math.exp(-t * 2.6)
            elif voice == 'bell':
                sound = math.sin(phase) + 0.19 * math.sin(phase * 2.76) * math.exp(-t * 4) + 0.055 * math.sin(phase * 5.4) * math.exp(-t * 7)
                envelope = math.exp(-t * 2.0)
            elif voice == 'pad':
                sound = (math.sin(phase) + 0.3 * math.sin(phase * 1.002)) * min(1, t / 0.18)
                envelope = math.exp(-t * 0.65)
            else:
                sound = math.sin(phase) + 0.1 * math.sin(phase * 2)
                envelope = math.exp(-t * 2.0)
            track[(start + index) % length] += gain * sound * envelope * attack * release

    for bar in range(8):
        offset = bar * meter
        if instrument == 'piano':
            for step in range(4):
                note(offset + step, roots[bar] + [0, 7, 12, 7][step], .095, .8, 'bass')
            for step in [0.65, 2.65]:
                for voice, pitch in enumerate(chords[bar]):
                    note(offset + step + voice * .025, pitch, .035, 1.1)
        elif instrument == 'guitar':
            note(offset, roots[bar], .10, 1.0, 'bass')
            note(offset + 2, roots[bar] + 7, .07, .8, 'bass')
            for step in [0, 1.5, 2.5, 3.5]:
                for voice, pitch in enumerate(chords[bar]):
                    note(offset + step + voice * .035, pitch, .17, .9)
        else:
            note(offset, roots[bar], .075, 2.0, 'bass')
            for step in [1, 2]:
                for pitch in chords[bar]:
                    note(offset + step, pitch, .027, 1.7, 'pad')
        for step, pitch in phrases[bar]:
            swing = .12 if instrument == 'piano' and step % 1 == .5 else 0
            note(offset + step + swing, pitch, .14 if instrument == 'guitar' else .055, 1.3)
        if instrument != 'bell':
            for step in [.65, 1.65, 2.65, 3.65] if instrument == 'piano' else [.5, 1.5, 2.5, 3.5]:
                start = round((offset + step) * beat * RATE)
                last = 0
                for index in range(round(.08 * RATE)):
                    t = index / RATE
                    last += (rng.uniform(-1, 1) - last) * .3
                    track[(start + index) % length] += last * .01 * math.sin(math.pi * t / .08) ** 2
    peak = max(abs(value) for value in track)
    gain = .65 / peak
    pcm = array('h', [round(sample * gain * 32767) for sample in track])
    with tempfile.TemporaryDirectory(prefix='bouffe-music-') as directory:
        path = Path(directory) / 'loop.wav'
        with wave.open(str(path), 'wb') as output:
            output.setnchannels(1)
            output.setsampwidth(2)
            output.setframerate(RATE)
            output.writeframes(pcm.tobytes())
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(path), '-codec:a', 'libmp3lame', '-q:a', '4', '-metadata', 'title=' + title, str(ROOT / 'assets' / (name + '.mp3'))], check=True)
    print(f'{title}: {length / RATE:.2f}s, {tempo} BPM, {instrument}', flush=True)


render('music-bistrot', 'Bistrot tranquille', 88, 4, 'piano',
       [38, 43, 36, 33, 38, 43, 36, 43],
       [[60,65,69,72], [59,64,67,71], [60,64,67,71], [60,64,67,72]] * 2,
       [[(0,69),(1.5,72),(2.5,76),(3.5,74)], [(0.5,71),(2,67),(3,69)],
        [(0,67),(1,72),(2.5,71),(3.5,67)], [(0.5,64),(1.5,67),(3,69)],
        [(0,72),(1.5,74),(2.5,77)], [(0.5,76),(1.5,74),(3,71)],
        [(0,72),(1,67),(2.5,64)], [(0.5,67),(2,71),(3.5,72)]])
render('music-balade', 'Balade gourmande', 104, 4, 'guitar',
       [43, 38, 40, 36, 43, 38, 36, 38],
       [[55,59,62,67], [57,62,66,69], [55,59,64,67], [55,60,64,67]] * 2,
       [[(0,71),(0.75,74),(1.5,76),(2.5,74)], [(0.5,69),(1.5,66),(3,69)],
        [(0,67),(1,71),(2,74),(3.5,71)], [(0.5,72),(2,71),(3,67)],
        [(0,74),(1,76),(2.5,79),(3.5,76)], [(0.5,74),(1.5,69),(3,66)],
        [(0,67),(1,72),(2.5,71)], [(0.5,69),(2,66),(3,67)]])
render('music-nuage', 'Nuage sucre', 70, 3, 'bell',
       [41, 36, 38, 34, 41, 33, 34, 36],
       [[60,65,69], [60,64,67], [62,65,69], [58,62,65], [60,65,69], [57,60,64], [58,62,65], [60,64,67]],
       [[(0,77),(2,76)], [(0,72),(1.5,74)], [(0,77),(1,81),(2,79)], [(0,77),(2,74)],
        [(0,72),(1.5,77)], [(0,76),(2,72)], [(0,74),(1,77),(2,74)], [(0,72),(2,69)]])
