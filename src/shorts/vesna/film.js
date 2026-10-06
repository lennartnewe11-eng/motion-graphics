// "Vesna" — explainer short, 1080x1920, 30 fps, ~61 s. JAT 367, 26 January 1972: the fall from 10 160 m.
// Every element is cut from a real photograph; cool monochrome on near-black, one colour (signal orange).
import { SW, SH, loadImages } from '../lib/collage.js';
import { FONTS as TYPE_FONTS } from '../lib/type.js';
import { LINES, SEGMENTS, DURATION, FPS } from './timeline.js';
import { SCENES } from './scenes.js';
import { cues } from './sound.js';
import { score as filmScore } from './score.js';

export const W = SW, H = SH;
export { FPS, DURATION };
export const FONTS = [...TYPE_FONTS, '800 40px "JetBrains Mono"', '500 40px "JetBrains Mono"', 'italic 700 40px "Bodoni Moda"', '700 40px "Bodoni Moda"', '300 40px "Inter Tight"'];
export const grainAmount = 1.5;
export const vignette = 0.22;
export const SHUTTER = 0.5;
export const sfxDuck = 0.5;
export const score = filmScore;

const PNG = ['plane_dive', 'plane_bank', 'yuaht', 'vesna', 'vesna_1973', 'fireball', 'cloud_a', 'cloud_b', 'cloud_c', 'cloud_d', 'cloud_e', 'cloud_f'];
const JPG = ['plate_jat', 'plate_vesna', 'plate_hospital', 'plate_reporter', 'plate_czech', 'plate_snow_v', 'plate_snow_a', 'plate_snow_b', 'plate_cloudsea', 'plate_sky'];

export async function init() {
  await loadImages(Object.fromEntries([...PNG.map((k) => [k, `/assets/vesna/img/${k}.png`]), ...JPG.map((k) => [k, `/assets/vesna/img/${k}.jpg`])]));
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
  ctx.fillStyle = '#090c11';
  ctx.fillRect(0, 0, SW, SH);
  const s = sceneAt(t);
  ctx.save();
  s.draw(ctx, t);
  ctx.restore();
  reset(ctx);
}

export function blurSamples(t) {
  const s = sceneAt(t);
  return (s.blur && s.blur(t)) || 2;
}

export function cueSheet() {
  const f = new URLSearchParams(location.search).get('cues');
  const all = cues();
  return f ? all.filter((c) => new RegExp(f).test(c.url || c.type)) : all;
}

export function voiceTakes() {
  return SEGMENTS.map((g) => ({ t: g.at, url: '/assets/vesna/vo/take.mp3', offset: Math.max(0, g.from), dur: g.to - Math.max(0, g.from) }));
}
export const voice = LINES;
