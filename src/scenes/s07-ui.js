// 07 — UI / UX motion: a phone prototype with micro-interactions — staggered lists,
// checkbox pops, a spring toggle, slider, cursor click + ripple, button→spinner→check morph,
// confetti, stacked notifications and a live state machine.
import { W, H, TAU, clamp, lerp, ease, seg, spring, rng, C, rgba, mix } from '../engine/core.js';
import { F, font, fillBg, roundRect, trimPoly, trimArc, burst, maskedLine } from '../engine/draw.js';

const PH = { w: 420, h: 860, r: 66, bezel: 14 };
const SCR = { w: PH.w - PH.bezel * 2, h: PH.h - PH.bezel * 2 };

function phonePos(lt) {
  const sp = spring(lt - 0.0, { stiffness: 120, damping: 15 });
  return {
    x: 660 - PH.w / 2,
    y: 540 - PH.h / 2 + (1 - sp) * 1100 + Math.sin(lt * 1.6) * 5,
    rot: (1 - clamp(sp)) * 0.22,
  };
}

const BTN = { x: 20, y: 712, w: SCR.w - 40, h: 76 };
const btnCenter = () => [BTN.x + BTN.w / 2, BTN.y + BTN.h / 2];
const CLICK = 2.62;

function cursorPos(lt, P) {
  // screen-space position of the pointer along a curved path
  const [bx, by] = btnCenter();
  const tx = P.x + PH.bezel + bx + 40, ty = P.y + PH.bezel + by + 6;
  const a = seg(lt, 1.95, 2.55, ease.inOutCubic);
  const leave = seg(lt, 3.05, 3.6, ease.inCubic);
  const sx = 1500, sy = 1000;
  const cx = lerp(sx, tx, a) + Math.sin(a * Math.PI) * -120;
  const cy = lerp(sy, ty, a) + Math.sin(a * Math.PI) * -160;
  return [lerp(cx, 1500, leave), lerp(cy, 1150, leave)];
}

function drawCursor(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.rotate(-0.12);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 34);
  ctx.lineTo(8.5, 26);
  ctx.lineTo(14.5, 40);
  ctx.lineTo(20.5, 37.5);
  ctx.lineTo(14.5, 24);
  ctx.lineTo(25.5, 24);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = rgba(C.paper);
  ctx.stroke();
  ctx.fillStyle = rgba(C.ink);
  ctx.fill();
  ctx.restore();
}

function checkbox(ctx, x, y, lt, tc) {
  const on = lt >= tc;
  const pop = on ? 1 + 0.25 * Math.exp(-(lt - tc) * 12) * Math.sin((lt - tc) * 30) : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pop, pop);
  roundRect(ctx, -16, -16, 32, 32, 10);
  if (on) {
    ctx.fillStyle = rgba(C.orange);
    ctx.fill();
    ctx.strokeStyle = rgba(C.paper);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    trimPoly(ctx, [[-8, 1], [-2, 7], [9, -6]], 0, seg(lt, tc, tc + 0.18, ease.outCubic));
  } else {
    ctx.strokeStyle = rgba(C.ink, 0.35);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
  burst(ctx, x, y, (lt - tc) / 0.4, { n: 6, r0: 24, r1: 42, width: 3, color: rgba(C.orange) });
}

function confetti(ctx, x, y, lt, t0) {
  const u = lt - t0;
  if (u < 0 || u > 1.4) return;
  const r = rng(7);
  const cols = [C.orange, C.violet, C.lime, C.ink, C.pink];
  for (let i = 0; i < 46; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * 2.6;
    const sp = 700 + r() * 900;
    const px = x + Math.cos(a) * sp * u * Math.exp(-u * 1.2);
    const py = y + Math.sin(a) * sp * u * Math.exp(-u * 1.2) + 900 * u * u * 0.5;
    const rot = r() * TAU + u * (r() - 0.5) * 20;
    const s = 9 + r() * 10;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    ctx.scale(1, Math.cos(u * 12 + i));
    ctx.globalAlpha = 1 - seg(u, 0.9, 1.4);
    ctx.fillStyle = rgba(cols[i % cols.length]);
    if (i % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, s * 0.45, 0, TAU); ctx.fill(); }
    else ctx.fillRect(-s / 2, -s * 0.3, s, s * 0.6);
    ctx.restore();
  }
}

