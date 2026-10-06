// The composition: scene order, transitions, HUD and the sound cue sheet.
import { C, clamp, ease, seg } from './engine/core.js';
import { drawHud } from './hud.js';
import { scenes } from './scenes/index.js';
import { transitions } from './transitions.js';

import { FPS, DURATION } from './meta.js';
export { FPS, DURATION };

const resetState = (ctx, keepTransform = false) => {
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  if (!keepTransform) ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
};

export function drawScene(ctx, scene, t, extra) {
  ctx.save();
  resetState(ctx, true);
  scene.draw(ctx, t - scene.start, t, extra);
  ctx.restore();
}

export function sceneAt(t) {
  for (const s of scenes) if (t >= s.start && t < s.end) return s;
  return scenes[scenes.length - 1];
}

function hudColor(t) {
  const s = sceneAt(t);
  return typeof s.hud === 'function' ? s.hud(t - s.start) : s.hud;
}

function sectionAt(t) {
  const s = sceneAt(t);
  const idx = scenes.indexOf(s);
  const prev = idx > 0 ? scenes[idx - 1] : null;
  const sub = s.subLabel ? s.subLabel(t - s.start) : null;
  if (sub) return { num: s.num, label: sub.label, t0: s.start + sub.t0, prev: sub.prev ? { num: s.num, label: sub.prev } : null };
  return { num: s.num, label: s.label, t0: s.start, prev: prev ? { num: prev.num, label: prev.label } : null };
}

// Render the full composition at time t (seconds). `frame` is used for the timecode only.
export function compose(ctx, t, frame) {
  resetState(ctx);
  const tr = transitions.find((x) => t >= x.start && t < x.end);
  if (tr) {
    const A = scenes.find((s) => s.id === tr.from);
    const B = scenes.find((s) => s.id === tr.to);
    const p = (t - tr.start) / (tr.end - tr.start);
    tr.draw(ctx, t, p, (c, extra) => drawScene(c, A, t, extra), (c, extra) => drawScene(c, B, t, extra), A, B);
  } else {
    drawScene(ctx, sceneAt(t), t);
  }
  resetState(ctx);
  drawHud(ctx, t, frame, FPS, sectionAt(t), hudColor(t));
}

// Motion-blur sample count per frame (more where things move very fast).
export function blurSamples(t) {
  for (const tr of transitions) if (tr.blur && t >= tr.start && t < tr.end) return tr.blur;
  for (const s of scenes) if (s.blur && t >= s.start && t < s.end) {
    const n = s.blur(t - s.start);
    if (n) return n;
  }
  return 4;
}

// The sound cue sheet: every scene declares its own cues in local time.
export function cueSheet() {
  const cues = [];
  for (const s of scenes) for (const c of s.sfx || []) cues.push({ ...c, t: c.t + s.start });
  for (const tr of transitions) for (const c of tr.sfx || []) cues.push({ ...c, t: c.t + tr.start });
  cues.sort((a, b) => a.t - b.t);
  return cues;
}

export async function init() {
  for (const s of scenes) if (s.init) await s.init();
}

export { scenes, transitions, C, clamp, ease, seg };
