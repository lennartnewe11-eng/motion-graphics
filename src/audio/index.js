// Mixer: buses, sidechain ducking, reverb + ping-pong delay sends, glue compression and a limiter.
import { initKit, resetRandom, playSfx, makeIR } from './kit.js';
import { scheduleScore } from './score.js';

export const SAMPLE_RATE = 48000;

// Decode a file once per render and normalise its peak (samples come from different generators).
async function loadBuffer(ac, url, peak = 0) {
  const buf = await ac.decodeAudioData(await (await fetch(url)).arrayBuffer());
  if (peak) {
    let m = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i])); }
    const k = m > 0 ? peak / m : 1;
    for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= k; }
  }
  return buf;
}

// music: pre-produced tracks [{ url, t, gain }] on the music bus (ducked under the voice by voiceDuck)
// samples: base URL for sample cues ({ t, s: 'tear', gain, rate, pan, rev }) next to the synthesised ones
export async function renderMix(cues, duration, { solo = null, score = scheduleScore, voice = [], music = [], samples = null, voiceDuck = 0.25, voiceGain = 2.4, sfxGain = 1.55 } = {}) {
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
  const sfx = ac.createGain(); sfx.gain.value = sfxGain; sfx.connect(master);

  // voice-over bus (ElevenLabs narration), with the rest of the mix ducking underneath
  const vduck = ac.createGain();
  duck.disconnect(); duck.connect(vduck); vduck.connect(master);
  const dDuck = ac.createGain();
  drums.disconnect(); drums.connect(dDuck); dDuck.connect(master);
  if (voice.length) {
    const vIn = ac.createGain(); vIn.gain.value = solo && solo !== 'voice' ? 0 : voiceGain;
    const vHp = ac.createBiquadFilter(); vHp.type = 'highpass'; vHp.frequency.value = 90;
    const vPres = ac.createBiquadFilter(); vPres.type = 'peaking'; vPres.frequency.value = 3200; vPres.gain.value = 2.5;
    const vComp = ac.createDynamicsCompressor();
    vComp.threshold.value = -22; vComp.ratio.value = 3; vComp.attack.value = 0.005; vComp.release.value = 0.12;
    vIn.connect(vHp); vHp.connect(vPres); vPres.connect(vComp); vComp.connect(master);
    const vRev = ac.createGain(); vRev.gain.value = 0.06; vComp.connect(vRev); vRev.connect(revIn);
    const bufs = await Promise.all(voice.map(async (v) => ac.decodeAudioData(await (await fetch(v.url)).arrayBuffer())));
    voice.forEach((v, i) => {
      const src = ac.createBufferSource();
      src.buffer = bufs[i];
      src.connect(vIn);
      src.start(v.t);
      const end = v.t + bufs[i].duration;
      for (const [g, depth] of [[vduck.gain, voiceDuck], [dDuck.gain, 0.5]]) {
        g.setTargetAtTime(depth, v.t - 0.1, 0.05);
        g.setTargetAtTime(1, end + 0.05, 0.25);
      }
    });
  }
  // stem solo for mix analysis (reverb/delay returns stay on)
  if (solo) for (const [k, g] of [['drums', drums], ['music', musicIn], ['sfx', sfx]]) if (k !== solo) g.gain.value = 0;

  // Nodes are created just-in-time in short windows (suspend/resume) so the live graph stays small.
  const events = [];
  const at = (t, fn) => events.push([t, fn]);
  const kicks = score ? score(ac, { drums, music: musicIn, rev: revIn, delay: delayIn, sfx }, at) : [];

  // pre-produced music tracks
  for (const m of music) {
    const buf = await loadBuffer(ac, m.url);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const g = ac.createGain(); g.gain.value = m.gain ?? 1;
    src.connect(g); g.connect(musicIn);
    src.start(m.t || 0, m.offset || 0);
  }

  // sample cues (foley): decoded once, peak-normalised, scheduled like the synth cues
  const sampleCues = cues.filter((c) => c.s);
  if (samples && sampleCues.length) {
    const names = [...new Set(sampleCues.map((c) => c.s))];
    const bufs = Object.fromEntries(await Promise.all(names.map(async (n) => [n, await loadBuffer(ac, `${samples}${n}.mp3`, 0.9)])));
    for (const c of sampleCues) at(c.t, () => {
      const src = ac.createBufferSource();
      src.buffer = bufs[c.s];
      src.playbackRate.value = c.rate || 1;
      const g = ac.createGain(); g.gain.value = c.gain ?? 0.5;
      const p = ac.createStereoPanner(); p.pan.value = c.pan || 0;
      src.connect(g); g.connect(p); p.connect(sfx);
      if (c.rev) { const r = ac.createGain(); r.gain.value = c.rev; p.connect(r); r.connect(revIn); }
      src.start(Math.max(0, c.t), c.offset || 0);
    });
  }

  // sidechain: duck the music bus on every kick
  for (const t of kicks) {
    if (solo && solo !== 'music') break;
    duck.gain.setTargetAtTime(0.42, t, 0.003);
    duck.gain.setTargetAtTime(1.0, t + 0.04, 0.075);
  }

  for (const c of cues) if (!c.s) at(c.t, () => playSfx(ac, { out: sfx, rev: revIn, delay: delayIn }, c));

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
