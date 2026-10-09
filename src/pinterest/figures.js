// Colored-pencil characters: the pointing hand (taps, swipes, flicks) and a small 2D rig for people
// (pelvis → spine → neck → head, 2-bone IK for arms and legs, faces that blink and smile, hair, clothes).
// Every part is a pencil item in rig space; drawPencil renders the lot as one drawing.
import { clamp, lerp, TAU } from '../engine/core.js';
import { drawPencil, ellipse, capsule, blob, smooth, rrect, PC, shadeOf, mat, mmul, xf } from './pencil.js';

const SK = { fill: PC.skin1, shade: '#D9967A', line: '#9C5B45' };
const T = (m, pts) => pts.map((p) => xf(m, p));

// ================================================================ HAND ===
// Right hand seen from the back, index finger extended. Local origin = the fingertip; finger points -y.
// opts: x, y (fingertip on screen), rot, scale, press (0 hover … 1 pressed), lift (shadow distance 0..1),
//       sleeve colour, skin, reveal (0..1 draw-on), boil
export function handItems({ rot = -0.42, scale = 1, press = 0, sleeve = PC.red, cuff = null, skin = SK, reveal = 1, curl = 0 } = {}) {
  const s = scale * (1 - 0.045 * press);
  const m = mat(0, 0, rot, s);
  const it = [];
  const R = (k) => clamp(reveal * 1.6 - k * 0.12, 0, 1); // staggered draw-on per part
  const skinIt = (pts, seed, o = {}) => ({ pts: T(m, pts), fill: skin.fill, shade: skin.shade, line: skin.line, seed, lw: 3, gap: 4.2, ...o });
  // sleeve + ribbed cuff
  const cuffC = cuff || shadeOf(sleeve, -0.12);
  it.push({ pts: T(m, smooth([[-128, 500], [236, 470], [300, 1250], [-180, 1250]], true, 3)), fill: sleeve, shade: shadeOf(sleeve, -0.35), line: shadeOf(sleeve, -0.5), seed: 11, lw: 3, reveal: R(0) });
  it.push({ pts: T(m, smooth([[-134, 470], [240, 436], [252, 530], [-126, 562]], true, 3)), fill: cuffC, shade: shadeOf(cuffC, -0.35), line: shadeOf(sleeve, -0.5), seed: 12, lw: 3, reveal: R(0.5) });
  for (let k = 0; k < 13; k++) {
    const u = k / 12;
    it.push({ pts: T(m, [[lerp(-122, 238, u), lerp(476, 444, u) + 8], [lerp(-116, 246, u), lerp(552, 522, u) - 6]]), open: true, line: shadeOf(cuffC, -0.42), lw: 1.8, seed: 20 + k, reveal: R(1) });
  }
  // curled fingers peeking out on the right, behind the back of the hand
  const fold = 1 - curl;
  it.push(skinIt(capsule(66, 236, 80, 320 + 10 * fold, 40, 38), 40, { reveal: R(1.2) }));
  it.push(skinIt(capsule(128, 262, 140, 346, 37, 35), 41, { reveal: R(1.3) }));
  it.push(skinIt(capsule(184, 300, 190, 372, 31, 29), 42, { reveal: R(1.4) }));
  // thumb, lying along the left side (tucked under the edge of the hand)
  it.push(skinIt(capsule(-40, 450, -92, 342, 42, 33), 70, { reveal: R(1.45), light: [-0.8, -0.4] }));
  it.push({ pts: T(m, ellipse(-90, 348, 14, 18, -0.45)), fill: '#F6D8D0', shade: null, line: '#C08070', lw: 1.8, seed: 71, reveal: R(1.5), gap: 3.6 });
  // back of the hand
  it.push(skinIt(smooth([[-58, 250], [0, 226], [62, 232], [150, 262], [206, 322], [224, 402], [206, 472], [122, 522], [0, 528], [-72, 492], [-94, 402], [-82, 312]], true, 5), 43, { reveal: R(1.5), light: [-0.4, -0.9] }));
  // knuckle marks + tendons
  for (const [x, y, k] of [[58, 252, 0], [124, 276, 1], [180, 310, 2]]) it.push({ pts: T(m, smooth([[x - 18, y + 8], [x, y], [x + 18, y + 8]], false, 3)), open: true, line: skin.line, lw: 2, seed: 50 + k, reveal: R(2) });
  for (const [x0, x1, k] of [[20, 10, 0], [70, 58, 1], [126, 104, 2]]) it.push({ pts: T(m, smooth([[x0, 300], [lerp(x0, x1, 0.5) + 4, 380], [x1, 460]], false, 3)), open: true, line: shadeOf(skin.shade, 0.1), lw: 1.5, seed: 55 + k, reveal: R(2.2) });
  // index finger
  it.push(skinIt(capsule(0, 30, 6, 268, 34, 40), 60, { reveal: R(2), light: [-0.7, -0.5] }));
  it.push({ pts: T(m, ellipse(0, 34, 20, 25)), fill: '#F6D8D0', shade: null, line: '#C08070', lw: 2, seed: 61, reveal: R(2.5), gap: 3.6 });
  for (const [y, k] of [[100, 0], [114, 1], [186, 2], [200, 3]]) it.push({ pts: T(m, smooth([[-16, y + 2], [0, y - 2], [16, y + 2]], false, 3)), open: true, line: skin.line, lw: k % 2 ? 1.5 : 2.1, seed: 62 + k, reveal: R(2.6) });
  return it;
}

