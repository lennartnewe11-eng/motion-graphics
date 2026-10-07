// Score of "Spaghetti": 128.57 BPM (14 frames per beat), D minor, cosmic. No music under the hook. A curious
// pulse from "Stell dir vor" · rising strings under the stretch · a drop into the hole · a half-time groove for the
// absurd part · only pads at the giant edge · a ritardando that stops dead on "verblasst" · the build to "Spaghetti".
import { kick, clap, snare, hat, shaker, tom, crash, bass, pad, pluck, stab, bell, subDrop, playSfx } from '../../audio/kit.js';
import { L, W_, WE, CUT, BEAT, E8, E16, DURATION } from './timeline.js';

const BAR = BEAT * 4;
const SET = [ // Dm – Bb – F – C
  { pad: [50, 57, 62, 65], bass: 38, arp: [62, 65, 69, 74] },
  { pad: [46, 53, 58, 62], bass: 34, arp: [58, 62, 65, 70] },
  { pad: [45, 53, 57, 60], bass: 41, arp: [60, 65, 69, 72] },
  { pad: [48, 55, 60, 64], bass: 36, arp: [60, 64, 67, 72] },
];
const chord = (prog, t0, t) => prog[Math.floor((t - t0) / BAR + 1e-6) % prog.length];

export function score(ac, bus, at) {
  const { drums, music, rev, delay } = bus;
  const fx = { out: bus.sfx, rev, delay };
  const kicks = [];
  const K = (t, v = 0.85, o) => { kicks.push(t); at(t, () => kick(ac, drums, t, v, o)); };
  const sendRev = (g, amt) => { const s = ac.createGain(); s.gain.value = amt; g.connect(s); s.connect(rev); };
  const padAt = (t, notes, dur, v, opts) => at(t, () => sendRev(pad(ac, music, t, notes, dur, v, opts), 0.7));
  const bellAt = (t, m, v = 0.06, decay = 2.2, p = 0, r = 0.9) => at(t, () => { const g = ac.createGain(); bell(ac, g, t, m, v, decay, p); g.connect(music); sendRev(g, r); });
  const pl = (t, m, v, o = {}) => at(t, () => { const g = pluck(ac, music, t, m, v, o); if (o.send) { const s = ac.createGain(); s.gain.value = o.send; g.connect(s); s.connect(delay); } });
  const grid = (a, b, step, fn) => { for (let t = a, i = 0; t < b - 1e-6; t += step, i++) fn(t, i); };

  // ---------------------------------------------------------------- 1–2 · hook, name: no music

  // ---------------------------------------------------------------- 3–5 · feet first, the tide, closer
  const s0 = CUT.feet, s1 = CUT.stretch;
  at(s0, () => subDrop(ac, music, s0, 0.35, 1.6));
  grid(s0, s1, BEAT, (t, i) => { K(t, i % 4 === 0 ? 0.62 : 0.45, { tight: true }); if (i % 2) at(t, () => hat(ac, drums, t, 0.05, false, 0.2)); });
  grid(s0, s1, E16, (t, i) => {
    const c = chord(SET, s0, t);
    pl(t, c.arp[[0, 2, 1, 3, 2, 1, 3, 2][i % 8]] + 12, 0.02, { decay: 0.12, cutoff: 3400, p: i % 2 ? 0.5 : -0.5, send: 0.35 });
    if (i % 4 === 0) at(t, () => bass(ac, music, t, c.bass, 0.2, 0.22, 0.3));
  });
  grid(s0, s1, BAR, (t) => padAt(t, chord(SET, s0, t).pad, BAR - 0.05, 0.04, { cutoff: 1500, attack: 0.4, release: 0.4 }));
  at(CUT.closer, () => playSfx(ac, fx, { t: CUT.closer, type: 'riser', gain: 0.28, dur: s1 - CUT.closer }));

  // ---------------------------------------------------------------- 6–7 · stretch: strings climbing, paste: a wink
  const st = CUT.stretch, pe = CUT.atoms;
  [[st, [62, 65, 69]], [W_('s06', 7), [63, 66, 70]], [W_('s06', 13), [64, 67, 71]]].forEach(([t, n], i, arr) => {
    const end = i + 1 < arr.length ? arr[i + 1][0] : CUT.paste;
    padAt(t, n, end - t, 0.035 + i * 0.012, { cutoff: 1800 + i * 900, attack: 0.25, release: 0.05 });
  });
  grid(st, CUT.paste, BEAT * 2, (t) => { K(t, 0.55, { tight: true }); K(t + 0.2, 0.38, { tight: true }); });
  grid(CUT.paste, pe, E8, (t, i) => pl(t, [74, 77, 81, 77][i % 4], 0.03, { decay: 0.08, cutoff: 3800, p: i % 2 ? 0.4 : -0.4 }));

  // ---------------------------------------------------------------- 8 · atoms: into the hole
  const td = W_('s08', 10) + 0.3;
  padAt(pe, [38, 50, 57], CUT.absurd - pe, 0.06, { cutoff: 700, attack: 0.5, release: 0.1 });
  at(W_('s08', 6), () => playSfx(ac, fx, { t: W_('s08', 6), type: 'riser', gain: 0.32, dur: td - W_('s08', 6) }));
  at(td, () => subDrop(ac, music, td, 0.9, 2.2));

  // ---------------------------------------------------------------- 9–10 · the absurd part: half-time groove
  const a0 = CUT.absurd, a1 = CUT.giant;
  at(a0, () => crash(ac, drums, a0, 0.2, rev));
  grid(a0, a1, BEAT, (t, i) => {
    if (i % 4 === 0) K(t, 0.7);
    if (i % 4 === 2) at(t, () => snare(ac, drums, t, 0.26, rev));
    at(t, () => hat(ac, drums, t, 0.05, i % 2 === 1, 0.2));
  });
  grid(a0, a1, E8, (t, i) => { const c = chord(SET, a0, t); if (i % 2 === 0) at(t, () => bass(ac, music, t, c.bass, 0.22, 0.24, 0.5)); });
  grid(a0, a1, BAR, (t) => padAt(t, chord(SET, a0, t).pad, BAR - 0.05, 0.045, { cutoff: 1700, attack: 0.2, release: 0.3 }));
  at(W_('s10', 2), () => stab(ac, music, W_('s10', 2), [50, 56, 62, 68], 0.1, 0.4)); // "zerreißt"

  // ---------------------------------------------------------------- 11–12 · the giant edge, outside: pads only
  padAt(CUT.giant, [38, 45, 50, 57, 62], CUT.freeze - CUT.giant, 0.06, { cutoff: 1100, attack: 1.0, release: 0.4 });
  [[0, 74], [2, 72], [4, 69], [6, 77]].forEach(([b, m]) => bellAt(CUT.giant + 0.4 + b * BEAT, m, 0.035, 3));

  // ---------------------------------------------------------------- 13 · freeze: a ritardando that stops
  const f0 = CUT.freeze, fv = W_('s13', 12);
  padAt(f0, [38, 50, 57, 62], fv - f0 + 0.2, 0.05, { cutoff: 900, attack: 0.3, release: 0.05 });
  for (let t = f0, dt = BEAT, i = 0; t < fv - 0.05; t += dt, i++) {
    K(t, 0.5 - i * 0.015, { tight: true });
    pl(t, [74, 69, 65, 62][i % 4], 0.03, { decay: 0.3, cutoff: 2600 });
    if (t > W_('s13', 7)) dt *= 1.22;
  }

  // ---------------------------------------------------------------- 14 · the star: build to "Spaghetti"
  const b0 = CUT.star, bs = W_('s14', 14), be = DURATION - 0.5;
  at(b0, () => subDrop(ac, music, b0, 0.3, 1.4));
  grid(b0, bs - 0.05, BEAT, (t, i) => { K(t, 0.55 + 0.25 * (t - b0) / (bs - b0), { tight: true }); if (i % 2) at(t, () => clap(ac, drums, t, 0.18, rev)); });
  grid(b0, bs - 0.05, E16, (t, i) => {
    const c = chord(SET, b0, t);
    pl(t, c.arp[[0, 1, 2, 3][i % 4]] + 12, 0.022, { decay: 0.1, cutoff: 3800, p: i % 2 ? 0.5 : -0.5, send: 0.3 });
    if (i % 2) at(t, () => shaker(ac, drums, t, 0.03, 0.3));
  });
  grid(b0, bs, BAR, (t) => padAt(t, chord(SET, b0, t).pad, BAR - 0.05, 0.045, { cutoff: 2000, attack: 0.2, release: 0.2 }));
  at(W_('s14', 6), () => playSfx(ac, fx, { t: W_('s14', 6), type: 'riser', gain: 0.32, dur: bs - W_('s14', 6) }));
  at(bs, () => crash(ac, drums, bs, 0.3, rev));
  K(bs, 1);
  [62, 65, 69, 74, 77].forEach((m, i) => bellAt(bs + i * 0.04, m + 12, 0.045, 3, (i - 2) * 0.3, 1));
  padAt(bs, [38, 50, 57, 62, 65, 69], be - bs, 0.06, { cutoff: 1800, attack: 0.05, release: 0.05 });
  return kicks.sort((a, b) => a - b);
}
