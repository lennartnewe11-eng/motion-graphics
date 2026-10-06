// Score of "Vesna": 128.57 BPM (14 frames per beat), E minor. The music follows the story:
// no music under the fall (wind, impact, silence, a heartbeat) · a cool departure-board pulse from the date on ·
// a riser that stops dead before "Bombe" · chaos for the break-up · one low tone while the windows go dark ·
// a heartbeat under the falling section · cold bells in the forest · nothing in the coma until she wakes ·
// the pulse returns, brighter, for the record · bells under her own words · hard cut into the fall (loop).
import { kick, clap, snare, hat, shaker, tom, crash, bass, pad, pluck, stab, bell, subDrop, playSfx } from '../../audio/kit.js';
import { L, W_, WE, CUT, BEAT, E8, E16, DURATION } from './timeline.js';

const BAR = BEAT * 4;
const SET = [ // Em – C – Am – B
  { pad: [52, 59, 64, 67], bass: 40, arp: [64, 67, 71, 76] },
  { pad: [48, 55, 60, 64], bass: 36, arp: [60, 64, 67, 72] },
  { pad: [45, 52, 57, 60], bass: 45, arp: [57, 60, 64, 69] },
  { pad: [47, 54, 59, 63], bass: 47, arp: [59, 63, 66, 71] },
];
const BRIGHT = [ // G – D – Em – C (the record)
  { pad: [55, 59, 62, 67], bass: 43, arp: [67, 71, 74, 79] },
  { pad: [50, 57, 62, 66], bass: 38, arp: [62, 66, 69, 74] },
  SET[0], SET[1],
];
const chord = (prog, t0, t) => prog[Math.floor((t - t0) / BAR + 1e-6) % prog.length];

