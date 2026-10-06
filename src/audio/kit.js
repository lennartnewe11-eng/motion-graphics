// Synth kit: every drum, instrument and sound effect is synthesised with Web Audio nodes.
// All functions schedule into (ac, out) at absolute time t. Deterministic (seeded noise).

export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

let noiseBuf = null;
let seed = 0x1234;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
export function resetRandom() { seed = 0x1234; }

export function initKit(ac) {
  const len = ac.sampleRate * 3;
  noiseBuf = ac.createBuffer(2, len, ac.sampleRate);
  let s = 99;
  for (let c = 0; c < 2; c++) {
    const d = noiseBuf.getChannelData(c);
    for (let i = 0; i < len; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = s / 2147483648 - 1; }
  }
}

// --------------------------------------------------------------- utils ---
function gainNode(ac, v = 1) { const g = ac.createGain(); g.gain.value = v; return g; }
function noise(ac, t, dur) {
  const n = ac.createBufferSource();
  n.buffer = noiseBuf;
  n.loop = true;
  n.start(t, rnd() * 2, dur + 0.05);
  return n;
}
function osc(ac, type, f, t, dur, detune = 0) {
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.value = f;
  o.detune.value = detune;
  o.start(t);
  o.stop(t + dur + 0.05);
  return o;
}
function filt(ac, type, f, q = 0.7) { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
function pan(ac, p) { const s = ac.createStereoPanner(); s.pan.value = Math.max(-1, Math.min(1, p)); return s; }
// percussive envelope
function perc(g, t, peak, decay, attack = 0.002) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}
// attack/hold/release envelope
function ahr(g, t, peak, a, h, r) {
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.setValueAtTime(peak, t + a + h);
  g.gain.linearRampToValueAtTime(0, t + a + h + r);
}
function chain(...nodes) { for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); return nodes[nodes.length - 1]; }

// ---------------------------------------------------------------- drums ---
export function kick(ac, out, t, v = 1, { tight = false } = {}) {
  const o = osc(ac, 'sine', 160, t, 0.6);
  o.frequency.setValueAtTime(170, t);
  o.frequency.exponentialRampToValueAtTime(52, t + 0.07);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.4);
  const g = gainNode(ac, 0);
  perc(g, t, v, tight ? 0.28 : 0.45, 0.002);
  const sh = ac.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; curve[i] = Math.tanh(x * 1.8); }
  sh.curve = curve;
  chain(o, g, sh, out);
  // click transient
  const n = noise(ac, t, 0.02);
  const ng = gainNode(ac, 0);
  perc(ng, t, 0.25 * v, 0.012, 0.001);
  chain(n, filt(ac, 'highpass', 2500), ng, out);
}

export function clap(ac, out, t, v = 1, rev = null) {
  const bp = filt(ac, 'bandpass', 1400, 1.1);
  const g = gainNode(ac, 0);
  g.gain.setValueAtTime(0, t);
  for (let k = 0; k < 3; k++) {
    const tk = t + k * 0.011;
    g.gain.setValueAtTime(v, tk);
    g.gain.exponentialRampToValueAtTime(0.05 * v, tk + 0.009);
  }
  g.gain.setValueAtTime(v * 0.8, t + 0.034);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  const n = noise(ac, t, 0.3);
  chain(n, filt(ac, 'highpass', 600), bp, g, out);
  if (rev) { const s = gainNode(ac, 0.35); g.connect(s); s.connect(rev); }
}

export function snare(ac, out, t, v = 1, rev = null) {
  const n = noise(ac, t, 0.25);
  const g = gainNode(ac, 0);
  perc(g, t, v * 0.8, 0.16);
  chain(n, filt(ac, 'bandpass', 2200, 0.7), g, out);
  const o = osc(ac, 'triangle', 200, t, 0.2);
  o.frequency.exponentialRampToValueAtTime(150, t + 0.08);
  const og = gainNode(ac, 0);
  perc(og, t, v * 0.5, 0.09);
  chain(o, og, out);
  if (rev) { const s = gainNode(ac, 0.25); g.connect(s); s.connect(rev); }
}

export function hat(ac, out, t, v = 1, open = false, p = 0) {
  const n = noise(ac, t, open ? 0.4 : 0.08);
  const g = gainNode(ac, 0);
  perc(g, t, v, open ? 0.28 : 0.035, 0.001);
  chain(n, filt(ac, 'highpass', 7500), filt(ac, 'peaking', 10500, 1.5), g, pan(ac, p), out);
}

export function shaker(ac, out, t, v = 1, p = 0.3) {
  const n = noise(ac, t, 0.1);
  const g = gainNode(ac, 0);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + 0.018);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
  chain(n, filt(ac, 'bandpass', 6500, 1.2), g, pan(ac, p), out);
}

