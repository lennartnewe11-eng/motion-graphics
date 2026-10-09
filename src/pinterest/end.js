// Act 5 (30–36 s): the four lived ideas stack up, a 3D push pin pins them, its head becomes the logo,
// the wordmark and the line arrive, and the drawn hand taps "Jetzt entdecken".
import { clamp, lerp, ease, seg, spring, kf, rng, TAU } from '../engine/core.js';
import * as G from './gl.js';
import { THREE } from './gl.js';
import { boilAt } from './pencil.js';
import { drawHand } from './figures.js';
import { snapshot } from './make.js';
import { logo, text, pill, rr, ripple, kinetic, RED, INK, GREY } from './ui.js';

export const T0 = 30;
const PIN_AT = 30.55, LOGO_AT = 30.95, WORD_AT = 31.2, LINE_AT = 31.9, CTA_AT = 32.7, TAP_AT = 34.0;
const LOGO = { x: 960, y: 410, r: 112 };
let LOCK = null; // final lock-up (measured once)
const CTA = { x: 960, y: 800, w: 450, h: 104 };

let grp, pin, floaters = [], burst = [];
export async function init() {
  grp = new THREE.Group();
  grp.visible = false;
  G.getScene().add(grp);
  pin = G.makePushpin('red');
  grp.add(pin);
  const defs = [
    ['heart', 'red', 250, 250, 70], ['sphere', 'butter', 1660, 230, 52], ['torus', 'pink', 1720, 760, 64], ['star', 'lilac', 230, 800, 60],
    ['pencil', 'blue', 430, 520, 20], ['knot', 'mint', 1500, 520, 44], ['box', 'peach', 560, 930, 40], ['pushpin', 'red', 1400, 930, 58],
    ['sphere', 'red', 1240, 170, 30], ['pencil', 'yellow', 700, 150, 16],
  ];
  const R = rng(77);
  for (const [k, c, x, y, s] of defs) {
    const m = G.mesh(k, c), sh = G.shadowMesh();
    grp.add(m, sh);
    floaters.push({ m, sh, k, x, y, s, ph: R() * TAU, sp: 0.5 + R() * 0.6, d: Math.hypot(x - 960, y - 540) });
  }
  const kinds = [['heart', 'red'], ['star', 'butter'], ['sphere', 'pink'], ['torus', 'mint'], ['pushpin', 'red'], ['heart', 'blush'], ['box', 'lilac'], ['sphere', 'red'], ['star', 'red'], ['capsule', 'sky'], ['heart', 'red'], ['sphere', 'butter']];
  kinds.forEach(([k, c], i) => { const m = G.mesh(k, c); grp.add(m); burst.push({ m, k, i }); });
}

// card rects at the hand-over from act 4 (four cards across the frame)
const card0 = (k) => ({ x: 240 + 480 * k, y: 540, w: 384, h: 216 });

function drawCards(ctx, t, frame) {
  const p = ease.inOutCubic(seg(t, 30.0, 30.5));
  const squash = t > PIN_AT ? 1 - 0.12 * Math.exp(-(t - PIN_AT) * 10) * Math.cos((t - PIN_AT) * 30) : 1;
  const gone = ease.inCubic(seg(t, 30.75, 31.05));
  if (gone >= 1) return;
  for (let k = 0; k < 4; k++) {
    const c0 = card0(k);
    const rot = lerp(0, (k - 1.5) * 0.09, p);
    const x = lerp(c0.x, LOGO.x + (k - 1.5) * 10, p), y = lerp(c0.y, LOGO.y + 20 + (1.5 - Math.abs(k - 1.5)) * -6, p) - Math.sin(p * Math.PI) * 120;
    const s = lerp(1, 0.9, p) * (1 - gone) * (k === 3 ? squash : 1);
    const img = snapshot(k, 29.99, 1799);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s * (2 - squash));
    ctx.shadowColor = 'rgba(0,0,0,0.14)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    rr(ctx, -c0.w / 2, -c0.h / 2, c0.w, c0.h, 24); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.clip();
    ctx.drawImage(img, -c0.w / 2, -c0.h / 2, c0.w, c0.h);
    ctx.restore();
  }
}

