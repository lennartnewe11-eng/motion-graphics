// Sound design of "Die Melasse-Flut" — every cue belongs to a picture event (style guide §4):
// recorded foley (ElevenLabs takes, sliced into round-robin variants) for material and world,
// synthesised accents (impacts, risers, ticks) for the graphic layer. Silence is used as an effect
// before the burst and before "süß".
import INDEX from '../../../assets/molasse/sfx/index.json' with { type: 'json' };
import { foley } from '../lib/sound.js';
import { L, W_, CUT, E8, E16, DURATION } from './timeline.js';

export function cues() {
  const { sfx, synth, cues: out } = foley('molasse', INDEX);
  const w = (id, i) => W_(id, i);
  // word pop on a paper strip: small paper sound, size of the word = size of the sound
  const strip = (t, big = false, pan = 0) => sfx(big ? 'paper_toss' : 'paper_slide', t, { gain: big ? 0.22 : 0.12, pan, dur: big ? undefined : 0.35, hp: big ? 120 : 400 });
  const pop = (t, g = 0.12, pitch = 1) => synth('pop', t, { gain: g, pitch });

  // ------------------------------------------------------------------ worlds (ambience beds)
  sfx('street', 0, { gain: 0.12, dur: 2.6, variant: 0, fadeOut: 0.05, lp: 3500, semis: 0 });
  sfx('harbor', CUT.tank, { gain: 0.2, dur: CUT.inside - CUT.tank + 0.4, variant: 0, fadeIn: 0.3, fadeOut: 0.4, semis: 0 });
  sfx('street', CUT.rattle, { gain: 0.26, dur: W_('m06', 5) - CUT.rattle, variant: 0, fadeIn: 0.15, fadeOut: 0.05, semis: 0, offset: 3 });
  sfx('wind', CUT.deadly, { gain: 0.15, dur: CUT.cold - CUT.deadly + 3.8, variant: 0, fadeIn: 0.6, fadeOut: 1, semis: 0 });
  sfx('wind', CUT.kids, { gain: 0.14, dur: CUT.leak - CUT.kids, variant: 0, fadeIn: 0.8, fadeOut: 0.6, semis: 0, offset: 2, rate: 0.9 });
  sfx('harbor', CUT.harbor, { gain: 0.24, dur: CUT.smell - CUT.harbor + 0.3, variant: 0, fadeIn: 0.2, fadeOut: 0.3, semis: 0, offset: 4 });
  sfx('summer', w('m17', 4) - 0.1, { gain: 0.3, dur: DURATION - w('m17', 4) + 0.1, variant: 0, fadeIn: 0.4, fadeOut: 0.5, semis: 0 });

  // ------------------------------------------------------------------ 1 · HOOK
  sfx('wave', 0, { gain: 0.26, offset: 1.2, dur: 2.62, lead: 0, fadeOut: 0.04, semis: 0, rev: 0.12, lp: 900 });
  synth('impact', 0.0, { gain: 0.7, big: true });
  sfx('crowd', 0.25, { gain: 0.08, lp: 1400, dur: 2.3, fadeOut: 0.05 });
  sfx('houses', 1.25, { gain: 0.13, lp: 3000, dur: 1.3, fadeOut: 0.05 });
  strip(w('m01', 0), false, -0.3); strip(w('m01', 1), true, 0.3); strip(w('m01', 2), false);
  synth('impact', w('m01', 3), { gain: 0.45 });
  sfx('stamp', w('m01', 3), { gain: 0.5, rate: 0.7, rev: 0.2 });
  strip(w('m01', 4), true, -0.2); strip(w('m01', 5), true, 0.2);
  [1.75, 2.0, 2.3].forEach((t, i) => sfx('gloop', t, { gain: 0.2, rate: 0.75, pan: (i - 1) * 0.3 }));

  // ------------------------------------------------------------------ 2 · SIRUP (hard cut to quiet)
  [0, 1, 2, 3].forEach((i) => pop(w('m02', i), 0.1, 0.9 + i * 0.08));
  sfx('pour', w('m02', 4) - 0.05, { gain: 0.24, dur: 1.3, fadeOut: 0.6 });
  sfx('gloop', w('m02', 4), { gain: 0.34, rate: 0.8 });
  synth('stretchGoo', w('m02', 4) + 0.1, { gain: 0.3 });
  [0.35, 0.62, 0.9].forEach((d, i) => sfx('drip', w('m02', 4) + d, { gain: 0.22, pan: (i - 1) * 0.4 }));
  sfx('marker', w('m02', 4) + 0.55, { gain: 0.35, variant: 3 });

  // ------------------------------------------------------------------ 3 · BOSTON
  sfx('newspaper', CUT.boston - 0.02, { gain: 0.55 });
  sfx('stamp', w('m03', 0), { gain: 0.45, rate: 0.85 });
  synth('impact', w('m03', 0), { gain: 0.18 });
  sfx('highlighter', w('m03', 1) + 0.05, { gain: 0.42, variant: 4 });
  for (let i = 0; i < 15; i++) if ('15. JANUAR 1919'[i] !== ' ') sfx('typewriter', w('m03', 1) + i / 15, { gain: 0.28, pan: -0.3 + i * 0.04, semis: 0.7 });
  sfx('clock_wind', w('m03', 4) - 0.05, { gain: 0.45, dur: 0.75 });
  for (let t = w('m03', 6) + 0.25; t < CUT.tank - 0.05; t += E8) sfx('tick', t, { gain: 0.35, semis: 0.3 });
  sfx('highlighter', w('m03', 4) + 0.1, { gain: 0.3 });
  sfx('marker', w('m03', 4), { gain: 0.25 });

  // ------------------------------------------------------------------ 4 · TANK
  sfx('paper_toss', w('m04', 1), { gain: 0.4 });
  for (let i = 0; i < 7; i++) sfx('clank', w('m04', 2) + i * E16, { gain: 0.3 + i * 0.03, rate: 0.75 + i * 0.03, pan: 0.2 - i * 0.06, rev: 0.12 });
  sfx('flash', w('m04', 4) - 0.05, { gain: 0.32 });
  sfx('paper_toss', w('m04', 4), { gain: 0.32, pan: 0.5 });
  strip(w('m04', 6), true);
  for (let i = 0; i < 5; i++) sfx('paper_toss', w('m04', 9) + i * E16, { gain: 0.22, rate: 1 + i * 0.06, pan: 0.5, semis: 0.4 });
  sfx('marker', w('m04', 10), { gain: 0.3, pan: 0.6 });

  // ------------------------------------------------------------------ 5 · INSIDE
  sfx('paper_tear', w('m05', 0), { gain: 0.5 });
  sfx('pour', w('m05', 2) - 0.1, { gain: 0.45, dur: 2.2, fadeOut: 0.8 });
  synth('counter', w('m05', 2), { gain: 0.14, dur: w('m05', 4) + 0.35 - w('m05', 2) });
  sfx('gloop', w('m05', 5), { gain: 0.5, rate: 0.85 });
  synth('impact', w('m05', 5), { gain: 0.2 });
  synth('stretchGoo', w('m05', 6), { gain: 0.6 });
  pop(w('m05', 7), 0.16, 0.8);
  sfx('stamp', w('m05', 8) + 0.12, { gain: 0.25, rate: 1.6 });

  // ------------------------------------------------------------------ 6 · RATTLE
  sfx('groan', CUT.rattle, { gain: 0.2, dur: 2.0, fadeIn: 0.4, lp: 1800 });
  for (let i = 0; i < 4; i++) sfx('paper_slide', w('m06', 1) + 0.08 + i * E16, { gain: 0.14, rate: 1.3, pan: -0.6 + i * 0.4, dur: 0.25 });
  for (let i = 0; i < 4; i++) sfx('marker', w('m06', 1) + 0.12 + i * E16, { gain: 0.12, rate: 1.4, pan: -0.6 + i * 0.4, dur: 0.2 });
  strip(w('m06', 0)); strip(w('m06', 1), true); strip(w('m06', 2), true); strip(w('m06', 3));
  for (let i = 0; i < 6; i++) sfx('rivet', w('m06', 4) + i * E16 * 0.7, { gain: 0.15, lp: 2600, rev: 0.2, pan: -0.5 });
  sfx('paper_slide', w('m06', 5) - 0.04, { gain: 0.3 });
  sfx('lewis', w('m06', 6) - 0.02, { gain: 0.5, dur: 1.3, fadeOut: 0.2, rev: 0.12, semis: 0 });
  pop(w('m06', 5), 0.12, 0.8);

  // ------------------------------------------------------------------ 7 · RIVETS
  sfx('groan', CUT.rivets, { gain: 0.28, dur: 2.5, variant: 0, rate: 0.85, semis: 0 });
  strip(w('m07', 3), true);
  for (let i = 0; i < 20; i++) {
    const t = w('m07', 3) + 0.12 + i * E16 * 0.75;
    if (t > CUT.burst - 0.05) break;
    sfx('rivet', t, { gain: 0.19, pan: ((i * 37) % 9) / 4.5 - 1, rev: 0.08 });
    if (i % 2 === 0) sfx('gloop', t + 0.05, { gain: 0.1, rate: 1.1 });
  }
  synth('burst', w('m07', 5), { gain: 0.25 });
  sfx('girder', w('m07', 8) - 0.05, { gain: 0.35, offset: 1.4, dur: 0.9 });
  strip(w('m07', 6)); strip(w('m07', 7));

  // ------------------------------------------------------------------ 8 · BURST (silence, then everything)
  sfx('heart', CUT.burst + 0.05, { gain: 0.45, dur: 0.85, fadeOut: 0.1, semis: 0 });
  sfx('groan', CUT.burst + 0.1, { gain: 0.28, dur: 0.75, offset: 2, lp: 900 });
  const tear = CUT.wave - 0.12;
  sfx('burst', tear, { gain: 1.0, lead: 0.03, semis: 0, rev: 0.15, dur: 1.1, fadeOut: 0.6 });
  synth('impact', tear, { gain: 1.0, big: true });
  synth('crash', tear, { gain: 0.7 });

  // ------------------------------------------------------------------ 9 · WAVE
  sfx('wave', CUT.wave - 0.05, { gain: 0.26, dur: 4.3, fadeOut: 0.3, semis: 0, rev: 0.1, lp: 900 });
  sfx('crowd', CUT.wave + 0.3, { gain: 0.08, dur: 3.2, lp: 1400, fadeOut: 0.6 });
  strip(w('m08', 0)); strip(w('m08', 1), true); strip(w('m08', 2), true);
  synth('zip', w('m08', 1), { gain: 0.4, dur: 0.45 });
  strip(w('m08', 3)); strip(w('m08', 4), true);
  synth('whoosh', w('m08', 5), { gain: 0.32, dur: 0.6, pan: 0.6 });
  strip(w('m08', 5), true); strip(w('m08', 6));
  synth('counter', w('m08', 7), { gain: 0.1, dur: 0.6 });
  synth('impact', w('m08', 7) + 0.55, { gain: 0.35 });
  strip(w('m08', 8), true, 0.4);
  sfx('houses', w('m08', 9), { gain: 0.13, lp: 2000, dur: 1.2, fadeOut: 0.3 });
  strip(w('m08', 9)); strip(w('m08', 10)); strip(w('m08', 11), true);

  // ------------------------------------------------------------------ 10 · CRUSH
  sfx('paper_toss', CUT.crush, { gain: 0.45 });
  strip(w('m09', 0)); strip(w('m09', 1), true);
  sfx('houses', w('m09', 2) + 0.05, { gain: 0.4, dur: 1.4, fadeOut: 0.3 });
  sfx('gloop', w('m09', 2) + 0.05, { gain: 0.45, rate: 0.6 });
  synth('impact', w('m09', 2) + 0.12, { gain: 0.4 });
  sfx('marker', CUT.crush + 0.3, { gain: 0.2 });
  sfx('paper_tear', w('m09', 4), { gain: 0.5 });
  sfx('girder', w('m09', 4), { gain: 0.38, dur: 1.4, fadeOut: 0.3 });
  sfx('newspaper', w('m09', 5) - 0.12, { gain: 0.4 });
  sfx('highlighter', w('m09', 6), { gain: 0.35 });
  sfx('highlighter', w('m09', 7) - 0.05, { gain: 0.3 });
  strip(w('m09', 3)); strip(w('m09', 5)); strip(w('m09', 6), true); strip(w('m09', 7));
  for (let i = 0; i < 7; i++) sfx('matches', w('m09', 8) + i * E16 * 0.6, { gain: 0.42, pan: -0.7 + i * 0.23 });

  // ------------------------------------------------------------------ 11 · DEADLY (the music falls away)
  sfx('heart', w('m10', 2), { gain: 0.24, dur: 2.0, fadeOut: 0.5, semis: 0 });
  synth('drop', w('m10', 2), { gain: 0.3 });
  for (let i = 0; i < 8; i++) sfx('typewriter', w('m10', 2) + i * 0.06, { gain: 0.06, lp: 1500, rate: 0.7 });
  strip(w('m10', 0)); strip(w('m10', 1)); strip(w('m10', 3)); strip(w('m10', 4)); strip(w('m10', 5), true);

  // ------------------------------------------------------------------ 12 · COLD
  strip(w('m11', 2), true); strip(w('m11', 4), true); strip(w('m11', 5), true);
  synth('slide', w('m11', 5), { gain: 0.2, dur: 0.9 });
  sfx('stuck', w('m11', 7), { gain: 0.38, dur: 2.2, fadeOut: 0.6, rate: 0.85 });
  sfx('gloop', w('m11', 12), { gain: 0.45, rate: 0.55 });
  synth('stretchGoo', w('m11', 12), { gain: 0.35 });
  sfx('marker', w('m11', 6) + 0.1, { gain: 0.25 });
  strip(w('m11', 11), true);

  // ------------------------------------------------------------------ 13 · STUCK
  sfx('stuck', CUT.stuck, { gain: 0.32, dur: 2.3, fadeOut: 0.5 });
  strip(w('m12', 0));
  sfx('gloop', w('m12', 1), { gain: 0.35, rate: 0.7 });
  strip(w('m12', 2)); strip(w('m12', 3), true); strip(w('m12', 4));
  synth('stretchGoo', w('m12', 5) + 0.15, { gain: 0.45 });
  sfx('gloop', w('m12', 5) + 0.45, { gain: 0.35, rate: 0.6 });

  // ------------------------------------------------------------------ 14 · KIDS (almost nothing)
  sfx('paper_slide', w('m13', 3), { gain: 0.16, rate: 0.8 });
  sfx('paper_slide', w('m13', 4), { gain: 0.16, rate: 0.85 });
  sfx('marker', w('m13', 6), { gain: 0.2, variant: 1 });
  sfx('marker', w('m13', 6) + 0.1, { gain: 0.18, variant: 2 });

  // ------------------------------------------------------------------ 15 · LEAK
  sfx('paper_toss', CUT.leak, { gain: 0.4 });
  strip(w('m14', 2), true);
  for (let i = 0; i < 8; i++) sfx('drip', w('m14', 2) + 0.3 + i * 0.28, { gain: 0.3, pan: ((i * 5) % 7) / 3.5 - 1 });
  sfx('stamp', w('m14', 5) + 0.1, { gain: 0.6, rate: 0.9 });
  sfx('marker', w('m14', 5) + 0.25, { gain: 0.2 });
  for (let i = 0; i < 3; i++) sfx('marker', w('m14', 8) + i * 0.12, { gain: 0.25 });
  synth('drip', w('m14', 8) + 0.3, { gain: 0.25 });

  // ------------------------------------------------------------------ 16 · PAINT
  strip(w('m15', 1), true);
  sfx('stamp', w('m15', 1) + 0.1, { gain: 0.65, rate: 0.8, rev: 0.12 });
  sfx('brush', w('m15', 5) - 0.05, { gain: 0.5, dur: 0.5 });
  sfx('brush', w('m15', 6), { gain: 0.5, dur: 0.5 });
  sfx('brush', w('m15', 6) + 0.35, { gain: 0.5, dur: 0.5 });
  sfx('brush', w('m15', 5), { gain: 0.35, dur: 0.4, pan: 0.3 });
  sfx('marker', w('m15', 6) + 0.55, { gain: 0.28 });
  strip(w('m15', 4), true);

  // ------------------------------------------------------------------ 17 · HARBOR
  strip(w('m16', 1), true);
  for (let i = 0; i < 5; i++) sfx('calendar', w('m16', 3) + i * E16 * 0.8, { gain: 0.38, pan: 0.2 });
  strip(w('m16', 5), true);
  strip(w('m16', 6), true);

  // ------------------------------------------------------------------ 18 · SMELL
  for (let i = 0; i < 4; i++) synth('flip', w('m17', 2) + i * E8, { gain: 0.5 });
  strip(w('m17', 4), true);
  sfx('sniff', w('m17', 4) + 0.15, { gain: 0.55, semis: 0, dur: 1.4, fadeOut: 0.3 });
  strip(w('m17', 8), true);
  sfx('gloop', w('m17', 11), { gain: 0.5, rate: 0.75 });
  sfx('pour', w('m17', 11) + 0.1, { gain: 0.25, dur: 1.2, fadeOut: 0.6 });
  sfx('drip', w('m17', 11) + 1.9 + 0.02, { gain: 0.5, rate: 0.8, rev: 0.3 });
  return out.sort((a, b) => a.t - b.t);
}
