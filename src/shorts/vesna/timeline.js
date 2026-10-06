// Timeline of "Vesna": every narration line placed on the film clock, cuts on the musical grid.
// 128.57 BPM = one beat every 14 frames at 30 fps, an eighth every 7 frames (same grid as the molasses short).
import VOICE from './voice.json' with { type: 'json' };

export const FPS = 30;
export const BEAT = 14 / FPS;
export const E8 = BEAT / 2;
export const E16 = BEAT / 4;
export const snap8 = (t) => Math.ceil(t / E8 - 1e-6) * E8;
export const snapB = (t) => Math.ceil(t / BEAT - 1e-6) * BEAT;

// One continuous take (voice-lines.js: ONE_TAKE). Long breaths trimmed to SENT_GAP (in a line) / LINE_GAP (between
// lines); EXTRA adds silence where the picture needs room: the impact before "Und sie hat überlebt", the downbeat
// that starts the music, the explosion, the 27, the snow, the coma, the record.
const SENT_GAP = 0.2, LINE_GAP = 0.24;
const EXTRA = { v03: 0.6, v04: 0.3, v08: 0.15, v11: 0.1, v12: 0.15, v15: 0.15, v16: 0.2 };
const KEEP = new Set([]);
const EXTRA_WORD = { 'v09:5': 0.2, 'v16:8': 0.15 }; // "…Siebenundzwanzig", "Hätte ich…"
const START = 0.45; // the plane is already falling before the first word

export const LINES = [];
export const SEGMENTS = [];
{
  let out = START, prevE = null, seg = null;
  for (const l of VOICE) {
    const words = [];
    l.words.forEach((w, i) => {
      const s = l.take + w.s, e = l.take + w.e;
      if (prevE === null) { seg = { from: s - 0.05, at: out - 0.05 }; }
      else {
        const gap = s - prevE;
        const keep = KEEP.has(`${l.id}:${i}`);
        const allowed = (keep ? gap : Math.min(gap, i === 0 ? LINE_GAP : SENT_GAP) + (i === 0 ? EXTRA[l.id] || 0 : 0)) + (EXTRA_WORD[`${l.id}:${i}`] || 0);
        if (Math.abs(allowed - gap) > 0.005) {
          const tail = Math.min(gap / 2, 0.08), head = Math.min(gap / 2, 0.06);
          SEGMENTS.push({ ...seg, to: prevE + tail });
          seg = { from: s - head, at: out + allowed - head };
        }
        out += allowed;
      }
      words.push({ w: w.w, s: out, e: out + (e - s) });
      out += e - s;
      prevE = e;
    });
    const t0 = words[0].s;
    LINES.push({ ...l, t: t0, end: words[words.length - 1].e, words: words.map((w) => ({ w: w.w, s: w.s - t0, e: w.e - t0 })) });
  }
  SEGMENTS.push({ ...seg, to: prevE + 0.4 });
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
