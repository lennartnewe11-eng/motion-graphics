// Score for "Flow": 120 BPM, D minor (Dm – Bb – F – C). The arrangement follows the one-take:
// heartbeat intro, groove on FLOW, a driving tunnel, the drop into the dot field,
// a half-time liquid section, a plucky card groove, and a wide, warm landing on the logo.
import { kick, clap, snare, hat, shaker, tom, crash, bass, pad, pluck, stab, bell, subDrop, playSfx } from '../audio/kit.js';

const BEAT = 0.5, BAR = 2, S16 = 0.125;
const CH = [
  { pad: [57, 62, 65, 69], bass: 38, arp: [62, 65, 69, 74] }, // Dm
  { pad: [58, 62, 65, 70], bass: 34, arp: [62, 65, 70, 74] }, // Bb
  { pad: [57, 60, 65, 69], bass: 41, arp: [60, 65, 69, 72] }, // F
  { pad: [55, 60, 64, 67], bass: 36, arp: [60, 64, 67, 72] }, // C
];
const chordAt = (t) => CH[Math.floor(t / BAR) % 4];
const ARP = [0, 2, 1, 3, 2, 1, 3, 2, 0, 3, 2, 1, 2, 3, 1, 2];
const between = (t, a, b) => t >= a - 1e-6 && t < b - 1e-6;

