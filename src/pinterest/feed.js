// Acts 1–3 (0–20 s): the drawn hand, the tap that opens the feed, scrolling, the 3D camera ride
// through the wall, catching the feed, the pin close-up with "Speichern", and the board.
import { clamp, lerp, ease, seg, spring, kf, rng, TAU } from '../engine/core.js';
import * as G from './gl.js';
import { THREE } from './gl.js';
import { drawPencil, boilAt, smooth, PC } from './pencil.js';
import { drawHand, handOutline } from './figures.js';
import { buildWall, layoutWall, makeScroll, colX, COLS, TOP } from './wall.js';
import { PINS, CW, cardCanvas, cardSize } from './pins.js';
import { header, ripple, kinetic, text, pill, rr, icon, boardChip, RED, INK, GREY, PILL } from './ui.js';

// ------------------------------------------------------------ timing ---
export const TL = {
  sketch: [0.45, 1.3], color: [1.3, 1.85], tap1: 2.5, headerIn: 3.05,
  flicks: [{ t: 4.0, v: 5200 }, { t: 6.0, v: 7600 }, { t: 8.0, v: 6400 }, { t: 10.0, v: 2500 }],
  letters: { word: 'SCROLLEN', t: 5.5, y: 400 },
  tilt: [6.2, 10.6], catch: 11.0, tapPin: 12.0,
  saves: [13.5, 15.0, 16.0, 17.0], swipes: [14.25, 15.5, 16.5],
  tapBoard: 18.0, tapBoardPin: 19.0, portal: [19.2, 20.0],
};
const HERO = { col: 2, y: 420 }; // pasta card top at rest
export const HEROES = [
  { key: 'pasta', title: 'Pasta wie in Rom', desc: ['Cremig, einfach und in 15 Minuten', 'fertig – das Rezept, das ganz Rom', 'am Sonntag kocht.'], by: 'Giulia', fol: '12,4 Tsd. Follower' },
  { key: 'vases', title: 'Keramik für Anfänger', desc: ['Deine erste Vase an der Töpfer-', 'scheibe – Schritt für Schritt, ganz', 'ohne Vorkenntnisse.'], by: 'Studio Lehm', fol: '8.912 Follower' },
  { key: 'mountains', title: 'Wandern im Herbst', desc: ['Die schönsten Touren mit Aussicht:', 'Gipfel, Seen und goldene Wälder', 'für ein perfektes Wochenende.'], by: 'Draußen', fol: '31,2 Tsd. Follower' },
  { key: 'vinyl', title: 'Wohnzimmer-Disco', desc: ['Licht aus, Musik an: die Playlist', 'für einen Abend, an dem einfach', 'getanzt wird.'], by: 'Tanzfläche', fol: '5.407 Follower' },
];

const scroll = makeScroll({ flicks: TL.flicks, k: 1.55, stopAt: TL.catch });
const delay = (c) => 0.013 * Math.abs(c - 3.5);
const q16 = (x) => Math.round(x / 0.125) * 0.125;

// --------------------------------------------------------- 3D props ---
let wall, pivot, floaters = [], pencils = [], bursts = [], pencilGroup, burstGroup;
const FLOAT = [
  ['sphere', 'red', 300, 330, 260, 46], ['torus', 'pink', 1580, 300, 300, 58], ['box', 'butter', 1270, 820, 220, 40],
  ['heart', 'red', 640, 860, 340, 46], ['capsule', 'mint', 1760, 760, 260, 44], ['star', 'lilac', 200, 760, 300, 44],
  ['knot', 'sky', 960, 220, 380, 40], ['blob', 'peach', 1450, 560, 200, 46], ['pushpin', 'red', 470, 560, 420, 52],
  ['ring', 'red', 1120, 520, 460, 50], ['sphere', 'butter', 1780, 1060, 300, 34], ['cone', 'blush', 120, 140, 360, 36],
];

export async function init() {
  const scene = G.getScene();
  pivot = new THREE.Group();
  pivot.position.set(960, 540, 0);
  scene.add(pivot);
  wall = buildWall({
    seed: 11, length: 21000,
    pool: Object.keys(PINS).filter((k) => !['vinyl', 'pasta'].includes(k)),
    letters: TL.letters,
    heroes: [{ key: 'pasta', id: 'pasta', col: HERO.col, t: TL.catch + 1, y: HERO.y }],
    scroll, delay,
  });
  wall.group.position.set(-960, -540, 0);
  pivot.add(wall.group);
  // floating shapes live in wall space (they tilt with it) and cast soft shadows on it
  const R = rng(5);
  for (const [kind, col, x, y, depth, size] of FLOAT) {
    const m = G.mesh(kind, col);
    const sh = G.shadowMesh();
    wall.group.add(m, sh);
    floaters.push({ m, sh, kind, x, y, depth, size: kind === 'pushpin' ? size * 1.1 : size, ax: R() * TAU, ay: R() * TAU, sp: 0.4 + R() * 0.7, ph: R() * TAU });
  }
  pencilGroup = new THREE.Group(); burstGroup = new THREE.Group();
  scene.add(pencilGroup, burstGroup);
  for (const col of ['red', 'peach', 'butter', 'blue', 'green']) {
    const p = G.makePencil(col === 'peach' ? '#F2B48C' : col === 'butter' ? 'yellow' : col);
    pencilGroup.add(p);
    pencils.push(p);
  }
  // confetti bursts of tiny 3D shapes (two alternating sets)
  const kinds = [['heart', 'red'], ['pushpin', 'red'], ['star', 'butter'], ['sphere', 'pink'], ['torus', 'mint'], ['heart', 'blush'], ['box', 'lilac'], ['sphere', 'red'], ['star', 'red'], ['capsule', 'sky']];
  for (let s = 0; s < 2; s++) {
    const set = [];
    kinds.forEach(([k, c], i) => { const m = G.mesh(k, c); burstGroup.add(m); set.push({ m, k, i, r: rng(100 + i + s * 50) }); });
    bursts.push(set);
  }
  // high-res stills of the hero images for the close-up
  for (const h of HEROES) cardCanvas(h.key, { scale: 3, title: false });
  for (const k of Object.keys(PINS)) cardCanvas(k);
}

