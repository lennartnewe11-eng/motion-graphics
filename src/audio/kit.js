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


// ---- instruments + sound design for the Pinterest spot
// Marimba: sine fundamental + a quickly decaying 4th harmonic and a woody click.
export function marimba(ac, out, t, midi, v = 1, { p = 0, decay = 0.5 } = {}) {
  const f = mtof(midi);
  const g = gainNode(ac, 0);
  perc(g, t, v, decay, 0.002);
  const pn = pan(ac, p);
  chain(osc(ac, 'sine', f, t, decay + 0.1), g, pn, out);
  const g2 = gainNode(ac, 0);
  perc(g2, t, v * 0.35, decay * 0.18, 0.001);
  chain(osc(ac, 'sine', f * 4, t, 0.2), g2, pn);
  const g3 = gainNode(ac, 0);
  perc(g3, t, v * 0.25, 0.012, 0.0005);
  chain(noise(ac, t, 0.03), filt(ac, 'bandpass', f * 6, 2), g3, pn);
  return pn;
}
// Formant "vocal chop": pulse-ish source through three vowel formants.
const VOWELS = { a: [[800, 1], [1150, 0.5], [2900, 0.25]], o: [[450, 1], [800, 0.45], [2830, 0.12]], e: [[400, 1], [2000, 0.4], [2550, 0.25]], i: [[300, 1], [2300, 0.35], [3000, 0.25]], u: [[325, 1], [700, 0.25], [2530, 0.06]] };
export function vox(ac, out, t, midi, dur, v = 1, { vowel = 'a', to = null, p = 0, glide = 0 } = {}) {
  const f = mtof(midi);
  const src = osc(ac, 'sawtooth', f, t, dur + 0.1);
  const src2 = osc(ac, 'square', f * 1.002, t, dur + 0.1);
  if (glide) { src.frequency.setValueAtTime(f * Math.pow(2, glide / 12), t); src.frequency.exponentialRampToValueAtTime(f, t + 0.08); src2.frequency.setValueAtTime(f * Math.pow(2, glide / 12), t); src2.frequency.exponentialRampToValueAtTime(f * 1.002, t + 0.08); }
  const vib = osc(ac, 'sine', 5.5, t, dur + 0.1), vg = gainNode(ac, f * 0.012);
  vib.connect(vg); vg.connect(src.frequency); vg.connect(src2.frequency);
  const mixIn = gainNode(ac, 0.5);
  src.connect(mixIn); const s2g = gainNode(ac, 0.3); src2.connect(s2g); s2g.connect(mixIn);
  const env = gainNode(ac, 0);
  ahr(env, t, v, 0.012, Math.max(0.01, dur - 0.06), 0.06);
  const pn = pan(ac, p);
  VOWELS[vowel].forEach(([F, a], i) => {
    const bp = filt(ac, 'bandpass', F, 9 + i * 3);
    if (to) bp.frequency.linearRampToValueAtTime(VOWELS[to][i][0], t + dur);
    const g = gainNode(ac, a * 2.2);
    chain(mixIn, bp, g, env);
  });
  env.connect(pn); pn.connect(out);
  return pn;
}
export function snap(ac, out, t, v = 1, p = 0) {
  const g = gainNode(ac, 0);
  perc(g, t, v, 0.06, 0.0008);
  chain(noise(ac, t, 0.08), filt(ac, 'bandpass', 2600, 1.4), g, pan(ac, p), out);
  const g2 = gainNode(ac, 0);
  perc(g2, t, v * 0.5, 0.01, 0.0005);
  chain(osc(ac, 'sine', 1800, t, 0.03), g2, pan(ac, p), out);
}
export function rim(ac, out, t, v = 1, p = 0) {
  const g = gainNode(ac, 0);
  perc(g, t, v, 0.035, 0.0005);
  chain(osc(ac, 'triangle', 1700, t, 0.05), filt(ac, 'bandpass', 1700, 3), g, pan(ac, p), out);
  const g2 = gainNode(ac, 0);
  perc(g2, t, v * 0.5, 0.02, 0.0005);
  chain(noise(ac, t, 0.03), filt(ac, 'highpass', 3000), g2, pan(ac, p), out);
}
export function cowbell(ac, out, t, v = 1, p = 0.3) {
  const g = gainNode(ac, 0);
  perc(g, t, v, 0.22, 0.001);
  const bp = filt(ac, 'bandpass', 800, 3);
  osc(ac, 'square', 540, t, 0.3).connect(bp); osc(ac, 'square', 800, t, 0.3).connect(bp);
  chain(bp, g, pan(ac, p), out);
}
export function revCymbal(ac, out, t, dur = 1, v = 1) {
  const n = noise(ac, t, dur);
  const g = gainNode(ac, 0);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + dur * 0.98);
  g.gain.linearRampToValueAtTime(0, t + dur);
  chain(n, filt(ac, 'highpass', 4000), filt(ac, 'peaking', 9000, 0.8), g, out);
}

