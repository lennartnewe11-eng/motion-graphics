// Timeline of "Spaghetti": every narration line placed on the film clock, cuts on the musical grid.
// 128.57 BPM = one beat every 14 frames at 30 fps, an eighth every 7 frames (same grid as the molasses short).
import VOICE from './voice.json' with { type: 'json' };

export const FPS = 30;
export const BEAT = 14 / FPS;
export const E8 = BEAT / 2;
export const E16 = BEAT / 4;
export const snap8 = (t) => Math.ceil(t / E8 - 1e-6) * E8;
export const snapB = (t) => Math.ceil(t / BEAT - 1e-6) * BEAT;

// One continuous take (eleven_v4, evenly time-stretched — voice-lines.js). The performance is never cut
// inside: its own breaths and melody stay. Silence is only *added* between lines where the picture needs room
// (the impact before "Und sie hat überlebt", the music downbeat, the blast, the turn to her own words) —
// and only at the quietest point between two lines (`cut`, found by scripts/voice.mjs).
const EXTRA = { s03: 0.5, s07: 0.3, s09: 0.4, s12: 0.35, s14: 0.4 };
const START = 0.2; // the noodle is already spiralling in on frame 1

export const LINES = [];
export const SEGMENTS = [];
{
  let off = START, from = 0;
  for (const l of VOICE) {
    const e = EXTRA[l.id] || 0;
    if (e > 0) {
      SEGMENTS.push({ from, to: l.cut, at: from + off });
      off += e;
      from = l.cut;
    }
    const t0 = l.take + l.words[0].s + off;
    LINES.push({ ...l, t: t0, end: l.take + l.words[l.words.length - 1].e + off, words: l.words.map((w) => ({ w: w.w, s: l.take + w.s + off - t0, e: l.take + w.e + off - t0 })) });
  }
  const last = VOICE[VOICE.length - 1];
  SEGMENTS.push({ from, to: last.take + last.dur + 0.4, at: from + off });
}
export const L = Object.fromEntries(LINES.map((l) => [l.id, l]));
export const W_ = (id, i) => L[id].t + L[id].words[i].s;
export const WE = (id, i) => L[id].t + L[id].words[i].e;
export const DURATION = Math.ceil((L.s14.end + 1.6) * FPS) / FPS;

export const CUT = {
  hook: 0,
  name: L.s02.t,
  feet: snap8(L.s03.t - E8),        // music downbeat
  tide: L.s04.t,
  closer: L.s05.t,
  stretch: L.s06.t,
  paste: L.s07.t,
  atoms: L.s08.t,
  absurd: L.s09.t,
  small: L.s10.t,
  giant: L.s11.t,
  outside: L.s12.t,
  freeze: L.s13.t,
  star: L.s14.t,
  end: DURATION,
};