export function scheduleFlowScore(ac, bus, at) {
  const { drums, music, rev, delay } = bus;
  const kicks = [];
  const K = (t, v = 0.9) => { kicks.push(t); at(t, () => kick(ac, drums, t, v)); };

  // ------------------------------------------------------------ drums
  for (let t = 6; t < 50; t += BEAT) {
    const beat = Math.round(t / BEAT) % 4; // 0..3 within the bar
    const groove = between(t, 6, 13) || between(t, 14, 21.75) || between(t, 22, 29) || between(t, 36, 40.5);
    const half = between(t, 30, 36);
    if (groove) K(t, between(t, 22, 29) ? 1.0 : 0.88);
    if (half && beat === 0) K(t, 0.85);
    if (half && beat === 1) K(t + S16 * 2, 0.6); // syncopated ghost kick
    // backbeat
    if (groove && (beat === 1 || beat === 3)) at(t, () => clap(ac, drums, t, between(t, 22, 29) ? 0.45 : 0.34, rev));
    if (half && beat === 2) at(t, () => clap(ac, drums, t, 0.42, rev));
    // hats
    if (groove || half) {
      const off = t + BEAT / 2;
      const open = between(t, 22, 29) || between(t, 18, 21.75);
      at(off, () => hat(ac, drums, off, open ? 0.15 : 0.11, open, 0.2));
      if (between(t, 14, 21.75) || between(t, 22, 29) || between(t, 36, 40.5)) {
        at(t, () => { hat(ac, drums, t + S16, 0.05, false, -0.25); hat(ac, drums, t + 3 * S16, 0.06, false, -0.25); });
      }
    }
  }
  for (let t = 30; t < 36; t += S16) at(t, () => shaker(ac, drums, t, (Math.round(t / S16) % 2 ? 0.035 : 0.06), 0.3));
  const roll = (a, b, step, v0, v1) => {
    for (let t = a; t < b - 1e-6; t += step) at(t, () => snare(ac, drums, t, v0 + (v1 - v0) * ((t - a) / (b - a)), rev));
  };
  roll(12.0, 13.0, S16, 0.06, 0.25);
  roll(20.0, 21.0, BEAT / 2, 0.08, 0.2);
  roll(21.0, 21.5, S16, 0.2, 0.33);
  roll(21.5, 21.75, S16 / 2, 0.33, 0.45);
  roll(41.0, 41.75, S16, 0.1, 0.32);
  [[28.5, 200], [28.625, 170], [28.75, 150], [28.875, 120]].forEach(([t, f]) => at(t, () => tom(ac, drums, t, 0.5, f)));
  for (const t of [6, 14, 22, 30, 36]) at(t, () => crash(ac, drums, t, t === 22 ? 0.32 : 0.18, rev));

  // ------------------------------------------------------------- bass
  const line = (a, b, mode, v) => {
    for (let t = a; t < b - 1e-6; t += S16) {
      const pos = Math.round((t % BEAT) / S16);
      const c = chordAt(t);
      if (mode === 'off' && pos === 2) at(t, () => bass(ac, music, t, c.bass + (Math.round(t / BEAT) % 2 ? 12 : 0), 0.2, v, 0.45));
      if (mode === 'roll' && pos !== 0) at(t, () => bass(ac, music, t, c.bass + (pos === 2 ? 12 : 0), 0.1, v, 0.75));
    }
  };
  line(6, 13, 'off', 0.3);
  line(14, 21.75, 'roll', 0.28);
  line(22, 29, 'roll', 0.33);
  line(36, 40.5, 'off', 0.28);
  // liquid: long gliding notes with a slow filter
  for (let t = 30; t < 36; t += 1) at(t, () => bass(ac, music, t, chordAt(t).bass, 0.85, 0.3, 0.15 + 0.1 * Math.sin(t)));

  // ------------------------------------------------------------- pads
  const padBar = (t, v, opts, notes) => at(t, () => {
    const g = pad(ac, music, t, notes || chordAt(t).pad, BAR - 0.1, v, opts);
    const s = ac.createGain(); s.gain.value = 0.7; g.connect(s); s.connect(rev);
  });
  padBar(0, 0.09, { cutoff: 800, attack: 1.4, release: 0.6 });
  padBar(2, 0.1, { cutoff: 1100, attack: 0.6, release: 0.5 });
  padBar(4, 0.11, { cutoff: 1700, attack: 0.4, release: 0.4 });
  for (let t = 6; t < 13; t += BAR) padBar(t, 0.03, { cutoff: 1500, attack: 0.2, release: 0.5 });
  padBar(13, 0.08, { cutoff: 1200, attack: 0.5, release: 0.4 }, CH[2].pad);
  for (let t = 14; t < 22; t += BAR) padBar(t, 0.035, { cutoff: 1300 + (t - 14) * 180, attack: 0.1, release: 0.3 });
  for (let t = 22; t < 29; t += BEAT) {
    const c = chordAt(t);
    at(t, () => stab(ac, music, t + BEAT / 2, c.pad.map((m) => m + 12), 0.07, 0.22));
  }
  for (let t = 30; t < 36; t += BAR) padBar(t, 0.08, { cutoff: 2000, attack: 0.5, release: 0.8 });
  for (let t = 36; t < 42; t += BAR) padBar(t, 0.03, { cutoff: 1800, attack: 0.1, release: 0.4 });
  const wide = (t, notes, dur, v, cutoff) => at(t, () => {
    const g = pad(ac, music, t, notes, dur, v, { cutoff, attack: 0.06, release: 2.2 });
    const s = ac.createGain(); s.gain.value = 0.9; g.connect(s); s.connect(rev);
  });
  wide(42, [38, 50, 57, 62, 65, 69], 1.9, 0.09, 2600);
  wide(44, [34, 50, 58, 62, 65, 70], 1.9, 0.08, 2200);
  wide(46, [41, 53, 60, 65, 69, 72], 1.4, 0.07, 2000);
  wide(48.15, [38, 50, 57, 62, 65, 69, 74], 1.4, 0.06, 1800);

  // ------------------------------------------------------------- arps
  const arp = (a, b, step, v, { oct = 0, cutoff = 2600, decay = 0.2, send = 0.35 } = {}) => {
    for (let t = a; t < b - 1e-6; t += step) {
      const i = Math.round(t / step);
      const m = chordAt(t).arp[ARP[i % 16]] + oct;
      const acc = i % 4 === 0 ? 1 : 0.7;
      at(t, () => {
        const g = pluck(ac, music, t, m, v * acc, { decay, cutoff, p: i % 2 ? 0.4 : -0.4 });
        const s = ac.createGain(); s.gain.value = send; g.connect(s); s.connect(delay);
      });
    }
  };
  arp(4.0, 6.0, S16, 0.04, { cutoff: 1400, decay: 0.15 });
  arp(6, 13, S16, 0.05, { cutoff: 2400 });
  arp(14, 21.75, S16, 0.05, { oct: 12, cutoff: 3200, decay: 0.14 });
  arp(22, 29, S16, 0.045, { oct: 12, cutoff: 4200, decay: 0.14 });
  arp(30, 36, BEAT / 2, 0.06, { cutoff: 1800, decay: 0.4, send: 0.6 });
  arp(36, 40.5, S16, 0.055, { cutoff: 3000, decay: 0.18 });

  // bells: intro motif and the landing
  [[0.7, 74], [1.73, 77], [2.6, 81], [3.86, 86]].forEach(([t, m]) => at(t, () => {
    const g = ac.createGain(); bell(ac, g, t, m, 0.07, 2.0, 0.2); g.connect(music);
    const s = ac.createGain(); s.gain.value = 0.8; g.connect(s); s.connect(rev);
  }));
  [[42.6, 74], [42.85, 77], [43.1, 81], [43.62, 86], [44.6, 84], [46.62, 81], [48.15, 86]].forEach(([t, m], i) => at(t, () => {
    const g = ac.createGain(); bell(ac, g, t, m, 0.075, 2.4, (i - 3) * 0.25); g.connect(music);
    const s = ac.createGain(); s.gain.value = 0.85; g.connect(s); s.connect(rev);
  }));

  // ---------------------------------------------- arrangement effects
  const fx = { out: bus.sfx, rev, delay };
  at(4.6, () => playSfx(ac, fx, { t: 4.6, type: 'riser', gain: 0.5, dur: 1.4 }));
  at(12.9, () => playSfx(ac, fx, { t: 12.9, type: 'suck', gain: 0.4, dur: 1.1 }));
  at(28.9, () => playSfx(ac, fx, { t: 28.9, type: 'riser', gain: 0.45, dur: 1.1 }));
  at(40.6, () => playSfx(ac, fx, { t: 40.6, type: 'riser', gain: 0.6, dur: 1.4 }));
  at(6, () => subDrop(ac, music, 6, 0.4, 1.0));
  at(22, () => subDrop(ac, music, 22, 0.55, 1.8));
  at(30, () => subDrop(ac, music, 30, 0.35, 1.2));

  return kicks.sort((a, b) => a - b);
}