// ----------------------------------------------------------- hand ---
const SPOT = { save: [1474, 248], swipeA: [1340, 640], swipeB: [600, 610], chip: [1700, 158] };
let heroRect = null; // pasta position on the wall after the catch (filled lazily)
function heroAtRest() {
  if (!heroRect) {
    layoutWall(wall, TL.catch + 1.5, scroll, delay);
    const e = wall.columns[HERO.col].find((x) => x.hero === 'pasta');
    const sy = TOP + e.y - scroll(TL.catch + 1.5 - delay(HERO.col)).y;
    heroRect = { x: colX(HERO.col), y: sy, w: CW, h: e.h, ih: cardSize('pasta').ih };
  }
  return heroRect;
}
const BOARD_PINS = (() => {
  const out = [];
  const w = 300, gap = 34, x0 = 960 - (4 * w + 3 * gap) / 2;
  HEROES.forEach((h, i) => { const ih = Math.round(w * PINS[h.key].a); out.push({ key: h.key, x: x0 + i * (w + gap), y: 330, w, h: ih }); });
  return out;
})();

function taps() {
  const hr = heroAtRest();
  return [
    { t: TL.tap1, x: 960, y: 520 },
    { t: TL.catch, x: 1180, y: 650 },
    { t: TL.tapPin, x: hr.x + hr.w / 2, y: hr.y + hr.ih / 2 },
    ...TL.saves.map((t) => ({ t, x: SPOT.save[0], y: SPOT.save[1], save: true })),
    { t: TL.tapBoard, x: SPOT.chip[0], y: SPOT.chip[1] },
    { t: TL.tapBoardPin, x: BOARD_PINS[0].x + 150, y: BOARD_PINS[0].y + 190 },
  ];
}

// Hand track: positions (fingertip), scale, rotation, press and lift over the whole act.
function handAt(t) {
  const hr = heroAtRest();
  const tp = taps();
  const pin = [hr.x + hr.w / 2, hr.y + hr.ih / 2];
  const E = ease.inOutCubic, S = ease.snappy, O = ease.outCubic;
  const X = [
    [0, 870], [2.0, 870], [2.32, 900, E], [TL.tap1, 960, ease.inQuad], [2.75, 966], [3.55, 1010, E], [4.0, 1010], [4.22, 985, ease.outQuart], [4.4, 1060], [4.95, 1500, ease.inCubic],
    [5.55, 1500], [5.85, 1040, O], [6.0, 1040], [6.2, 1000, ease.outQuart], [6.85, 1600, ease.inCubic],
    [10.35, 1600], [10.9, 1180, O], [11.2, 1180], [11.85, pin[0], S], [12.12, pin[0]], [12.65, 1200, E], [13.2, SPOT.save[0], S], [13.6, SPOT.save[0]],
  ];
  const Y = [
    [0, 330], [2.0, 330], [2.32, 300, E], [TL.tap1, 520, ease.inQuad], [2.75, 540], [3.55, 900, E], [4.0, 900], [4.22, 420, ease.outQuart], [4.4, 470], [4.95, 1350, ease.inCubic],
    [5.55, 1350], [5.85, 900, O], [6.0, 900], [6.2, 380, ease.outQuart], [6.85, 1400, ease.inCubic],
    [10.35, 1400], [10.9, 650, O], [11.2, 650], [11.85, pin[1], S], [12.12, pin[1]], [12.65, 800, E], [13.2, SPOT.save[1], S], [13.6, SPOT.save[1]],
  ];
  // close-up rhythm: save → swipe → save …
  const segs = [];
  TL.swipes.forEach((sw, i) => {
    segs.push([sw - 0.32, SPOT.swipeA, S], [sw, SPOT.swipeA], [sw + 0.28, SPOT.swipeB, ease.outQuart], [TL.saves[i + 1] - 0.14, SPOT.save, S], [TL.saves[i + 1] + 0.08, SPOT.save]);
  });
  segs.push([17.75, SPOT.chip, S], [TL.tapBoard + 0.08, SPOT.chip], [18.8, [BOARD_PINS[0].x + 150, BOARD_PINS[0].y + 190], S], [TL.tapBoardPin + 0.1, [BOARD_PINS[0].x + 150, BOARD_PINS[0].y + 190]], [19.75, [1500, 1500], ease.inCubic]);
  for (const [tt, p, e] of segs) { X.push([tt, p[0], e]); Y.push([tt, p[1], e]); }
  const x = kf(t, X), y = kf(t, Y);
  // press: pulses on taps, held during flicks/swipes
  let press = 0;
  for (const tap of tp) press = Math.max(press, clamp(1 - Math.abs(t - tap.t) / 0.11) ** 0.7);
  for (const [a, b] of [[3.85, 4.2], [5.92, 6.18], ...TL.swipes.map((s) => [s - 0.06, s + 0.26])]) if (t > a && t < b) press = Math.max(press, seg(t, a, a + 0.06));
  const moving = Math.min(1, Math.hypot(kf(t + 0.02, X) - x, kf(t + 0.02, Y) - y) / 14);
  const lift = clamp(0.25 + moving * 0.75 - press);
  const scale = kf(t, [[0, 0.82], [2.6, 0.82], [3.5, 0.62, E]]) * (1 + 0.03 * lift);
  const rot = -0.42 + 0.08 * Math.sin(t * 1.3) + (x - 960) * 0.00012;
  return { x, y, scale, rot, press, lift };
}

