// "Flow" — one continuous shot. Every element hands over to the next without a cut.
import { C, rgba, seg, ease, mix } from '../engine/core.js';
import { F, font } from '../engine/draw.js';
import { scheduleFlowScore } from './score.js';
import { shots } from './shots.js';

export const FPS = 60;
export const DURATION = 50;
export { scheduleFlowScore as score };

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
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
};

const shotAt = (t) => shots.find((s) => t >= s.start && t < s.end) || shots[shots.length - 1];

// Minimal HUD — brand + timecode only, so nothing interrupts the flow.
function hud(ctx, t, frame) {
  if (t < 0.4 || t > 48.6) return;
  const s = shotAt(t);
  const col = typeof s.hud === 'function' ? s.hud(t) : s.hud || C.paper;
  const a = seg(t, 0.4, 1.2, ease.outCubic) * (1 - seg(t, 48.0, 48.6));
  ctx.save();
  ctx.globalAlpha = a;
  font(ctx, 16, 700, F.mono);
  ctx.letterSpacing = '4px';
  ctx.fillStyle = rgba(col);
  ctx.fillText('CLAUDE', 64, 70);
  font(ctx, 16, 400, F.mono);
  ctx.fillStyle = rgba(col, 0.5);
  ctx.fillText('/  FLOW', 160, 70);
  const sec = Math.floor(frame / FPS), ff = frame % FPS;
  ctx.textAlign = 'right';
  ctx.fillStyle = rgba(col);
  ctx.fillText(`${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}:${String(ff).padStart(2, '0')}`, 1856, 70);
  ctx.fillStyle = rgba(col, 0.5);
  ctx.fillText('ONE TAKE  ·  0 CUTS', 1856, 1030);
  // progress hairline
  ctx.fillStyle = rgba(col, 0.18);
  ctx.fillRect(64, 1012 - 24, 1792, 1);
  ctx.fillStyle = rgba(col, 0.8);
  ctx.fillRect(64, 1012 - 24, 1792 * (t / 48.6), 1);
  ctx.restore();
}

export function compose(ctx, t, frame) {
  reset(ctx);
  const s = shotAt(t);
  ctx.save();
  s.draw(ctx, t);
  ctx.restore();
  reset(ctx);
  hud(ctx, t, frame);
}

export function blurSamples(t) {
  const s = shotAt(t);
  return (s.blur && s.blur(t)) || 4;
}

export function cueSheet() {
  return shots.flatMap((s) => s.sfx || []).sort((a, b) => a.t - b.t);
}

export async function init() {
  for (const s of shots) if (s.init) await s.init();
}

export const voice = (await import('./voice.json', { with: { type: 'json' } })).default;