export function tom(ac, out, t, v, f) {
  const o = osc(ac, 'sine', f, t, 0.4);
  o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.25);
  const g = gainNode(ac, 0);
  perc(g, t, v, 0.3);
  chain(o, g, out);
}

export function crash(ac, out, t, v = 1, rev = null) {
  const n = noise(ac, t, 2.5);
  const g = gainNode(ac, 0);
  perc(g, t, v, 2.2, 0.003);
  chain(n, filt(ac, 'highpass', 3500), filt(ac, 'peaking', 8000, 0.8), g, out);
  if (rev) { const s = gainNode(ac, 0.3); g.connect(s); s.connect(rev); }
}

// --------------------------------------------------------- instruments ---
export function bass(ac, out, t, midi, dur, v = 1, bright = 0.5) {
  const f = mtof(midi);
  const g = gainNode(ac, 0);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + 0.006);
  g.gain.setTargetAtTime(v * 0.7, t + 0.03, 0.08);
  g.gain.setValueAtTime(v * 0.7, t + dur);
  g.gain.linearRampToValueAtTime(0, t + dur + 0.04);
  const lp = filt(ac, 'lowpass', 200, 4);
  lp.frequency.setValueAtTime(220, t);
  lp.frequency.linearRampToValueAtTime(400 + 1600 * bright, t + 0.012);
  lp.frequency.setTargetAtTime(240, t + 0.02, 0.07);
  const a = osc(ac, 'sawtooth', f, t, dur + 0.05, -6);
  const b = osc(ac, 'square', f, t, dur + 0.05, 6);
  const bg = gainNode(ac, 0.5);
  a.connect(lp); b.connect(bg); bg.connect(lp);
  lp.connect(g);
  const sub = osc(ac, 'sine', f, t, dur + 0.05);
  const sg = gainNode(ac, 0.9);
  sub.connect(sg); sg.connect(g);
  g.connect(out);
}

export function pad(ac, out, t, notes, dur, v = 1, { cutoff = 1600, attack = 0.5, release = 1.2 } = {}) {
  const g = gainNode(ac, 0);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + attack);
  g.gain.setValueAtTime(v, t + dur);
  g.gain.linearRampToValueAtTime(0, t + dur + release);
  const lp = filt(ac, 'lowpass', cutoff, 0.6);
  lp.connect(g);
  g.connect(out);
  notes.forEach((m, i) => {
    for (const [dt, p] of [[-9, -0.6], [0, 0], [9, 0.6]]) {
      const o = osc(ac, 'sawtooth', mtof(m), t, dur + release, dt + i * 1.3);
      const og = gainNode(ac, 0.18);
      chain(o, og, pan(ac, p * 0.8), lp);
    }
  });
  return lp;
}

export function pluck(ac, out, t, midi, v = 1, { decay = 0.22, cutoff = 3200, type = 'square', p = 0 } = {}) {
  const o = osc(ac, type, mtof(midi), t, decay + 0.1);
  const o2 = osc(ac, 'sawtooth', mtof(midi), t, decay + 0.1, 7);
  const lp = filt(ac, 'lowpass', cutoff, 2);
  lp.frequency.setValueAtTime(cutoff, t);
  lp.frequency.exponentialRampToValueAtTime(300, t + decay);
  const g = gainNode(ac, 0);
  perc(g, t, v, decay, 0.002);
  const og = gainNode(ac, 0.5);
  o.connect(lp); o2.connect(og); og.connect(lp);
  chain(lp, g, pan(ac, p), out);
  return g;
}

export function stab(ac, out, t, notes, v = 1, dur = 0.28) {
  const lp = filt(ac, 'lowpass', 5000, 1.5);
  lp.frequency.setValueAtTime(6000, t);
  lp.frequency.exponentialRampToValueAtTime(700, t + dur);
  const g = gainNode(ac, 0);
  perc(g, t, v, dur, 0.003);
  chain(lp, g, out);
  notes.forEach((m, i) => {
    for (const [dt, p] of [[-12, -0.7], [-4, -0.2], [4, 0.2], [12, 0.7]]) {
      const o = osc(ac, 'sawtooth', mtof(m), t, dur + 0.05, dt + i);
      chain(o, gainNode(ac, 0.12), pan(ac, p), lp);
    }
  });
}

export function bell(ac, out, t, midi, v = 1, decay = 1.6, p = 0) {
  const f = mtof(midi);
  const car = osc(ac, 'sine', f, t, decay + 0.1);
  const mod = osc(ac, 'sine', f * 3.5, t, decay + 0.1);
  const mg = gainNode(ac, 0);
  mg.gain.setValueAtTime(f * 2.2, t);
  mg.gain.exponentialRampToValueAtTime(f * 0.05, t + decay * 0.6);
  mod.connect(mg); mg.connect(car.frequency);
  const g = gainNode(ac, 0);
  perc(g, t, v, decay, 0.002);
  chain(car, g, pan(ac, p), out);
}