// ------------------------------------------------------------ sfx ---
export const sfx = (() => {
  const c = [];
  // pencils fly in, sketch, colour, fly off
  [0.18, 0.26, 0.32, 0.4, 0.46].forEach((t, i) => c.push({ t, type: 'passby', gain: 0.32, pan: [-0.7, 0.6, -0.3, 0.8, 0] [i] }));
  c.push({ t: TL.sketch[0], type: 'pencilLine', gain: 0.9, dur: TL.sketch[1] - TL.sketch[0] });
  c.push({ t: TL.color[0], type: 'hatching', gain: 0.75, dur: TL.color[1] - TL.color[0], pan: -0.2 });
  c.push({ t: TL.color[0] + 0.04, type: 'hatching', gain: 0.55, dur: TL.color[1] - TL.color[0] - 0.05, pan: 0.4 });
  c.push({ t: 1.86, type: 'whoosh', gain: 0.5, pan: 0.6 }, { t: 1.95, type: 'whoosh', gain: 0.4, pan: -0.6 });
  c.push({ t: 2.05, type: 'boil', gain: 0.5 });
  // taps
  c.push({ t: TL.tap1, type: 'tapBig', gain: 1 });
  c.push({ t: TL.catch, type: 'tap', gain: 0.9 }, { t: TL.catch, type: 'scrollStop', gain: 0.8 });
  c.push({ t: TL.tapPin, type: 'tap', gain: 1 }, { t: TL.tapPin + 0.08, type: 'lift', gain: 0.8 });
  // pops of the wall (pitched by ring)
  for (let k = 0; k < 8; k++) c.push({ t: TL.tap1 + 0.125 * (k + 1), type: 'cardPop', gain: 0.75 - k * 0.05, step: k });
  c.push({ t: TL.headerIn, type: 'slideDown', gain: 0.5 });
  // flicks + touches
  c.push({ t: 3.86, type: 'touch', gain: 0.6 }, { t: 4.0, type: 'flick', gain: 1 }, { t: 5.93, type: 'touch', gain: 0.6 }, { t: 6.0, type: 'flick', gain: 1.1 });
  c.push({ t: 8.0, type: 'whooshBig', gain: 0.9 }, { t: 10.0, type: 'flick', gain: 0.6 });
  c.push({ t: TL.letters.t - 0.05, type: 'lettersLock', gain: 1 });
  c.push({ t: 6.25, type: 'tiltRise', gain: 0.6, dur: 1.6 }, { t: 9.6, type: 'tiltDown', gain: 0.6, dur: 1.0 });
  // close-up
  c.push({ t: 12.2, type: 'cardOpen', gain: 0.8 });
  TL.saves.forEach((t, i) => c.push({ t, type: 'save', gain: 1, step: i }, { t: t + 0.03, type: 'confetti3d', gain: 0.8 }, { t: t + 0.5, type: 'boardDrop', gain: 0.7, step: i }));
  TL.swipes.forEach((t) => c.push({ t: t - 0.04, type: 'touch', gain: 0.5 }, { t, type: 'swipe', gain: 0.9 }));
  c.push({ t: TL.tapBoard, type: 'tap', gain: 0.9 }, { t: TL.tapBoard + 0.05, type: 'boardOpen', gain: 0.9 });
  c.push({ t: TL.tapBoardPin, type: 'tap', gain: 1 }, { t: TL.portal[0], type: 'portal', gain: 1, dur: TL.portal[1] - TL.portal[0] });
  return c;
})();

// scroll ticks: one soft haptic tick whenever a card edge passes the screen centre line (computed analytically)
export function scrollTicks() {
  const out = [];
  if (!wall) return out;
  for (let c = 0; c < COLS; c += 3) {
    let prev = null;
    for (let t = 4.0; t < 11.5; t += 1 / 240) {
      const off = scroll(t - delay(c)).y;
      const idx = Math.floor((off + 540) / 330);
      if (prev !== null && idx !== prev) {
        const v = scroll(t).v;
        if (v > 300) out.push({ t, type: 'scrollTick', gain: clamp(v / 7000) * 0.5 + 0.15, pitch: 0.8 + clamp(v / 8000) * 0.8, pan: (c - 3.5) / 4 });
      }
      prev = idx;
    }
  }
  return out;
}

// ------------------------------------------------------------ helpers ---
function trimPts(pts, u) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = cum[cum.length - 1] * u, out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (cum[i] <= L) out.push(pts[i]);
    else { const k = (L - cum[i - 1]) / (cum[i] - cum[i - 1]); out.push([lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]); break; }
  }
  return out;
}
const _q = new THREE.Quaternion(), _d = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
// Put a pencil with its tip at (x, y, z) pointing along dir (tip direction), spun around its axis.
function placePencil(p, x, y, z, dir, spin, scale = 34) {
  _d.set(dir[0], dir[1], dir[2]).normalize();
  _q.setFromUnitVectors(_up, _d);
  p.quaternion.copy(_q);
  p.rotateY(spin);
  p.scale.setScalar(scale);
  const tip = p.userData.tip * scale;
  p.position.set(x - _d.x * tip, y - _d.y * tip, z - _d.z * tip);
  p.visible = true;
}

