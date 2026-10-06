// Edit grid of the Assecor film. The score (ElevenLabs Music, 120 BPM) has its beat grid at
// 0.05 + n * 0.5 s: intro 0–8, kick from 8, full groove 16–38, breakdown 38–48, drop 48–56, final hit 56.
// Every narration line is placed so its key word lands on a beat or a section change.
import VOICE_RAW from './voice.json' with { type: 'json' };

export const FPS = 25;
export const DURATION = 64;
export const GRID = 0.05; // first downbeat offset of the music
export const BEAT = 0.5;
export const beat = (n) => GRID + n * BEAT; // n-th beat
export const bar = (n) => GRID + n * 2; // n-th bar

// line start times (seconds)
export const LINE_T = {
  a01: 2.6, // "Digitalisierung verändert die Welt."
  a02: 5.63, // "… Ihr Geschäft." -> "Geschäft" on the kick entry at 8.05
  a03: 9.4, // "… echten Mehrwert?" -> "Mehrwert" on 12.05
  a04: 16.05, // "KI," on the full groove
  a05: 20.05, // "Software,"
  a06: 24.05, // "Und Transformation,"
  a07: 27.65, // "Von der Idee …"
  a08: 32.3, // "Seit über zwanzig Jahren …"
  a09: 41.3, // "Für den Mittelstand …" (breakdown)
  a10: 48.05, // "Skalierbar." on the drop
  a11: 53.67, // "… entfaltet" on the final hit at 56.05
  a12: 57.75, // "Assecor. …"
};

export const VOICE = VOICE_RAW.map((l) => ({ ...l, t: LINE_T[l.id] }));
export const line = (id) => VOICE.find((l) => l.id === id);
// absolute time word i of a line is spoken
export const wt = (id, i) => { const l = line(id); return l.t + l.words[Math.min(i, l.words.length - 1)].s; };
export const we = (id, i) => { const l = line(id); return l.t + l.words[Math.min(i, l.words.length - 1)].e; };
export const lineEnd = (id) => { const l = line(id); return l.t + l.dur; };
