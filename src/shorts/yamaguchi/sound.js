// Sound design of "Yamaguchi" — every cue belongs to a picture event. Recorded foley (ElevenLabs, round-robin
// variants; shared material copied from "Vesna"), synthesised accents for the graphic layer. Silence is an event:
// the cicadas stop dead at the first flash, the office goes quiet before the second.
import INDEX from '../../../assets/yamaguchi/sfx/index.json' with { type: 'json' };
import { foley } from '../lib/sound.js';
import { L, W_, WE, CUT, DURATION, HOOKFLASH, FLASH1, FLASH2 } from './timeline.js';

export function cues() {
  const { sfx, synth, cues: out } = foley('yamaguchi', INDEX);
  const paper = (t, g = 0.2, pan = 0) => sfx('paper', t, { gain: g, pan, hp: 200 });
  const pop = (t, g = 0.1, pitch = 1) => synth('pop', t, { gain: g, pitch });
  const typeOut = (t0, n, cps, g = 0.1, pan = 0) => { for (let i = 0; i < n; i += 2) sfx('typewriter', t0 + i / cps, { gain: g, pan: pan + (i / n - 0.5) * 0.4, semis: 0.8 }); };
  const flaps = (t, n, g = 0.16, pan = 0) => sfx('flap', t, { gain: g + n * 0.008, pan, dur: Math.min(0.6, 0.12 + n * 0.05), fadeOut: 0.05 });
  const blast = (t, g, o = {}) => { sfx('blast_far', t, { gain: g, lead: 0, semis: 0, rev: 0.2, lp: 3000, ...o }); synth('impact', t, { gain: g, big: true }); };

  // ------------------------------------------------------------------ 1 · HOOK (no music)
  const w1 = (i) => W_('y01', i), w2 = (i) => W_('y02', i), w3 = (i) => W_('y03', i);
  sfx('blast_far', 0, { gain: 0.32, offset: 0.9, dur: L.y02.t, lead: 0, semis: 0, lp: 1800, fadeOut: 0.03 });
  sfx('rumble', 0, { gain: 0.2, dur: L.y02.t, lead: 0, semis: 0, fadeOut: 0.03 });
  sfx('marker', w1(1) + 0.05, { gain: 0.25, variant: 4 });
  paper(w1(4), 0.18, 0.3); paper(w1(6), 0.24, 0); pop(w1(7), 0.1, 0.9);
  // the train: hard cut on "Dann"
  sfx('train_pass', L.y02.t - 0.05, { gain: 0.3, dur: HOOKFLASH - L.y02.t + 0.05, lead: 0, semis: 0, lp: 3000, fadeOut: 0.03 });
  flaps(L.y02.t - 0.3, 9, 0.14);
  flaps(w3(1) - 0.5, 8, 0.18);
  paper(w2(3), 0.2, 0);
  // Nagasaki
  blast(HOOKFLASH, 0.7);
  sfx('rumble', HOOKFLASH + 0.2, { gain: 0.22, dur: CUT.trip - HOOKFLASH - 0.2, semis: 0, fadeOut: 0.4 });

  // ------------------------------------------------------------------ 2 · TRIP
  const w4 = (i) => W_('y04', i), t2 = CUT.trip;
  flaps(w4(0), 2); flaps(w4(1), 3, 0.16, 0.2); flaps(w4(2), 4, 0.16, 0.3);
  typeOut(t2 + 0.1, 36, 70, 0.08, -0.2);
  typeOut(t2 + 0.55, 18, 45, 0.1);
  [[w4(3), 18], [w4(5), 2], [w4(6), 16], [w4(8), 10], [w4(13), 9]].forEach(([t, n], i) => typeOut(t, n, 34, 0.1, 0.2 - i * 0.08));
  sfx('stamp', w4(13) + 0.05, { gain: 0.5, rate: 0.9, rev: 0.12 });
  pop(w4(3), 0.08); pop(w4(5), 0.12, 0.8);

  // ------------------------------------------------------------------ 3 · LAST (summer morning) + 4 · FLASH
  const w5 = (i) => W_('y05', i), w6 = (i) => W_('y06', i);
  sfx('cicadas', CUT.last, { gain: 0.24, dur: FLASH1 - CUT.last, fadeIn: 0.3, fadeOut: 0.01, semis: 0, lead: 0 });
  paper(w5(3), 0.2);
  for (let t = w5(5) - 0.2, i = 0; t < FLASH1 - 0.1; t += 0.5, i++) sfx('clock', t, { gain: 0.16, semis: 0.3, pan: i % 2 ? 0.2 : -0.2 });
  flaps(w5(5) - 0.2, 5, 0.2); flaps(w5(7) - 0.05, 5, 0.22);
  sfx('marker', w6(0), { gain: 0.25, variant: 1 });
  paper(w6(0), 0.18, -0.3);
  blast(FLASH1, 0.85);
  sfx('glass', FLASH1 + 0.25, { gain: 0.2, semis: 0, pan: 0.3 });

  // ------------------------------------------------------------------ 5 · BURN (ringing ears)
  const w7 = (i) => W_('y07', i);
  sfx('tinnitus', FLASH1 + 0.7, { gain: 0.08, dur: CUT.shelter - FLASH1 - 0.7, fadeIn: 0.6, fadeOut: 0.5, semis: 0, hp: 2000 });
  sfx('ash_wind', CUT.burn, { gain: 0.14, dur: CUT.shelter - CUT.burn, fadeIn: 0.3, fadeOut: 0.3, semis: 0, lp: 2400 });
  sfx('marker', w7(1), { gain: 0.2, variant: 1 });
  sfx('fire', w7(3) - 0.05, { gain: 0.3, semis: 0 });
  paper(w7(3), 0.2);
  [w7(6), w7(6) + 0.12].forEach((t, i) => sfx('crack', t, { gain: 0.35, pan: i ? 0.5 : -0.5, rev: 0.15 }));
  sfx('whoosh', w7(9) - 0.1, { gain: 0.25, rate: 0.6, lp: 3000 });

  // ------------------------------------------------------------------ 6 · SHELTER, the train home
  const w8 = (i) => W_('y08', i), td = w8(7);
  sfx('shelter', CUT.shelter, { gain: 0.24, dur: td - CUT.shelter, fadeIn: 0.3, fadeOut: 0.4, semis: 0 });
  synth('drop', w8(6) + 0.25, { gain: 0.12 });
  sfx('train_steam', td - 0.1, { gain: 0.11, dur: CUT.office - td + 0.2, fadeIn: 0.3, fadeOut: 0.3, semis: 0, lp: 2000 });
  flaps(w8(10), 9, 0.14, -0.2); flaps(w8(13) - 0.1, 8, 0.16, 0.2);
  paper(w8(14), 0.22);

  // ------------------------------------------------------------------ 7 · OFFICE, 8 · BOSS, 9 · CRAZY
  const w9 = (i) => W_('y09', i), w10 = (i) => W_('y10', i), w11 = (i) => W_('y11', i);
  sfx('office', CUT.office, { gain: 0.16, dur: CUT.white - CUT.office, fadeIn: 0.3, fadeOut: 0.1, semis: 0 });
  flaps(w9(0), 2); flaps(w9(1), 3, 0.16, 0.2); flaps(w9(1) + 0.1, 4, 0.16, 0.3);
  [0, 0.12, 0.24].forEach((d, i) => sfx('bandage', w9(3) + d, { gain: 0.3, pan: (i - 1) * 0.3 }));
  paper(w9(13), 0.22, -0.2);
  pop(w10(4), 0.08); pop(w10(6), 0.14, 0.75);
  synth('impact', w10(6), { gain: 0.2 });
  [0, 0.06, 0.12, 0.18, 0.24].forEach((d, i) => sfx('crack', w10(11) + 0.1 + d, { gain: 0.14, rate: 1.4, pan: (i - 2) * 0.25 }));
  sfx('debris', w10(11) + 0.15, { gain: 0.14, semis: 0, dur: 1.2, fadeOut: 0.5 });
  synth('glitch', w11(5), { gain: 0.12 });
  sfx('marker', w11(5) + 0.2, { gain: 0.3, variant: 2 });

  // ------------------------------------------------------------------ 10 · WHITE: 11:02
  const w12 = (i) => W_('y12', i);
  sfx('office', CUT.white, { gain: 0.1, dur: FLASH2 - CUT.white, offset: 3, fadeOut: 0.01, semis: 0, lead: 0 });
  flaps(w12(0) - 0.1, 5, 0.22);
  for (let t = w12(0) + 0.2, i = 0; t < FLASH2 - 0.1; t += 0.5, i++) sfx('clock', t, { gain: 0.2, semis: 0.2, pan: i % 2 ? 0.2 : -0.2 });
  blast(FLASH2, 0.9);
  sfx('glass', FLASH2 + 0.05, { gain: 0.32, semis: 0 });

  // ------------------------------------------------------------------ 11 · AGAIN
  const w13 = (i) => W_('y13', i), tb = w13(5) - 0.05;
  sfx('tinnitus', CUT.again, { gain: 0.06, dur: tb - CUT.again, fadeIn: 0.1, fadeOut: 0.1, semis: 0, hp: 2000 });
  sfx('marker', w13(0), { gain: 0.3, variant: 0 });
  sfx('marker', w13(1), { gain: 0.25, variant: 1 });
  paper(w13(2), 0.2, -0.3);
  blast(tb, 0.6, { offset: 0.1 });
  [w13(0), w13(3), w13(7)].forEach((t, i) => pop(t, 0.08 + i * 0.03, 0.9 - i * 0.1));
  paper(w13(8), 0.24);

  // ------------------------------------------------------------------ 12 · RECOG
  const w14 = (i) => W_('y14', i), r0 = CUT.recog;
  typeOut(r0 + 0.05, 42, 70, 0.07, -0.2);
  typeOut(r0 + 0.4, 20, 45, 0.09);
  [0, 1, 2, 3, 4].forEach((i) => typeOut(r0 + 1.0 + i * 0.25, 16, 40, 0.06, -0.2 + i * 0.1));
  flaps(w14(1) - 0.1, 4, 0.2);
  sfx('stamp', w14(5), { gain: 0.55, rate: 0.85, rev: 0.15 });
  sfx('whoosh', w14(7), { gain: 0.16, lp: 3000 });
  paper(w14(8), 0.22);

  // ------------------------------------------------------------------ 13 · END93 (+ loop into the hook)
  const w15 = (i) => W_('y15', i);
  synth('counter', w15(2), { gain: 0.14 });
  paper(w15(3), 0.18);
  sfx('marker', w15(9), { gain: 0.4, variant: 3 });
  sfx('marker', w15(9) + 0.25, { gain: 0.4, variant: 5 });
  paper(w15(9), 0.2, 0.2);
  sfx('rumble', DURATION - 0.5, { gain: 0.2, dur: 0.5, lead: 0, semis: 0 });
  sfx('blast_far', DURATION - 0.5, { gain: 0.32, offset: 0.4, dur: 0.5, lead: 0, semis: 0, lp: 1800 });
  return out;
}