// --------------------------------------------------------- the draw ---
const HAND0 = { x: 870, y: 330, rot: -0.42, s: 0.82 };
let outlineCache = null;

function drawIntro(ctx, t, frame) {
  const boil = boilAt(frame / 60);
  if (!outlineCache) outlineCache = smooth(handOutline(HAND0.x, HAND0.y, HAND0.rot, HAND0.s), true, 6);
  const out = [...outlineCache, outlineCache[0]];
  const u = seg(t, TL.sketch[0], TL.sketch[1], ease.inOutSine);
  const tipPt = trimPts(out, Math.max(0.001, u)).at(-1);
  // sketch line under the colouring
  const sketchA = 1 - seg(t, 1.7, 2.1);
  if (u > 0 && sketchA > 0) drawPencil(ctx, [{ pts: trimPts(out, u), open: true, line: '#B0453A', lw: 3.2, seed: 3, amp: 1.3 }], { boil, alpha: sketchA });
  const rev = t < TL.color[0] ? 0 : t >= TL.color[1] ? 1 : seg(t, TL.color[0], TL.color[1]) * 0.84;
  return { tipPt, rev, u };
}

function layoutPencils(t, tipPt) {
  const [red, peach, ...amb] = pencils;
  for (const p of pencils) p.visible = false;
  if (t > 2.4) return;
  // ambient pencils: fly in, orbit, fly out
  const homes = [[360, 260, -260], [1600, 300, -320], [1480, 860, -240]];
  amb.forEach((p, i) => {
    const [hx, hy, hz] = homes[i];
    const inP = spring(t - 0.05 * i, { stiffness: 60, damping: 11 });
    const outP = ease.inCubic(seg(t, 1.8 + i * 0.05, 2.35));
    const from = [[-400, -300], [2400, -200], [2300, 1400]][i];
    const to = [[-600, 400], [2500, 600], [1900, 1700]][i];
    const x = lerp(lerp(from[0], hx, inP), to[0], outP) + Math.sin(t * 1.4 + i) * 30;
    const y = lerp(lerp(from[1], hy, inP), to[1], outP) + Math.cos(t * 1.7 + i) * 24;
    const a = t * 0.9 + i * 2;
    placePencil(p, x, y, hz, [Math.cos(a), Math.sin(a), 0.35], t * 3 + i, 44);
  });
  // the drawing pencil (red) and the colouring pencil (peach)
  const inR = spring(t - 0.0, { stiffness: 70, damping: 12 });
  const leave = ease.inCubic(seg(t, 1.86, 2.3));
  const tilt = [-0.42, -0.5, 0.75];
  if (t < TL.sketch[1]) {
    const hover = 1 - seg(t, 0.3, TL.sketch[0], ease.outCubic);
    const x = lerp(1200, tipPt[0], inR), y = lerp(-300, tipPt[1], inR);
    placePencil(red, x + 60 * hover, y - 40 * hover, -160 * hover, tilt, t * 2, 44);
  } else {
    // colours the sleeve with fast zig-zags, then leaves
    const k = seg(t, TL.sketch[1], TL.color[1]);
    const zx = 1080 + 220 * k + Math.sin(t * 24) * 80, zy = 860 + 160 * k + Math.cos(t * 24) * 34;
    placePencil(red, lerp(zx, 2300, leave), lerp(zy, -500, leave), -220 * leave, tilt, t * 2, 44);
  }
  const inP = ease.outCubic(seg(t, 1.05, TL.color[0]));
  if (t > 1.05) {
    const k = seg(t, TL.color[0], TL.color[1]);
    const zx = lerp(800, 1060, k) + Math.sin(t * 26) * 90, zy = lerp(330, 760, k) + Math.cos(t * 26) * 50;
    placePencil(peach, lerp(-300, lerp(zx, -400, leave), inP), lerp(1200, lerp(zy, -200, leave), inP), -200 * leave - (1 - inP) * 200, [-0.48, -0.55, 0.7], t * 2.4, 44);
  }
}

function layoutFloaters(t) {
  const sc = scroll(t);
  for (const f of floaters) {
    const d = Math.hypot(f.x - 960, f.y - 520);
    const t0 = TL.tap1 + q16(d / 1300) + 0.0625;
    const sp = spring(t - t0, { stiffness: 200, damping: 11 });
    const vis = t > t0 && t < TL.tapPin + 0.4;
    f.m.visible = f.sh.visible = vis;
    if (!vis) continue;
    const out = 1 - ease.inBack(seg(t, TL.tapPin - 0.05, TL.tapPin + 0.35));
    const s = f.size * Math.max(0, sp) * out;
    // drift with a fraction of the scroll (they float above the wall), wrap around
    let y = f.y - sc.y * (0.18 + f.depth / 2400);
    y = ((y + 400) % 1900 + 1900) % 1900 - 400;
    const x = f.x + Math.sin(t * f.sp + f.ph) * 26;
    y += Math.cos(t * f.sp * 1.3 + f.ph) * 22;
    f.m.position.set(x, y, -f.depth);
    f.m.scale.setScalar(Math.max(0.001, s));
    const spin = t * f.sp + sc.y * 0.0007;
    f.m.rotation.set(f.ax + spin * 0.8, f.ay + spin, f.kind === 'pushpin' ? Math.PI + 0.5 : spin * 0.3);
    f.sh.position.set(x + f.depth * 0.22, y + f.depth * 0.32, -0.5);
    const ss = s * (2.6 + f.depth / 300);
    f.sh.scale.set(ss, ss * 0.8, 1);
    f.sh.material.opacity = clamp(1.1 - f.depth / 700) * Math.min(1, sp);
  }
}

