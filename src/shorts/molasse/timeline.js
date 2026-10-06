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

// The narration is one continuous take (voice-lines.js: ONE_TAKE) — breath and melody flow across lines.
// Like an editor, long breaths are trimmed: pauses inside a line to SENT_GAP, between lines to LINE_GAP;
// EXTRA then adds silence where the picture needs it (the burst, the turn to grief, the cause).
// The result: LINES (word timings on the film clock) and SEGMENTS (slices of the take placed on the film clock).
const SENT_GAP = 0.26, LINE_GAP = 0.3;
const EXTRA = { m03: 0.12, m08: 0.85, m10: 0.25, m13: 0.2, m14: 0.3, m17: 0.15 };
// the dramatic pause in the hook ("Und sie bestand aus … Sirup.") and before "süß" stay untouched
const KEEP = new Set(['m02:5', 'm17:11']);
const EXTRA_WORD = { 'm17:11': 0.4 }; // let the last word land
const START = 0.1; // the hook speaks almost on frame 1

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
          // cut: close the running slice shortly after the last word, open a new one shortly before this word
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
