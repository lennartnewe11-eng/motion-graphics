// Score of "Yamaguchi": 128.57 BPM (14 frames per beat), A minor. No music under the hook. A clockwork pulse from
// the date on (the last morning) that rises into the first flash and stops dead · a drone in the burns · the train
// rhythm home · the office pulse · only a clock at 11:02 · a heartbeat under "wieder" · warm bells for the
// recognition and the end · hard cut into the loop.
import { kick, clap, snare, hat, shaker, tom, crash, bass, pad, pluck, stab, bell, subDrop, playSfx } from '../../audio/kit.js';
import { L, W_, WE, CUT, BEAT, E8, E16, DURATION, FLASH1, FLASH2 } from './timeline.js';

const BAR = BEAT * 4;
const SET = [ // Am – F – C – E
  { pad: [45, 52, 57, 60], bass: 45, arp: [69, 72, 76, 81] },
  { pad: [41, 48, 53, 57], bass: 41, arp: [65, 69, 72, 77] },
  { pad: [48, 55, 60, 64], bass: 48, arp: [67, 72, 76, 79] },
  { pad: [40, 52, 56, 59], bass: 40, arp: [64, 68, 71, 76] },
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

  // ---------------------------------------------------------------- 1 · hook: no music

  // ---------------------------------------------------------------- 2–4 · the trip, the last morning, up to the flash
  const s0 = CUT.trip, f1 = FLASH1 - 0.02;
  at(s0, () => subDrop(ac, music, s0, 0.3, 1.4));
  grid(s0, CUT.last, BEAT, (t, i) => { K(t, i % 4 === 0 ? 0.6 : 0.42, { tight: true }); if (i % 2) at(t, () => hat(ac, drums, t, 0.05, false, 0.2)); });
  grid(s0, f1, E8, (t, i) => {
    const c = chord(SET, s0, t);
    pl(t, i % 2 ? c.arp[2] : c.arp[0], i % 2 ? 0.022 : 0.03, { decay: 0.06, cutoff: 2600, p: i % 2 ? 0.35 : -0.35 }); // the clock
    if (t < CUT.last) at(t, () => bass(ac, music, t, c.bass - 12 + (i % 2 ? 12 : 0), 0.15, 0.2, 0.3));
  });
  grid(s0, CUT.last, BAR, (t) => padAt(t, chord(SET, s0, t).pad, BAR - 0.05, 0.035, { cutoff: 1300, attack: 0.3, release: 0.4 }));
  // the last morning: strings creep up towards 8:15, then nothing
  [[CUT.last, [57, 60, 64]], [W_('y05', 5), [58, 61, 65]], [CUT.flash, [59, 62, 66]]].forEach(([t, n], i, arr) => {
    const end = i + 1 < arr.length ? arr[i + 1][0] : f1;
    padAt(t, n, end - t, 0.03 + i * 0.012, { cutoff: 1600 + i * 900, attack: 0.25, release: 0.01 });
  });
  grid(CUT.flash, f1, E16, (t) => at(t, () => snare(ac, drums, t, 0.03 + 0.18 * (t - CUT.flash) / (f1 - CUT.flash), rev)));
  at(CUT.flash, () => playSfx(ac, fx, { t: CUT.flash, type: 'riser', gain: 0.3, dur: f1 - CUT.flash }));
  at(FLASH1, () => subDrop(ac, music, FLASH1, 0.9, 2.6));
  at(FLASH1, () => crash(ac, drums, FLASH1, 0.35, rev));

  // ---------------------------------------------------------------- 5 · burns: a low drone
  padAt(CUT.burn, [33, 45, 52], CUT.shelter - CUT.burn, 0.07, { cutoff: 420, attack: 1.2, release: 0.6 });
  [[0, 76], [3, 72], [6, 69]].forEach(([b, m]) => bellAt(CUT.burn + 0.8 + b * BEAT, m, 0.03, 3, 0, 1.1));

  // ---------------------------------------------------------------- 6 · night, then the train rhythm home
  const td = W_('y08', 7);
  padAt(CUT.shelter, [33, 40, 45], td - CUT.shelter, 0.05, { cutoff: 380, attack: 0.8, release: 0.4 });
  grid(td, CUT.white, E8, (t, i) => {
    // train wheels: da-dum da-dum
    if (i % 4 === 0 || i % 4 === 1) K(t, i % 4 === 0 ? 0.5 : 0.32, { tight: true });
    at(t, () => hat(ac, drums, t, i % 2 ? 0.035 : 0.06, false, 0.2));
    const c = chord(SET, td, t);
    if (i % 2 === 0) at(t, () => bass(ac, music, t, c.bass - 12, 0.15, 0.2, 0.35));
    if (t >= CUT.boss) pl(t, c.arp[[0, 2, 1, 3][i % 4]], 0.02, { decay: 0.1, cutoff: 3200, p: i % 2 ? 0.4 : -0.4, send: 0.3 });
  });
  grid(td, CUT.white, BAR, (t) => padAt(t, chord(SET, td, t).pad, BAR - 0.05, 0.04, { cutoff: 1500, attack: 0.25, release: 0.3 }));
  at(W_('y10', 6), () => stab(ac, music, W_('y10', 6), [45, 52, 57, 60, 64], 0.09, 0.4)); // "Bombe"
  at(W_('y11', 5), () => stab(ac, music, W_('y11', 5), [46, 53, 58, 61], 0.08, 0.3)); // "verrückt": a wrong chord

  // ---------------------------------------------------------------- 10 · 11:02 — only the clock (sfx), then the flash
  at(FLASH2, () => subDrop(ac, music, FLASH2, 1, 2.8));
  at(FLASH2, () => crash(ac, drums, FLASH2, 0.4, rev));

  // ---------------------------------------------------------------- 11 · again: heartbeat, then the third hit
  const a0 = CUT.again, tb = W_('y13', 5) - 0.05;
  padAt(a0, [33, 45, 52, 57], CUT.recog - a0, 0.05, { cutoff: 600, attack: 0.6, release: 0.3 });
  grid(a0 + 0.2, CUT.recog, BEAT * 2, (t) => { K(t, 0.5, { tight: true }); K(t + 0.2, 0.34, { tight: true }); });
  at(tb, () => crash(ac, drums, tb, 0.3, rev));
  [69, 72, 76, 81].forEach((m, i) => bellAt(W_('y13', 8) + i * 0.04, m + 12, 0.04, 2.6, (i - 1.5) * 0.3, 1)); // "überlebt"

  // ---------------------------------------------------------------- 12–13 · recognition and the end: bells
  const r0 = CUT.recog, re = DURATION - 0.5;
  padAt(r0, [45, 52, 57, 60, 64], CUT.end93 - r0, 0.05, { cutoff: 1300, attack: 0.5, release: 0.2 });
  padAt(CUT.end93, [41, 48, 53, 57, 60], re - CUT.end93, 0.055, { cutoff: 1500, attack: 0.4, release: 0.05 });
  const line = [76, 74, 72, 69, 72, 71, 69, 64, 65, 67, 69, 72];
  line.forEach((m, i) => { const t = r0 + 0.3 + i * BEAT; if (t < re - 0.3) bellAt(t, m, 0.03, 2.2, i % 2 ? 0.3 : -0.3, 0.9); });
  grid(r0, re - 0.2, BEAT, (t, i) => { if (i % 2 === 0) K(t, 0.3, { tight: true }); });
  [57, 60, 64, 69, 72].forEach((m, i) => bellAt(W_('y15', 9) + i * 0.05, m + 12, 0.04, 3, (i - 2) * 0.3, 1)); // "gegen Atomwaffen"
  return kicks.sort((a, b) => a - b);
}