export function score(ac, bus, at) {
  const { drums, music, rev, delay } = bus;
  const fx = { out: bus.sfx, rev, delay };
  const kicks = [];
  const K = (t, v = 0.85, o) => { kicks.push(t); at(t, () => kick(ac, drums, t, v, o)); };
  const sendRev = (g, amt) => { const s = ac.createGain(); s.gain.value = amt; g.connect(s); s.connect(rev); };
  const padAt = (t, notes, dur, v, opts) => at(t, () => sendRev(pad(ac, music, t, notes, dur, v, opts), 0.6));
  const bellAt = (t, m, v = 0.06, decay = 2.2, p = 0, r = 0.8) => at(t, () => { const g = ac.createGain(); bell(ac, g, t, m, v, decay, p); g.connect(music); sendRev(g, r); });
  const pl = (t, m, v, o = {}) => at(t, () => { const g = pluck(ac, music, t, m, v, o); if (o.send) { const s = ac.createGain(); s.gain.value = o.send; g.connect(s); s.connect(delay); } });
  const grid = (a, b, step, fn) => { for (let t = a, i = 0; t < b - 1e-6; t += step, i++) fn(t, i); };

  // ---------------------------------------------------------------- 1–2 · the fall: no music at all

  // ---------------------------------------------------------------- 3–5 · flight, on board, the roster
  const s0 = CUT.flight, s1 = CUT.bomb;
  at(s0, () => subDrop(ac, music, s0, 0.35, 1.6));
  grid(s0, s1, BEAT, (t, i) => {
    K(t, i % 4 === 0 ? 0.7 : 0.5, { tight: true });
    if (t >= CUT.board && (i % 4 === 1 || i % 4 === 3)) at(t, () => clap(ac, drums, t, 0.18, rev));
  });
  grid(s0, s1, E8, (t, i) => {
    if (i % 2) at(t, () => hat(ac, drums, t, 0.06, false, 0.25));
    const c = chord(SET, s0, t);
    at(t, () => bass(ac, music, t, c.bass + (i % 2 ? 12 : 0), 0.16, 0.22, 0.3));
  });
  grid(s0, s1, BAR, (t) => padAt(t, chord(SET, s0, t).pad, BAR - 0.05, t >= CUT.board ? 0.05 : 0.035, { cutoff: 1400, attack: 0.3, release: 0.4 }));
  // the departure board: a dry pluck pattern like flaps settling
  grid(s0, CUT.board, E16, (t, i) => {
    if (i % 4 === 3) return;
    const c = chord(SET, s0, t);
    pl(t, c.arp[[0, 2, 1, 3][i % 4]] + 12, 0.02, { decay: 0.05, cutoff: 3000, p: i % 2 ? 0.4 : -0.4 });
  });
  // "Vesna Vulović": a bell chord on her name
  [64, 67, 71, 76, 79].forEach((m, i) => bellAt(W_('v05', 4) + i * 0.04, m + 12, 0.035, 2.5, (i - 2) * 0.3, 1));
  grid(CUT.roster, s1, E16, (t, i) => {
    if (i % 2) at(t, () => shaker(ac, drums, t, 0.03, 0.3));
    const c = chord(SET, s0, t);
    pl(t, c.arp[[0, 1, 2, 3, 2, 1, 3, 2][i % 8]] + 12, 0.02, { decay: 0.1, cutoff: 3400, p: i % 2 ? 0.5 : -0.5, send: 0.3 });
  });
  at(W_('v06', 13), () => stab(ac, music, W_('v06', 13), [52, 58, 64, 70], 0.07, 0.3)); // "verwechselt": a wrong chord

  // ---------------------------------------------------------------- 6 · the bomb: tension, then dead stop
  const b0 = CUT.bomb, tb = W_('v07', 7);
  padAt(b0, [40, 52, 59, 62], tb - b0, 0.06, { cutoff: 700, attack: 0.6, release: 0.02 });
  grid(b0, tb - BEAT, BEAT, (t) => K(t, 0.5, { tight: true }));
  grid(W_('v07', 3), tb - BEAT * 0.5, E16, (t) => at(t, () => snare(ac, drums, t, 0.03 + 0.2 * (t - W_('v07', 3)) / (tb - W_('v07', 3)), rev)));
  at(W_('v07', 2), () => playSfx(ac, fx, { t: W_('v07', 2), type: 'riser', gain: 0.35, dur: tb - BEAT * 0.5 - W_('v07', 2) }));
  // the blast
  at(tb, () => crash(ac, drums, tb, 0.45, rev));
  at(tb, () => subDrop(ac, music, tb, 0.9, 2.4));
  K(tb, 1);

  // ---------------------------------------------------------------- 7 · break-up: chaos
  const c0 = CUT.breakup, c1 = CUT.count;
  grid(c0, c1 - 0.2, BEAT, (t, i) => {
    K(t, 0.75);
    if (i % 2) at(t, () => snare(ac, drums, t, 0.3, rev));
    if (i % 4 === 3) [0, 1, 2, 3].forEach((k) => at(t + k * E16, () => tom(ac, drums, t + k * E16, 0.4, 170 - k * 22)));
  });
  grid(c0, c1 - 0.2, E16, (t, i) => {
    at(t, () => hat(ac, drums, t, i % 2 ? 0.04 : 0.08, i % 4 === 2, 0.2));
    if (i % 4 !== 0) at(t, () => bass(ac, music, t, 40 + (i % 4 === 2 ? 12 : 0), 0.09, 0.28, 0.8));
  });
  grid(c0, c1 - 0.2, BEAT, (t) => at(t + E8, () => stab(ac, music, t + E8, [64, 67, 70, 75], 0.05, 0.16)));

  // ---------------------------------------------------------------- 8 · 28 -> 27: one low tone
  padAt(c1, [28, 40, 47], CUT.wedged - c1, 0.08, { cutoff: 380, attack: 0.2, release: 0.6 });
  bellAt(W_('v09', 5) + 1.25, 83, 0.05, 3.5, 0.2, 1.1); // the one window that stays lit

  // ---------------------------------------------------------------- 9–10 · falling section: heartbeat + strings
  const h0 = CUT.wedged, ti = WE('v11', 7) - 0.15;
  grid(h0, ti - 0.2, BEAT * 2, (t) => { K(t, 0.55, { tight: true }); K(t + 0.2, 0.38, { tight: true }); });
  at(h0, () => sendRev(pad(ac, music, h0, [40, 52, 59, 64], ti - h0, 0.05, { cutoff: 600, attack: 1.2, release: 0.05 }), 0.5));
  [[h0 + 0.4, [64, 67, 71]], [CUT.slope, [65, 68, 72]], [CUT.slope + BAR * 0.6, [66, 69, 73]]].forEach(([t, n], i, arr) => {
    const end = i + 1 < arr.length ? arr[i + 1][0] : ti;
    padAt(t, n, end - t, 0.03 + i * 0.012, { cutoff: 1800 + i * 900, attack: 0.25, release: 0.02 });
  });
  at(CUT.slope + 0.3, () => playSfx(ac, fx, { t: CUT.slope + 0.3, type: 'riser', gain: 0.4, dur: ti - CUT.slope - 0.3 }));
  at(ti, () => crash(ac, drums, ti, 0.35, rev));
  at(ti, () => subDrop(ac, music, ti, 0.8, 2));
  K(ti, 1);

  // ---------------------------------------------------------------- 11 · Honke: cold bells
  const g0 = CUT.honke;
  padAt(g0 + 0.3, [40, 47, 52, 55], CUT.injuries - g0 - 0.3, 0.06, { cutoff: 520, attack: 0.8, release: 0.8 });
  [[0, 76], [2, 74], [4, 71], [6, 67], [8, 69]].forEach(([b, m]) => { const t = g0 + BEAT + b * BEAT; if (t < CUT.injuries - 0.2) bellAt(t, m, 0.04, 3, 0, 1.0); });
  // "Sanitäter": a warm major third — help is coming
  [64, 68, 71].forEach((m, i) => bellAt(W_('v12', 11) + i * 0.05, m + 12, 0.035, 2.6, (i - 1) * 0.3, 1));

  // ---------------------------------------------------------------- 12 · injuries: a low pulse, a hit per fracture
  const i0 = CUT.injuries;
  grid(i0, CUT.coma, BEAT, (t, i) => at(t, () => bass(ac, music, t, 28, 0.3, 0.25, 0.1)));
  [W_('v13', 0) + 0.25, W_('v13', 3) + 0.22, W_('v13', 6) + 0.22].forEach((t) => { K(t, 0.8); at(t, () => crash(ac, drums, t, 0.08, rev)); });

  // ---------------------------------------------------------------- 13 · coma: nothing — then she wakes
  const tw = W_('v14', 6);
  padAt(CUT.coma, [40, 47], tw - CUT.coma, 0.035, { cutoff: 300, attack: 1, release: 0.3 });
  padAt(tw - 0.05, [52, 59, 64, 67, 71], CUT.record - tw + 0.05, 0.06, { cutoff: 1700, attack: 0.08, release: 0.3 });
  [76, 79, 83].forEach((m, i) => bellAt(tw + i * 0.06, m, 0.04, 2.4, (i - 1) * 0.3, 1));
  grid(tw + BEAT, CUT.record, BEAT, (t, i) => K(t, 0.4, { tight: true }));
  // "an nichts": the bells forget their notes (a falling, detuned line)
  [[0, 79], [0.5, 76], [1, 71]].forEach(([b, m]) => bellAt(W_('v14', 12) + b * BEAT, m - 0.3 * b, 0.03, 2, 0, 1.1));

  // ---------------------------------------------------------------- 14 · the record: brighter pulse
  const r0 = CUT.record, r1 = CUT.quote;
  at(r0, () => crash(ac, drums, r0, 0.18, rev));
  grid(r0, r1, BEAT, (t, i) => {
    K(t, i % 4 === 0 ? 0.75 : 0.55, { tight: true });
    if (i % 4 === 1 || i % 4 === 3) at(t, () => clap(ac, drums, t, 0.22, rev));
  });
  grid(r0, r1, E8, (t, i) => {
    if (i % 2) at(t, () => hat(ac, drums, t, 0.07, false, 0.25));
    const c = chord(BRIGHT, r0, t);
    at(t, () => bass(ac, music, t, c.bass + (i % 2 ? 12 : 0), 0.16, 0.22, 0.5));
    pl(t, c.arp[[0, 2, 1, 3][i % 4]] + 12, 0.024, { decay: 0.12, cutoff: 3600, p: i % 2 ? 0.5 : -0.5, send: 0.3 });
  });
  grid(r0, r1, BAR, (t) => padAt(t, chord(BRIGHT, r0, t).pad, BAR - 0.05, 0.05, { cutoff: 2000, attack: 0.2, release: 0.3 }));
  at(W_('v15', 3), () => stab(ac, music, W_('v15', 3), [55, 59, 62, 67, 71], 0.1, 0.5));

  // ---------------------------------------------------------------- 15 · her words: bells, a long chord, cut
  const q0 = CUT.quote, qe = DURATION - 0.5;
  padAt(q0, [40, 52, 55, 59, 64], qe - q0, 0.05, { cutoff: 1100, attack: 0.6, release: 0.05 });
  const line = [76, 74, 71, 67, 69, 71, 64, 67];
  line.forEach((m, i) => { const t = q0 + 0.3 + i * BEAT; if (t < qe - 0.3) bellAt(t, m, 0.035, 2.2, (i % 2 ? 0.3 : -0.3), 0.9); });
  [52, 59, 64, 67, 71].forEach((m, i) => bellAt(W_('v16', 15) + i * 0.04, m + 12, 0.04, 3, (i - 2) * 0.3, 1));
  return kicks.sort((a, b) => a - b);
}
