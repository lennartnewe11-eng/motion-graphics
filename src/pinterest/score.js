// Score: 120 BPM, F major (F – Dm – B♭ – C, I–vi–IV–V). The arrangement follows the picture:
//  0–4    sketch & tap   : pencil-scratch groove, marimba motif, finger snaps, riser
//  4–11   scroll         : four-on-the-floor house groove, plucks, vocal chops when the camera rides
//  11     the catch      : everything tape-stops under the finger
//  12–20  tap & save     : half-time bounce, every save adds a layer, snare roll into the drop
//  20–30  machen         : full chorus, vocal-chop hook, crashes on the whip pans, cowbell for the dance
//  30–36  logo           : drop-out, pin thunk, the logo chord, soft outro with the motif
import { kick, clap, snare, hat, shaker, tom, crash, bass, pad, pluck, stab, bell, subDrop, playSfx, marimba, vox, snap, rim, cowbell, revCymbal } from '../audio/kit.js';

const BEAT = 0.5, BAR = 2, S16 = 0.125;
const CH = [
  { pad: [57, 60, 64, 65], bass: 41, arp: [65, 69, 72, 76], vox: 69 }, // Fmaj7
  { pad: [57, 60, 62, 65], bass: 38, arp: [62, 65, 69, 72], vox: 69 }, // Dm7
  { pad: [58, 62, 65, 69], bass: 34, arp: [62, 65, 70, 74], vox: 70 }, // Bbmaj7
  { pad: [55, 60, 64, 67], bass: 36, arp: [60, 64, 67, 72], vox: 67 }, // C
];
const chordAt = (t) => CH[Math.floor(t / BAR + 1e-6) % 4];
const ARP = [0, 1, 2, 3, 2, 1, 0, 2, 1, 3, 2, 0, 3, 2, 1, 2];
const between = (t, a, b) => t >= a - 1e-6 && t < b - 1e-6;
// silent windows (tape stop under the finger; drop-out before the logo)
const MUTE = [[11.0, 11.75], [29.96, 30.55]];
const muted = (t) => MUTE.some(([a, b]) => t >= a - 1e-6 && t < b - 1e-6);

