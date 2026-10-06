// Assecor — image film. Storytelling after the "word by word" reference (kinetic type, real photos,
// icons, hand-drawn layer), in the visual language of assecor.de; the analog CRT look is applied
// afterwards by scripts/analog.mjs.
import { FPS, DURATION, VOICE } from './timeline.js';
import { FONTS, loadAssets, dust, COL } from './lib.js';
import { SCENES } from './scenes.js';

export { FPS, DURATION };
export const fonts = FONTS;
export const voice = VOICE;
// the analog pass adds its own noise/vignette — keep only a whisper of the built-in grain
export const finish = { grain: 0.25, vignette: 0 };
export const mix = {
  score: null,
  music: [{ url: '/assets/assecor/music/score.mp3', t: 0, gain: 1.15 }],
  samples: '/assets/assecor/sfx/',
  voiceDuck: 0.6,
  voiceGain: 2.1,
  sfxGain: 1.0,
};

const reset = (ctx) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
};

const sceneAt = (t) => SCENES.find((s) => t >= s.start && t < s.end) || SCENES[SCENES.length - 1];

export function compose(ctx, t, frame) {
  reset(ctx);
  const s = sceneAt(t);
  ctx.save();
  s.draw(ctx, t, frame);
  ctx.restore();
  reset(ctx);
  if (s.post) { s.post(ctx, t, frame); reset(ctx); }
  dust(ctx, frame, { n: 6 });
}

export function blurSamples(t) {
  const s = sceneAt(t);
  return (s.blur && s.blur(t)) || 3;
}

export function cueSheet() {
  return SCENES.flatMap((s) => s.sfx || [])
    .map((c) => ({ gain: 0.5, ...c }))
    .sort((a, b) => a.t - b.t);
}

export async function init() {
  await loadAssets([
    'welt', 'handshake', 'whiteboard', 'presenter', 'servers', 'rack', 'laptop', 'typing', 'code', 'team', 'sticky',
    'notes', 'sketch', 'squiggle', 'machinist', 'tower', 'berlin', 'spree', 'station', 'pylon', 'talk', 'meeting', 'handshake2', 'factory',
  ]);
}

export { COL };
