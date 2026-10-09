// Pinterest — spec spot (36 s, 1920×1080, 60 fps). Composition, shot order, cue sheet.
import * as G from './gl.js';
import * as feed from './feed.js';
import * as make from './make.js';
import * as end from './end.js';
import { scorePinterest } from './score.js';

export const FPS = 60;
export const DURATION = 36;
export const finish = { vignette: 0, grainBase: 0.3, grainMid: 1.3 };
export { scorePinterest as score };

const shots = [
  { start: 0, end: 20, mod: feed },
  { start: 20, end: 30, mod: make },
  { start: 30, end: 36, mod: end },
];
const reset = (ctx) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
};
const shotAt = (t) => shots.find((s) => t >= s.start && t < s.end) || shots[shots.length - 1];

export function compose(ctx, t, frame) {
  reset(ctx);
  const s = shotAt(t);
  ctx.save();
  s.mod.draw(ctx, Math.min(t, s.end - 1e-4), frame);
  ctx.restore();
  reset(ctx);
}
export const blurSamples = (t) => shotAt(t).mod.blur?.(t) || 4;
export function cueSheet() {
  return [...feed.sfx, ...feed.scrollTicks(), ...make.sfx, ...end.sfx].sort((a, b) => a.t - b.t);
}
export async function init() {
  G.initGL();
  for (const s of shots) await s.mod.init?.();
  feed.setPortal((ctx, t, frame) => make.draw(ctx, t, frame, { portal: true }));
}