export function scorePinterest(ac, bus, at) {
  const { drums, music, rev, delay } = bus;
  // this spot is sound-design heavy: sit the music lower than in the reels
  music.gain.value *= 0.58;
  drums.gain.value *= 0.82;
  bus.sfx.gain.value *= 1.1;
  const kicks = [];
  const K = (t, v = 0.9) => { if (muted(t)) return; kicks.push(t); at(t, () => kick(ac, drums, t, v)); };
  const D = (t, fn) => { if (!muted(t)) at(t, fn); };
  const send = (g, node, v) => { const s = ac.createGain(); s.gain.value = v; g.connect(s); s.connect(node); };

  // ------------------------------------------------------------ intro
  // marimba motif (call): F A C … answered later in the outro
  const MOTIF = [[0.0, 77], [0.25, 81], [0.5, 84], [1.0, 81], [1.5, 79], [1.75, 77]];
  for (const [dt, m] of MOTIF) D(0.5 + dt, () => { const p = marimba(ac, music, 0.5 + dt, m, 0.2, { p: 0.2 }); send(p, delay, 0.35); });
  for (const [dt, m] of MOTIF) D(2.5 + dt, () => { const p = marimba(ac, music, 2.5 + dt, m + 2, 0.18, { p: -0.2 }); send(p, delay, 0.35); });
  D(0, () => send(pad(ac, music, 0, CH[0].pad, 1.8, 0.05, { cutoff: 900, attack: 1.2, release: 0.6 }), rev, 0.8));
  D(2, () => send(pad(ac, music, 2, CH[1].pad, 1.8, 0.06, { cutoff: 1300, attack: 0.5, release: 0.4 }), rev, 0.8));
  for (let t = 2.0; t < 4; t += BEAT) if (Math.round(t / BEAT) % 2) D(t, () => snap(ac, drums, t, 0.35, 0.25));
  for (let t = 3.0; t < 4; t += S16) D(t, () => shaker(ac, drums, t, 0.02 + (t - 3) * 0.05, -0.3));
  D(3.0, () => playSfx(ac, { out: bus.sfx, rev, delay }, { t: 3.0, type: 'riser', gain: 0.5, dur: 1.0 }));
  D(3.5, () => revCymbal(ac, drums, 3.5, 0.5, 0.25));

  // ------------------------------------------------------------ drums
  for (let t = 4; t < 36; t += BEAT) {
    const beat = Math.round(t / BEAT) % 4;
    const house = between(t, 4, 11) || between(t, 20, 29.9);
    const half = between(t, 12, 20);
    const outro = between(t, 31, 35.5);
    if (house) K(t, between(t, 20, 30) ? 1.0 : 0.9);
    if (half) {
      if (beat === 0) K(t, 0.9);
      if (beat === 2 && between(t, 16, 20)) K(t, 0.7);
      if (beat === 1) K(t + 3 * S16, 0.55);
    }
    if (outro && beat === 0) K(t, 0.7);
    // backbeat
    if ((house || outro) && (beat === 1 || beat === 3)) D(t, () => clap(ac, drums, t, between(t, 20, 30) ? 0.42 : 0.32, rev));
    if (half && beat === 2) D(t, () => { clap(ac, drums, t, 0.4, rev); snare(ac, drums, t, 0.15, rev); });
    if (half && beat === 0) D(t + BEAT * 0.75, () => rim(ac, drums, t + BEAT * 0.75, 0.25, -0.3));
    // hats
    if (house || half || outro) {
      const off = t + BEAT / 2;
      const open = between(t, 8, 10) || between(t, 24, 29.9);
      D(off, () => hat(ac, drums, off, open ? 0.16 : 0.1, open, 0.22));
      if (house && between(t, 6, 11) || between(t, 20, 29.9)) D(t, () => { hat(ac, drums, t + S16, 0.05, false, -0.25); hat(ac, drums, t + 3 * S16, 0.06, false, -0.25); });
    }
    if (between(t, 27.5, 29.9)) D(t + S16 * 2, () => cowbell(ac, drums, t + S16 * 2, beat % 2 ? 0.08 : 0.12, 0.35));
  }
  for (let t = 12; t < 20; t += S16) D(t, () => shaker(ac, drums, t, Math.round(t / S16) % 2 ? 0.025 : 0.05, 0.3));
  const roll = (a, b, step, v0, v1) => { for (let t = a; t < b - 1e-6; t += step) D(t, () => snare(ac, drums, t, v0 + (v1 - v0) * ((t - a) / (b - a)), rev)); };
  roll(10.0, 11.0, S16, 0.06, 0.22);
  roll(18.0, 19.0, BEAT / 2, 0.08, 0.2);
  roll(19.0, 19.5, S16, 0.2, 0.32);
  roll(19.5, 20.0, S16 / 2, 0.32, 0.46);
  roll(29.15, 29.9, S16, 0.08, 0.3);
  [[11.75, 220], [11.81, 190], [11.875, 160], [11.94, 130]].forEach(([t, f]) => at(t, () => tom(ac, drums, t, 0.45, f)));
  for (const t of [4, 6, 8, 12, 20, 22.5, 25, 27.5]) D(t, () => crash(ac, drums, t, t === 20 ? 0.34 : 0.2, rev));
  for (const t of [22.5, 25, 27.5]) D(t - 0.5, () => revCymbal(ac, drums, t - 0.5, 0.5, 0.22));

  // ------------------------------------------------------------- bass
  const bline = (a, b, mode, v) => {
    for (let t = a; t < b - 1e-6; t += S16) {
      const pos = Math.round((t % BEAT) / S16), c = chordAt(t), bi = Math.round(t / BEAT) % 8;
      if (muted(t)) continue;
      if (mode === 'house' && (pos === 2 || (pos === 3 && bi % 4 === 3))) at(t, () => bass(ac, music, t, c.bass + (pos === 3 ? 12 : 0), 0.18, v, 0.5));
      if (mode === 'bounce' && (pos === 0 && bi % 2 === 0 || pos === 3)) at(t, () => bass(ac, music, t, c.bass + (pos === 3 ? 7 : 0), pos === 0 ? 0.32 : 0.1, v, 0.65));
      if (mode === 'drive' && pos !== 0) at(t, () => bass(ac, music, t, c.bass + (pos === 2 ? 12 : 0), 0.1, v, 0.8));
      if (mode === 'soft' && pos === 0 && bi % 2 === 0) at(t, () => bass(ac, music, t, c.bass, 0.8, v, 0.2));
    }
  };
  bline(4, 11, 'house', 0.3);
  bline(12, 20, 'bounce', 0.3);
  bline(20, 29.9, 'drive', 0.3);
  bline(31, 35.5, 'soft', 0.24);

  // ------------------------------------------------------- pads + stabs
  const padBar = (t, v, opts, notes) => D(t, () => send(pad(ac, music, t, notes || chordAt(t).pad, BAR - 0.08, v, opts), rev, 0.7));
  for (let t = 4; t < 11; t += BAR) padBar(t, 0.03, { cutoff: 1500 + (t - 4) * 150, attack: 0.15, release: 0.4 });
  for (let t = 12; t < 20; t += BAR) padBar(t, 0.035, { cutoff: 1100 + (t - 12) * 200, attack: 0.3, release: 0.4 });
  for (let t = 20; t < 29.9; t += BAR) padBar(t, 0.05, { cutoff: 2600, attack: 0.05, release: 0.5 });
  for (let t = 20; t < 29.9; t += BEAT) if (Math.round(t / BEAT) % 2 === 1) D(t + S16 * 2, () => stab(ac, music, t + S16 * 2, chordAt(t).pad.map((m) => m + 12), 0.06, 0.2));
  for (let t = 6; t < 11; t += BEAT) if (Math.round(t / BEAT) % 4 === 3) D(t + S16 * 2, () => stab(ac, music, t + S16 * 2, chordAt(t).pad.map((m) => m + 12), 0.05, 0.18));

  // --------------------------------------------------------- plucks/arps
  const arp = (a, b, step, v, { oct = 0, cutoff = 2800, decay = 0.18, sendV = 0.35, inst = 'pluck' } = {}) => {
    for (let t = a; t < b - 1e-6; t += step) {
      if (muted(t)) continue;
      const i = Math.round(t / step), m = chordAt(t).arp[ARP[i % 16]] + oct, acc = i % 4 === 0 ? 1 : 0.7;
      at(t, () => {
        const g = inst === 'marimba' ? marimba(ac, music, t, m, v * acc * 2.2, { p: i % 2 ? 0.35 : -0.35, decay: 0.3 }) : pluck(ac, music, t, m, v * acc, { decay, cutoff, p: i % 2 ? 0.4 : -0.4 });
        send(g, delay, sendV);
      });
    }
  };
  arp(4, 11, S16, 0.045, { cutoff: 2600 });
  arp(12, 20, S16 * 2, 0.06, { inst: 'marimba', sendV: 0.45 });
  arp(16, 20, S16, 0.03, { oct: 12, cutoff: 3800, decay: 0.12 });
  arp(20, 29.9, S16, 0.045, { oct: 12, cutoff: 4400, decay: 0.13 });

  // ------------------------------------------------------- vocal chops
  // camera ride (6–10): airy "ah" swells; chorus (20–30): a chopped hook
  for (const [t, m, d, v] of [[6.0, 69, 0.9, 'a'], [7.0, 72, 0.9, 'o'], [8.0, 74, 0.9, 'a'], [9.0, 77, 0.8, 'e']]) D(t, () => send(vox(ac, music, t, m, d, 0.05, { vowel: v, to: 'a', p: 0.2 }), rev, 0.6));
  const HOOK = [[0, 0, 'a'], [0.75, 0, 'o'], [1.0, 3, 'a'], [1.5, 2, 'e'], [2.25, 0, 'a'], [2.5, -1, 'o'], [3.0, 0, 'a'], [3.5, 4, 'i']];
  const scale = [65, 67, 69, 70, 72, 74, 76, 77, 79, 81];
  for (let bar2 = 20; bar2 < 29.9; bar2 += 4) {
    for (const [dt, deg, v] of HOOK) {
      const t = bar2 + dt;
      if (t >= 29.9) continue;
      const base = scale.indexOf(chordAt(t).vox) >= 0 ? scale.indexOf(chordAt(t).vox) : 2;
      const m = scale[Math.max(0, Math.min(scale.length - 1, base + deg))];
      D(t, () => { const g = vox(ac, music, t, m, 0.22, 0.06, { vowel: v, p: dt % 1 ? 0.3 : -0.3, glide: dt === 0 ? -2 : 0 }); send(g, delay, 0.3); send(g, rev, 0.3); });
    }
  }

  // ----------------------------------------------- outro: the motif answers
  D(30.95, () => send(pad(ac, music, 30.95, [41, 53, 57, 60, 64, 69], 3.0, 0.08, { cutoff: 2200, attack: 0.04, release: 2.2 }), rev, 0.9));
  D(33.0, () => send(pad(ac, music, 33.0, [46, 58, 62, 65, 69], 1.9, 0.06, { cutoff: 1800, attack: 0.3, release: 0.8 }), rev, 0.9));
  D(34.0, () => send(pad(ac, music, 34.0, [41, 53, 60, 65, 69, 72, 77], 1.9, 0.08, { cutoff: 2400, attack: 0.02, release: 2.0 }), rev, 1));
  for (const [dt, m] of [[0, 77], [0.25, 81], [0.5, 84], [1.0, 89]]) D(32.0 + dt, () => send(marimba(ac, music, 32.0 + dt, m, 0.2, { p: 0.15 }), delay, 0.4));
  for (const [dt, m] of [[0, 84], [0.25, 81], [0.5, 77], [0.75, 72], [1.0, 77]]) D(34.0 + dt, () => send(marimba(ac, music, 34.0 + dt, m, 0.18, { p: -0.15 }), delay, 0.4));

  // ---------------------------------------------- arrangement effects
  const fx = { out: bus.sfx, rev, delay };
  D(10.2, () => playSfx(ac, fx, { t: 10.2, type: 'riser', gain: 0.35, dur: 0.8 }));
  D(17.0, () => playSfx(ac, fx, { t: 17.0, type: 'riser', gain: 0.55, dur: 3.0 }));
  D(28.9, () => playSfx(ac, fx, { t: 28.9, type: 'riser', gain: 0.45, dur: 1.05 }));
  for (const t of [4, 12, 20]) D(t, () => subDrop(ac, music, t, t === 20 ? 0.55 : 0.4, 1.4));
  D(30.95, () => subDrop(ac, music, 30.95, 0.5, 1.8));
  // hard stops on the music + drum buses (the tape-stop under the finger, the drop-out before the logo)
  for (const [a, b] of MUTE) for (const g of [music.gain, drums.gain]) {
    const base = g.value;
    if (base === 0) continue;
    g.setValueAtTime(base, a - 0.03);
    g.linearRampToValueAtTime(0.0001, a + 0.09);
    g.setValueAtTime(0.0001, b - 0.02);
    g.linearRampToValueAtTime(base, b + 0.01);
  }
  return kicks.sort((a, b) => a - b);
}