export function subDrop(ac, out, t, v = 1, dur = 1.4) {
  const o = osc(ac, 'sine', 70, t, dur);
  o.frequency.setValueAtTime(75, t);
  o.frequency.exponentialRampToValueAtTime(30, t + dur);
  const g = gainNode(ac, 0);
  perc(g, t, v, dur, 0.004);
  chain(o, g, out);
}

// noise sweep — the swiss-army knife for whooshes and risers
function sweep(ac, out, t, dur, { f0 = 400, f1 = 6000, q = 1.2, v = 1, shape = 'bell', p0 = 0, p1 = 0, type = 'bandpass' } = {}) {
  const n = noise(ac, t, dur);
  const bp = filt(ac, type, f0, q);
  bp.frequency.setValueAtTime(f0, t);
  bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = gainNode(ac, 0);
  g.gain.setValueAtTime(0.0001, t);
  if (shape === 'bell') {
    g.gain.exponentialRampToValueAtTime(v, t + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  } else if (shape === 'rise') {
    g.gain.exponentialRampToValueAtTime(v, t + dur * 0.97);
    g.gain.linearRampToValueAtTime(0, t + dur);
  } else {
    g.gain.exponentialRampToValueAtTime(v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  const pn = pan(ac, p0);
  pn.pan.setValueAtTime(p0, t);
  pn.pan.linearRampToValueAtTime(p1, t + dur);
  chain(n, bp, g, pn, out);
  return g;
}

// ------------------------------------------------------------------ sfx ---
// Each effect: (ac, bus, cue) where bus = { out, rev, delay }.
const SFX = {
  tick(ac, b, c) {
    const o = osc(ac, 'sine', 2600 * (c.pitch || 1), c.t, 0.03);
    const g = gainNode(ac, 0);
    perc(g, c.t, 0.5 * c.gain, 0.025, 0.001);
    chain(o, g, pan(ac, c.pan || 0), b.out);
  },
  click(ac, b, c) {
    const pp = c.pitch || 1;
    const o = osc(ac, 'sine', 1500 * pp, c.t, 0.05);
    o.frequency.exponentialRampToValueAtTime(900 * pp, c.t + 0.03);
    const g = gainNode(ac, 0);
    perc(g, c.t, 0.8 * c.gain, 0.04, 0.001);
    chain(o, g, b.out);
    const n = noise(ac, c.t, 0.02);
    const ng = gainNode(ac, 0);
    perc(ng, c.t, 0.3 * c.gain, 0.01, 0.001);
    chain(n, filt(ac, 'highpass', 4000), ng, b.out);
  },
  mouse(ac, b, c) { SFX.click(ac, b, { ...c, pitch: 1.6 }); SFX.click(ac, b, { ...c, t: c.t + 0.11, gain: c.gain * 0.6, pitch: 1.9 }); },
  toggle(ac, b, c) {
    SFX.click(ac, b, { ...c, pitch: 1.2 });
    const o = osc(ac, 'sine', 700, c.t + 0.04, 0.15);
    o.frequency.exponentialRampToValueAtTime(1400, c.t + 0.12);
    const g = gainNode(ac, 0);
    perc(g, c.t + 0.04, 0.3 * c.gain, 0.12);
    chain(o, g, b.out);
    const s = gainNode(ac, 0.3); g.connect(s); s.connect(b.rev);
  },
  bonk(ac, b, c) {
    const pp = c.pitch || 1;
    const o = osc(ac, 'sine', 440 * pp, c.t, 0.4);
    o.frequency.setValueAtTime(520 * pp, c.t);
    o.frequency.exponentialRampToValueAtTime(170 * pp, c.t + 0.09);
    const g = gainNode(ac, 0);
    perc(g, c.t, 0.85 * c.gain, 0.28, 0.002);
    chain(o, g, b.out);
    const o2 = osc(ac, 'triangle', 1300 * pp, c.t, 0.06);
    const g2 = gainNode(ac, 0);
    perc(g2, c.t, 0.25 * c.gain, 0.04, 0.001);
    chain(o2, g2, b.out);
    const s = gainNode(ac, 0.25); g.connect(s); s.connect(b.rev);
  },
  boing(ac, b, c) {
    const o = osc(ac, 'sine', 180, c.t, 0.6);
    o.frequency.setValueAtTime(160, c.t);
    o.frequency.exponentialRampToValueAtTime(620, c.t + 0.35);
    const lfo = osc(ac, 'sine', 26, c.t, 0.6);
    const lg = gainNode(ac, 0);
    lg.gain.setValueAtTime(90, c.t);
    lg.gain.exponentialRampToValueAtTime(2, c.t + 0.5);
    lfo.connect(lg); lg.connect(o.frequency);
    const g = gainNode(ac, 0);
    perc(g, c.t, 0.45 * c.gain, 0.5, 0.005);
    chain(o, g, b.out);
  },
  stretch(ac, b, c) {
    const d = c.dur || 0.8;
    const o = osc(ac, 'sawtooth', 110, c.t, d);
    o.frequency.setValueAtTime(90, c.t);
    o.frequency.exponentialRampToValueAtTime(260, c.t + d);
    const lfo = osc(ac, 'sine', 14, c.t, d);
    const lg = gainNode(ac, 6);
    lfo.connect(lg); lg.connect(o.frequency);
    const lp = filt(ac, 'bandpass', 900, 3);
    lp.frequency.exponentialRampToValueAtTime(2200, c.t + d);
    const g = gainNode(ac, 0);
    g.gain.setValueAtTime(0, c.t);
    g.gain.linearRampToValueAtTime(0.12 * c.gain, c.t + d * 0.9);
    g.gain.linearRampToValueAtTime(0, c.t + d);
    chain(o, lp, g, b.out);
    sweep(ac, b.out, c.t, d, { f0: 300, f1: 3000, v: 0.12 * c.gain, shape: 'rise', q: 2 });
  },
  whooshUp(ac, b, c) {
    const d = c.dur || 0.6;
    const g = sweep(ac, b.out, c.t, d, { f0: 300, f1: 7000, v: 0.55 * c.gain, shape: 'rise', q: 1.4 });
    const s = gainNode(ac, 0.3); g.connect(s); s.connect(b.rev);
  },
  whoosh(ac, b, c) {
    const d = c.dur || 0.45;
    const p = c.pan || 0;
    sweep(ac, b.out, c.t, d, { f0: 500, f1: 3200, v: 0.5 * c.gain, shape: 'bell', q: 1.0, p0: -p, p1: p });
  },
  swish(ac, b, c) {
    const p = c.pan || 0;
    sweep(ac, b.out, c.t, 0.28, { f0: 1500, f1: 6500, v: 0.4 * c.gain, shape: 'bell', q: 1.6, p0: p - 0.3, p1: p + 0.3 });
  },
  whip(ac, b, c) {
    sweep(ac, b.out, c.t, 0.35, { f0: 600, f1: 9000, v: 0.7 * c.gain, shape: 'bell', q: 1.8, p0: 0.8, p1: -0.8 });
    sweep(ac, b.out, c.t + 0.05, 0.3, { f0: 200, f1: 1200, v: 0.4 * c.gain, shape: 'bell', q: 0.8, p0: 0.6, p1: -0.6 });
  },
  impact(ac, b, c) {
    const v = c.gain;
    subDrop(ac, b.out, c.t, 0.9 * v, c.big ? 1.8 : 0.9);
    kick(ac, b.out, c.t, 0.7 * v);
    const n = noise(ac, c.t, 1.6);
    const g = gainNode(ac, 0);
    perc(g, c.t, 0.5 * v, c.big ? 1.4 : 0.7, 0.002);
    const lp = filt(ac, 'lowpass', 6000);
    lp.frequency.exponentialRampToValueAtTime(400, c.t + 1.0);
    chain(n, lp, g, b.out);
    const s = gainNode(ac, 0.6); g.connect(s); s.connect(b.rev);
  },
  crash(ac, b, c) { crash(ac, b.out, c.t, 0.35 * c.gain, b.rev); },
  pop(ac, b, c) {
    const pp = c.pitch || 1;
    const o = osc(ac, 'sine', 300 * pp, c.t, 0.12);
    o.frequency.setValueAtTime(260 * pp, c.t);
    o.frequency.exponentialRampToValueAtTime(900 * pp, c.t + 0.05);
    const g = gainNode(ac, 0);
    perc(g, c.t, 0.6 * c.gain, 0.09, 0.002);
    chain(o, g, b.out);
    const s = gainNode(ac, 0.2); g.connect(s); s.connect(b.rev);
  },
  morph(ac, b, c) {
    const pp = c.pitch || 1;
    const o = osc(ac, 'sine', 200 * pp, c.t, 0.35);
    o.frequency.setValueAtTime(180 * pp, c.t);
    o.frequency.exponentialRampToValueAtTime(520 * pp, c.t + 0.08);
    o.frequency.exponentialRampToValueAtTime(260 * pp, c.t + 0.3);
    const g = gainNode(ac, 0);
    perc(g, c.t, 0.5 * c.gain, 0.3, 0.004);
    const bp = filt(ac, 'lowpass', 2500, 6);
    chain(o, bp, g, b.out);
    const s = gainNode(ac, 0.3); g.connect(s); s.connect(b.rev);
    sweep(ac, b.out, c.t, 0.25, { f0: 800, f1: 4000, v: 0.12 * c.gain, shape: 'bell' });
  },
  wobble(ac, b, c) {
    const d = c.dur || 0.8;
    const o = osc(ac, 'triangle', 220, c.t, d);
    const lfo = osc(ac, 'sine', 9.6, c.t, d);
    const lg = gainNode(ac, 70);
    lfo.connect(lg); lg.connect(o.frequency);
    const g = gainNode(ac, 0);
    ahr(g, c.t, 0.2 * c.gain, 0.1, d - 0.3, 0.2);
    chain(o, filt(ac, 'lowpass', 1800), g, b.out);
  },
  drop(ac, b, c) {
    const o = osc(ac, 'sine', 1400, c.t, 0.35);
    o.frequency.exponentialRampToValueAtTime(160, c.t + 0.3);
    const g = gainNode(ac, 0);
    perc(g, c.t, 0.25 * c.gain, 0.3, 0.01);
    chain(o, g, b.out);
  },
  blip(ac, b, c) {
    const o = osc(ac, 'square', 520 * (c.pitch || 1), c.t, 0.07);
    const g = gainNode(ac, 0);
    perc(g, c.t, 0.25 * c.gain, 0.06, 0.001);
    chain(o, filt(ac, 'lowpass', 3000), g, b.out);
    const s = gainNode(ac, 0.3); g.connect(s); s.connect(b.delay);
  },
  clack(ac, b, c) {
    const n = noise(ac, c.t, 0.05);
    const g = gainNode(ac, 0);
    perc(g, c.t, 0.6 * c.gain, 0.03, 0.001);
    chain(n, filt(ac, 'bandpass', 3200, 3), g, b.out);
    tom(ac, b.out, c.t, 0.3 * c.gain, 130);
  },
  zoom(ac, b, c) {
    const d = c.dur || 1.5;
    const g = sweep(ac, b.out, c.t, d, { f0: 150, f1: 6000, v: 0.6 * c.gain, shape: 'rise', q: 0.9 });
    const o = osc(ac, 'sawtooth', 80, c.t, d);
    o.frequency.exponentialRampToValueAtTime(880, c.t + d);
    const og = gainNode(ac, 0);
    og.gain.setValueAtTime(0, c.t);
    og.gain.linearRampToValueAtTime(0.06 * c.gain, c.t + d * 0.95);
    og.gain.linearRampToValueAtTime(0, c.t + d);
    chain(o, filt(ac, 'lowpass', 2000), og, b.out);
    const s = gainNode(ac, 0.3); g.connect(s); s.connect(b.rev);
    SFX.pop(ac, b, { t: c.t + d, gain: c.gain * 0.9, pitch: 0.7 });
  },
  pluckFx(ac, b, c) {
    const notes = [76, 79, 83];
    notes.forEach((m, i) => {
      const g = pluck(ac, b.out, c.t + i * 0.04, m + Math.round(12 * Math.log2(c.pitch || 1)), 0.18 * c.gain, { decay: 0.2, p: (i - 1) * 0.5 });
      const s = gainNode(ac, 0.4); g.connect(s); s.connect(b.delay);
    });
  },
  swirl(ac, b, c) {
    const d = c.dur || 1;
    const n = noise(ac, c.t, d);
    const bp = filt(ac, 'bandpass', 1200, 4);
    const lfo = osc(ac, 'sine', 5, c.t, d);
    const lg = gainNode(ac, 700);
    lfo.connect(lg); lg.connect(bp.frequency);
    const g = gainNode(ac, 0);
    ahr(g, c.t, 0.4 * c.gain, d * 0.4, d * 0.2, d * 0.4);
    const pn = ac.createStereoPanner();
    const plfo = osc(ac, 'sine', 2.5, c.t, d);
    plfo.connect(pn.pan);
    chain(n, bp, g, pn, b.out);
  },
  suck(ac, b, c) {
    const d = c.dur || 0.5;
    const g = sweep(ac, b.out, c.t, d, { f0: 6000, f1: 400, v: 0.5 * c.gain, shape: 'rise', q: 1.2 });
    const s = gainNode(ac, 0.2); g.connect(s); s.connect(b.rev);
  },
  burst(ac, b, c) {
    const n = noise(ac, c.t, 0.8);
    const g = gainNode(ac, 0);
    perc(g, c.t, 0.6 * c.gain, 0.6, 0.002);
    const lp = filt(ac, 'lowpass', 9000);
    lp.frequency.exponentialRampToValueAtTime(500, c.t + 0.6);
    chain(n, lp, g, b.out);
    const s = gainNode(ac, 0.5); g.connect(s); s.connect(b.rev);
    subDrop(ac, b.out, c.t, 0.5 * c.gain, 0.6);
  },
  air(ac, b, c) {
    const d = c.dur || 1;
    const n = noise(ac, c.t, d);
    const g = gainNode(ac, 0);
    ahr(g, c.t, 0.25 * c.gain, d * 0.3, d * 0.3, d * 0.4);
    chain(n, filt(ac, 'lowpass', 900, 0.5), g, b.out);
  },
  shimmer(ac, b, c) {
    [88, 91, 95, 100, 103].forEach((m, i) => {
      const g = gainNode(ac, 1);
      bell(ac, g, c.t + i * 0.05, m, 0.08 * c.gain, 1.2, (i - 2) * 0.35);
      g.connect(b.out);
      const s = gainNode(ac, 0.8); g.connect(s); s.connect(b.rev);
    });
  },
  chime(ac, b, c) {
    [81, 84, 88].forEach((m, i) => {
      const g = gainNode(ac, 1);
      bell(ac, g, c.t + i * 0.07, m, 0.12 * c.gain, 1.4, (i - 1) * 0.4);
      g.connect(b.out);
      const s = gainNode(ac, 0.6); g.connect(s); s.connect(b.rev);
    });
  },
  success(ac, b, c) {
    [72, 76, 79, 84].forEach((m, i) => {
      const g = gainNode(ac, 1);
      bell(ac, g, c.t + i * 0.06, m, 0.16 * c.gain, 1.2, (i - 1.5) * 0.3);
      g.connect(b.out);
      const s = gainNode(ac, 0.5); g.connect(s); s.connect(b.rev);
    });
  },
  notify(ac, b, c) {
    const pp = Math.round(12 * Math.log2(c.pitch || 1));
    [[88, 0], [83, 0.11]].forEach(([m, dt]) => {
      const g = gainNode(ac, 1);
      bell(ac, g, c.t + dt, m + pp, 0.24 * c.gain, 0.9);
      g.connect(b.out);
      const s = gainNode(ac, 0.4); g.connect(s); s.connect(b.rev);
    });
  },
  confetti(ac, b, c) {
    for (let i = 0; i < 26; i++) {
      const t = c.t + Math.pow(rnd(), 1.6) * 0.8;
      SFX.tick(ac, b, { t, gain: c.gain * (0.3 + rnd() * 0.5), pitch: 0.8 + rnd() * 1.4, pan: rnd() * 1.6 - 0.8 });
    }
  },
  counter(ac, b, c) {
    const d = c.dur || 2;
    let t = c.t, k = 0;
    while (t < c.t + d) {
      const u = (t - c.t) / d;
      SFX.tick(ac, b, { t, gain: c.gain * (0.6 + 0.4 * (1 - u)), pitch: 0.9 + (k % 2) * 0.15 });
      // fast in the middle, slow at the ends (matches an in-out ease)
      t += 0.022 + 0.12 * Math.pow(Math.abs(u - 0.5) * 2, 3);
      k++;
    }
  },
  scribble(ac, b, c) {
    const d = c.dur || 1.5;
    const n = noise(ac, c.t, d);
    const g = gainNode(ac, 0);
    g.gain.setValueAtTime(0, c.t);
    for (let k = 0; k < d / 0.05; k++) g.gain.linearRampToValueAtTime((0.05 + rnd() * 0.12) * c.gain, c.t + k * 0.05);
    g.gain.linearRampToValueAtTime(0, c.t + d);
    chain(n, filt(ac, 'bandpass', 3500, 2), g, b.out);
  },
  slide(ac, b, c) {
    const d = c.dur || 0.5;
    const o = osc(ac, 'sine', 400, c.t, d);
    o.frequency.exponentialRampToValueAtTime(1200, c.t + d);
    const g = gainNode(ac, 0);
    ahr(g, c.t, 0.1 * c.gain, 0.05, d - 0.1, 0.05);
    chain(o, g, b.out);
  },
  loading(ac, b, c) {
    for (let t = c.t; t < c.t + (c.dur || 0.6); t += 0.125) SFX.tick(ac, b, { t, gain: c.gain, pitch: 0.6 });
  },
  glitch(ac, b, c) {
    const d = c.dur || 0.3;
    for (let t = c.t; t < c.t + d; t += 0.025 + rnd() * 0.03) {
      const o = osc(ac, 'square', 80 + rnd() * 1800, t, 0.03);
      const g = gainNode(ac, 0);
      perc(g, t, 0.18 * c.gain, 0.02, 0.001);
      chain(o, g, pan(ac, rnd() * 2 - 1), b.out);
      if (rnd() < 0.5) {
        const n = noise(ac, t, 0.03);
        const ng = gainNode(ac, 0);
        perc(ng, t, 0.3 * c.gain, 0.02, 0.001);
        chain(n, filt(ac, 'bandpass', 500 + rnd() * 6000, 3), ng, b.out);
      }
    }
  },
  cut(ac, b, c) {
    const v = c.gain;
    switch (c.variant % 8) {
      case 0: clap(ac, b.out, c.t, 0.5 * v, b.rev); break;
      case 1: bell(ac, b.out, c.t, 76, 0.18 * v, 0.4); break;
      case 2: kick(ac, b.out, c.t, 0.6 * v, { tight: true }); hat(ac, b.out, c.t, 0.3 * v, true); break;
      case 3: tom(ac, b.out, c.t, 0.5 * v, 180); break;
      case 4: SFX.blip(ac, b, { t: c.t, gain: v * 1.5, pitch: 2 }); SFX.blip(ac, b, { t: c.t + 0.04, gain: v, pitch: 3 }); break;
      case 5: sweep(ac, b.out, c.t, 0.2, { f0: 3000, f1: 600, v: 0.4 * v, shape: 'perc' }); break;
      case 6: SFX.pop(ac, b, { t: c.t, gain: v, pitch: 1.4 }); break;
      case 7: SFX.glitch(ac, b, { t: c.t, gain: v * 1.4, dur: 0.12 }); break;
    }
  },
  riser(ac, b, c) {
    const d = c.dur || 1;
    const g = sweep(ac, b.out, c.t, d, { f0: 300, f1: 9000, v: 0.5 * c.gain, shape: 'rise', q: 1.5 });
    const s = gainNode(ac, 0.4); g.connect(s); s.connect(b.rev);
  },
  zip(ac, b, c) {
    const d = c.dur || 0.5;
    const o = osc(ac, 'sawtooth', 120, c.t, d);
    o.frequency.exponentialRampToValueAtTime(1600, c.t + d);
    const g = gainNode(ac, 0);
    ahr(g, c.t, 0.08 * c.gain, 0.02, d - 0.1, 0.08);
    chain(o, filt(ac, 'bandpass', 1500, 1), g, b.out);
    sweep(ac, b.out, c.t, d, { f0: 600, f1: 8000, v: 0.3 * c.gain, shape: 'bell' });
  },
  final(ac, b, c) {
    SFX.impact(ac, b, { ...c, big: true });
    [45, 57, 64, 69, 72, 76].forEach((m, i) => {
      const g = gainNode(ac, 1);
      bell(ac, g, c.t + i * 0.015, m, 0.09 * c.gain, 3.5, (i - 2.5) * 0.3);
      g.connect(b.out);
      const s = gainNode(ac, 0.9); g.connect(s); s.connect(b.rev);
    });
  },
};

// ---- sound design for the "Flow" film
Object.assign(SFX, {
  heart(ac, b, c) {
    for (const [dt, v] of [[0, 1], [0.17, 0.6]]) {
      const t = c.t + dt;
      const o = osc(ac, 'sine', 90, t, 0.4);
      o.frequency.setValueAtTime(95, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      const g = gainNode(ac, 0);
      perc(g, t, 0.9 * v * c.gain, 0.28, 0.004);
      chain(o, filt(ac, 'lowpass', 300), g, b.out);
    }
  },
  laser(ac, b, c) {
    const o = osc(ac, 'sine', 200, c.t, 0.5);
    o.frequency.exponentialRampToValueAtTime(2600, c.t + 0.14);
    const g = gainNode(ac, 0);
    perc(g, c.t, 0.35 * c.gain, 0.4, 0.004);
    chain(o, g, b.out);
    const s = gainNode(ac, 0.5); g.connect(s); s.connect(b.delay);
    sweep(ac, b.out, c.t, 0.45, { f0: 800, f1: 9000, v: 0.4 * c.gain, shape: 'perc', q: 2, p0: -0.8, p1: 0.8 });
  },
  flip(ac, b, c) {
    for (const dt of [0, 0.07]) sweep(ac, b.out, c.t + dt, 0.09, { f0: 2500, f1: 900, v: 0.45 * c.gain, shape: 'perc', q: 2.5 });
  },
  slice(ac, b, c) {
    const o = osc(ac, 'sine', 3400, c.t, 0.6);
    o.frequency.exponentialRampToValueAtTime(2900, c.t + 0.5);
    const g = gainNode(ac, 0);
    perc(g, c.t, 0.18 * c.gain, 0.55, 0.001);
    chain(o, g, b.out);
    const s = gainNode(ac, 0.6); g.connect(s); s.connect(b.rev);
    sweep(ac, b.out, c.t, 0.5, { f0: 6000, f1: 1200, v: 0.55 * c.gain, shape: 'perc', q: 1.2, p0: 0.7, p1: -0.9 });
    subDrop(ac, b.out, c.t, 0.4 * c.gain, 0.5);
  },
  passby(ac, b, c) {
    const p = c.pan || 0;
    sweep(ac, b.out, c.t - 0.15, 0.3, { f0: 500, f1: 4000, v: 0.5 * c.gain, shape: 'rise', q: 1.2, p0: p, p1: p });
    sweep(ac, b.out, c.t + 0.15, 0.45, { f0: 3000, f1: 300, v: 0.45 * c.gain, shape: 'perc', q: 1.2, p0: p, p1: -p });
  },
  swarm(ac, b, c) {
    const d = c.dur || 0.6;
    for (let i = 0; i < 60; i++) {
      const t = c.t + Math.pow(rnd(), 0.6) * d;
      SFX.tick(ac, b, { t, gain: c.gain * (0.15 + rnd() * 0.35), pitch: 0.6 + rnd() * 1.6, pan: rnd() * 1.8 - 0.9 });
    }
  },
  lock(ac, b, c) {
    SFX.click(ac, b, { ...c, pitch: 0.8 });
    tom(ac, b.out, c.t, 0.6 * c.gain, 110);
    [62, 69, 74].forEach((m, i) => {
      const g = pluck(ac, b.out, c.t + i * 0.012, m + 12, 0.12 * c.gain, { decay: 0.5, cutoff: 4000 });
      const s = gainNode(ac, 0.4); g.connect(s); s.connect(b.rev);
    });
  },
  drip(ac, b, c) {
    const o = osc(ac, 'sine', 500, c.t, 0.3);
    o.frequency.setValueAtTime(420, c.t);
    o.frequency.exponentialRampToValueAtTime(1500, c.t + 0.07);
    const g = gainNode(ac, 0);
    perc(g, c.t, 0.6 * c.gain, 0.18, 0.003);
    chain(o, g, b.out);
    const s = gainNode(ac, 0.6); g.connect(s); s.connect(b.rev);
  },
  blob(ac, b, c) {
    const pp = c.pitch || 1;
    const o = osc(ac, 'sine', 200 * pp, c.t, 0.35);
    o.frequency.setValueAtTime(160 * pp, c.t);
    o.frequency.exponentialRampToValueAtTime(420 * pp, c.t + 0.1);
    o.frequency.exponentialRampToValueAtTime(240 * pp, c.t + 0.3);
    const g = gainNode(ac, 0);
    perc(g, c.t, 0.5 * c.gain, 0.3, 0.01);
    chain(o, filt(ac, 'lowpass', 1400, 4), g, b.out);
    const s = gainNode(ac, 0.3); g.connect(s); s.connect(b.rev);
  },
  stretchGoo(ac, b, c) {
    const o = osc(ac, 'sawtooth', 70, c.t, 0.6);
    o.frequency.exponentialRampToValueAtTime(220, c.t + 0.35);
    const lfo = osc(ac, 'sine', 18, c.t, 0.6);
    const lg = gainNode(ac, 12); lfo.connect(lg); lg.connect(o.frequency);
    const lp = filt(ac, 'lowpass', 300, 8);
    lp.frequency.exponentialRampToValueAtTime(1800, c.t + 0.3);
    lp.frequency.exponentialRampToValueAtTime(400, c.t + 0.55);
    const g = gainNode(ac, 0);
    ahr(g, c.t, 0.25 * c.gain, 0.05, 0.3, 0.2);
    chain(o, lp, g, b.out);
    subDrop(ac, b.out, c.t + 0.1, 0.5 * c.gain, 0.8);
  },
  harden(ac, b, c) {
    [86, 90, 93, 98].forEach((m, i) => {
      const g = gainNode(ac, 1);
      bell(ac, g, c.t + i * 0.04, m, 0.07 * c.gain, 1.0, (i - 1.5) * 0.4);
      g.connect(b.out);
      const s = gainNode(ac, 0.7); g.connect(s); s.connect(b.rev);
    });
    SFX.click(ac, b, { ...c, gain: c.gain * 0.6, pitch: 1.3 });
  },
  cardSlap(ac, b, c) {
    const n = noise(ac, c.t, 0.08);
    const g = gainNode(ac, 0);
    perc(g, c.t, 0.6 * c.gain, 0.06, 0.001);
    chain(n, filt(ac, 'bandpass', 1300, 1.2), g, b.out);
    tom(ac, b.out, c.t, 0.35 * c.gain, 150);
  },
});

export function playSfx(ac, bus, cue) {
  const f = SFX[cue.type];
  if (!f) { console.warn('unknown sfx', cue.type); return; }
  f(ac, bus, cue);
}

// stereo reverb impulse response (decaying, darkening noise)
export function makeIR(ac, seconds = 2.8, decay = 2.6) {
  const len = Math.floor(ac.sampleRate * seconds);
  const ir = ac.createBuffer(2, len, ac.sampleRate);
  let s = 7;
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const w = s / 2147483648 - 1;
      const t = i / ac.sampleRate;
      const k = 0.85 - 0.75 * Math.min(1, t / seconds); // darker tail
      lp += k * (w - lp);
      d[i] = lp * Math.pow(1 - t / seconds, decay) * (t < 0.012 ? t / 0.012 : 1);
    }
  }
  return ir;
}
