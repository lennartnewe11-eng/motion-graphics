// "Die Melasse-Flut" — explainer short, 1080x1920, 30 fps, ~56 s.
// Archive collage that moves like film; one colour only (the molasses). See docs/STYLEGUIDE.md §6–§8.
import { SW, SH, P, bg, loadImages, paperTexture, fibreTexture } from '../lib/collage.js';
import { FONTS as TYPE_FONTS } from '../lib/type.js';
import { LINES, SEGMENTS, DURATION, FPS } from './timeline.js';
import { SCENES } from './scenes.js';
import { cues } from './sound.js';
import { score as filmScore } from './score.js';

export const W = SW, H = SH;
export { FPS, DURATION };
export const FONTS = TYPE_FONTS;
export const grainAmount = 1.35; // archive film grain on luma
export const vignette = 0.1;
export const SHUTTER = 0.5;
export const sfxDuck = 0.5; // foley sits 6 dB under the narrator
export const score = filmScore;

const IMAGES = ['plate_street', 'plate_aerial', 'plate_elwreck', 'plate_ambulance', 'plate_tank', 'plate_twharf', 'plate_rowes',
  'plate_dudley', 'plate_fire', 'news_ledger', 'news_newbritain', 'news_globe', 'fire_fg', 'lewis_gun',
  'p_woman', 'p_boy_wood', 'p_girl_box', 'p_girl_wood', 'p_man_bowler', 'p_boy_walk'];

export async function init() {
  await loadImages(Object.fromEntries(IMAGES.map((k) => [k, `/assets/molasse/img/${k}.${k.startsWith('p_') || k.endsWith('_fg') || k === 'lewis_gun' ? 'png' : 'jpg'}`])));
  paperTexture();
  fibreTexture();
}

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

const sceneAt = (t) => SCENES.find((s) => t >= s.start && t < s.end) || SCENES[SCENES.length - 1];

export function compose(ctx, t) {
  reset(ctx);
  bg(ctx, P.paper, false);
  const s = sceneAt(t);
  ctx.save();
  s.draw(ctx, t);
  ctx.restore();
  reset(ctx);
  // paper tooth over everything: prints, stickers and syrup sit on the same sheet
  ctx.globalAlpha = 0.55;
  ctx.drawImage(fibreTexture(), 0, 0);
  ctx.globalAlpha = 1;
}

export function blurSamples(t) {
  const s = sceneAt(t);
  return (s.blur && s.blur(t)) || 2;
}

export function cueSheet() {
  // debug: ?cues=<regex> keeps only matching cues (by sample url or synth type) for mix analysis
  const f = new URLSearchParams(location.search).get('cues');
  const all = cues();
  return f ? all.filter((c) => new RegExp(f).test(c.url || c.type)) : all;
}

// the narration: slices of the one take, placed on the film clock (timeline.js trims the long breaths)
export function voiceTakes() {
  return SEGMENTS.map((g) => ({ t: g.at, url: '/assets/molasse/vo/take.mp3', offset: Math.max(0, g.from), dur: g.to - Math.max(0, g.from) }));
}
export const voice = LINES;
