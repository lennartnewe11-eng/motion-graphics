// Sound design of "Vesna" — every cue belongs to a picture event (style guide §4): recorded foley
// (ElevenLabs takes, sliced into round-robin variants) for the world and the material, synthesised accents
// for the graphic layer. Silence is an effect: after the impact, before "Bombe", in the coma.
import INDEX from '../../../assets/vesna/sfx/index.json' with { type: 'json' };
import { foley } from '../lib/sound.js';
import { rng } from '../../engine/core.js';
import { L, W_, WE, CUT, IMPACT, E8, E16, DURATION } from './timeline.js';

export function cues() {
  const { sfx, synth, cues: out } = foley('vesna', INDEX);
  const paper = (t, g = 0.22, pan = 0) => sfx('paper', t, { gain: g, pan, hp: 200 });
  const pop = (t, g = 0.1, pitch = 1) => synth('pop', t, { gain: g, pitch });
  const typeOut = (t0, n, cps, g = 0.12, pan = 0) => { for (let i = 0; i < n; i += 2) sfx('typewriter', t0 + i / cps, { gain: g, pan: pan + (i / n - 0.5) * 0.4, semis: 0.8 }); };

  // ------------------------------------------------------------------ 1 · FALL (no music: the world only)
  const w1 = (i) => W_('v01', i), w2 = (i) => W_('v02', i);
  sfx('wind_alt', 0, { gain: 0.11, dur: IMPACT, lead: 0, fadeIn: 0.02, fadeOut: 0.02, semis: 0, lp: 2400 });
  sfx('dive', 0.1, { gain: 0.07, dur: IMPACT - 0.1, fadeIn: 0.4, fadeOut: 0.02, semis: 0, lp: 2000 });
  [0.05, 0.62, 1.15, 2.45, 2.9, 3.4].forEach((t, i) => sfx('whoosh', t, { gain: 0.13, pan: i % 2 ? 0.45 : -0.45, rev: 0.1, lp: 3000 }));
  sfx('whoosh', 1.72, { gain: 0.3, rate: 0.7, rev: 0.15, lp: 2500 }); // the cloud deck
  sfx('paper', w1(0) - 0.05, { gain: 0.3, pan: -0.4 });
  sfx('marker', w1(1), { gain: 0.25, pan: -0.2 });
  pop(w1(1), 0.1, 1.1);
  paper(w1(4), 0.18, 0);
  pop(w1(5), 0.12, 0.8);
  synth('drop', WE('v01', 7) - 0.05, { gain: 0.18 });
  paper(w2(1), 0.22, 0.2);
  sfx('marker', w2(1) + 0.22, { gain: 0.3, variant: 1 });
  // the altimeter: a fine mechanical ticking that speeds up with the fall
  for (let t = 0.1, k = 0; t < IMPACT - 0.1; k++) { synth('tick', t, { gain: 0.035, pitch: 1.2 + t * 0.15 }); t += Math.max(0.05, 0.16 - t * 0.028); }
  // impact: then nothing
  sfx('impact_snow', IMPACT - 0.03, { gain: 0.75, lead: 0, semis: 0, rev: 0.15 });
  synth('impact', IMPACT, { gain: 0.8, big: true });
  sfx('snow_burst', IMPACT + 0.05, { gain: 0.3, dur: 1.4, fadeOut: 0.8, semis: 0 });

  // ------------------------------------------------------------------ 2 · BLACK
  sfx('forest', IMPACT + 0.9, { gain: 0.09, dur: CUT.flight - IMPACT - 0.9, fadeIn: 0.8, fadeOut: 0.1, variant: 0, semis: 0 });
  sfx('heart', W_('v03', 0) - 0.4, { gain: 0.4, dur: 2.2, fadeOut: 0.6, semis: 0, lp: 900 });
  synth('heart', W_('v03', 3), { gain: 0.3 });

  // ------------------------------------------------------------------ 3 · FLIGHT
  const w4 = (i) => W_('v04', i);
  paper(CUT.flight + 0.05, 0.3, 0.3);
  [[w4(0), 2], [w4(1), 3], [w4(2), 4], [w4(3), 3], [w4(4), 3], [w4(6), 9], [w4(8) - 0.05, 7]].forEach(([t, n], i) =>
    sfx('flap', t, { gain: 0.16 + n * 0.012, pan: -0.25 + (i % 3) * 0.25, dur: Math.min(0.6, 0.12 + n * 0.05), fadeOut: 0.05 }));
  sfx('marker', w4(3), { gain: 0.3, variant: 4 });
  sfx('marker', w4(4), { gain: 0.25, variant: 0 });
  [w4(6) - 0.32, w4(6) - 0.2, w4(6) - 0.08].forEach((t, i) => sfx('scissors', t, { gain: 0.3, pan: 0.2 - i * 0.1 }));
  sfx('jet_pass', w4(6) + 0.1, { gain: 0.17, lp: 2500, dur: CUT.board - w4(6) + 0.3, fadeIn: 0.3, fadeOut: 0.3, semis: 0 });

  // ------------------------------------------------------------------ 4 · BOARD
  const w5 = (i) => W_('v05', i);
  sfx('cabin', CUT.board, { gain: 0.14, dur: w5(4) - CUT.board, fadeIn: 0.2, fadeOut: 0.1, semis: 0, variant: 0 });
  pop(w5(0), 0.08);
  sfx('whoosh', w5(3) - 0.1, { gain: 0.34, rate: 0.85 });
  synth('zoom', w5(3) - 0.05, { gain: 0.15 });
  paper(w5(4) - 0.05, 0.3, 0);
  paper(w5(5), 0.2, 0.2);

  // ------------------------------------------------------------------ 5 · ROSTER
  const w6 = (i) => W_('v06', i), r0 = CUT.roster;
  typeOut(r0 + 0.05, 27, 70, 0.1, -0.2);
  typeOut(r0 + 0.4, 17, 50, 0.11, 0);
  typeOut(r0 + 0.7, 35, 60, 0.08, 0.2);
  [0, 1, 2, 3].forEach((i) => typeOut(r0 + 1.0 + i * 0.25, 10, 40, 0.06, -0.3 + i * 0.2));
  paper(w6(7), 0.22, -0.2);
  sfx('stamp', w6(8), { gain: 0.55, rate: 0.9, rev: 0.12 });
  sfx('marker', w6(13) - 0.1, { gain: 0.3, variant: 3 });
  synth('glitch', w6(13), { gain: 0.12 });
  paper(w6(14), 0.3, -0.3); paper(w6(16), 0.3, 0.3); paper(w6(17), 0.2, 0);

  // ------------------------------------------------------------------ 6 · BOMB
  const w7 = (i) => W_('v07', i), tb = w7(7);
  sfx('cabin', CUT.bomb, { gain: 0.14, dur: tb - CUT.bomb, fadeIn: 0.2, fadeOut: 0.02, semis: 0, offset: 2 });
  typeOut(w7(2) + 0.2, 36, 60, 0.06, 0.1);
  sfx('marker', w7(4), { gain: 0.22 });
  synth('glitch', w7(3), { gain: 0.1 });
  sfx('explosion', tb - 0.02, { gain: 0.85, lead: 0, semis: 0, rev: 0.2 });
  synth('impact', tb, { gain: 0.8, big: true });
  sfx('fire', tb + 0.05, { gain: 0.42, semis: 0 });
  sfx('metal_tear', tb + 0.18, { gain: 0.45, pan: -0.3 });

  // ------------------------------------------------------------------ 7 · BREAKUP
  const w8 = (i) => W_('v08', i);
  sfx('debris', CUT.breakup, { gain: 0.2, semis: 0 });
  [CUT.breakup + 0.2, CUT.breakup + 0.75, CUT.breakup + 1.4].forEach((t, i) => sfx('metal_tear', t, { gain: 0.18, pan: (i - 1) * 0.5, rate: 0.85 }));
  sfx('wind_alt', CUT.breakup + 0.4, { gain: 0.14, lp: 2400, dur: CUT.count - CUT.breakup - 0.3, fadeIn: 0.8, fadeOut: 0.1, semis: 0, offset: 1.5 });
  sfx('flap', w8(1) - 0.05, { gain: 0.2, dur: 0.35, fadeOut: 0.05 });
  synth('slice', w8(6) + 0.15, { gain: 0.2 });

  // ------------------------------------------------------------------ 8 · COUNT: 27 lights go out
  const w9 = (i) => W_('v09', i);
  synth('impact', w9(0), { gain: 0.25 });
  paper(CUT.count, 0.28, -0.4); paper(CUT.count + 0.12, 0.28, 0.4);
  const order = rng(5);
  for (let i = 0; i < 28; i++) {
    if (i === 17) continue;
    const t = w9(5) + 0.05 + order() * 1.05;
    sfx('switch', t, { gain: 0.16, pan: (i / 27 - 0.5) * 0.8, semis: 1 });
  }
  synth('impact', w9(5), { gain: 0.3 });
  sfx('marker', w9(5) + 1.25, { gain: 0.3, variant: 0 });

  // ------------------------------------------------------------------ 9 · WEDGED
  const w10 = (i) => W_('v10', i);
  sfx('wind_alt', CUT.wedged, { gain: 0.1, lp: 2400, dur: CUT.slope - CUT.wedged + 0.1, fadeIn: 0.1, fadeOut: 0.1, semis: 0, offset: 0.5, rate: 0.9 });
  [CUT.wedged + 0.3, CUT.wedged + 1.5, CUT.wedged + 2.6].forEach((t, i) => sfx('whoosh', t, { gain: 0.11, pan: i % 2 ? 0.5 : -0.5, lp: 3000 }));
  synth('zoom', w10(0) - 0.05, { gain: 0.14 });
  paper(w10(2), 0.22, 0.3);
  sfx('metal_tear', w10(5), { gain: 0.18, rate: 0.6, dur: 0.7, fadeOut: 0.3 });
  synth('harden', w10(5) + 0.4, { gain: 0.2 });
  sfx('stamp', w10(8), { gain: 0.4, rate: 0.8 });

  // ------------------------------------------------------------------ 10 · SLOPE
  const w11 = (i) => W_('v11', i), ti = WE('v11', 7) - 0.15;
  sfx('wind_alt', CUT.slope, { gain: 0.11, lp: 2400, dur: ti - CUT.slope, fadeIn: 0.05, fadeOut: 0.02, semis: 0, offset: 3 });
  sfx('whoosh', ti - 0.45, { gain: 0.22, rate: 0.75, lp: 3000 });
  paper(w11(2), 0.2, -0.2); paper(w11(5), 0.2, 0.1); paper(w11(6), 0.2, 0.3);
  sfx('impact_snow', ti - 0.03, { gain: 0.7, lead: 0, semis: 0, rev: 0.15 });
  synth('impact', ti, { gain: 0.6, big: true });
  sfx('snow_burst', ti + 0.05, { gain: 0.3, semis: 0 });
  [ti + 0.08, ti + 0.2, ti + 0.37].forEach((t, i) => sfx('crack', t, { gain: 0.25, pan: (i - 1) * 0.6 }));

  // ------------------------------------------------------------------ 11 · HONKE
  const w12 = (i) => W_('v12', i);
  sfx('forest', CUT.honke, { gain: 0.24, dur: CUT.injuries - CUT.honke, fadeIn: 0.4, fadeOut: 0.2, variant: 0, semis: 0, offset: 1 });
  sfx('cry', w12(4) - 0.1, { gain: 0.16, rev: 0.45, lp: 3000, semis: 0 });
  typeOut(w12(5), 11, 26, 0.14, 0);
  paper(w12(11), 0.22, 0);
  sfx('marker', w12(11) + 0.15, { gain: 0.3, variant: 2 });

  // ------------------------------------------------------------------ 12 · INJURIES
  const w13 = (i) => W_('v13', i);
  sfx('xray', CUT.injuries, { gain: 0.3, semis: 0 });
  [w13(0) + 0.28, w13(3) + 0.23, w13(6) + 0.23].forEach((t, i) => sfx('crack', t, { gain: 0.5, pan: (i - 1) * 0.3, rev: 0.12 }));
  [0, 1, 2].forEach((i) => sfx('crack', w13(5) + i * 0.12, { gain: 0.22, rate: 1.3, pan: 0.4 }));
  sfx('marker', w13(0), { gain: 0.2, variant: 3 });

  // ------------------------------------------------------------------ 13 · COMA
  const w14 = (i) => W_('v14', i), tw = w14(6);
  sfx('hospital', CUT.coma, { gain: 0.2, dur: CUT.record - CUT.coma, fadeIn: 0.3, fadeOut: 0.2, semis: 0 });
  for (let t = CUT.coma + 0.6; t < w14(5) + 0.3; t += 1.875) sfx('beep', t, { gain: 0.12, semis: 0, pan: 0.2 });
  for (let t = w14(5) + 0.45; t < CUT.record - 0.1; t += 0.577) sfx('beep', t, { gain: 0.15, semis: 0, pan: 0.2 });
  sfx('heart', tw - 0.1, { gain: 0.3, dur: 1.2, fadeOut: 0.4, semis: 0, lp: 900 });
  paper(tw, 0.22, 0);

  // ------------------------------------------------------------------ 14 · RECORD
  const w15 = (i) => W_('v15', i);
  sfx('flap', w15(1) + 0.1, { gain: 0.3, dur: 0.5, fadeOut: 0.05 });
  synth('counter', w15(3), { gain: 0.15 });
  pop(w15(3), 0.12, 0.9);
  sfx('paper', w15(4) - 0.1, { gain: 0.3, pan: 0.4 });
  [w15(6) - 0.02, w15(7) + 0.1, w15(7) + 0.38].forEach((t, i) => sfx('flashbulb', t, { gain: 0.4, pan: (i - 1) * 0.5 }));
  sfx('applause', w15(7) + 0.2, { gain: 0.22, dur: CUT.quote - w15(7) - 0.1, fadeOut: 0.4, semis: 0 });
  paper(w15(6), 0.2, -0.3); paper(w15(7), 0.2, -0.2);

  // ------------------------------------------------------------------ 15 · QUOTE (+ loop into the fall)
  const w16 = (i) => W_('v16', i);
  pop(w16(3) - 0.1, 0.08);
  pop(w16(7), 0.12, 0.85);
  sfx('marker', w16(10), { gain: 0.35, variant: 1 });
  paper(w16(15), 0.22, 0);
  sfx('wind_alt', DURATION - 0.5, { gain: 0.11, lp: 2400, dur: 0.5, lead: 0, fadeIn: 0.02, fadeOut: 0.02, semis: 0 });
  sfx('whoosh', DURATION - 0.5, { gain: 0.3 });
  return out;
}