function screen(ctx, lt) {
  // paper screen
  fillBg(ctx, C.paper);
  // status bar
  font(ctx, 17, 700, F.mono);
  ctx.fillStyle = rgba(C.ink);
  ctx.fillText('9:41', 32, 46);
  ctx.fillRect(SCR.w - 60, 34, 30, 13);
  ctx.fillRect(SCR.w - 28, 38, 3, 5);
  // header
  const hp = seg(lt, 0.25, 0.7, ease.outExpo);
  ctx.save();
  ctx.globalAlpha = hp;
  ctx.translate(0, 20 * (1 - hp));
  ctx.fillStyle = rgba(C.orange);
  ctx.beginPath(); ctx.arc(52, 128, 26, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgba(C.paper); ctx.lineWidth = 7; ctx.lineCap = 'round';
  trimArc(ctx, 52, 128, 12, 0.08, 0.92, 0);
  font(ctx, 32, 800);
  ctx.fillStyle = rgba(C.ink);
  ctx.letterSpacing = '-1px';
  ctx.fillText('Bewerbung', 92, 124);
  ctx.letterSpacing = '0px';
  font(ctx, 13, 500, F.mono);
  ctx.fillStyle = rgba(C.ink, 0.5);
  ctx.fillText('MOTION DESIGNER · AB SOFORT', 93, 148);
  ctx.restore();
  // skills list
  const rows = ['Motion Design', 'Sound Design', 'Typografie'];
  font(ctx, 12, 500, F.mono);
  ctx.letterSpacing = '2px';
  ctx.fillStyle = rgba(C.ink, 0.45 * hp);
  ctx.fillText('SKILLS', 22, 210);
  ctx.letterSpacing = '0px';
  rows.forEach((name, k) => {
    const sp = clamp(spring(lt - (0.45 + k * 0.09), { stiffness: 220, damping: 18 }), 0, 1.1);
    if (sp <= 0.001) return;
    const y = 228 + k * 82;
    ctx.save();
    ctx.translate((1 - sp) * 260, 0);
    ctx.globalAlpha = clamp(sp * 1.5);
    roundRect(ctx, 16, y, SCR.w - 32, 68, 20);
    ctx.fillStyle = rgba(C.paper2);
    ctx.fill();
    font(ctx, 20, 600);
    ctx.fillStyle = rgba(C.ink);
    ctx.fillText(name, 38, y + 41);
    checkbox(ctx, SCR.w - 58, y + 34, lt, 1.0 + k * 0.18);
    ctx.restore();
  });
  // toggle
  const tp = clamp(spring(lt - 0.75, { stiffness: 220, damping: 18 }), 0, 1.1);
  if (tp > 0.001) {
    const y = 488;
    ctx.save();
    ctx.translate((1 - tp) * 260, 0);
    font(ctx, 20, 600);
    ctx.fillStyle = rgba(C.ink);
    ctx.fillText('Bereit für Neues', 22, y + 8);
    const on = spring(lt - 1.75, { stiffness: 380, damping: 16 });
    const tx = SCR.w - 92, tw = 66, th = 38;
    roundRect(ctx, tx, y - th / 2 - 4, tw, th, th / 2);
    ctx.fillStyle = rgba(mix(C.paper2, C.orange, clamp(on)));
    ctx.fill();
    const kx = tx + th / 2 + (tw - th) * on;
    ctx.fillStyle = rgba(C.paper);
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.ellipse(kx, y - 4, (th / 2 - 4) * (1 + 0.25 * Math.abs(on - clamp(on))), th / 2 - 4, 0, 0, TAU);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.restore();
  }
  // slider
  const slp = clamp(spring(lt - 0.85, { stiffness: 220, damping: 18 }), 0, 1.1);
  if (slp > 0.001) {
    const y = 586;
    ctx.save();
    ctx.translate((1 - slp) * 260, 0);
    font(ctx, 20, 600);
    ctx.fillStyle = rgba(C.ink);
    ctx.fillText('Kreativität', 22, y);
    const v = lerp(0.35, 1, ease.inOutQuint(seg(lt, 2.0, 2.5)));
    font(ctx, 15, 600, F.mono);
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(v * 100)} %`, SCR.w - 24, y);
    ctx.textAlign = 'left';
    const x0 = 24, x1 = SCR.w - 24, yy = y + 34;
    ctx.lineCap = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = rgba(C.paper2);
    ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
    ctx.strokeStyle = rgba(C.violet);
    ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(lerp(x0, x1, v), yy); ctx.stroke();
    ctx.fillStyle = rgba(C.paper);
    ctx.strokeStyle = rgba(C.violet);
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(lerp(x0, x1, v), yy, 13, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // button -> spinner -> success
  const bp = clamp(spring(lt - 0.95, { stiffness: 200, damping: 18 }), 0, 1.1);
  if (bp > 0.001) {
    const press = lt >= CLICK && lt < CLICK + 0.14 ? 1 : 0;
    const shrink = seg(lt, 2.78, 3.12, ease.snappy);
    const succ = lt >= 3.5;
    const pop = succ ? 1 + 0.18 * Math.exp(-(lt - 3.5) * 9) * Math.cos((lt - 3.5) * 24) : 1;
    const [cx, cy] = btnCenter();
    const w = lerp(BTN.w, BTN.h, shrink);
    ctx.save();
    ctx.translate(cx, cy + (1 - bp) * 200);
    const sc = (press ? 0.955 : 1) * pop;
    ctx.scale(sc, sc);
    roundRect(ctx, -w / 2, -BTN.h / 2, w, BTN.h, BTN.h / 2);
    ctx.fillStyle = rgba(succ ? C.lime : C.ink);
    ctx.fill();
    // ripple
    const rp = seg(lt, CLICK, CLICK + 0.55, ease.outCubic);
    if (rp > 0 && rp < 1) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = rgba(C.paper, 0.28 * (1 - rp));
      ctx.beginPath(); ctx.arc(40, 6, rp * 260, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // label
    const la = 1 - seg(lt, 2.74, 2.86);
    if (la > 0) {
      font(ctx, 20, 700);
      ctx.fillStyle = rgba(C.paper, la);
      ctx.textAlign = 'center';
      ctx.fillText('Bewerbung absenden', 0, 7);
    }
    // spinner
    const spa = seg(lt, 3.0, 3.12) * (1 - seg(lt, 3.42, 3.5));
    if (spa > 0) {
      ctx.strokeStyle = rgba(C.paper, spa);
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      const r0 = (lt * 1.6) % 1;
      trimArc(ctx, 0, 0, 18, r0, r0 + 0.3 + 0.25 * Math.sin(lt * 9), lt * 9);
    }
    if (succ) {
      ctx.strokeStyle = rgba(C.ink);
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      trimPoly(ctx, [[-13, 1], [-4, 10], [14, -9]], 0, seg(lt, 3.52, 3.75, ease.outCubic));
    }
    ctx.restore();
    const gp = seg(lt, 3.7, 4.0, ease.outExpo);
    if (gp > 0) {
      font(ctx, 15, 600, F.mono);
      ctx.letterSpacing = '3px';
      ctx.fillStyle = rgba(C.ink, gp);
      ctx.textAlign = 'center';
      ctx.fillText('GESENDET!', cx, BTN.y - 18 + 10 * (1 - gp));
      ctx.letterSpacing = '0px';
    }
    confetti(ctx, cx, cy, lt, 3.52);
  }
  // notification banners
  const notes = [['NACHRICHTEN', 'Wann kannst du anfangen?', 4.0], ['KALENDER', 'Kennenlernen · Mo, 10:00', 4.55]];
  notes.forEach(([app, msg, t0], k) => {
    const s = spring(lt - t0, { stiffness: 260, damping: 20 });
    if (s <= 0.001) return;
    // older banners get pushed down and scaled back
    let push = 0;
    for (let j = k + 1; j < notes.length; j++) push += clamp(spring(lt - notes[j][2], { stiffness: 260, damping: 20 }));
    const y = lerp(-120, 66, s) + push * 22;
    const sc = 1 - push * 0.06;
    ctx.save();
    ctx.translate(SCR.w / 2, y + 40);
    ctx.scale(sc, sc);
    ctx.globalAlpha = 1 - push * 0.35;
    roundRect(ctx, -SCR.w / 2 + 12, -40, SCR.w - 24, 82, 24);
    ctx.fillStyle = rgba(C.ink, 0.94);
    ctx.fill();
    ctx.fillStyle = rgba(k ? C.violet : C.orange);
    roundRect(ctx, -SCR.w / 2 + 26, -24, 50, 50, 14);
    ctx.fill();
    font(ctx, 12, 600, F.mono);
    ctx.letterSpacing = '2px';
    ctx.fillStyle = rgba(C.paper, 0.6);
    ctx.fillText(app, -SCR.w / 2 + 90, -8);
    ctx.letterSpacing = '0px';
    font(ctx, 17, 600);
    ctx.fillStyle = rgba(C.paper);
    ctx.fillText(msg, -SCR.w / 2 + 90, 16);
    ctx.restore();
  });
}

function phone(ctx, lt) {
  const P = phonePos(lt);
  ctx.save();
  ctx.translate(P.x + PH.w / 2, P.y + PH.h / 2);
  ctx.rotate(P.rot);
  ctx.translate(-PH.w / 2, -PH.h / 2);
  // soft shadow
  ctx.save();
  ctx.shadowColor = 'rgba(10,8,40,0.45)';
  ctx.shadowBlur = 80;
  ctx.shadowOffsetY = 40;
  roundRect(ctx, 0, 0, PH.w, PH.h, PH.r);
  ctx.fillStyle = rgba(C.ink);
  ctx.fill();
  ctx.restore();
  // screen
  ctx.save();
  roundRect(ctx, PH.bezel, PH.bezel, SCR.w, SCR.h, PH.r - PH.bezel);
  ctx.clip();
  ctx.translate(PH.bezel, PH.bezel);
  screen(ctx, lt);
  ctx.restore();
  // dynamic island
  roundRect(ctx, PH.w / 2 - 62, PH.bezel + 12, 124, 34, 17);
  ctx.fillStyle = rgba(C.ink);
  ctx.fill();
  ctx.restore();
  return P;
}

const STATES = [['DEFAULT', 0], ['PRESSED', CLICK], ['LOADING', 2.85], ['SUCCESS', 3.5]];
function rightSide(ctx, lt) {
  const x = 1040;
  font(ctx, 112, 800);
  ctx.fillStyle = rgba(C.paper);
  const tr = -0.035 * 112;
  maskedLine(ctx, 'UI, die sich', x, 370, seg(lt, 0.3, 0.75, ease.outExpo), { tracking: tr });
  maskedLine(ctx, 'gut anfühlt.', x, 490, seg(lt, 0.38, 0.83, ease.outExpo), { tracking: tr });
  font(ctx, 17, 500, F.mono);
  ctx.fillStyle = rgba(C.paper, 0.75);
  maskedLine(ctx, 'MICRO-INTERACTIONS · SPRINGS · STATES', x + 4, 560, seg(lt, 0.6, 1.0, ease.outExpo), { tracking: 3 });
  // state machine chips
  let cx = x + 4;
  let active = 0;
  STATES.forEach(([, t0], i) => { if (lt >= t0) active = i; });
  STATES.forEach(([name], i) => {
    const ap = seg(lt, 1.0 + i * 0.08, 1.4 + i * 0.08, ease.outBack);
    if (ap <= 0) return;
    font(ctx, 14, 700, F.mono);
    ctx.letterSpacing = '2px';
    const w = ctx.measureText(name).width + 34;
    const on = i === active;
    ctx.save();
    ctx.translate(cx + w / 2, 640);
    ctx.scale(ap, ap);
    roundRect(ctx, -w / 2, -22, w, 44, 22);
    ctx.fillStyle = rgba(on ? C.lime : C.paper, on ? 1 : 0.12);
    ctx.fill();
    ctx.fillStyle = rgba(on ? C.ink : C.paper, on ? 1 : 0.8);
    ctx.textAlign = 'center';
    ctx.fillText(name, 0, 5);
    ctx.restore();
    if (i < STATES.length - 1) {
      ctx.strokeStyle = rgba(C.paper, 0.5 * ap);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + w + 8, 640); ctx.lineTo(cx + w + 26, 640);
      ctx.moveTo(cx + w + 20, 634); ctx.lineTo(cx + w + 26, 640); ctx.lineTo(cx + w + 20, 646);
      ctx.stroke();
    }
    ctx.letterSpacing = '0px';
    cx += w + 36;
  });
}

// live plot of the toggle's spring response
function springCard(ctx, lt) {
  const ap = seg(lt, 1.2, 1.6, ease.outExpo);
  if (ap <= 0) return;
  const x = 1044, y = 720, w = 560, h = 200;
  ctx.save();
  ctx.globalAlpha = ap;
  ctx.translate(0, 30 * (1 - ap));
  roundRect(ctx, x, y, w, h, 24);
  ctx.fillStyle = rgba(C.ink, 0.22);
  ctx.fill();
  font(ctx, 13, 600, F.mono);
  ctx.letterSpacing = '2px';
  ctx.fillStyle = rgba(C.paper, 0.7);
  ctx.fillText('SPRING  ·  STIFFNESS 380  ·  DAMPING 16', x + 24, y + 36);
  ctx.letterSpacing = '0px';
  const gx = x + 24, gy = y + 60, gw = w - 48, gh = h - 90;
  ctx.strokeStyle = rgba(C.paper, 0.2);
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(gx, gy + gh * 0.25); ctx.lineTo(gx + gw, gy + gh * 0.25);
  ctx.stroke();
  ctx.setLineDash([]);
  const T = 0.9;
  const pts = [];
  for (let i = 0; i <= 120; i++) {
    const u = (i / 120) * T;
    pts.push([gx + (i / 120) * gw, gy + gh - spring(u, { stiffness: 380, damping: 16 }) * gh * 0.75]);
  }
  const prog = clamp((lt - 1.75) / T);
  ctx.strokeStyle = rgba(C.lime);
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  trimPoly(ctx, pts, 0, prog);
  if (prog > 0) {
    const k = Math.min(120, Math.round(prog * 120));
    ctx.fillStyle = rgba(C.lime);
    ctx.beginPath(); ctx.arc(pts[k][0], pts[k][1], 7, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

export default {
  id: 'ui',
  label: 'UI / UX Motion',
  num: '07',
  start: 36,
  end: 42,
  hud: C.paper,
  draw(ctx, lt) {
    fillBg(ctx, C.violet);
    const g = ctx.createRadialGradient(400, 200, 0, 400, 200, 1400);
    g.addColorStop(0, rgba(C.paper, 0.16));
    g.addColorStop(1, rgba(C.paper, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // dotted canvas grid
    ctx.fillStyle = rgba(C.paper, 0.12);
    for (let y = 40; y < H; y += 48) for (let x = 40; x < W; x += 48) ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    rightSide(ctx, lt);
    springCard(ctx, lt);
    const P = phone(ctx, lt);
    // cursor (screen space)
    if (lt > 1.9 && lt < 3.7) {
      const [x, y] = cursorPos(lt, P);
      const press = lt >= CLICK && lt < CLICK + 0.14;
      drawCursor(ctx, x, y, press ? 0.85 : 1);
    }
  },
  blur: (lt) => (lt < 0.8 ? 6 : 0),
  sfx: [
    { t: 0.0, type: 'whoosh', gain: 0.5, dur: 0.6, pan: 0 },
    { t: 0.45, type: 'tick', gain: 0.3 }, { t: 0.54, type: 'tick', gain: 0.3 }, { t: 0.63, type: 'tick', gain: 0.3 },
    { t: 1.0, type: 'click', gain: 0.55, pitch: 1.0 }, { t: 1.18, type: 'click', gain: 0.55, pitch: 1.12 }, { t: 1.36, type: 'click', gain: 0.55, pitch: 1.26 },
    { t: 1.75, type: 'toggle', gain: 0.6 },
    { t: 2.0, type: 'slide', gain: 0.35, dur: 0.5 },
    { t: CLICK, type: 'mouse', gain: 0.8 },
    { t: 2.8, type: 'loading', gain: 0.3, dur: 0.65 },
    { t: 3.5, type: 'success', gain: 0.7 },
    { t: 3.52, type: 'confetti', gain: 0.5 },
    { t: 4.0, type: 'notify', gain: 0.6 },
    { t: 4.55, type: 'notify', gain: 0.5, pitch: 1.12 },
  ],
};
