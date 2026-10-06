// Score of "Die Melasse-Flut": 128.57 BPM (14 frames per beat), D minor, every section follows the story:
// no music under the hook (sound design only) · a ticking clockwork groove that starts on "Boston" (Boston,
// the tank) · heartbeat and rising strings (the rattle, the rivets) · two beats of nothing · chaos (the
// wave) · bells in the cold (the dead) · the pulse returns (the company) · a music box for "süß".
import { kick, clap, snare, hat, shaker, tom, crash, bass, pad, pluck, stab, bell, subDrop, playSfx } from '../../audio/kit.js';
import { L, W_, CUT, BEAT, E8, E16, DURATION } from './timeline.js';

const BAR = BEAT * 4;
// D minor progressions (midi)
const SET = [ // Dm – Bb – Gm – A
  { pad: [50, 57, 62, 65], bass: 38, arp: [62, 65, 69, 74] },
  { pad: [50, 58, 62, 65], bass: 34, arp: [62, 65, 70, 74] },
  { pad: [50, 55, 58, 62], bass: 43, arp: [62, 67, 70, 74] },
  { pad: [49, 57, 61, 64], bass: 45, arp: [61, 64, 69, 73] },
];
const CHAOS = [ // Dm – Bb – C – A
  SET[0], SET[1], { pad: [48, 55, 60, 64], bass: 36, arp: [60, 64, 67, 72] }, SET[3],
];
const MAD = [ // Gm – Dm – Bb – A
  SET[2], SET[0], SET[1], SET[3],
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

  // ---------------------------------------------------------------- 1–2 · HOOK: no music — only the world
  // (the wave, the people, the syrup). The score enters with the story, on "Boston".

  // ---------------------------------------------------------------- 3–5 · SETUP: clockwork groove
  const s0 = CUT.boston, s1 = CUT.rattle;
  grid(s0, s1, BEAT, (t, i) => {
    K(t, i % 4 === 0 ? 0.75 : 0.55, { tight: true });
    if (t >= CUT.tank && (i % 4 === 1 || i % 4 === 3)) at(t, () => clap(ac, drums, t, 0.22, rev));
  });
  grid(s0, s1, E8, (t, i) => {
    if (i % 2) at(t, () => hat(ac, drums, t, 0.07, false, 0.25));
    const c = chord(SET, s0, t);
    // the "clock": a dry pluck ticking on eighths (tick-tock = root / fifth)
    pl(t, i % 2 ? c.arp[2] + 12 : c.arp[0] + 12, i % 2 ? 0.03 : 0.045, { decay: 0.07, cutoff: 2600, p: i % 2 ? 0.35 : -0.35 });
    at(t, () => bass(ac, music, t, c.bass + (i % 2 ? 12 : 0), 0.16, 0.2, 0.25));
  });
  grid(s0, s1, BAR, (t) => padAt(t, chord(SET, s0, t).pad, BAR - 0.05, t >= CUT.inside ? 0.05 : 0.03, { cutoff: 1300, attack: 0.3, release: 0.4 }));
  grid(CUT.inside, s1, E16, (t, i) => {
    if (i % 2) at(t, () => shaker(ac, drums, t, 0.035, 0.3));
    const c = chord(SET, s0, t);
    pl(t, c.arp[[0, 1, 2, 3, 2, 1, 3, 2][i % 8]] + 12, 0.025, { decay: 0.12, cutoff: 3600, p: i % 2 ? 0.5 : -0.5, send: 0.3 });
  });
  at(CUT.tank, () => crash(ac, drums, CUT.tank, 0.12, rev));

  // ---------------------------------------------------------------- 6–7 · TENSION: heartbeat + rising strings
  const h0 = CUT.rattle, h1 = CUT.burst;
  grid(h0, h1, BEAT * 2, (t) => { K(t, 0.6, { tight: true }); K(t + 0.2, 0.42, { tight: true }); });
  at(h0, () => sendRev(pad(ac, music, h0, [38, 50, 57, 62], h1 - h0, 0.06, { cutoff: 600, attack: 1.5, release: 0.05 }), 0.5));
  // strings-like cluster creeping up a semitone at a time
  [[h0 + 0.5, [62, 65, 69]], [CUT.rivets, [63, 66, 70]], [CUT.rivets + BAR * 0.5, [64, 67, 71]]].forEach(([t, n], i, arr) => {
    const end = i + 1 < arr.length ? arr[i + 1][0] : h1;
    padAt(t, n, end - t, 0.035 + i * 0.012, { cutoff: 1800 + i * 900, attack: 0.25, release: 0.02 });
  });
  grid(CUT.rivets + BEAT * 2, h1 - 0.02, E16, (t, i) => at(t, () => snare(ac, drums, t, 0.04 + 0.22 * (t - CUT.rivets) / (h1 - CUT.rivets), rev)));
  at(CUT.rivets + 0.4, () => playSfx(ac, fx, { t: CUT.rivets + 0.4, type: 'riser', gain: 0.45, dur: h1 - CUT.rivets - 0.4 }));

  // ---------------------------------------------------------------- 8 · (two beats of nothing)

  // ---------------------------------------------------------------- 9–10 · CHAOS: the wave
  const c0 = CUT.wave - 0.12, c1 = CUT.deadly;
  at(c0, () => crash(ac, drums, c0, 0.4, rev));
  at(c0, () => subDrop(ac, music, c0, 0.7, 2.2));
  grid(CUT.wave, c1 - 0.3, BEAT, (t, i) => {
    K(t, 0.8);
    if (i % 2) at(t, () => snare(ac, drums, t, 0.32, rev));
    if (i % 8 === 7) [0, 1, 2, 3].forEach((k) => at(t + k * E16, () => tom(ac, drums, t + k * E16, 0.45, 180 - k * 25)));
  });
  grid(CUT.wave, c1 - 0.3, E16, (t, i) => {
    const c = chord(CHAOS, CUT.wave, t);
    at(t, () => hat(ac, drums, t, i % 2 ? 0.05 : 0.09, i % 4 === 2, 0.2));
    if (i % 4 !== 0) at(t, () => bass(ac, music, t, c.bass + (i % 4 === 2 ? 12 : 0), 0.09, 0.3, 0.8));
  });
  grid(CUT.wave, c1 - 0.3, BEAT, (t) => { const c = chord(CHAOS, CUT.wave, t); at(t + E8, () => stab(ac, music, t + E8, c.pad.map((m) => m + 12), 0.06, 0.18)); });
  grid(CUT.wave, c1 - 0.3, BAR, (t) => padAt(t, chord(CHAOS, CUT.wave, t).pad, BAR, 0.05, { cutoff: 2600, attack: 0.05, release: 0.2 }));
  at(CUT.crush, () => crash(ac, drums, CUT.crush, 0.25, rev));
  at(c1 - 0.6, () => playSfx(ac, fx, { t: c1 - 0.6, type: 'suck', gain: 0.4, dur: 0.6 }));

  // ---------------------------------------------------------------- 11–14 · GRIEF: cold bells
  const g0 = CUT.deadly, g1 = CUT.leak;
  padAt(g0, [38, 45, 50, 53], CUT.kids - g0, 0.07, { cutoff: 520, attack: 0.8, release: 1.5 });
  [[0, 74], [2, 72], [4, 69], [6, 65], [8, 67], [10, 64], [12, 62], [14, 61]].forEach(([b, m]) => {
    const t = g0 + BEAT + b * BEAT;
    if (t < CUT.kids - 0.2) bellAt(t, m, 0.045, 3, 0, 1.0);
  });
  // the cold: a glassy high cluster
  [86, 89, 93].forEach((m, i) => bellAt(CUT.cold + 0.6 + i * 0.12, m, 0.025, 4, (i - 1) * 0.5, 1));
  grid(CUT.stuck, CUT.kids, BEAT * 2, (t) => { K(t, 0.35, { tight: true }); K(t + 0.22, 0.25, { tight: true }); });
  // the children: a single, simple line (no drums, no pad)
  [[0, 69], [1.5, 67], [3, 65], [4, 64], [5, 62]].forEach(([b, m]) => bellAt(W_('m13', 3) + b * BEAT, m, 0.05, 3.5, 0, 1.1));
  padAt(W_('m13', 5), [50, 57, 62], g1 - W_('m13', 5), 0.035, { cutoff: 700, attack: 0.6, release: 0.5 });

  // ---------------------------------------------------------------- 15–17 · ANGER: the pulse returns
  const a0 = CUT.leak, a1 = CUT.smell;
  grid(a0, a1, BEAT, (t, i) => {
    const half = t >= CUT.harbor;
    if (!half || i % 2 === 0) K(t, half ? 0.5 : 0.66, { tight: true });
    if (!half && (i % 4 === 1 || i % 4 === 3)) at(t, () => snare(ac, drums, t, t >= CUT.paint ? 0.36 : 0.26, rev));
  });
  grid(a0, a1, E16, (t, i) => {
    const c = chord(MAD, a0, t);
    if (i % 2) at(t, () => hat(ac, drums, t, 0.05, false, -0.2));
    if (t < CUT.harbor || i % 2 === 0) pl(t, c.arp[[0, 2, 1, 3][i % 4]] + (t >= CUT.paint ? 12 : 0), 0.028, { decay: 0.1, cutoff: 3000, p: i % 2 ? 0.4 : -0.4, send: 0.25 });
    if (i % 2 === 0) at(t, () => bass(ac, music, t, c.bass, 0.11, 0.24, t >= CUT.paint ? 0.7 : 0.4));
  });
  grid(a0, a1, BAR, (t) => padAt(t, chord(MAD, a0, t).pad, BAR, 0.04, { cutoff: 1400, attack: 0.2, release: 0.3 }));
  at(W_('m15', 5), () => stab(ac, music, W_('m15', 5), [50, 55, 58, 62, 67], 0.12, 0.5));
  at(W_('m15', 5), () => crash(ac, drums, W_('m15', 5), 0.18, rev));
  at(CUT.paint, () => crash(ac, drums, CUT.paint, 0.14, rev));

  // ---------------------------------------------------------------- 18 · SWEET: a music box, a pause, "süß"
  const e0 = CUT.smell, pause = W_('m17', 10) - 0.05, sweet = W_('m17', 11);
  padAt(e0, [53, 57, 60, 65], pause - e0, 0.05, { cutoff: 1500, attack: 0.4, release: 0.1 });
  const box = [84, 81, 77, 81, 84, 89, 88, 84, 81, 79, 77, 76];
  box.forEach((m, i) => { const t = e0 + i * E8; if (t < pause) bellAt(t, m, 0.035, 1.4, (i % 2 ? 0.35 : -0.35), 0.7); });
  // "süß": F major chord in bells + warm pad, ringing out to the loop point
  [65, 69, 72, 77, 81].forEach((m, i) => bellAt(sweet + i * 0.035, m + 12, 0.05, 3.2, (i - 2) * 0.3, 1));
  padAt(sweet, [41, 53, 57, 60, 65], DURATION - sweet - 0.3, 0.06, { cutoff: 1700, attack: 0.05, release: 0.25 });
  at(sweet, () => subDrop(ac, music, sweet, 0.25, 1.5));
  return kicks.sort((a, b) => a - b);
}