// camera ride: tilt the wall into a floor, swing, return
function layoutCamera(t) {
  const a = TL.tilt[0], b = TL.tilt[1];
  const rx = kf(t, [[a, 0], [a + 0.9, -0.95, ease.inOutCubic], [8.0, -0.82], [8.6, -0.55, ease.inOutCubic], [9.6, -0.6], [b, 0, ease.inOutBack]]);
  const ry = kf(t, [[a, 0], [7.4, 0.16, ease.inOutSine], [8.0, 0.1], [8.7, -0.42, ease.inOutCubic], [9.6, -0.3], [b, 0, ease.inOutCubic]]);
  const rz = kf(t, [[a, 0], [7.2, -0.12, ease.inOutSine], [8.0, -0.06], [8.7, 0.16, ease.inOutCubic], [9.6, 0.1], [b, 0, ease.inOutCubic]]);
  const pz = kf(t, [[a, 0], [a + 0.9, 380, ease.inOutCubic], [8.0, 520], [8.7, 260, ease.inOutCubic], [9.6, 320], [b, 0, ease.inOutCubic]]);
  const py = kf(t, [[a, 0], [a + 0.9, 260, ease.inOutCubic], [8.7, 120, ease.inOutCubic], [b, 0, ease.inOutCubic]]);
  pivot.rotation.set(rx, ry, rz);
  pivot.position.set(960, 540 + py, pz);
}

function layoutBursts(t) {
  bursts.forEach((set) => set.forEach((b) => (b.m.visible = false)));
  TL.saves.forEach((ts, si) => {
    const dt = t - ts;
    if (dt < 0 || dt > 1.3) return;
    const set = bursts[si % 2];
    const dx = cardDX(t, si);
    set.forEach((b) => {
      const r = rng(1000 + b.i * 7 + si * 131);
      const a = -Math.PI / 2 + (r() - 0.5) * 2.6;
      const v = 900 + r() * 900;
      const x = SPOT.save[0] + dx + Math.cos(a) * v * dt;
      const y = SPOT.save[1] + Math.sin(a) * v * dt + 0.5 * 2600 * dt * dt;
      const s = (26 + r() * 22) * Math.min(1, dt * 14) * (1 - ease.inCubic(clamp((dt - 0.7) / 0.6)));
      b.m.visible = s > 0.5;
      b.m.position.set(x, y, -200 - r() * 200);
      b.m.scale.setScalar(Math.max(0.01, s));
      b.m.rotation.set(dt * (4 + r() * 6), dt * (3 + r() * 5), b.k === 'pushpin' ? Math.PI + dt * 3 : dt * 2);
    });
  });
}

// ------------------------------------------------------- close-up ---
const CARD = { x: 352, y: 150, w: 1216, h: 790, r: 40 };
const SLOT = { x: 352, y: 150, w: 590, h: 790 };
function cardDX(t, i) {
  // horizontal offset of close-up card i (enter from the right on swipe i-1, leave on swipe i)
  let dx = 0;
  if (i > 0) { const sw = TL.swipes[i - 1]; dx += (1 - spring(t - sw - 0.08, { stiffness: 150, damping: 17 })) * 1500; if (t < sw + 0.08) dx = 1500; }
  if (i < TL.swipes.length) { const sw = TL.swipes[i]; dx -= ease.inCubic(seg(t, sw, sw + 0.3)) * 1700; }
  return dx;
}
const savedAt = (i) => TL.saves[i];

