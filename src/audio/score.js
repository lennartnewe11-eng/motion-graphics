// The score: a 120 BPM track in A minor (Am – F – C – G), arranged to the picture.
// Bars are 2 s long, so every scene cut lands on a downbeat.
import { kick, clap, snare, hat, shaker, tom, crash, bass, pad, pluck, stab, bell, subDrop, playSfx } from './kit.js';

const BEAT = 0.5, BAR = 2, S16 = 0.125;
const CHORDS = [
  { pad: [57, 60, 64, 69], bass: 33, arp: [69, 72, 76, 81] }, // Am
  { pad: [57, 60, 65, 69], bass: 29, arp: [65, 69, 72, 77] }, // F
  { pad: [55, 60, 64, 67], bass: 36, arp: [67, 72, 76, 79] }, // C
  { pad: [55, 59, 62, 67], bass: 31, arp: [67, 71, 74, 79] }, // G
];
const chordAt = (t) => CHORDS[Math.floor(t / BAR) % 4];
const ARP = [0, 1, 2, 1, 3, 2, 1, 2, 0, 2, 1, 3, 2, 1, 3, 2];

// windows where drums rest (fills, breaths, pre-drop silences)
const KICK_REST = [[11.0, 12.0], [17.5, 18.0], [20.0, 24.0], [45.5, 50.0], [53.5, 99]];
const rests = (t, list) => list.some(([a, b]) => t >= a - 1e-6 && t < b - 1e-6);

export function kickTimes() {
  const out = [];
  for (let t = 4; t < 54; t += BEAT) if (!rests(t, KICK_REST)) out.push(t);
  // half-time feel in the outro
  return out.filter((t) => !(t >= 50 && (t / BEAT) % 2 === 1));
}