// Draw the hand with its fingertip at (x, y).
export function drawHand(ctx, x, y, o = {}) {
  const { boil = 0, lift = 0.4, alpha = 1, reveal = 1, shadowK = 1 } = o;
  const items = handItems(o);
  ctx.save();
  ctx.translate(x, y);
  const sh = reveal >= 1 && shadowK > 0 ? { dx: 16 + 44 * lift, dy: 24 + 54 * lift, blur: 26 + 34 * lift, alpha: (0.16 + 0.06 * (1 - lift)) * shadowK } : null;
  drawPencil(ctx, items, { boil, paper: reveal >= 1, shadow: sh, alpha });
  ctx.restore();
}
// The outline path the "drawing pencil" follows in the intro (screen space for given placement).
export function handOutline(x, y, rot = -0.42, scale = 1) {
  const m = mmul(mat(x, y), mat(0, 0, rot, scale));
  const P = [...capsule(0, 30, 6, 268, 34, 40).slice(0, 11), [62, 232], [150, 262], [206, 322], [224, 402], [206, 472], [122, 522], [0, 528], [-72, 492], [-116, 300], [-82, 312], [-40, 250]];
  return T(m, P);
}

// ============================================================== PEOPLE ===
const rotv = (a, [x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
// 2-bone IK: from root A to target T with segment lengths l1, l2; bend = +1/-1 picks the elbow side.
export function ik(A, Tg, l1, l2, bend = 1) {
  const dx = Tg[0] - A[0], dy = Tg[1] - A[1];
  const d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  const a = Math.atan2(dy, dx);
  const c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const b = a + bend * Math.acos(c);
  const E = [A[0] + Math.cos(b) * l1, A[1] + Math.sin(b) * l1];
  const ea = Math.atan2(Tg[1] - E[1], Tg[0] - E[0]);
  return { E, W: [E[0] + Math.cos(ea) * l2, E[1] + Math.sin(ea) * l2], a1: b, a2: ea };
}

// spec: { skin, hair:{style,color}, top, topShade, pattern, sleeves:'long'|'short', bottom, shoes, extras:[] }
// pose: { x, y, s, lean, headTilt, look (−1..1), blink (0..1), smile (0..1), mouthOpen, armL:{t:[x,y],bend}, armR, legL, legR,
//         sway (hair), hide:{legs}, handL:'open'|'fist' }
export function personItems(spec, pose) {
  const { x = 0, y = 0, s = 1, lean = 0, headTilt = 0, look = 0, blink = 0, smile = 0.6, mouthOpen = 0, sway = 0, bob = 0 } = pose;
  const root = mat(x, y + bob, 0, s);
  const skin = spec.skin || SK;
  const it = [];
  const P = (pts) => T(root, pts);
  let seed = 100;
  const S = () => seed++;
  // skeleton (rig space)
  const pelvis = [0, 0];
  const neck = add(pelvis, rotv(lean, [0, -250]));
  const sh = (side) => add(neck, rotv(lean, [side * 76, 22]));
  const head = add(neck, rotv(lean + headTilt, [0, -104]));
  const hrot = lean + headTilt;
  const hp = (px, py) => add(head, rotv(hrot, [px, py]));
  const hm = mmul(root, mat(head[0], head[1], hrot));
  const H = (pts) => T(hm, pts);
  const top = spec.top, topSh = spec.topShade || shadeOf(top, -0.32);
  const hair = spec.hair || { style: 'short', color: PC.umber };
  const hc = hair.color, hs = hair.shade || shadeOf(hc, -0.35);
  // limb solve
  const arm = (side) => {
    const o = pose[side < 0 ? 'armL' : 'armR'] || {};
    const A = sh(side);
    const tg = o.t ? o.t : add(A, [side * 30, 210]);
    return { A, ...ik(A, tg, 118, 112, o.bend ?? -side), o };
  };
  const leg = (side) => {
    const o = pose[side < 0 ? 'legL' : 'legR'] || {};
    const A = [side * 34, -6];
    const tg = o.t ? o.t : [side * 46, 290];
    return { A, ...ik(A, tg, 152, 146, o.bend ?? side * 0.35), o };
  };
  const drawArm = (a, side) => {
    const sl = spec.sleeves || 'long';
    const fore = sl === 'long' ? top : skin.fill;
    it.push({ pts: P(capsule(a.A[0], a.A[1], a.E[0], a.E[1], 27, 21)), fill: top, shade: topSh, seed: S(), lw: 2.6 });
    it.push({ pts: P(capsule(a.E[0], a.E[1], a.W[0], a.W[1], 20, 16)), fill: fore, shade: sl === 'long' ? topSh : skin.shade, line: sl === 'long' ? undefined : skin.line, seed: S(), lw: 2.4 });
    if (sl === 'long') it.push({ pts: P(capsule(a.W[0] - Math.cos(a.a2) * 8, a.W[1] - Math.sin(a.a2) * 8, a.W[0], a.W[1], 18, 18)), fill: shadeOf(top, -0.12), seed: S(), lw: 2 });
    // hand: palm + thumb, oriented along the forearm
    const hd = a.a2, hx = a.W[0] + Math.cos(hd) * 16, hy = a.W[1] + Math.sin(hd) * 16;
    if (a.o.hand !== 'hidden') {
      it.push({ pts: P(ellipse(hx, hy, 21, 17, hd)), fill: skin.fill, shade: skin.shade, line: skin.line, seed: S(), lw: 2.2 });
      const th = hd - side * 1.2;
      it.push({ pts: P(capsule(hx + Math.cos(th) * 6, hy + Math.sin(th) * 6, hx + Math.cos(th) * 22, hy + Math.sin(th) * 22, 7, 6)), fill: skin.fill, shade: null, line: skin.line, seed: S(), lw: 1.8 });
    }
    return [hx, hy];
  };
  const drawLeg = (l, side) => {
    it.push({ pts: P(capsule(l.A[0], l.A[1], l.E[0], l.E[1], 33, 25)), fill: spec.bottom, shade: shadeOf(spec.bottom, -0.32), seed: S(), lw: 2.6 });
    it.push({ pts: P(capsule(l.E[0], l.E[1], l.W[0], l.W[1], 24, 18)), fill: spec.bottom, shade: shadeOf(spec.bottom, -0.32), seed: S(), lw: 2.4 });
    const fd = l.o.foot ?? side * 0.25;
    it.push({ pts: P(capsule(l.W[0] - side * 4, l.W[1] + 8, l.W[0] + Math.cos(Math.PI / 2 - fd) * 0 + side * 26, l.W[1] + 16, 20, 16)), fill: spec.shoes || PC.graphite, seed: S(), lw: 2.4 });
  };
  const aL = arm(-1), aR = arm(1);
  const lL = leg(-1), lR = leg(1);
  // ---------------- back layer: long hair, back accessories
  if (hair.style === 'long' || hair.style === 'bob') {
    const len = hair.style === 'long' ? 190 : 92;
    it.push({ pts: H(smooth([[-70, -30], [-64, -90], [0, -118], [64, -90], [70, -30], [74 + sway * 8, len], [-74 + sway * 8, len]], true, 5)), fill: hc, shade: hs, seed: S(), lw: 2.6 });
  }
  if (hair.style === 'curly') {
    const C = [];
    for (let k = 0; k < 15; k++) { const a = Math.PI + (k / 14) * Math.PI * 1.1 - 0.05; C.push([Math.cos(a) * 82 + sway * 4, Math.sin(a) * 84 - 14]); }
    it.push({ pts: H(blob(0, -22, 92, 7, 0.13, 44, 0.95)), fill: hc, shade: hs, seed: S(), lw: 2.4 });
  }
  if (hair.style === 'bun') it.push({ pts: H(blob(sway * 6, -128, 40, 5, 0.1, 30)), fill: hc, shade: hs, seed: S() });
  for (const e of spec.extras || []) if (e === 'backpack') it.push({ pts: P(rrect(-112, -250, 224, 240, 46)), fill: PC.orange, shade: PC.brown, seed: S() });
  // ---------------- legs
  if (!pose.hide?.legs) { drawLeg(lL, -1); drawLeg(lR, 1); }
  // arms behind the body?
  const behind = pose.armsBehind || [];
  const hands = {};
  if (behind.includes('L')) hands.L = drawArm(aL, -1);
  if (behind.includes('R')) hands.R = drawArm(aR, 1);
  // ---------------- torso
  const shL = sh(-1), shR = sh(1);
  const waistL = add(pelvis, rotv(lean * 0.5, [-62, -70])), waistR = add(pelvis, rotv(lean * 0.5, [62, -70]));
  const torsoPts = smooth([add(shL, [-14, 6]), add(neck, rotv(lean, [-34, -6])), add(neck, rotv(lean, [34, -6])), add(shR, [14, 6]), add(waistR, [4, 0]), [70, 14], [-70, 14], add(waistL, [-4, 0])], true, 5);
  it.push({ pts: P(torsoPts), fill: top, shade: topSh, seed: S(), lw: 2.8 });
  if (spec.pattern === 'stripes') for (let k = 0; k < 6; k++) {
    const yy = -206 + k * 34, hw = lerp(84, 62, (yy + 220) / 160) - 6;
    it.push({ pts: P([rotv(lean, [-hw, yy]), rotv(lean, [hw, yy + 2])]), open: true, line: spec.stripe || PC.white, lw: 5, seed: S() });
  }
  if (spec.pattern === 'dots') for (let k = 0; k < 10; k++) { const px = ((k * 37) % 110) - 55, py = -210 + ((k * 53) % 190); it.push({ pts: P(ellipse(...rotv(lean, [px, py]), 6, 6)), fill: spec.dot || PC.white, shade: null, seed: S(), lw: 1.4 }); }
  for (const e of spec.extras || []) {
    if (e === 'apron') it.push({ pts: P(smooth([add(neck, rotv(lean, [-30, 34])), add(neck, rotv(lean, [30, 34])), [40, -110], [64, -70], [66, 150], [-66, 150], [-64, -70], [-40, -110]], true, 3)), fill: spec.apron || PC.red, shade: shadeOf(spec.apron || PC.red, -0.35), seed: S() });
    if (e === 'straps') for (const sd of [-1, 1]) it.push({ pts: P(capsule(...add(sh(sd), [-sd * 22, -2]), sd * 40, -90, 9, 9)), fill: PC.brown, seed: S(), lw: 2 });
  }
  // ---------------- neck + head
  it.push({ pts: P(capsule(neck[0], neck[1] + 10, ...add(neck, rotv(lean, [0, -44])), 19, 18)), fill: skin.fill, shade: skin.shade, line: skin.line, seed: S(), lw: 2.4 });
  if (spec.collar !== false) it.push({ pts: P(smooth([add(neck, rotv(lean, [-30, -4])), add(neck, rotv(lean, [0, 14])), add(neck, rotv(lean, [30, -4])), add(neck, rotv(lean, [0, 4]))], true, 4)), fill: shadeOf(top, -0.1), seed: S(), lw: 2 });
  for (const sd of [-1, 1]) it.push({ pts: H(ellipse(sd * 56, 4, 12, 17)), fill: skin.fill, shade: skin.shade, line: skin.line, seed: S(), lw: 2.2 });
  it.push({ pts: H(smooth([[0, -70], [44, -58], [58, -10], [50, 36], [26, 62], [0, 68], [-26, 62], [-50, 36], [-58, -10], [-44, -58]], true, 5)), fill: skin.fill, shade: skin.shade, line: skin.line, seed: S(), lw: 2.8, light: [-0.6, -0.7] });
  // ---------------- face
  const lx = look * 12;
  it.push({ pts: H(ellipse(-28 + lx, 30, 11, 7)), fill: PC.pink, shade: null, line: null, seed: S(), pressure: 0.55 });
  it.push({ pts: H(ellipse(28 + lx, 30, 11, 7)), fill: PC.pink, shade: null, line: null, seed: S(), pressure: 0.55 });
  for (const sd of [-1, 1]) {
    const ex = sd * 21 + lx, ey = 2;
    if (blink > 0.5) it.push({ pts: H(smooth([[ex - 8, ey], [ex, ey + 3], [ex + 8, ey]], false, 3)), open: true, line: PC.ink, lw: 2.6, seed: S() });
    else it.push({ pts: H(ellipse(ex, ey, 5.5, 7.5 * (1 - blink))), fill: PC.ink, shade: null, line: PC.ink, lw: 1.4, seed: S(), solid: true, gap: 2.4 });
    it.push({ pts: H(smooth([[ex - 10, -14 - smile * 2], [ex, -19 - smile * 3], [ex + 10, -15]], false, 3)), open: true, line: hs, lw: 2.6, seed: S() });
  }
  it.push({ pts: H(smooth([[lx * 1.3 - 2, 6], [lx * 1.3 - 6, 22], [lx * 1.3 + 3, 25]], false, 3)), open: true, line: skin.line, lw: 2, seed: S() });
  if (mouthOpen > 0.05) {
    const mw = 15 + smile * 5, mh = 6 + mouthOpen * 12;
    it.push({ pts: H(smooth([[lx - mw, 38], [lx + mw, 38], [lx + mw * 0.6, 38 + mh], [lx, 40 + mh * 1.1], [lx - mw * 0.6, 38 + mh]], true, 4)), fill: '#A8323C', shade: null, line: '#7A2028', lw: 2, seed: S(), solid: true });
    it.push({ pts: H(ellipse(lx, 38 + mh * 0.8, mw * 0.45, mh * 0.35)), fill: PC.rose, shade: null, line: null, seed: S() });
  } else {
    const mw = 13 + smile * 4;
    it.push({ pts: H(smooth([[lx - mw, 40 - smile * 3], [lx, 42 + smile * 6], [lx + mw, 40 - smile * 3]], false, 4)), open: true, line: '#8A3A3A', lw: 2.6, seed: S() });
  }
  // ---------------- hair front
  if (hair.style === 'curly') {
    for (let k = 0; k < 7; k++) { const a = Math.PI + 0.35 + (k / 6) * (Math.PI - 0.7); it.push({ pts: H(blob(Math.cos(a) * 46 + sway * 3, Math.sin(a) * 56 - 22, 24, k + 3, 0.12, 22)), fill: hc, shade: hs, seed: S(), lw: 2.2 }); }
  } else if (hair.style === 'bun' || hair.style === 'short' || hair.style === 'long' || hair.style === 'bob') {
    const fr = hair.style === 'short' ? [[-62, -6], [-60, -64], [0, -96], [60, -64], [62, -6], [44, -40], [10, -50], [-30, -40]] : [[-62, 10], [-58, -66], [0, -94], [58, -66], [62, 10], [48, -36], [16, -52], [-20, -44], [-44, -30]];
    it.push({ pts: H(smooth(fr, true, 5)), fill: hc, shade: hs, seed: S(), lw: 2.6 });
    for (let k = 0; k < 4; k++) it.push({ pts: H(smooth([[-30 + k * 18, -84], [-24 + k * 18, -60], [-28 + k * 18, -46]], false, 3)), open: true, line: hs, lw: 1.6, seed: S() });
  }
  for (const e of spec.extras || []) {
    if (e === 'beanie') {
      it.push({ pts: H(smooth([[-66, -30], [-60, -92], [0, -128], [60, -92], [66, -30]], true, 5)), fill: spec.beanie || PC.red, shade: shadeOf(spec.beanie || PC.red, -0.35), seed: S() });
      it.push({ pts: H(rrect(-70, -46, 140, 26, 12)), fill: shadeOf(spec.beanie || PC.red, -0.1), seed: S() });
      it.push({ pts: H(ellipse(0, -132, 18, 16)), fill: PC.cream, seed: S() });
    }
    if (e === 'headphones') {
      it.push({ pts: H(smooth([[-66, -10], [-62, -84], [0, -112], [62, -84], [66, -10], [56, -10], [52, -78], [0, -100], [-52, -78], [-56, -10]], true, 3)), fill: PC.graphite, seed: S(), lw: 2 });
      for (const sd of [-1, 1]) it.push({ pts: H(rrect(sd * 62 - 15, -22, 30, 46, 12)), fill: spec.phones || PC.yellow, shade: PC.orange, seed: S() });
    }
    if (e === 'glasses') for (const sd of [-1, 1]) it.push({ pts: H(ellipse(sd * 21 + lx, 2, 17, 15)), fill: null, shade: null, line: PC.ink, lw: 2.6, seed: S(), noOcclude: true });
  }
  // ---------------- arms in front (callers can slot props in between: items.slice(0, armStart))
  const armStart = it.length;
  if (!behind.includes('L')) hands.L = drawArm(aL, -1);
  if (!behind.includes('R')) hands.R = drawArm(aR, 1);
  return { items: it, armStart, hands: { L: xf(root, hands.L), R: xf(root, hands.R) }, head: xf(root, head), neck: xf(root, neck) };
}

export function drawPerson(ctx, spec, pose, { boil = 0, shadow = true, alpha = 1, extra = [] } = {}) {
  const r = personItems(spec, pose);
  drawPencil(ctx, [...r.items, ...extra], { boil, paper: true, shadow: shadow ? { dx: 10, dy: 16, blur: 30, alpha: 0.1 } : null, alpha });
  return r;
}

// A few cast members.
export const CAST = {
  cook: { skin: { fill: PC.skin3, shade: '#7E4E32', line: '#4E2E1E' }, hair: { style: 'curly', color: '#3A2620' }, top: PC.yellow, sleeves: 'short', bottom: PC.navy, extras: ['apron'], apron: '#E60023' },
  potter: { skin: { fill: PC.skin1, shade: '#D9967A', line: '#9C5B45' }, hair: { style: 'bun', color: '#C2552E' }, top: PC.teal, pattern: 'stripes', stripe: PC.cream, sleeves: 'long', bottom: PC.blue },
  hiker: { skin: { fill: PC.skin2, shade: '#B07850', line: '#6E4430' }, hair: { style: 'short', color: '#2A2220' }, top: PC.yellow, sleeves: 'long', bottom: PC.forest, shoes: PC.brown, extras: ['backpack', 'beanie', 'straps'], beanie: '#E60023' },
  dancer: { skin: { fill: '#8A5A40', shade: '#4A2C20', line: '#2E1A12' }, hair: { style: 'bob', color: '#5B3A8E' }, top: PC.pink, pattern: 'dots', dot: PC.white, sleeves: 'short', bottom: PC.sky, shoes: PC.white, extras: ['headphones'] },
};
