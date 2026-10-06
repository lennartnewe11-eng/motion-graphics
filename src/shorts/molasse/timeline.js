// Timeline of "Die Melasse-Flut": every narration line is placed on the musical grid.
// 128.57 BPM = one beat every 14 frames at 30 fps (0.4667 s), an eighth every 7 frames — the
// tempo of the typography reference (~129 BPM) and frame-exact at 30 fps.
import VOICE from './voice.json' with { type: 'json' };

export const FPS = 30;
export const BEAT = 14 / FPS;
export const E8 = BEAT / 2;
export const E16 = BEAT / 4;
export const snap8 = (t) => Math.ceil(t / E8 - 1e-6) * E8;
export const snapB = (t) => Math.ceil(t / BEAT - 1e-6) * BEAT;

// silence before each line (seconds, before snapping to the next eighth)
const GAP = { m01: 0, m02: 0.12, m03: 0.3, m04: 0.1, m05: 0.1, m06: 0.3, m07: 0.08, m08: 1.05, m09: 0.06,
  m10: 0.5, m11: 0.25, m12: 0.12, m13: 0.45, m14: 0.6, m15: 0.1, m16: 0.25, m17: 0.3 };
const START = 0.1; // the hook speaks almost on frame 1

export const LINES = [];
{
  let t = START;
  for (const l of VOICE) {
    const start = l.id === 'm01' ? START : snap8(t + (GAP[l.id] ?? 0.15));
    LINES.push({ ...l, t: start, end: start + l.dur });
    t = start + l.dur;
  }
}
export const L = Object.fromEntries(LINES.map((l) => [l.id, l]));
// absolute time a word is spoken (word index in the ElevenLabs alignment)
export const W_ = (id, i) => L[id].t + L[id].words[i].s;
export const WE = (id, i) => L[id].t + L[id].words[i].e;
export const DURATION = Math.ceil((L.m17.end + 1.6) * FPS) / FPS;

// Scene boundaries (each scene = one idea; hard cuts on the grid)
export const CUT = {
  hook: 0,
  sirup: snap8(L.m02.t - E8),
  boston: snap8(L.m03.t - E8 * 0.5) ,
  tank: L.m04.t,
  inside: L.m05.t,
  rattle: L.m06.t,
  rivets: L.m07.t,
  burst: snap8(L.m07.end + 0.1),
  wave: W_('m08', 0),
  crush: L.m09.t,
  deadly: L.m10.t,
  cold: L.m11.t,
  stuck: L.m12.t,
  kids: L.m13.t,
  leak: L.m14.t,
  paint: L.m15.t,
  harbor: L.m16.t,
  smell: L.m17.t,
  end: DURATION,
};