function drawCloseupCard(ctx, t, i, dx, grow = 1) {
  const h = HEROES[i];
  const cv = cardCanvas(h.key, { scale: 3, title: false });
  ctx.save();
  ctx.translate(dx, 0);
  // card
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.16)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 18;
  rr(ctx, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();
  // image (left), cover-fit into the slot
  if (grow >= 1) {
    ctx.save();
    rr(ctx, SLOT.x, SLOT.y, SLOT.w, SLOT.h, CARD.r);
    ctx.clip();
    drawCover(ctx, cv.canvas, SLOT.x, SLOT.y, SLOT.w, SLOT.h);
    ctx.restore();
  }
  // content (right)
  const c0 = 12.45 + (i === 0 ? 0 : 0);
  const ap = (k) => (i === 0 ? ease.outCubic(seg(t, c0 + k * 0.05, c0 + 0.35 + k * 0.05)) : 1);
  const X = 1000, Rr = CARD.x + CARD.w - 40;
  const lineIn = (k, fn) => { const a = ap(k); if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, (1 - a) * 24); fn(); ctx.restore(); };
  const saved = t >= savedAt(i) + 0.04;
  lineIn(0, () => {
    icon(ctx, 'heart', X + 12, 218, 1.4, INK);
    icon(ctx, 'share', X + 70, 216, 1.3, INK);
    icon(ctx, 'dots', X + 128, 218, 1.4, INK);
    text(ctx, 'Sonntagsideen', Rr - 200, 219, 19, 650, INK, 'right');
    icon(ctx, 'down', Rr - 186, 221, 1, INK);
    // Speichern button with press squash
    const press = clamp(1 - Math.abs(t - savedAt(i)) / 0.1);
    const pop = saved ? 1 + 0.12 * Math.exp(-(t - savedAt(i)) * 9) * Math.cos((t - savedAt(i)) * 26) : 1;
    const bw = saved ? 160 : 140, bh = 60;
    ctx.save();
    ctx.translate(SPOT.save[0], SPOT.save[1]);
    ctx.scale((1 - press * 0.08) * pop, (1 - press * 0.1) * pop);
    pill(ctx, -bw / 2 + (saved ? -10 : 0), -bh / 2, bw, bh, saved ? INK : RED);
    text(ctx, saved ? 'Gespeichert' : 'Speichern', saved ? -10 : 0, 1, 20, 700, '#fff', 'center');
    ctx.restore();
  });
  lineIn(1, () => text(ctx, h.title, X, 330, 50, 800, INK, 'left', { tracking: -1 }));
  lineIn(2, () => h.desc.forEach((l, k) => text(ctx, l, X, 396 + k * 32, 22, 450, '#333')));
  lineIn(3, () => {
    ctx.fillStyle = PINS[h.key].av;
    ctx.beginPath(); ctx.arc(X + 28, 548, 28, 0, TAU); ctx.fill();
    text(ctx, h.by[0], X + 28, 549, 24, 750, '#fff', 'center');
    text(ctx, h.by, X + 70, 536, 21, 700, INK);
    text(ctx, h.fol, X + 70, 562, 17, 500, GREY);
    pill(ctx, Rr - 120, 520, 120, 54, PILL);
    text(ctx, 'Folgen', Rr - 60, 548, 19, 650, INK, 'center');
  });
  lineIn(4, () => {
    text(ctx, 'Kommentare', X, 650, 22, 750, INK);
    text(ctx, 'Noch keine Kommentare. Füge einen hinzu!', X, 690, 19, 450, GREY);
    pill(ctx, X, 820, Rr - X, 64, PILL);
    text(ctx, 'Was gefällt dir?', X + 28, 853, 19, 450, GREY);
  });
  ctx.restore();
}
function drawCover(ctx, img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s, sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

// sticker label ("Tippen.", "Speichern.")
function sticker(ctx, str, x, y, t, t0, t1, rot = -0.07, col = RED) {
  if (t < t0 || t > t1 + 0.3) return;
  const sp = spring(t - t0, { stiffness: 260, damping: 14 });
  const out = ease.inBack(seg(t, t1, t1 + 0.28));
  const s = Math.max(0, sp) * (1 - out);
  if (s <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot + (1 - sp) * 0.3);
  ctx.scale(s, s);
  ctx.font = `850 64px InterV`;
  ctx.letterSpacing = '-2px';
  const w = ctx.measureText(str).width + 64;
  ctx.shadowColor = 'rgba(120,0,20,0.25)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  pill(ctx, -w / 2, -52, w, 104, col, { r: 30 });
  ctx.shadowColor = 'transparent';
  text(ctx, str, 0, 2, 64, 850, '#fff', 'center', { tracking: -2 });
  ctx.restore();
}

// ------------------------------------------------------------- draw ---
let wallCache = null;
// Render one GL pass with only the named groups visible.
function glPass(ctx, { wall: w = false, pens = false, burst = false } = {}) {
  pivot.visible = w; pencilGroup.visible = pens; burstGroup.visible = burst;
  G.renderOnly(ctx, [pivot, pencilGroup, burstGroup]);
}
export function draw(ctx, t, frame) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 1920, 1080);
  const boil = boilAt(frame / 60);
  const h = handAt(t);
  let introState = null;
  if (t < 2.6) introState = drawIntro(ctx, t, frame);
  // ---- layout all 3D props for this instant
  const wallOn = t >= TL.tap1 && t < TL.tapBoard + 0.6;
  if (wallOn) {
    layoutCamera(t);
    const pop = (x, y, e) => {
      if (t > TL.tap1 + 1.4) return { s: 1 };
      const d = Math.hypot(x - 960, y - 520);
      const t0 = TL.tap1 + q16(d / 1300);
      const sp = spring(t - t0, { stiffness: 320, damping: 15 });
      return { s: t < t0 ? 0 : Math.max(0, sp), rz: (1 - sp) * (((e.y | 0) % 2) ? 0.25 : -0.25) };
    };
    const heroes = layoutWall(wall, t, scroll, delay, { pop, viewTop: -3600, viewBottom: 3400 });
    if (heroes.pasta && t >= TL.tapPin) heroes.pasta.mesh.visible = false;
    layoutFloaters(t);
  }
  for (const p of pencils) p.visible = false;
  if (t < 2.4) layoutPencils(t, introState.tipPt);
  layoutBursts(t);
  // ---- wall pass (frozen behind the close-up: rendered once and reused)
  if (wallOn) {
    if (t >= 12.7) {
      if (!wallCache) {
        const c = document.createElement('canvas'); c.width = 1920; c.height = 1080;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.fillStyle = '#fff'; g.fillRect(0, 0, 1920, 1080);
        layoutCamera(12.7); layoutWall(wall, 12.7, scroll, delay); layoutFloaters(12.7);
        const e = wall.columns[HERO.col].find((x) => x.hero === 'pasta'); e.mesh.visible = false;
        glPass(g, { wall: true });
        wallCache = c;
      }
      ctx.drawImage(wallCache, 0, 0);
    } else glPass(ctx, { wall: true });
  }
  // ---- header + ripples
  const hp = spring(t - TL.headerIn, { stiffness: 140, damping: 16 });
  if (t > TL.headerIn) header(ctx, { p: hp });
  for (const tp of taps()) if (!tp.save) ripple(ctx, tp.x, tp.y, t - tp.t, { r1: tp.t === TL.tap1 ? 220 : 110 });
  // ---- close-up, save bursts, board, portal
  if (t >= TL.tapPin) drawCloseupLayer(ctx, t, frame);
  // ---- the hand
  if (t >= TL.color[0] && t < 19.8) {
    const rev = introState ? introState.rev : 1;
    drawHand(ctx, h.x, h.y, { boil, rot: h.rot, scale: h.scale, press: h.press, lift: h.lift, reveal: rev, shadowK: seg(t, 1.85, 2.2) });
  }
  // ---- pencils above everything during the intro
  if (t < 2.4) glPass(ctx, { pens: true });
  kineticLayer(ctx, t);
}