function layoutPin(t) {
  // drops in tilted, pins the stack, rights itself so its head faces the camera, grows into the logo
  const drop = ease.inQuad(seg(t, 30.2, PIN_AT));
  const settle = spring(t - PIN_AT, { stiffness: 180, damping: 13 });
  const grow = ease.inOutCubic(seg(t, PIN_AT + 0.05, LOGO_AT));
  const vis = t > 30.2 && t < LOGO_AT + 0.02;
  pin.visible = vis;
  if (!vis) return;
  const z = lerp(-1400, -150, drop);
  const y = lerp(-500, LOGO.y, drop);
  pin.position.set(LOGO.x + (1 - drop) * 300, y, z);
  const tiltX = -Math.PI / 2 + lerp(0.9, 0, clamp(settle)) * (t > PIN_AT ? 1 : 1);
  pin.rotation.set(t < PIN_AT ? -Math.PI / 2 + 0.9 : tiltX, 0, t < PIN_AT ? 0.5 * (1 - drop) : 0);
  const sc = lerp(112, 126, grow);
  pin.scale.setScalar(sc);
}

function layoutFloaters(t) {
  for (const f of floaters) {
    const t0 = WORD_AT + f.d / 2400;
    const sp = spring(t - t0, { stiffness: 150, damping: 11 });
    f.m.visible = f.sh.visible = t > t0;
    if (t <= t0) continue;
    const x = f.x + Math.sin(t * f.sp + f.ph) * 18, y = f.y + Math.cos(t * f.sp * 1.2 + f.ph) * 16;
    const s = f.s * Math.max(0, sp);
    f.m.position.set(x, y, -220);
    f.m.scale.setScalar(Math.max(0.01, s));
    const a = t * f.sp;
    if (f.k === 'pencil') f.m.rotation.set(0.6, a, 1.0 + Math.sin(a) * 0.2);
    else if (f.k === 'pushpin') f.m.rotation.set(-Math.PI / 2 + 0.7, 0, Math.sin(a) * 0.4);
    else f.m.rotation.set(a * 0.7 + f.ph, a, f.k === 'heart' ? Math.PI + Math.sin(a) * 0.3 : 0);
    f.sh.position.set(x + 48, y + 72, -0.5);
    const ss = s * 3;
    f.sh.scale.set(ss, ss * 0.75, 1);
    f.sh.material.opacity = 0.7;
  }
  // CTA tap burst
  const dt = t - TAP_AT;
  for (const b of burst) {
    b.m.visible = dt > 0 && dt < 1.4;
    if (!b.m.visible) continue;
    const r = rng(500 + b.i * 13);
    const a = (b.i / burst.length) * TAU + r() * 0.4;
    const v = 700 + r() * 600;
    const x = CTA.x + Math.cos(a) * v * dt * (1 - dt * 0.35);
    const y = CTA.y + Math.sin(a) * v * dt * 0.6 + 900 * dt * dt;
    const s = (24 + r() * 20) * Math.min(1, dt * 12) * (1 - ease.inCubic(clamp((dt - 0.8) / 0.6)));
    b.m.position.set(x, y, -260);
    b.m.scale.setScalar(Math.max(0.01, s));
    b.m.rotation.set(dt * 5 + b.i, dt * 4, b.k === 'pushpin' ? Math.PI + dt * 3 : dt * 2);
  }
}

function glPass(ctx, show) {
  grp.visible = true;
  pin.visible = pin.visible && show.pin;
  for (const f of floaters) { f.m.visible = f.m.visible && show.float; f.sh.visible = f.sh.visible && show.float; }
  for (const b of burst) b.m.visible = b.m.visible && show.burst;
  G.renderOnly(ctx, [grp]);
  grp.visible = false;
}

function handAt(t) {
  const X = [[33.0, 1700], [33.7, CTA.x + 60, ease.snappy], [34.25, CTA.x + 60], [35.2, 1750, ease.inOutCubic]];
  const Y = [[33.0, 1400], [33.7, CTA.y + 6, ease.snappy], [34.25, CTA.y + 6], [35.2, 1300, ease.inOutCubic]];
  const press = clamp(1 - Math.abs(t - TAP_AT) / 0.11) ** 0.7;
  return { x: kf(t, X), y: kf(t, Y), press, lift: clamp(0.3 - press + (t < 33.7 || t > 34.3 ? 0.6 : 0)) };
}

