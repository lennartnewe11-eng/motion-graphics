// Mixer: buses, sidechain ducking, reverb + ping-pong delay sends, glue compression and a limiter.
import { initKit, resetRandom, playSfx, makeIR } from './kit.js';
import { scheduleScore } from './score.js';

export const SAMPLE_RATE = 48000;

export async function renderMix(cues, duration, { solo = null, score = scheduleScore, voice = [], sfxDuck = 1 } = {}) {
  const ac = new OfflineAudioContext(2, Math.ceil(duration * SAMPLE_RATE), SAMPLE_RATE);
  initKit(ac);
  resetRandom();

  // master chain
  const master = ac.createGain();
  master.gain.value = 0.75;
  const lowCut = ac.createBiquadFilter();
  lowCut.type = 'highpass';
  lowCut.frequency.value = 28;
  const glue = ac.createDynamicsCompressor();
  glue.threshold.value = -18; glue.knee.value = 10; glue.ratio.value = 2.5; glue.attack.value = 0.012; glue.release.value = 0.18;
  const limiter = ac.createDynamicsCompressor();
  limiter.threshold.value = -3; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.001; limiter.release.value = 0.06;
  master.connect(lowCut); lowCut.connect(glue); glue.connect(limiter); limiter.connect(ac.destination);

  // reverb send
  const revIn = ac.createGain();
  const revHp = ac.createBiquadFilter();
  revHp.type = 'highpass'; revHp.frequency.value = 280;
  const conv = ac.createConvolver();
  conv.buffer = makeIR(ac, 2.8, 2.4);
  const revOut = ac.createGain();
  revOut.gain.value = 0.32;
  revIn.connect(revHp); revHp.connect(conv); conv.connect(revOut); revOut.connect(master);

  // ping-pong delay (dotted eighth)
  const delayIn = ac.createGain();
  const dL = ac.createDelay(2), dR = ac.createDelay(2);
  dL.delayTime.value = 0.375; dR.delayTime.value = 0.375;
  const fb1 = ac.createGain(), fb2 = ac.createGain();
  fb1.gain.value = 0.42; fb2.gain.value = 0.42;
  const dlp = ac.createBiquadFilter();
  dlp.type = 'lowpass'; dlp.frequency.value = 3200;
  const pL = ac.createStereoPanner(), pR = ac.createStereoPanner();
  pL.pan.value = -0.75; pR.pan.value = 0.75;
  const delayOut = ac.createGain();
  delayOut.gain.value = 0.32;
  delayIn.connect(dlp); dlp.connect(dL);
  dL.connect(pL); pL.connect(delayOut);
  dL.connect(fb1); fb1.connect(dR);
  dR.connect(pR); pR.connect(delayOut);
  dR.connect(fb2); fb2.connect(dL);
  delayOut.connect(master);
  const dRev = ac.createGain(); dRev.gain.value = 0.2; delayOut.connect(dRev); dRev.connect(revIn);

  // buses
  const drums = ac.createGain(); drums.gain.value = 0.85; drums.connect(master);
  const musicIn = ac.createGain(); musicIn.gain.value = 0.75;
  const duck = ac.createGain(); duck.gain.value = 1;
  musicIn.connect(duck); duck.connect(master);
  const sfx = ac.createGain(); sfx.gain.value = 1.55;
  const sDuck = ac.createGain(); sDuck.gain.value = 1; sfx.connect(sDuck); sDuck.connect(master);

  // voice-over bus (ElevenLabs narration), with the rest of the mix ducking underneath
  const vduck = ac.createGain();
  duck.disconnect(); duck.connect(vduck); vduck.connect(master);
  const dDuck = ac.createGain();
  drums.disconnect(); drums.connect(dDuck); dDuck.connect(master);
  if (voice.length) {
    const vIn = ac.createGain(); vIn.gain.value = solo && solo !== 'voice' ? 0 : 2.4;
    const vHp = ac.createBiquadFilter(); vHp.type = 'highpass'; vHp.frequency.value = 90;
    const vPres = ac.createBiquadFilter(); vPres.type = 'peaking'; vPres.frequency.value = 3200; vPres.gain.value = 2.5;
    const vComp = ac.createDynamicsCompressor();
    vComp.threshold.value = -22; vComp.ratio.value = 3; vComp.attack.value = 0.005; vComp.release.value = 0.12;
    vIn.connect(vHp); vHp.connect(vPres); vPres.connect(vComp); vComp.connect(master);
    const vRev = ac.createGain(); vRev.gain.value = 0.06; vComp.connect(vRev); vRev.connect(revIn);
    const decoded = new Map();
    for (const u of new Set(voice.map((v) => v.url))) decoded.set(u, await ac.decodeAudioData(await (await fetch(u)).arrayBuffer()));
    const bufs = voice.map((v) => decoded.get(v.url));
    voice.forEach((v, i) => {
      const src = ac.createBufferSource();
      src.buffer = bufs[i];
      // short fades so slices cut from one take never click
      const fg = ac.createGain();
      src.connect(fg); fg.connect(vIn);
      // optional sub-range of the take (offset/dur) so a film can open a pause inside a line
      const off = v.offset || 0, len = v.dur ?? bufs[i].duration - off;
      src.start(Math.max(0, v.t), off, len);
      const end = v.t + len;
      if (v.offset !== undefined) {
        fg.gain.setValueAtTime(0, Math.max(0, v.t));
        fg.gain.linearRampToValueAtTime(1, Math.max(0, v.t) + 0.005);
        fg.gain.setValueAtTime(1, Math.max(0, end - 0.006));
        fg.gain.linearRampToValueAtTime(0, end);
      }
    });
    // duck the rest of the mix under the voice: merge segments into continuous speech spans first,
    // so the release of one slice can never cancel the duck of the next
    const spans = [];
    for (const v of voice.map((v, i) => ({ a: Math.max(0, v.t), b: Math.max(0, v.t) + (v.dur ?? bufs[i].duration - (v.offset || 0)) })).sort((x, y) => x.a - y.a)) {
      const last = spans[spans.length - 1];
      if (last && v.a - last.b < 0.35) last.b = Math.max(last.b, v.b); else spans.push({ ...v });
    }
    for (const { a, b } of spans) {
      for (const [g, depth] of [[vduck.gain, 0.25], [dDuck.gain, 0.5], [sDuck.gain, sfxDuck]]) {
        g.setTargetAtTime(depth, Math.max(0, a - 0.1), 0.05);
        g.setTargetAtTime(1, b + 0.05, 0.25);
      }
    }
  }
  // stem solo for mix analysis (reverb/delay returns stay on)
  if (solo) for (const [k, g] of [['drums', drums], ['music', musicIn], ['sfx', sfx]]) if (k !== solo) g.gain.value = 0;

  // Nodes are created just-in-time in short windows (suspend/resume) so the live graph stays small.
  const events = [];
  const at = (t, fn) => events.push([t, fn]);
  const kicks = score(ac, { drums, music: musicIn, rev: revIn, delay: delayIn, sfx }, at);

  // sidechain: duck the music bus on every kick
  for (const t of kicks) {
    if (solo && solo !== 'music') break;
    duck.gain.setTargetAtTime(0.42, t, 0.003);
    duck.gain.setTargetAtTime(1.0, t + 0.04, 0.075);
  }

  // recorded foley (ElevenLabs takes, sliced into variants): cue = { t, url, gain, pan, rate, rev, dur, lp, hp }
  const sampleUrls = [...new Set(cues.filter((c) => c.url).map((c) => c.url))];
  const sampleBufs = new Map(await Promise.all(sampleUrls.map(async (u) => [u, await ac.decodeAudioData(await (await fetch(u)).arrayBuffer())])));
  const playSample = (c) => {
    const src = ac.createBufferSource();
    src.buffer = sampleBufs.get(c.url);
    src.playbackRate.value = c.rate || 1;
    const g = ac.createGain();
    const gain = c.gain ?? 1;
    const len = c.dur ?? (src.buffer.duration - (c.offset || 0)) / (c.rate || 1);
    if (c.fadeIn) { g.gain.setValueAtTime(0, c.t); g.gain.linearRampToValueAtTime(gain, c.t + c.fadeIn); } else g.gain.setValueAtTime(gain, c.t);
    const fo = c.fadeOut ?? Math.min(0.08, len * 0.3);
    g.gain.setValueAtTime(gain, Math.max(c.t, c.t + len - fo));
    g.gain.linearRampToValueAtTime(0, c.t + len);
    let node = src;
    if (c.lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = c.lp; node.connect(f); node = f; }
    if (c.hp) { const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = c.hp; node.connect(f); node = f; }
    const p = ac.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, c.pan || 0));
    node.connect(g); g.connect(p); p.connect(c.bus === 'amb' ? sfx : sfx);
    if (c.rev) { const s = ac.createGain(); s.gain.value = c.rev; p.connect(s); s.connect(revIn); }
    src.start(Math.max(0, c.t), c.offset || 0, len * (c.rate || 1) + 0.01);
  };
  for (const c of cues) at(c.t, () => (c.url ? playSample(c) : playSfx(ac, { out: sfx, rev: revIn, delay: delayIn }, c)));

  events.sort((x, y) => x[0] - y[0]);
  const WIN = 0.5, LEAD = 0.25;
  let next = 0;
  const flush = (until) => {
    while (next < events.length && events[next][0] < until) events[next++][1]();
  };
  flush(WIN + LEAD);
  for (let w = WIN; w < duration; w += WIN) {
    const until = w + WIN + LEAD;
    ac.suspend(w).then(() => { flush(until); ac.resume(); });
  }
  return ac.startRendering();
}
