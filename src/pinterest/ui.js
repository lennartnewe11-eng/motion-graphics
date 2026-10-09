// Pinterest-style UI chrome drawn in 2D: header bar, logo, pills, the pin close-up page, board chip,
// tap ripples and kinetic type. Clean, flat, rounded — the crisp counterpart to the pencil world.
import { TAU, clamp, lerp, ease, seg, spring } from '../engine/core.js';

export const RED = '#E60023', INK = '#111111', GREY = '#767676', PILL = '#E9E9E9';
export const FONT = 'InterV';

export function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export function text(ctx, str, x, y, size, weight = 600, color = INK, align = 'left', o = {}) {
  ctx.font = `${o.style || 'normal'} ${weight} ${size}px ${o.family || FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = o.baseline || 'middle';
  ctx.letterSpacing = (o.tracking || 0) + 'px';
  ctx.fillText(str, x, y);
  ctx.letterSpacing = '0px';
}

// The logo: red disc with a white P whose stem runs down like a pin's needle.
export function logo(ctx, x, y, r, { pReveal = 1, disc = 1, color = RED } = {}) {
  ctx.save();
  ctx.translate(x, y);
  if (disc > 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, r * disc, 0, TAU);
    ctx.fill();
  }
  if (pReveal > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.clip();
    ctx.fillStyle = '#fff';
    // P: bowl (ring) + tapered stem
    const bx = r * 0.08, by = -r * 0.16, R0 = r * 0.44, R1 = r * 0.2;
    ctx.save();
    if (pReveal < 1) {
      // reveal: wipe from the top of the stem, round the bowl
      ctx.beginPath();
      ctx.rect(-r, -r, r * 2, r * 2 * pReveal);
      ctx.clip();
    }
    ctx.beginPath();
    ctx.arc(bx, by, R0, -Math.PI / 2 - 0.35, Math.PI / 2 + 0.5);
    ctx.lineTo(-r * 0.12, by + R0 * 0.98);
    ctx.lineTo(-r * 0.12, by + R1 * 1.0);
    ctx.lineTo(bx, by + R1);
    ctx.arc(bx, by, R1, Math.PI / 2, -Math.PI / 2, true);
    ctx.lineTo(-r * 0.12, by - R1);
    ctx.lineTo(-r * 0.12, by - R0 * 0.96);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-r * 0.36, -r * 0.58);
    ctx.quadraticCurveTo(-r * 0.25, -r * 0.62, -r * 0.12, -r * 0.6);
    ctx.lineTo(-r * 0.12, r * 0.42);
    ctx.quadraticCurveTo(-r * 0.16, r * 0.78, -r * 0.34, r * 1.02);
    ctx.quadraticCurveTo(-r * 0.36, r * 0.7, -r * 0.36, r * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export function pill(ctx, x, y, w, h, fill, { stroke = null, r = h / 2 } = {}) {
  rr(ctx, x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

function icon(ctx, kind, x, y, s = 1, color = '#5F5F5F') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (kind === 'search') { ctx.beginPath(); ctx.arc(-2, -2, 8, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(4, 4); ctx.lineTo(10, 10); ctx.stroke(); }
  if (kind === 'bell') {
    ctx.beginPath(); ctx.moveTo(-10, 7); ctx.lineTo(10, 7); ctx.quadraticCurveTo(6, 3, 6, -2); ctx.quadraticCurveTo(6, -11, 0, -11); ctx.quadraticCurveTo(-6, -11, -6, -2); ctx.quadraticCurveTo(-6, 3, -10, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 10, 3, 0, TAU); ctx.fill();
  }
  if (kind === 'chat') {
    ctx.beginPath(); ctx.ellipse(0, -1, 11, 9.5, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-6, 6); ctx.lineTo(-10, 12); ctx.lineTo(-1, 8); ctx.fill();
    ctx.fillStyle = '#fff'; for (const dx of [-5, 0, 5]) { ctx.beginPath(); ctx.arc(dx, -1, 1.6, 0, TAU); ctx.fill(); }
  }
  if (kind === 'share') { ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -10); ctx.moveTo(-6, -4); ctx.lineTo(0, -10); ctx.lineTo(6, -4); ctx.moveTo(-9, 2); ctx.lineTo(-9, 10); ctx.lineTo(9, 10); ctx.lineTo(9, 2); ctx.stroke(); }
  if (kind === 'dots') for (const dx of [-7, 0, 7]) { ctx.beginPath(); ctx.arc(dx, 0, 2.6, 0, TAU); ctx.fill(); }
  if (kind === 'heart') { ctx.beginPath(); ctx.moveTo(0, 9); ctx.bezierCurveTo(-14, -1, -8, -12, 0, -5); ctx.bezierCurveTo(8, -12, 14, -1, 0, 9); ctx.stroke(); }
  if (kind === 'down') { ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(0, 3); ctx.lineTo(5, -2); ctx.stroke(); }
  ctx.restore();
}
export { icon };

// Header bar. p = slide-in progress, search = { text, caret } for typing, active tab.
export function header(ctx, { p = 1, search = 'Suche nach Ideen', typed = null, caret = false, alpha = 1, board = null } = {}) {
  if (p <= 0 || alpha <= 0) return;
  const y0 = (1 - p) * -110;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(0, y0);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 1920, 96);
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.fillRect(0, 96, 1920, 1);
  logo(ctx, 58, 48, 23);
  pill(ctx, 100, 22, 150, 52, INK);
  text(ctx, 'Startseite', 175, 49, 19, 650, '#fff', 'center');
  text(ctx, 'Entdecken', 280, 49, 19, 650, INK);
  text(ctx, 'Erstellen', 412, 49, 19, 650, INK);
  pill(ctx, 540, 22, 1080, 52, PILL);
  icon(ctx, 'search', 576, 48, 1.05, GREY);
  if (typed !== null) {
    text(ctx, typed, 604, 49, 19, 550, INK);
    if (caret) { ctx.font = `550 19px ${FONT}`; const w = ctx.measureText(typed).width; ctx.fillStyle = INK; ctx.fillRect(606 + w, 36, 2, 26); }
  } else text(ctx, search, 604, 49, 19, 500, GREY);
  icon(ctx, 'bell', 1672, 48, 1.15);
  icon(ctx, 'chat', 1740, 48, 1.15);
  ctx.fillStyle = '#F4A3B8';
  ctx.beginPath(); ctx.arc(1810, 48, 20, 0, TAU); ctx.fill();
  text(ctx, 'L', 1810, 49, 18, 750, '#7A2E44', 'center');
  icon(ctx, 'down', 1856, 50, 1, INK);
  ctx.restore();
}

// Tap feedback: two expanding rings + a soft filled pulse.
export function ripple(ctx, x, y, age, { color = RED, r1 = 120, a = 1 } = {}) {
  if (age < 0 || age > 0.9) return;
  ctx.save();
  for (const [d, k] of [[0, 1], [0.12, 0.6]]) {
    const q = clamp((age - d) / 0.6);
    if (q <= 0 || q >= 1) continue;
    const r = lerp(8, r1 * k + 30, ease.outExpo(q));
    ctx.strokeStyle = color;
    ctx.globalAlpha = a * (1 - q) * 0.9;
    ctx.lineWidth = 7 * (1 - q) + 1;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  }
  const q = clamp(age / 0.35);
  ctx.globalAlpha = a * 0.22 * (1 - q);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, lerp(10, 60, ease.outCubic(q)), 0, TAU); ctx.fill();
  ctx.restore();
}

// Kinetic word: letters rise out of a mask with a stagger, and drop out on exit.
export function kinetic(ctx, str, x, y, size, t, t0, t1, { weight = 850, color = INK, align = 'center', stagger = 0.035, tracking = -0.03, dur = 0.45, family = FONT, style = 'normal' } = {}) {
  if (t < t0 || t > t1 + 0.6) return;
  ctx.save();
  ctx.font = `${style} ${weight} ${size}px ${family}`;
  ctx.letterSpacing = tracking * size + 'px';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const W = ctx.measureText(str).width;
  let cx = align === 'center' ? x - W / 2 : align === 'right' ? x - W : x;
  const asc = size * 0.76, desc = size * 0.24;
  ctx.beginPath();
  ctx.rect(cx - size, y - asc - size * 0.18, W + size * 2, asc + desc + size * 0.36);
  ctx.clip();
  ctx.fillStyle = color;
  let prev = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const wPrefix = ctx.measureText(str.slice(0, i)).width;
    const pin = ease.outExpo(clamp((t - t0 - i * stagger) / dur));
    const pout = ease.inExpo(clamp((t - t1 - i * stagger * 0.6) / (dur * 0.8)));
    const dy = (1 - pin) * (asc + desc + size * 0.2) - pout * (asc + desc + size * 0.25);
    if (pin > 0) ctx.fillText(ch, cx + wPrefix, y + dy);
    prev = ch;
  }
  ctx.restore();
  return W;
}

// Board chip (top right): collage of saved pin thumbnails + count.
export function boardChip(ctx, x, y, { thumbs = [], count = 0, bump = 0, alpha = 1, scale = 1 } = {}) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(scale * (1 + bump * 0.12), scale * (1 + bump * 0.12));
  ctx.shadowColor = 'rgba(0,0,0,0.16)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  pill(ctx, -150, -46, 300, 92, '#fff', { r: 24 });
  ctx.shadowColor = 'transparent';
  // 2×2 collage
  ctx.save();
  rr(ctx, -136, -32, 64, 64, 14);
  ctx.clip();
  ctx.fillStyle = '#EFEFEF';
  ctx.fillRect(-136, -32, 64, 64);
  thumbs.slice(0, 4).forEach((th, i) => {
    const tx = -136 + (i % 2) * 32, ty = -32 + Math.floor(i / 2) * 32;
    if (th) ctx.drawImage(th, 0, 0, th.width, th.width, tx, ty, 32, 32);
  });
  ctx.restore();
  text(ctx, 'Sonntagsideen', -58, -10, 20, 750, INK);
  text(ctx, `${count} ${count === 1 ? 'Pin' : 'Pins'}`, -58, 16, 16, 550, GREY);
  ctx.restore();
}