export function draw(ctx, t, frame) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 1920, 1080);
  const boil = boilAt(frame / 60);
  drawCards(ctx, t, frame);
  layoutPin(t);
  layoutFloaters(t);
  // shadows + floaters under the type, pin above the cards
  glPass(ctx, { pin: true, float: true, burst: false });
  // logo: the pin head hands over to the flat mark
  if (!LOCK) {
    ctx.save(); ctx.font = '850 168px InterV'; ctx.letterSpacing = '-6px'; const ww = ctx.measureText('Pinterest').width; ctx.restore();
    const total = LOGO.r * 2 + 34 + ww, x0 = 960 - total / 2;
    LOCK = { logoX: x0 + LOGO.r, wordX: x0 + LOGO.r * 2 + 34, ww };
  }
  const slide = ease.inOutQuint(seg(t, WORD_AT, WORD_AT + 0.6));
  const lx = lerp(LOGO.x, LOCK.logoX, slide);
  if (t >= LOGO_AT) {
    const pop = 1 + 0.08 * Math.exp(-(t - LOGO_AT) * 8) * Math.sin((t - LOGO_AT) * 22);
    logo(ctx, lx, LOGO.y, LOGO.r * pop, { pReveal: ease.outCubic(seg(t, LOGO_AT, LOGO_AT + 0.35)) });
  }
  // wordmark wipes out from behind the logo
  if (t >= WORD_AT) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(lx + LOGO.r + 8, 0, 1920, 1080);
    ctx.clip();
    const wx = lerp(lx - LOCK.ww - 40, LOCK.wordX, slide);
    text(ctx, 'Pinterest', wx, LOGO.y + 8, 168, 850, RED, 'left', { tracking: -6 });
    ctx.restore();
  }
  // the line
  kinetic(ctx, 'Finde Ideen.', 960 - 24, 650, 70, t, LINE_AT, 99, { align: 'right', weight: 800 });
  kinetic(ctx, 'Mach was draus.', 960 + 24, 650, 70, t, LINE_AT + 0.22, 99, { align: 'left', weight: 800, color: RED });
  // CTA
  if (t > CTA_AT) {
    const sp = spring(t - CTA_AT, { stiffness: 220, damping: 13 });
    const h = handAt(t);
    const press = h.press;
    const s = Math.max(0, sp) * (1 - press * 0.07) * (t > TAP_AT ? 1 + 0.06 * Math.exp(-(t - TAP_AT) * 8) * Math.sin((t - TAP_AT) * 24) : 1);
    ctx.save();
    ctx.translate(CTA.x, CTA.y);
    ctx.scale(s, s);
    ctx.shadowColor = 'rgba(230,0,35,0.28)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    pill(ctx, -CTA.w / 2, -CTA.h / 2, CTA.w, CTA.h, t > TAP_AT + 0.05 ? '#B5001B' : RED);
    ctx.shadowColor = 'transparent';
    text(ctx, 'Jetzt entdecken', 0, 2, 40, 750, '#fff', 'center');
    ctx.restore();
  }
  ripple(ctx, CTA.x + 60, CTA.y + 6, t - TAP_AT, { r1: 200 });
  glPass(ctx, { pin: false, float: false, burst: true });
  // hand
  if (t > 33.0 && t < 35.3) {
    const h = handAt(t);
    drawHand(ctx, h.x, h.y, { boil, rot: -0.38, scale: 0.6, press: h.press, lift: h.lift });
  }
  // small print
  const sp = ease.outCubic(seg(t, 34.6, 35.2));
  if (sp > 0) { ctx.save(); ctx.globalAlpha = sp; text(ctx, 'pinterest.de', 960, 1010, 22, 600, GREY, 'center', { tracking: 1 }); ctx.restore(); }
}

export function blur(t) {
  if (t < 31.1) return 7;
  if (t > TAP_AT - 0.4 && t < TAP_AT + 1.2) return 6;
  return 4;
}

export const sfx = [
  { t: 30.0, type: 'cardsGather', gain: 0.9 },
  { t: 30.2, type: 'fallWhistle', gain: 0.7, dur: PIN_AT - 30.2 },
  { t: PIN_AT, type: 'pinThunk', gain: 1.1 },
  { t: LOGO_AT, type: 'logoHit', gain: 1.1 },
  { t: WORD_AT, type: 'wordSwish', gain: 0.8 },
  { t: WORD_AT + 0.3, type: 'shapesPop', gain: 0.7 },
  { t: LINE_AT, type: 'typeTick', gain: 0.6 }, { t: LINE_AT + 0.22, type: 'typeTick', gain: 0.6, pitch: 1.2 },
  { t: CTA_AT, type: 'ctaPop', gain: 0.8 },
  { t: 33.3, type: 'whoosh', gain: 0.4, pan: 0.5 },
  { t: TAP_AT, type: 'tapBig', gain: 1 }, { t: TAP_AT + 0.02, type: 'success', gain: 1 }, { t: TAP_AT + 0.03, type: 'confetti3d', gain: 0.8 },
  { t: 35.0, type: 'tail', gain: 0.6 },
];
