// The home feed as a 3D masonry wall. Eight columns of pin cards (GL planes), each column scrolled with
// its own small time delay so the feed moves like jelly. Scroll comes from flick impulses with
// exponential friction (closed form, so any frame can be evaluated independently) and can be "caught"
// by a finger. Letter cards are inserted so that at a chosen moment the columns spell a word.
import { rng, clamp } from '../engine/core.js';
import * as G from './gl.js';
import { PINS, CW, cardCanvas, letterCanvas, cardSize } from './pins.js';

export const COLS = 8, GAP = 24, TOP = 112;
export const colX = (c) => (1920 - (COLS * CW + (COLS - 1) * GAP)) / 2 + c * (CW + GAP);

const texCache = new Map();
function tex(key, make) {
  if (!texCache.has(key)) texCache.set(key, G.textureFrom(make().canvas));
  return texCache.get(key);
}

// ------------------------------------------------------------- scroll ---
// flicks: [{ t, v }] (v in px/s, positive = content moves up), friction k, catch: time the finger stops it.
export function makeScroll({ flicks, k = 1.55, stopAt = Infinity, stopSpring = 18 }) {
  const raw = (t) => {
    let y = 0, v = 0;
    for (const f of flicks) {
      if (t <= f.t) continue;
      const e = Math.exp(-k * (t - f.t));
      y += (f.v / k) * (1 - e);
      v += f.v * e;
    }
    return { y, v };
  };
  return (t) => {
    if (t <= stopAt) return raw(t);
    // caught: stop with a short damped overshoot
    const s = raw(stopAt);
    const dt = t - stopAt;
    const over = (s.v / stopSpring) * Math.exp(-stopSpring * 0.5 * dt) * Math.sin(stopSpring * 0.5 * dt) * 0.9;
    return { y: s.y + over, v: 0 };
  };
}

// ------------------------------------------------------------- build ---
// opts: seed, pool (pin keys), length (content px per column), letters: { word, t, y } placed so that at
// time t they sit at screen y; heroes: [{ key, col, t, y }] same idea for specific pins.
export function buildWall({ seed = 7, pool = Object.keys(PINS), length = 18000, letters = null, heroes = [], scroll, delay }) {
  const R = rng(seed);
  const group = new G.THREE.Group();
  const columns = [];
  for (let c = 0; c < COLS; c++) {
    const inserts = [];
    if (letters && c < letters.word.length) {
      const ch = letters.word[c];
      const off = scroll(letters.t - delay(c)).y;
      inserts.push({ y: letters.y - TOP + off, kind: 'letter', ch, h: Math.round(CW * 1.25) });
    }
    for (const h of heroes.filter((x) => x.col === c)) {
      const off = scroll(h.t - delay(c)).y;
      inserts.push({ y: h.y - TOP + off, kind: 'pin', key: h.key, h: cardSize(h.key).h, hero: h.id || h.key });
    }
    inserts.sort((a, b) => a.y - b.y);
    const list = [];
    let y = -700 - R() * 260, last = [];
    const minH = Math.min(...pool.map((k) => cardSize(k).h));
    const place = (e) => { list.push(e); y = e.y + e.h + GAP; };
    const spread = (r) => { const n = Math.min(4, list.length); for (let i = 0; i < n; i++) list[list.length - n + i].y += (r * (i + 1)) / (n + 1); };
    let guard = 0;
    while (y < length) {
      if (++guard > 5000) break;
      const ins = inserts[0];
      // avoid repeating a pin within the column and next to the same pin in the neighbour column
      const prevCol = columns[c - 1] || [];
      const near = prevCol.filter((e) => e.kind === 'pin' && e.y < y + 420 && e.y + e.h > y - 120).map((e) => e.key);
      const banned = [...last, ...near];
      const free = pool.filter((k) => !banned.includes(k));
      let key = (free.length ? free : pool)[(R() * (free.length || pool.length)) | 0];
      if (ins) {
        const room = ins.y - y;
        if (room < minH + GAP) { spread(room); inserts.shift(); place({ ...ins }); continue; }
        if (room - (cardSize(key).h + GAP) < minH + GAP) {
          const cand = pool.filter((k) => !banned.includes(k) && cardSize(k).h + GAP <= room).sort((p, q) => cardSize(q).h - cardSize(p).h);
          if (!cand.length) { spread(room); inserts.shift(); place({ ...ins }); continue; }
          key = cand[0];
        }
      }
      last = [...last.slice(-3), key];
      place({ kind: 'pin', key, y, h: cardSize(key).h });
    }
    for (const e of list) {
      let t, w = CW, h = e.h;
      if (e.kind === 'letter') t = tex('L' + e.ch, () => letterCanvas(e.ch));
      else t = tex('P' + e.key, () => cardCanvas(e.key));
      const m = G.cardMesh(t, w, h, 18);
      m.userData = { ...e, w };
      group.add(m);
      e.mesh = m;
    }
    columns.push(list);
  }
  return { group, columns };
}

// Position all cards for time t. Returns hero screen boxes (pre-transform, z=0 plane).
export function layoutWall(wall, t, scroll, delay, { pop = null, viewTop = -1400, viewBottom = 2600 } = {}) {
  const heroes = {};
  wall.columns.forEach((list, c) => {
    const off = scroll(t - delay(c)).y;
    const x = colX(c);
    for (const e of list) {
      const sy = TOP + e.y - off;
      const m = e.mesh;
      const vis = sy + e.h > viewTop && sy < viewBottom;
      m.visible = vis;
      if (!vis) continue;
      let s = 1, rz = 0;
      if (pop) { const p = pop(x + CW / 2, sy + e.h / 2, e); s = p.s; rz = p.rz || 0; if (s <= 0.001) { m.visible = false; continue; } }
      m.position.set(x + CW / 2, sy + e.h / 2, 0);
      m.scale.set(s, s, 1);
      m.rotation.set(0, 0, rz);
      if (e.hero) heroes[e.hero] = { x, y: sy, w: CW, h: e.h, ih: cardSize(e.key).ih, mesh: m };
    }
  });
  return heroes;
}
