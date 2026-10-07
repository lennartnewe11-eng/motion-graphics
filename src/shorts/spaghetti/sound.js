// Sound design of "Spaghetti" — every cue belongs to a picture event: chalk for every drawn line, rubber for every
// stretch, the black hole's drone under everything, a slurp where it is absurd. Shared foley copied from earlier films.
import INDEX from '../../../assets/spaghetti/sfx/index.json' with { type: 'json' };
import { foley } from '../lib/sound.js';
import { L, W_, WE, CUT, DURATION } from './timeline.js';

export function cues() {
  const { sfx, synth, cues: out } = foley('spaghetti', INDEX);
  const paper = (t, g = 0.2, pan = 0) => sfx('paper', t, { gain: g, pan, hp: 200 });
  const chalk = (t, g = 0.2, pan = 0) => sfx('chalk', t, { gain: g, pan, semis: 1 });
  const pop = (t, g = 0.1, pitch = 1) => synth('pop', t, { gain: g, pitch });
  const drone = (t, dur, g = 0.2, o = {}) => sfx('bh_drone', t, { gain: g, dur, fadeIn: 0.3, fadeOut: 0.4, semis: 0, lp: 1800, variant: 0, ...o });

  // ------------------------------------------------------------------ 1 · HOOK (no music)
  const w1 = (i) => W_('s01', i);
  drone(0, CUT.name + 0.2, 0.26, { fadeIn: 0.02, lead: 0 });
  sfx('warp', 0, { gain: 0.2, lead: 0, semis: 0, lp: 3000 });
  paper(w1(4), 0.2);
  sfx('stretch', w1(10) + 0.1, { gain: 0.22, rate: 1.1 });
  [0, 0.12, 0.24].forEach((d, i) => chalk(w1(10) + d, 0.22, 0.4));
  sfx('slurp', w1(10) + 0.45, { gain: 0.3, semis: 0, pan: 0.3 });

  // ------------------------------------------------------------------ 2 · NAME
  const w2 = (i) => W_('s02', i);
  sfx('whoosh', CUT.name - 0.05, { gain: 0.28, lp: 3000 });
  paper(w2(0), 0.26, -0.2);
  sfx('stretch', w2(6), { gain: 0.3, rate: 0.85 });
  sfx('warp', w2(6) + 0.3, { gain: 0.24, semis: 0, lp: 3000, dur: CUT.feet - w2(6) - 0.3, fadeOut: 0.2 });
  drone(CUT.name, CUT.feet - CUT.name, 0.14, { offset: 2 });

  // ------------------------------------------------------------------ 3 · FEET, 4 · TIDE, 5 · CLOSER
  const w3 = (i) => W_('s03', i), w4 = (i) => W_('s04', i), w5 = (i) => W_('s05', i);
  for (let i = 0; i < 6; i++) chalk(w3(0) + i * 0.22, 0.14, (i % 2 ? 0.3 : -0.3));
  sfx('whoosh', w3(4), { gain: 0.2, rate: 0.8, lp: 3000 });
  chalk(w3(7), 0.24, 0.3); paper(w3(7), 0.2, 0.2);
  drone(CUT.feet, CUT.stretch - CUT.feet, 0.12, { offset: 4 });
  [w4(1), w4(5), w4(9)].forEach((t, i) => { chalk(t, 0.24, -0.3); chalk(t + 0.15, 0.18, -0.3); });
  sfx('stretch', w4(6), { gain: 0.24 });
  sfx('warp', CUT.closer, { gain: 0.3, semis: 0, lp: 3000, dur: CUT.stretch - CUT.closer, fadeIn: 0.4, fadeOut: 0.3, rate: 0.8 });
  paper(w5(9), 0.22);

  // ------------------------------------------------------------------ 6 · STRETCH, 7 · PASTE
  const w6 = (i) => W_('s06', i), w7 = (i) => W_('s07', i);
  sfx('stretch', w6(5), { gain: 0.16, rate: 1.2, dur: 0.6, fadeOut: 0.2 });
  paper(w6(5), 0.18);
  sfx('stretch', w6(7), { gain: 0.32, rate: 0.75 });
  sfx('stretch', w6(11), { gain: 0.3, rate: 0.65 });
  for (let i = 0; i < 6; i++) chalk(w6(13) + i * 0.1, 0.18, i % 2 ? 0.5 : -0.5);
  sfx('squish', w6(17), { gain: 0.28, rate: 0.8 });
  chalk(CUT.paste, 0.22); chalk(CUT.paste + 0.15, 0.2);
  sfx('squish', w7(1), { gain: 0.42 }); sfx('squish', w7(1) + 0.45, { gain: 0.36 });

  // ------------------------------------------------------------------ 8 · ATOMS
  const w8 = (i) => W_('s08', i);
  drone(CUT.atoms, CUT.absurd - CUT.atoms, 0.2, { offset: 1 });
  sfx('dissolve', w8(7), { gain: 0.3, semis: 0 });
  sfx('dissolve', w8(10) + 0.2, { gain: 0.34, semis: 0, pan: 0.2 });
  sfx('suck', w8(10) + 0.3, { gain: 0.42, semis: 0 });

  // ------------------------------------------------------------------ 9 · ABSURD, 10 · SMALL
  const w9 = (i) => W_('s09', i), w10 = (i) => W_('s10', i);
  sfx('warp', CUT.absurd, { gain: 0.32, semis: 0, lp: 3000, rate: 0.7 });
  paper(w9(1), 0.24, -0.2);
  chalk(w9(3), 0.2, -0.4); chalk(w9(3) + 0.2, 0.2, 0.4);
  pop(w9(3), 0.1, 0.8); pop(w9(8), 0.08, 1.3);
  chalk(w10(1), 0.18);
  sfx('tear', w10(2) + 0.05, { gain: 0.4, semis: 0 });
  chalk(w10(4), 0.22, 0.3);

  // ------------------------------------------------------------------ 11 · GIANT, 12 · OUTSIDE
  const w11 = (i) => W_('s11', i), w12 = (i) => W_('s12', i);
  sfx('space', CUT.giant, { gain: 0.22, dur: CUT.outside - CUT.giant, fadeIn: 0.4, fadeOut: 0.3, semis: 0 });
  paper(w11(2), 0.22, 0.3);
  chalk(w11(5), 0.24); chalk(w11(6), 0.2);
  sfx('warp', CUT.outside - 0.05, { gain: 0.32, semis: 0, lp: 3000, rate: 1.2 });
  for (let i = 0; i < 3; i++) chalk(CUT.outside + 0.1 + i * 0.18, 0.2, -0.3);
  paper(w12(5), 0.22);

  // ------------------------------------------------------------------ 13 · FREEZE: the clock runs down
  const w13 = (i) => W_('s13', i);
  drone(CUT.freeze, CUT.star - CUT.freeze, 0.14, { offset: 3 });
  chalk(CUT.freeze, 0.2, 0.4);
  for (let t = CUT.freeze + 0.2, dt = 0.4; t < W_('s13', 12); t += dt) {
    sfx('clock', t, { gain: 0.18, semis: 0, pan: 0.4, rate: t > w13(7) ? 0.85 : 1 });
    if (t > w13(7)) dt *= 1.28;
  }
  sfx('tapestop', w13(12) - 0.1, { gain: 0.18, semis: 0, lp: 2500 });

  // ------------------------------------------------------------------ 14 · STAR (+ loop)
  const w14 = (i) => W_('s14', i);
  sfx('flap', w14(0) - 0.1, { gain: 0.22, dur: 0.5, fadeOut: 0.05 });
  for (let i = 0; i < 34; i += 2) sfx('typewriter', w14(5) + 0.2 + i / 60, { gain: 0.07, semis: 0.8, pan: (i / 34 - 0.5) * 0.4 });
  synth('counter', w14(8), { gain: 0.14 });
  sfx('stretch', w14(12), { gain: 0.3, rate: 0.7 });
  sfx('tear', w14(12) + 0.6, { gain: 0.13, semis: 0, rate: 0.8, lp: 2500 });
  sfx('slurp', w14(14) + 0.25, { gain: 0.32, semis: 0 });
  drone(DURATION - 0.5, 0.5, 0.26, { fadeIn: 0.02, fadeOut: 0.02, lead: 0 });
  sfx('warp', DURATION - 0.5, { gain: 0.2, lead: 0, semis: 0, lp: 3000, dur: 0.5 });
  return out;
}