export function scheduleScore(ac, bus, at) {
  const { drums, music, rev, delay } = bus;
  const kicks = kickTimes();

  // ---------------------------------------------------------------- drums
  for (const t of kicks) at(t, () => kick(ac, drums, t, t >= 24 && t < 30 ? 1.0 : 0.88));
  for (let t = 4; t < 54; t += BEAT) {
    const beat = Math.round(t / BEAT);
    const inRest = rests(t, KICK_REST);
    if (inRest) continue;
    // backbeat
    if (beat % 2 === 1 && !(t >= 50)) at(t, () => clap(ac, drums, t, t >= 24 && t < 30 ? 0.45 : 0.36, rev));
    if (t >= 50 && beat % 4 === 2) at(t, () => clap(ac, drums, t, 0.3, rev));
    // hats
    const off = t + BEAT / 2;
    const openHat = (t >= 24 && t < 30) || (t >= 42 && t < 45.5);
    at(off, () => hat(ac, drums, off, openHat ? 0.16 : 0.12, openHat, 0.15));
    if ((t >= 12 && t < 18) || (t >= 24 && t < 42)) {
      at(t, () => hat(ac, drums, t + S16, 0.05, false, -0.2));
      at(t, () => hat(ac, drums, t + 3 * S16, 0.06, false, -0.2));
    }
  }
  // shakers in groove A2 / B
  for (let t = 12; t < 17.5; t += S16) at(t, () => shaker(ac, drums, t, ((t / S16) % 2 ? 0.05 : 0.08), 0.35));
  for (let t = 30; t < 42; t += S16) at(t, () => shaker(ac, drums, t, ((t / S16) % 2 ? 0.04 : 0.065), 0.35));

  // snare rolls into the big moments
  const roll = (a, b, step, v0, v1) => {
    for (let t = a; t < b - 1e-6; t += step) at(t, () => snare(ac, drums, t, v0 + (v1 - v0) * ((t - a) / (b - a)), rev));
  };
  roll(11.0, 12.0, S16, 0.08, 0.35);
  roll(22.0, 23.0, BEAT / 2, 0.08, 0.2);
  roll(23.0, 23.5, S16, 0.2, 0.32);
  roll(23.5, 23.75, S16 / 2, 0.32, 0.45);
  roll(44.0, 45.0, S16, 0.12, 0.3);
  roll(45.0, 45.5, S16 / 2, 0.3, 0.45);
  // tom fill into the particles
  [[17.5, 220], [17.625, 190], [17.75, 160], [17.875, 130]].forEach(([t, f]) => at(t, () => tom(ac, drums, t, 0.55, f)));
  // crashes on section downbeats
  for (const t of [4, 12, 24, 30, 36, 42]) at(t, () => crash(ac, drums, t, t === 24 ? 0.32 : 0.2, rev));

  // ------------------------------------------------------------------ bass
  const bassLine = (a, b, mode, v = 0.32) => {
    for (let t = a; t < b - 1e-6; t += S16) {
      const pos = Math.round((t % BEAT) / S16); // 0..3 within the beat
      const c = chordAt(t);
      if (mode === 'offbeat' && pos === 2) at(t, () => bass(ac, music, t, c.bass + (Math.round(t / BEAT) % 2 ? 12 : 0), 0.2, v, 0.45));
      if (mode === 'roll' && pos !== 0) at(t, () => bass(ac, music, t, c.bass + (pos === 2 ? 12 : 0), 0.1, v, 0.75));
      if (mode === 'drive' && pos !== 0) at(t, () => bass(ac, music, t, c.bass + (pos === 3 ? 12 : 0), 0.09, v, 0.6));
    }
  };
  bassLine(4, 11, 'offbeat');
  bassLine(12, 17.5, 'offbeat');
  bassLine(18, 20, 'offbeat', 0.3);
  bassLine(24, 30, 'roll', 0.34);
  bassLine(30, 42, 'offbeat', 0.29);
  bassLine(42, 45.5, 'drive', 0.31);
  // outro: long, warm notes
  [[50, 36], [51, 36], [52, 31], [53, 31]].forEach(([t, m]) => at(t, () => bass(ac, music, t, m, 0.8, 0.26, 0.2)));

  // ----------------------------------------------------------- pads/chords
  const padBar = (t, v, opts) => at(t, () => {
    const g = pad(ac, music, t, chordAt(t).pad, BAR - 0.1, v, opts);
    const s = ac.createGain(); s.gain.value = 0.6; g.connect(s); s.connect(rev);
  });
  padBar(0, 0.1, { cutoff: 1000, attack: 1.0, release: 0.8 });
  padBar(2, 0.11, { cutoff: 1400, attack: 0.5, release: 0.6 });
  for (let t = 4; t < 20; t += BAR) padBar(t, 0.03, { cutoff: 1500, attack: 0.3, release: 0.6 });
  padBar(20, 0.13, { cutoff: 1700, attack: 0.4, release: 0.5 });
  padBar(22, 0.15, { cutoff: 2800, attack: 0.3, release: 0.1 });
  for (let t = 30; t < 42; t += BAR) padBar(t, 0.026, { cutoff: 1700, attack: 0.2, release: 0.5 });
  // drop: chord stabs on the offbeats + a sustained bed
  for (let t = 24; t < 30; t += BEAT) {
    const c = chordAt(t);
    at(t, () => stab(ac, music, t + BEAT / 2, c.pad.map((m) => m + 12), 0.075, 0.24));
    if (Math.round(t / BEAT) % 4 === 3) at(t, () => stab(ac, music, t + 3 * S16, c.pad.map((m) => m + 12), 0.05, 0.12));
  }
  for (let t = 24; t < 30; t += BAR) padBar(t, 0.03, { cutoff: 2200, attack: 0.05, release: 0.3 });
  // montage: stabs on every beat
  for (let t = 42; t < 45.5; t += BEAT) at(t, () => stab(ac, music, t + BEAT / 2, chordAt(t).pad.map((m) => m + 12), 0.06, 0.18));
  // logo + end card: wide warm chords
  const wide = (t, notes, dur, v, cutoff) => at(t, () => {
    const g = pad(ac, music, t, notes, dur, v, { cutoff, attack: 0.08, release: 1.8 });
    const s = ac.createGain(); s.gain.value = 0.9; g.connect(s); s.connect(rev);
  });
  wide(46, [45, 57, 64, 69, 72], 1.9, 0.1, 2600);
  wide(48, [41, 57, 60, 65, 69], 1.9, 0.09, 2200);
  wide(50, [48, 55, 60, 64, 67], 1.9, 0.05, 1800);
  wide(52, [43, 55, 59, 62, 67], 1.9, 0.05, 1800);
  wide(54, [45, 57, 60, 64, 69, 76], 0.6, 0.06, 2400);

  // ------------------------------------------------------------- arps/lead
  const arp = (a, b, step, v, { oct = 0, cutoff = 2600, decay = 0.2, send = 0.35 } = {}) => {
    for (let t = a; t < b - 1e-6; t += step) {
      const i = Math.round(t / step);
      const c = chordAt(t);
      const m = c.arp[ARP[i % 16]] + oct;
      const acc = i % 4 === 0 ? 1 : 0.7;
      at(t, () => {
        const g = pluck(ac, music, t, m, v * acc, { decay, cutoff, p: (i % 2 ? 0.35 : -0.35) });
        const s = ac.createGain(); s.gain.value = send; g.connect(s); s.connect(delay);
      });
    }
  };
  arp(4, 11, S16, 0.05, { cutoff: 2200 });
  arp(12, 17.5, S16, 0.055, { cutoff: 3000 });
  arp(18, 20, S16, 0.05, { cutoff: 1800 });
  // breakdown: filter opens as the tension builds
  for (let t = 20; t < 23.75; t += S16) {
    const u = (t - 20) / 3.75;
    const i = Math.round(t / S16);
    at(t, () => {
      const g = pluck(ac, music, t, chordAt(t).arp[ARP[i % 16]], 0.09 + 0.05 * u, { cutoff: 700 + 5000 * u * u, decay: 0.18 + 0.1 * u, p: i % 2 ? 0.4 : -0.4 });
      const s = ac.createGain(); s.gain.value = 0.45; g.connect(s); s.connect(delay);
    });
  }
  arp(24, 30, S16, 0.045, { oct: 12, cutoff: 4200, decay: 0.15 });
  arp(30, 42, BEAT / 2, 0.06, { cutoff: 2800, decay: 0.25 });
  arp(50, 53.5, BEAT / 2, 0.045, { cutoff: 2000, decay: 0.3, send: 0.5 });

  // intro motif: a few soft bells answering the bouncing ball
  [[0.3, 76], [2.2, 81], [2.45, 79], [2.7, 76]].forEach(([t, m]) => at(t, () => {
    const g = ac.createGain(); g.gain.value = 1;
    bell(ac, g, t, m, 0.09, 1.8, 0.2);
    g.connect(music);
    const s = ac.createGain(); s.gain.value = 0.7; g.connect(s); s.connect(rev);
  }));
  // logo motif
  [[46.6, 76], [46.85, 81], [47.1, 84], [47.6, 83], [48.6, 81]].forEach(([t, m], i) => at(t, () => {
    const g = ac.createGain(); g.gain.value = 1;
    bell(ac, g, t, m, 0.08, 2.2, (i - 2) * 0.3);
    g.connect(music);
    const s = ac.createGain(); s.gain.value = 0.8; g.connect(s); s.connect(rev);
  }));

  // ------------------------------------------------- arrangement effects
  const fx = { out: bus.sfx, rev, delay };
  at(2.9, () => playSfx(ac, fx, { t: 2.9, type: 'riser', gain: 0.45, dur: 1.1 }));
  at(20.5, () => playSfx(ac, fx, { t: 20.5, type: 'riser', gain: 1.1, dur: 3.25 }));
  at(44.4, () => playSfx(ac, fx, { t: 44.4, type: 'riser', gain: 0.6, dur: 1.1 }));
  at(24, () => subDrop(ac, music, 24, 0.5, 1.6));
  at(4, () => subDrop(ac, music, 4, 0.35, 1.0));

  return kicks;
}