function kineticLayer(ctx, t) {
  // "Entdecken." during the camera ride, on a white plate
  if (t > 7.95 && t < 10.2) {
    const a = ease.outExpo(seg(t, 7.95, 8.35)), b = ease.inExpo(seg(t, 9.7, 10.0));
    const w = 980 * a * (1 - b);
    if (w > 4) {
      ctx.save();
      pill(ctx, 960 - w / 2, 430, w, 210, '#fff', { r: 105 });
      ctx.restore();
    }
    kinetic(ctx, 'Entdecken.', 960, 584, 150, t, 8.05, 9.6, { weight: 850 });
  }
  sticker(ctx, 'Tippen.', 250, 960, t, TL.tapPin + 0.02, 13.2, -0.08);
  sticker(ctx, 'Speichern.', 250, 960, t, 13.52, 17.6, 0.06, INK);
  if (t > 17.2 && t < 18.2) kinetic(ctx, '4 Ideen gespeichert.', 960, 1035, 56, t, 17.25, 17.95, { weight: 800 });
}

function drawCloseupLayer(ctx, t, frame) {
  const hr = heroAtRest();
  const k = seg(t, TL.tapPin + 0.08, TL.tapPin + 0.62, ease.snappy);
  // veil over the wall
  const veil = ease.outCubic(seg(t, TL.tapPin + 0.05, TL.tapPin + 0.5)) * 0.82;
  const boardP = spring(t - TL.tapBoard - 0.05, { stiffness: 120, damping: 17 });
  if (veil > 0) { ctx.fillStyle = `rgba(255,255,255,${veil})`; ctx.fillRect(0, 0, 1920, 1080); header(ctx, { p: 1 }); }
  if (t < TL.tapBoard + 0.5) {
    if (k < 1) {
      // card grows from the pin, image flies into the slot
      const lift = spring(t - TL.tapPin, { stiffness: 400, damping: 18 });
      const pr = { x: hr.x, y: hr.y, w: hr.w, h: hr.h };
      const R = { x: lerp(pr.x, CARD.x, k), y: lerp(pr.y, CARD.y, k), w: lerp(pr.w, CARD.w, k), h: lerp(pr.h, CARD.h, k) };
      const bump = 1 + 0.06 * Math.sin(Math.min(1, lift) * Math.PI) * (1 - k);
      ctx.save();
      ctx.translate(R.x + R.w / 2, R.y + R.h / 2); ctx.scale(bump, bump); ctx.translate(-(R.x + R.w / 2), -(R.y + R.h / 2));
      ctx.shadowColor = `rgba(0,0,0,${0.16 * k})`; ctx.shadowBlur = 60; ctx.shadowOffsetY = 18;
      rr(ctx, R.x, R.y, R.w, R.h, lerp(18, CARD.r, k)); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.shadowColor = 'transparent';
      const I = { x: lerp(hr.x, SLOT.x, k), y: lerp(hr.y, SLOT.y, k), w: lerp(hr.w, SLOT.w, k), h: lerp(hr.ih, SLOT.h, k) };
      rr(ctx, I.x, I.y, I.w, I.h, lerp(18, CARD.r, k)); ctx.save(); ctx.clip();
      drawCover(ctx, cardCanvas('pasta', { scale: 3, title: false }).canvas, I.x, I.y, I.w, I.h);
      ctx.restore();
      ctx.restore();
    } else {
      const fade = 1 - boardP;
      ctx.save();
      ctx.globalAlpha *= clamp(fade);
      for (let i = 0; i < HEROES.length; i++) {
        const dx = cardDX(t, i);
        if (Math.abs(dx) > 1700) continue;
        if (i > 0 && t < TL.swipes[i - 1]) continue;
        drawCloseupCard(ctx, t, i, dx);
      }
      ctx.restore();
    }
  }
  // GL bursts above the card
  if (TL.saves.some((ts) => t > ts && t < ts + 1.3)) glPass(ctx, { burst: true });
  // saved thumbnails fly to the board chip
  const chipIn = spring(t - (TL.saves[0] + 0.22), { stiffness: 160, damping: 15 });
  const thumbs = [];
  let count = 0, bump = 0;
  TL.saves.forEach((ts, i) => {
    const arrive = ts + 0.5;
    if (t >= arrive) { count++; thumbs.push(cardCanvas(HEROES[i].key).canvas); bump = Math.max(bump, Math.exp(-(t - arrive) * 7) * Math.sin(Math.min(Math.PI, (t - arrive) * 14))); }
    if (t > ts + 0.02 && t < arrive) {
      const q = ease.inOutCubic(seg(t, ts + 0.02, arrive));
      const dx = cardDX(ts + 0.02, i);
      const x = lerp(SLOT.x + SLOT.w / 2 + dx, SPOT.chip[0] - 104, q), y = lerp(SLOT.y + SLOT.h / 2, SPOT.chip[1], q) - Math.sin(q * Math.PI) * 140;
      const w = lerp(SLOT.w * 0.8, 48, q), hh = w * 1.2;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(Math.sin(q * Math.PI) * 0.25);
      ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
      rr(ctx, -w / 2, -hh / 2, w, hh, 16 * (1 - q) + 6); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.clip();
      drawCover(ctx, cardCanvas(HEROES[i].key, { scale: 3, title: false }).canvas, -w / 2, -hh / 2, w, hh);
      ctx.restore();
    }
  });
  const chipPress = clamp(1 - Math.abs(t - TL.tapBoard) / 0.1);
  if (t > TL.saves[0] + 0.22 && t < TL.tapBoard + 0.3) boardChip(ctx, SPOT.chip[0], SPOT.chip[1], { thumbs, count, bump, alpha: Math.min(1, chipIn * 1.5) * (1 - seg(t, TL.tapBoard + 0.05, TL.tapBoard + 0.25)), scale: Math.max(0, chipIn) * (1 - chipPress * 0.06) });
  if (t > TL.tapBoard) drawBoard(ctx, t, boardP, frame);
}