const F_PENTA = [65, 67, 69, 72, 74, 77, 79, 81, 84];
Object.assign(SFX, {
  // drawing
  pencilLine(ac, b, c) {
    // graphite on paper: band-passed noise with stroke-rate modulation and grain crackle
    const d = c.dur || 1;
    const n = noise(ac, c.t, d);
    const bp = filt(ac, 'bandpass', 3800, 1.6);
    const g = gainNode(ac, 0);
    g.gain.setValueAtTime(0, c.t);
    for (let k = 0; k <= d / 0.03; k++) {
      const u = (k * 0.03) / d;
      g.gain.linearRampToValueAtTime((0.12 + 0.18 * Math.abs(Math.sin(u * 22)) + rnd() * 0.06) * c.gain, c.t + k * 0.03);
      bp.frequency.setValueAtTime(3000 + 2000 * Math.abs(Math.sin(u * 22)), c.t + k * 0.03);
    }
    g.gain.linearRampToValueAtTime(0, c.t + d);
    chain(n, filt(ac, 'highpass', 1200), bp, g, pan(ac, 0.2), b.out);
    for (let k = 0; k < d * 40; k++) { const t = c.t + rnd() * d; const ng = gainNode(ac, 0); perc(ng, t, 0.06 * c.gain, 0.006, 0.0005); chain(noise(ac, t, 0.01), filt(ac, 'highpass', 6000), ng, b.out); }
  },
  hatching(ac, b, c) {
    // fast back-and-forth colouring strokes (~9 per second)
    const d = c.dur || 0.5;
    for (let t = c.t; t < c.t + d; t += 0.055 + rnd() * 0.02) {
      const L = 0.05 + rnd() * 0.02;
      const n = noise(ac, t, L);
      const g = gainNode(ac, 0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.32 * c.gain, t + L * 0.3);
      g.gain.linearRampToValueAtTime(0, t + L);
      const bp = filt(ac, 'bandpass', 2200 + rnd() * 1800, 1.3);
      bp.frequency.linearRampToValueAtTime(3500 + rnd() * 1500, t + L);
      chain(n, filt(ac, 'highpass', 900), bp, g, pan(ac, (c.pan || 0) + (rnd() - 0.5) * 0.3), b.out);
    }
  },
  pencilWrite(ac, b, c) { SFX.hatching(ac, b, { ...c, gain: c.gain * 0.6 }); SFX.pencilLine(ac, b, { ...c, gain: c.gain * 0.5 }); },
  boil(ac, b, c) {
    // the drawing comes alive: a tiny sparkle + soft "pff"
    SFX.shimmer(ac, b, { t: c.t, gain: c.gain * 0.5 });
    sweep(ac, b.out, c.t, 0.25, { f0: 500, f1: 2400, v: 0.2 * c.gain, shape: 'bell' });
  },
  check(ac, b, c) {
    SFX.pencilLine(ac, b, { t: c.t, dur: 0.18, gain: c.gain * 0.8 });
    [84, 91].forEach((m, i) => { const g = gainNode(ac, 1); bell(ac, g, c.t + 0.12 + i * 0.07, m, 0.12 * c.gain, 0.8); g.connect(b.out); const s = gainNode(ac, 0.5); g.connect(s); s.connect(b.rev); });
  },
  // touch
  tap(ac, b, c) {
    // fingertip on glass: soft low knock + bright tick
    const o = osc(ac, 'sine', 180, c.t, 0.12);
    o.frequency.exponentialRampToValueAtTime(90, c.t + 0.06);
    const g = gainNode(ac, 0); perc(g, c.t, 0.55 * c.gain, 0.07, 0.001);
    chain(o, g, b.out);
    const g2 = gainNode(ac, 0); perc(g2, c.t, 0.25 * c.gain, 0.012, 0.0005);
    chain(noise(ac, c.t, 0.02), filt(ac, 'bandpass', 5200, 1.5), g2, b.out);
    SFX.click(ac, b, { t: c.t + 0.005, gain: c.gain * 0.35, pitch: 1.4 });
  },
  tapBig(ac, b, c) {
    SFX.tap(ac, b, { ...c, gain: c.gain * 1.2 });
    subDrop(ac, b.out, c.t, 0.5 * c.gain, 0.5);
    const g = sweep(ac, b.out, c.t, 0.5, { f0: 4000, f1: 600, v: 0.25 * c.gain, shape: 'perc' });
    const s = gainNode(ac, 0.5); g.connect(s); s.connect(b.rev);
    SFX.pop(ac, b, { t: c.t + 0.01, gain: c.gain * 0.6, pitch: 1.5 });
  },
  touch(ac, b, c) { const g = gainNode(ac, 0); perc(g, c.t, 0.2 * c.gain, 0.03, 0.001); chain(noise(ac, c.t, 0.04), filt(ac, 'bandpass', 1800, 2), g, b.out); },
  lift(ac, b, c) { SFX.pop(ac, b, { t: c.t, gain: c.gain * 0.5, pitch: 1.1 }); sweep(ac, b.out, c.t, 0.35, { f0: 400, f1: 3000, v: 0.25 * c.gain, shape: 'rise' }); },
  flick(ac, b, c) {
    sweep(ac, b.out, c.t - 0.03, 0.42, { f0: 700, f1: 7000, v: 0.6 * c.gain, shape: 'bell', q: 1.3, p0: 0.3, p1: -0.3 });
    sweep(ac, b.out, c.t, 0.6, { f0: 3000, f1: 300, v: 0.3 * c.gain, shape: 'perc', q: 0.8 });
    SFX.touch(ac, b, { t: c.t - 0.02, gain: c.gain });
  },
  whooshBig(ac, b, c) {
    const g = sweep(ac, b.out, c.t - 0.35, 0.9, { f0: 200, f1: 5000, v: 0.6 * c.gain, shape: 'bell', q: 0.9, p0: -0.7, p1: 0.7 });
    const s = gainNode(ac, 0.4); g.connect(s); s.connect(b.rev);
    subDrop(ac, b.out, c.t, 0.4 * c.gain, 0.9);
  },
  swipe(ac, b, c) {
    sweep(ac, b.out, c.t, 0.32, { f0: 900, f1: 5000, v: 0.5 * c.gain, shape: 'bell', q: 1.5, p0: 0.7, p1: -0.7 });
    SFX.flip(ac, b, { t: c.t + 0.18, gain: c.gain * 0.5 });
  },
  scrollTick(ac, b, c) {
    // haptic detent: very short pitched click
    const o = osc(ac, 'square', 3200 * (c.pitch || 1), c.t, 0.012);
    const g = gainNode(ac, 0); perc(g, c.t, 0.09 * c.gain, 0.006, 0.0003);
    chain(o, filt(ac, 'bandpass', 3800 * (c.pitch || 1), 4), g, pan(ac, c.pan || 0), b.out);
  },
  scrollStop(ac, b, c) {
    // the finger catches the feed: tape-stop pitch dive + thud
    const o = osc(ac, 'sawtooth', 220, c.t, 0.5);
    o.frequency.setValueAtTime(330, c.t);
    o.frequency.exponentialRampToValueAtTime(40, c.t + 0.45);
    const g = gainNode(ac, 0); ahr(g, c.t, 0.12 * c.gain, 0.005, 0.25, 0.2);
    chain(o, filt(ac, 'lowpass', 1400, 2), g, b.out);
    kick(ac, b.out, c.t, 0.5 * c.gain, { tight: true });
  },
  // cards + ui
  cardPop(ac, b, c) {
    const m = F_PENTA[(c.step || 0) % F_PENTA.length];
    const pn = marimba(ac, b.out, c.t, m, 0.28 * c.gain, { p: ((c.step || 0) % 2 ? 0.4 : -0.4), decay: 0.4 });
    const s = gainNode(ac, 0.35); pn.connect(s); s.connect(b.delay);
    SFX.pop(ac, b, { t: c.t, gain: c.gain * 0.45, pitch: 1 + (c.step || 0) * 0.12 });
    SFX.swarm(ac, b, { t: c.t, dur: 0.12, gain: c.gain * 0.25 });
  },
  slideDown(ac, b, c) { sweep(ac, b.out, c.t, 0.3, { f0: 2500, f1: 600, v: 0.25 * c.gain, shape: 'bell' }); SFX.click(ac, b, { t: c.t + 0.26, gain: c.gain * 0.4, pitch: 0.9 }); },
  lettersLock(ac, b, c) {
    // eight cards snap into a row: eight fast clacks, then a chord stab
    for (let k = 0; k < 8; k++) SFX.clack(ac, b, { t: c.t - 0.24 + k * 0.03, gain: c.gain * 0.35 });
    stab(ac, b.out, c.t + 0.05, [65, 69, 72, 76, 81], 0.12 * c.gain, 0.5);
    const g = gainNode(ac, 1); bell(ac, g, c.t + 0.05, 89, 0.1 * c.gain, 1.2); g.connect(b.out); const s = gainNode(ac, 0.7); g.connect(s); s.connect(b.rev);
  },
  tiltRise(ac, b, c) { SFX.zoom(ac, b, { ...c, gain: c.gain * 0.6 }); },
  tiltDown(ac, b, c) { SFX.suck(ac, b, { ...c, gain: c.gain }); },
  cardOpen(ac, b, c) { sweep(ac, b.out, c.t, 0.4, { f0: 300, f1: 3500, v: 0.4 * c.gain, shape: 'bell', q: 1 }); SFX.pop(ac, b, { t: c.t + 0.35, gain: c.gain * 0.5, pitch: 0.8 }); },
  save(ac, b, c) {
    // press, then a bright pluck chord that climbs with every saved idea
    const k = c.step || 0;
    SFX.tap(ac, b, { t: c.t, gain: c.gain * 0.8 });
    const roots = [[72, 76, 79], [74, 77, 81], [76, 79, 84], [77, 81, 84, 89]][k % 4];
    roots.forEach((m, i) => { const g = pluck(ac, b.out, c.t + 0.02 + i * 0.025, m, 0.13 * c.gain, { decay: 0.35, cutoff: 5000, p: (i - 1) * 0.4 }); const s = gainNode(ac, 0.5); g.connect(s); s.connect(b.delay); });
    const g = gainNode(ac, 1); bell(ac, g, c.t + 0.04, roots[roots.length - 1] + 12, 0.1 * c.gain, 1.0); g.connect(b.out); const s = gainNode(ac, 0.7); g.connect(s); s.connect(b.rev);
  },
  confetti3d(ac, b, c) {
    for (let i = 0; i < 14; i++) { const t = c.t + Math.pow(rnd(), 1.4) * 0.6; SFX.blob(ac, b, { t, gain: c.gain * (0.12 + rnd() * 0.2), pitch: 1 + rnd() * 1.8 }); }
    SFX.confetti(ac, b, { t: c.t, gain: c.gain * 0.6 });
  },
  boardDrop(ac, b, c) { SFX.whoosh(ac, b, { t: c.t - 0.3, dur: 0.32, gain: c.gain * 0.5, pan: 0.6 }); SFX.drip(ac, b, { t: c.t, gain: c.gain * 0.8 }); SFX.tick(ac, b, { t: c.t + 0.04, gain: c.gain, pitch: 1.1 + (c.step || 0) * 0.15 }); },
  boardOpen(ac, b, c) { SFX.zip(ac, b, { t: c.t, dur: 0.35, gain: c.gain * 0.6 }); SFX.chime(ac, b, { t: c.t + 0.3, gain: c.gain * 0.6 }); },
  portal(ac, b, c) { const d = c.dur || 0.8; SFX.zoom(ac, b, { t: c.t, dur: d, gain: c.gain * 0.7 }); revCymbal(ac, b.out, c.t, d, 0.3 * c.gain); },
  pageOpen(ac, b, c) { sweep(ac, b.out, c.t, 0.5, { f0: 1200, f1: 300, v: 0.35 * c.gain, shape: 'perc', q: 0.8 }); SFX.shimmer(ac, b, { t: c.t, gain: c.gain * 0.5 }); },
  // foley
  sizzle(ac, b, c) {
    const d = c.dur || 2;
    const n = noise(ac, c.t, d);
    const g = gainNode(ac, 0); ahr(g, c.t, 0.06 * c.gain, 0.3, d - 0.6, 0.3);
    chain(n, filt(ac, 'highpass', 5000), filt(ac, 'peaking', 8000, 1), g, pan(ac, 0.4), b.out);
    for (let k = 0; k < d * 30; k++) { const t = c.t + rnd() * d; const ng = gainNode(ac, 0); perc(ng, t, 0.05 * c.gain, 0.005, 0.0005); chain(noise(ac, t, 0.01), filt(ac, 'bandpass', 3000 + rnd() * 5000, 3), ng, pan(ac, 0.3 + rnd() * 0.3), b.out); }
  },
  stir(ac, b, c) {
    // wooden spoon scraping round the pot
    const n = noise(ac, c.t, 0.4);
    const g = gainNode(ac, 0); ahr(g, c.t, 0.12 * c.gain, 0.1, 0.15, 0.15);
    const bp = filt(ac, 'bandpass', 600, 3); bp.frequency.linearRampToValueAtTime(1100, c.t + 0.35);
    chain(n, bp, g, pan(ac, 0.35), b.out);
    tom(ac, b.out, c.t + 0.2, 0.08 * c.gain, 320);
  },
  bubble(ac, b, c) {
    const pp = c.pitch || 1;
    const o = osc(ac, 'sine', 300 * pp, c.t, 0.08);
    o.frequency.exponentialRampToValueAtTime(900 * pp, c.t + 0.05);
    const g = gainNode(ac, 0); perc(g, c.t, 0.18 * c.gain, 0.05, 0.002);
    chain(o, g, pan(ac, 0.4), b.out);
  },
  paperThump(ac, b, c) { const g = gainNode(ac, 0); perc(g, c.t, 0.4 * c.gain, 0.12, 0.001); chain(noise(ac, c.t, 0.15), filt(ac, 'lowpass', 900), g, b.out); kick(ac, b.out, c.t, 0.3 * c.gain, { tight: true }); },
  wheel(ac, b, c) {
    const d = c.dur || 2;
    const o = osc(ac, 'sawtooth', 52, c.t, d);
    const g = gainNode(ac, 0); ahr(g, c.t, 0.05 * c.gain, 0.3, d - 0.6, 0.3);
    const lfo = osc(ac, 'sine', 3, c.t, d), lg = gainNode(ac, 0.02 * c.gain); lfo.connect(lg); lg.connect(g.gain);
    chain(o, filt(ac, 'lowpass', 260, 2), g, b.out);
  },
  squish(ac, b, c) {
    const pp = c.pitch || 1;
    const n = noise(ac, c.t, 0.25);
    const g = gainNode(ac, 0); ahr(g, c.t, 0.18 * c.gain, 0.03, 0.08, 0.12);
    const bp = filt(ac, 'bandpass', 500 * pp, 4); bp.frequency.exponentialRampToValueAtTime(1400 * pp, c.t + 0.2);
    chain(n, bp, g, pan(ac, -0.2), b.out);
    SFX.blob(ac, b, { t: c.t, gain: c.gain * 0.3, pitch: 0.6 * pp });
  },
  wind(ac, b, c) {
    const d = c.dur || 2;
    const n = noise(ac, c.t, d);
    const bp = filt(ac, 'bandpass', 500, 0.8);
    for (let k = 0; k <= 8; k++) bp.frequency.linearRampToValueAtTime(400 + rnd() * 700, c.t + (k / 8) * d);
    const g = gainNode(ac, 0); ahr(g, c.t, 0.25 * c.gain, d * 0.3, d * 0.3, d * 0.4);
    const pn = ac.createStereoPanner(); const pl = osc(ac, 'sine', 0.3, c.t, d); pl.connect(pn.pan);
    chain(n, bp, g, pn, b.out);
  },
  bird(ac, b, c) {
    const pp = c.pitch || 1;
    for (let k = 0; k < 3; k++) {
      const t = c.t + k * 0.09;
      const o = osc(ac, 'sine', 3200 * pp, t, 0.08);
      o.frequency.setValueAtTime(2600 * pp, t); o.frequency.exponentialRampToValueAtTime(4200 * pp, t + 0.04); o.frequency.exponentialRampToValueAtTime(3000 * pp, t + 0.07);
      const g = gainNode(ac, 0); perc(g, t, 0.07 * c.gain, 0.06, 0.004);
      chain(o, g, pan(ac, 0.6 - k * 0.2), b.out);
      const s = gainNode(ac, 0.4); g.connect(s); s.connect(b.rev);
    }
  },
  cheer(ac, b, c) {
    // tiny crowd "yay": a few formant voices gliding up
    [[64, -0.5], [67, 0.1], [71, 0.5], [60, -0.2]].forEach(([m, p], i) => vox(ac, b.out, c.t + i * 0.02, m, 0.5, 0.06 * c.gain, { vowel: 'e', to: 'a', p, glide: -5 }));
    SFX.shimmer(ac, b, { t: c.t + 0.1, gain: c.gain * 0.6 });
  },
  landing(ac, b, c) { kick(ac, b.out, c.t, 0.25 * c.gain, { tight: true }); const g = gainNode(ac, 0); perc(g, c.t, 0.15 * c.gain, 0.08, 0.001); chain(noise(ac, c.t, 0.1), filt(ac, 'bandpass', 1200, 1), g, b.out); },
  vinylStart(ac, b, c) {
    // needle drop: crackle + a little wow
    const g = gainNode(ac, 0); perc(g, c.t, 0.3 * c.gain, 0.08, 0.001); chain(noise(ac, c.t, 0.1), filt(ac, 'bandpass', 2000, 1), g, b.out);
    for (let k = 0; k < 40; k++) { const t = c.t + rnd() * 1.6; const ng = gainNode(ac, 0); perc(ng, t, 0.05 * c.gain, 0.003, 0.0004); chain(noise(ac, t, 0.006), filt(ac, 'highpass', 3000), ng, b.out); }
  },
  stomp(ac, b, c) { kick(ac, b.out, c.t, 0.25 * c.gain, { tight: true }); clap(ac, b.out, c.t + 0.25, 0.12 * c.gain, b.rev); },
  zoomOut(ac, b, c) { const d = c.dur || 0.8; SFX.suck(ac, b, { t: c.t, dur: d, gain: c.gain * 0.8 }); revCymbal(ac, b.out, c.t, d, 0.25 * c.gain); },
  // end card
  cardsGather(ac, b, c) { for (let k = 0; k < 4; k++) SFX.flip(ac, b, { t: c.t + 0.12 + k * 0.08, gain: c.gain * 0.5 }); SFX.whoosh(ac, b, { t: c.t, dur: 0.5, gain: c.gain * 0.5 }); },
  fallWhistle(ac, b, c) {
    const d = c.dur || 0.4;
    const o = osc(ac, 'sine', 2400, c.t, d);
    o.frequency.exponentialRampToValueAtTime(700, c.t + d);
    const g = gainNode(ac, 0); ahr(g, c.t, 0.08 * c.gain, d * 0.3, d * 0.5, d * 0.2);
    chain(o, g, b.out);
    sweep(ac, b.out, c.t, d, { f0: 600, f1: 5000, v: 0.3 * c.gain, shape: 'rise' });
  },
  pinThunk(ac, b, c) {
    // push pin into cork: woody thunk + short metallic ring
    kick(ac, b.out, c.t, 0.8 * c.gain, { tight: true });
    tom(ac, b.out, c.t, 0.5 * c.gain, 140);
    const g = gainNode(ac, 0); perc(g, c.t, 0.4 * c.gain, 0.05, 0.0006);
    chain(noise(ac, c.t, 0.06), filt(ac, 'bandpass', 1400, 2), g, b.out);
    const m = gainNode(ac, 1); bell(ac, m, c.t, 100, 0.05 * c.gain, 0.5); m.connect(b.out);
  },
  logoHit(ac, b, c) {
    SFX.impact(ac, b, { t: c.t, gain: c.gain * 0.8 });
    [53, 60, 65, 69, 72, 77].forEach((m, i) => { const g = gainNode(ac, 1); bell(ac, g, c.t + i * 0.012, m + 12, 0.07 * c.gain, 2.6, (i - 2.5) * 0.3); g.connect(b.out); const s = gainNode(ac, 0.9); g.connect(s); s.connect(b.rev); });
    vox(ac, b.out, c.t, 69, 0.9, 0.05 * c.gain, { vowel: 'o', to: 'a', p: -0.3 });
    vox(ac, b.out, c.t, 72, 0.9, 0.05 * c.gain, { vowel: 'o', to: 'a', p: 0.3 });
  },
  wordSwish(ac, b, c) { sweep(ac, b.out, c.t, 0.5, { f0: 800, f1: 6000, v: 0.4 * c.gain, shape: 'bell', p0: -0.6, p1: 0.6 }); },
  shapesPop(ac, b, c) { for (let k = 0; k < 10; k++) SFX.pop(ac, b, { t: c.t + k * 0.06 + rnd() * 0.03, gain: c.gain * 0.4, pitch: 0.8 + rnd() * 1.2 }); },
  typeTick(ac, b, c) { SFX.click(ac, b, { t: c.t, gain: c.gain * 0.5, pitch: c.pitch || 1 }); SFX.swish(ac, b, { t: c.t, gain: c.gain * 0.5 }); },
  ctaPop(ac, b, c) { SFX.pop(ac, b, { t: c.t, gain: c.gain, pitch: 0.9 }); marimba(ac, b.out, c.t + 0.03, 77, 0.2 * c.gain); },
  tail(ac, b, c) { SFX.shimmer(ac, b, { t: c.t, gain: c.gain * 0.6 }); },
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
