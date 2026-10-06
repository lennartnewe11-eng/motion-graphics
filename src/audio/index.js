// Mixer: buses, sidechain ducking, reverb + ping-pong delay sends, glue compression and a limiter.
import { initKit, resetRandom, playSfx, makeIR } from './kit.js';
import { scheduleScore } from './score.js';

export const SAMPLE_RATE = 48000;

export async function renderMix(cues, duration, { solo = null } = {}) {
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
  const sfx = ac.createGain(); sfx.gain.value = 1.55; sfx.connect(master);
  // stem solo for mix analysis (reverb/delay returns stay on)
  if (solo) for (const [k, g] of [['drums', drums], ['music', duck], ['sfx', sfx]]) if (k !== solo) g.gain.value = 0;

  // Nodes are created just-in-time in short windows (suspend/resume) so the live graph stays small.
  const events = [];
  const at = (t, fn) => events.push([t, fn]);
  const kicks = scheduleScore(ac, { drums, music: musicIn, rev: revIn, delay: delayIn, sfx }, at);

  // sidechain: duck the music bus on every kick
  for (const t of kicks) {
    if (solo && solo !== 'music') break;
    duck.gain.setTargetAtTime(0.42, t, 0.003);
    duck.gain.setTargetAtTime(1.0, t + 0.04, 0.075);
  }

  for (const c of cues) at(c.t, () => playSfx(ac, { out: sfx, rev: revIn, delay: delayIn }, c));

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
