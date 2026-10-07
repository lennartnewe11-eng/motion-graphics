// Timeline of "Vesna": every narration line placed on the film clock, cuts on the musical grid.
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
const EXTRA = { v03: 0.75, v04: 0.35, v08: 0.3, v16: 0.25 };
const START = 0.45; // the plane is already falling before the first word

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
export const DURATION = Math.ceil((L.v16.end + 1.8) * FPS) / FPS;

// the impact: the fuselage hits the snow right after "Fallschirm" — then silence and black
export const IMPACT = WE('v02', 1) + 0.12;

export const CUT = {
  fall: 0,
  black: IMPACT,
  flight: snap8(L.v04.t - E8),       // music downbeat
  board: L.v05.t,
  roster: L.v06.t,
  bomb: L.v07.t,
  breakup: L.v08.t,
  count: L.v09.t,
  wedged: L.v10.t,
  slope: L.v11.t,
  honke: L.v12.t,
  injuries: L.v13.t,
  coma: L.v14.t,
  record: L.v15.t,
  quote: L.v16.t,
  end: DURATION,
};