// --------------------------------------------------------- board ---
export let portalHook = null; // set by the film: (ctx, t, rect) draws the next act inside the portal
export function setPortal(fn) { portalHook = fn; }

function drawBoard(ctx, t, p, frame) {
  // page grows out of the chip
  const R = { x: lerp(SPOT.chip[0] - 150, 0, p), y: lerp(SPOT.chip[1] - 46, 0, p), w: lerp(300, 1920, p), h: lerp(92, 1080, p) };
  ctx.save();
  rr(ctx, R.x, R.y, R.w, R.h, lerp(24, 0, clamp(p)));
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.clip();
  header(ctx, { p: 1, alpha: clamp((p - 0.6) * 3) });
  const a = (k) => ease.outCubic(seg(t, TL.tapBoard + 0.25 + k * 0.06, TL.tapBoard + 0.6 + k * 0.06));
  ctx.save(); ctx.globalAlpha *= a(0); text(ctx, 'Sonntagsideen', 960, 200 + (1 - a(0)) * 30, 76, 850, INK, 'center', { tracking: -2.5 }); ctx.restore();
  ctx.save(); ctx.globalAlpha *= a(1); text(ctx, '4 Pins  ·  Ideen fürs Wochenende', 960, 270, 22, 550, GREY, 'center'); ctx.restore();
  const portal = seg(t, TL.portal[0], TL.portal[1], ease.inOutQuint);
  BOARD_PINS.forEach((bp, i) => {
    const sp = spring(t - TL.tapBoard - 0.3 - i * 0.07, { stiffness: 220, damping: 14 });
    if (sp <= 0) return;
    const press = i === 0 ? clamp(1 - Math.abs(t - TL.tapBoardPin) / 0.1) : 0;
    const s = Math.max(0, sp) * (1 - press * 0.05);
    if (i === 0 && portal > 0) return;
    ctx.save();
    ctx.translate(bp.x + bp.w / 2, bp.y + bp.h / 2); ctx.scale(s, s); ctx.translate(-(bp.x + bp.w / 2), -(bp.y + bp.h / 2));
    rr(ctx, bp.x, bp.y, bp.w, bp.h, 22); ctx.clip();
    drawCover(ctx, cardCanvas(bp.key, { scale: 3, title: false }).canvas, bp.x, bp.y, bp.w, bp.h);
    ctx.restore();
    // a little check badge: saved
    ctx.save(); ctx.globalAlpha *= clamp(sp);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(bp.x + bp.w - 30, bp.y + 30, 18, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bp.x + bp.w - 38, bp.y + 30); ctx.lineTo(bp.x + bp.w - 32, bp.y + 36); ctx.lineTo(bp.x + bp.w - 21, bp.y + 24); ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
  if (portal > 0) {
    // the first pin becomes a window into the next act
    const bp = BOARD_PINS[0];
    const tw = 2300, th = tw * (bp.h / bp.w);
    const Rr = { x: lerp(bp.x, 960 - tw / 2, portal), y: lerp(bp.y, 540 - th / 2 + 200, portal), w: lerp(bp.w, tw, portal), h: lerp(bp.h, th, portal) };
    ctx.save();
    rr(ctx, Rr.x, Rr.y, Rr.w, Rr.h, lerp(22, 60, portal));
    ctx.clip();
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1920, 1080);
    const mixA = ease.inOutSine(seg(t, TL.portal[0] + 0.15, TL.portal[1] - 0.1));
    if (portalHook) { ctx.save(); portalHook(ctx, t, frame); ctx.restore(); }
    ctx.globalAlpha = 1 - mixA;
    drawCover(ctx, cardCanvas(bp.key, { scale: 3, title: false }).canvas, Rr.x, Rr.y, Rr.w, Rr.h);
    ctx.restore();
  }
}

export function blur(t) {
  const v = Math.abs(scroll(t).v);
  if (t > 4 && t < 11.2) return v > 4500 ? 10 : v > 2000 ? 7 : 5;
  if (t > TL.tilt[0] && t < TL.tilt[1]) return 6;
  for (const sw of TL.swipes) if (t > sw - 0.05 && t < sw + 0.45) return 7;
  if (t > TL.portal[0] && t < TL.portal[1]) return 6;
  if (t < 2.4) return 5;
  return 4;
}
