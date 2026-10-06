// Foley cue builder (style guide §4): round-robin variants, never the same take twice in a row,
// per-hit variation of pitch, level, start offset and pan; cues start 10–20 ms before the picture.
import { rng } from '../../engine/core.js';

export function foley(film, index) {
  const r = rng(4242);
  const last = new Map();
  const history = [];
  const cues = [];
  const base = `/assets/${film}/sfx/`;
  // s: sample id, t: picture time, o: { gain, pan, rate, semis (pitch spread), rev, lead, dur, variant, lp, hp, fadeIn, fadeOut, offset }
  function sfx(s, t, o = {}) {
    const list = index[s];
    if (!list || !list.length) { console.warn('no foley', s); return; }
    let k;
    if (o.variant !== undefined) k = o.variant % list.length;
    else {
      // avoid repeating the previous take and limit any take to 3 uses per 10 s
      for (let tries = 0; tries < 12; tries++) {
        k = Math.floor(r() * list.length);
        const used = history.filter((h) => h.f === list[k] && Math.abs(h.t - t) < 10).length;
        if ((list.length === 1 || k !== last.get(s)) && (used < 3 || list.length < 3)) break;
      }
    }
    last.set(s, k);
    history.push({ f: list[k], t });
    const semis = o.semis ?? 1.5;
    const rate = (o.rate ?? 1) * Math.pow(2, ((r() * 2 - 1) * semis) / 12);
    const gainDb = (r() * 2 - 1) * 2;
    cues.push({
      t: Math.max(0, t - (o.lead ?? 0.015) + r() * 0.012),
      url: base + list[k],
      gain: (o.gain ?? 0.5) * Math.pow(10, gainDb / 20),
      pan: (o.pan ?? 0) + (r() * 2 - 1) * 0.12,
      rate,
      rev: o.rev ?? 0.05,
      dur: o.dur, lp: o.lp, hp: o.hp, fadeIn: o.fadeIn, fadeOut: o.fadeOut, offset: o.offset,
    });
  }
  // synthesized cue (engine kit) passthrough
  const synth = (type, t, o = {}) => cues.push({ t, type, gain: 0.5, ...o });
  return { sfx, synth, cues };
}
