// Timeline of "Yamaguchi": every narration line placed on the film clock, cuts on the musical grid.
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
const EXTRA = { y03: 0.2, y04: 0.45, y07: 0.4, y13: 0.45 };
const START = 0.3; // the cloud is already rising behind him before the first word

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
export const DURATION = Math.ceil((L.y15.end + 1.6) * FPS) / FPS;

// the two flashes: on "Blitz" (y06) in Hiroshima and on "weiß" (y12) in Nagasaki; the hook's second flash on "Nagasaki"
export const FLASH1 = W_('y06', 6);
export const FLASH2 = W_('y12', 5) - 0.05;
export const HOOKFLASH = W_('y03', 1) + 0.05;

export const CUT = {
  hook: 0,
  trip: snap8(L.y04.t - E8),        // music downbeat
  last: L.y05.t,
  flash: L.y06.t,
  burn: L.y07.t,
  shelter: L.y08.t,
  office: L.y09.t,
  boss: L.y10.t,
  crazy: L.y11.t,
  white: L.y12.t,
  again: L.y13.t,
  recog: L.y14.t,
  end93: L.y15.t,
  end: DURATION,
};
