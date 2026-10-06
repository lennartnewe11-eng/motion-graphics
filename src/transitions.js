// Transitions between scenes. Each one owns a time window and draws both scenes.
import { W, H, TAU, clamp, lerp, ease, seg, C, rgba, hash1 } from './engine/core.js';
import { roundRect } from './engine/draw.js';

const buffers = {};
function buf(name) {
  if (!buffers[name]) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    buffers[name] = { c, ctx: c.getContext('2d') };
  }
  const b = buffers[name];
  b.ctx.setTransform(1, 0, 0, 1, 0, 0);
  b.ctx.globalCompositeOperation = 'source-over';
  b.ctx.globalAlpha = 1;
  return b;
}

export const transitions = [
  // 02 -> 03: zoom through the counter of the "O" (scene 02 draws the portal itself)
  {
    from: 'type', to: 'shapes', start: 10.45, end: 12,
    draw(ctx, t, p, drawA, drawB) { drawA(ctx, drawB); },
  },

  // 05 -> 06: whip pan with heavy motion blur
  {
    from: '3d', to: 'data', start: 29.55, end: 30.0,
    blur: 14,
    draw(ctx, t, p, drawA, drawB) {
      const e = ease.inOutExpo(p);
      const panel = (dx, draw) => {
        ctx.save();
        ctx.translate(dx, 0);
        ctx.beginPath();
        ctx.rect(0, 0, W, H);
        ctx.clip();
        draw(ctx);
        ctx.restore();
      };
      panel(-W * e * 1.05, drawA);
      panel(W * (1 - e) * 1.05, drawB);
    },
    sfx: [{ t: 0.05, type: 'whip', gain: 0.9 }],
  },

  // 06 -> 07: the dashboard shrinks into a card and gets flicked away
  {
    from: 'data', to: 'ui', start: 35.45, end: 36.0,
    blur: 8,
    draw(ctx, t, p, drawA, drawB) {
      drawB(ctx);
      const s = lerp(1, 0.42, ease.snappy(clamp(p / 0.55)));
      const fly = ease.inExpo(clamp((p - 0.42) / 0.58));
      const x = 960 - 1500 * fly, y = 540 - 420 * fly + 60 * Math.sin(fly * Math.PI);
      const rot = -0.45 * fly + 0.04 * Math.sin(clamp(p / 0.55) * Math.PI);
      const r = lerp(0, 46, clamp(p / 0.4)) / s;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(s, s);
      ctx.translate(-960, -540);
      ctx.save();
      ctx.shadowColor = 'rgba(10,8,40,0.5)';
      ctx.shadowBlur = 120 * s;
      ctx.shadowOffsetY = 60;
      roundRect(ctx, 0, 0, W, H, r);
      ctx.fillStyle = rgba(C.paper);
      ctx.fill();
      ctx.restore();
      roundRect(ctx, 0, 0, W, H, r);
      ctx.clip();
      drawA(ctx);
      ctx.restore();
    },
    sfx: [{ t: 0.0, type: 'swish', gain: 0.45 }, { t: 0.25, type: 'whip', gain: 0.7 }],
  },

  // 07 -> 08: RGB-split slice glitch, switching scenes on the downbeat
  {
    from: 'ui', to: 'styles', start: 41.8, end: 42.12,
    blur: 1,
    draw(ctx, t, p, drawA, drawB) {
      const src = buf('src');
      src.ctx.save();
      (t < 42 ? drawA : drawB)(src.ctx);
      src.ctx.restore();
      const amt = clamp(1 - Math.abs(t - 42) / 0.2);
      const seed = Math.floor(t * 40);
      // channel split
      const ch = buf('ch');
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const shifts = [[-1, '#ff0000'], [0, '#00ff00'], [1, '#0000ff']];
      for (const [k, col] of shifts) {
        ch.ctx.globalCompositeOperation = 'source-over';
        ch.ctx.drawImage(src.c, 0, 0);
        ch.ctx.globalCompositeOperation = 'multiply';
        ch.ctx.fillStyle = col;
        ch.ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(ch.c, k * 26 * amt, k * 4 * amt);
      }
      ctx.globalCompositeOperation = 'source-over';
      // horizontal slice displacement
      const comp = buf('comp');
      comp.ctx.drawImage(ctx.canvas, 0, 0);
      let y = 0;
      let i = 0;
      while (y < H) {
        const h = 12 + Math.floor(hash1(seed * 13 + i) * 90);
        if (hash1(seed * 7 + i * 3) < 0.45 * amt + 0.05) {
          const dx = (hash1(seed + i * 11) - 0.5) * 260 * amt;
          ctx.drawImage(comp.c, 0, y, W, h, dx, y, W, h);
        }
        y += h; i++;
      }
      // a few flash bars
      for (let k = 0; k < 3; k++) {
        if (hash1(seed * 5 + k) < 0.5 * amt) {
          ctx.fillStyle = rgba(k % 2 ? C.lime : C.paper, 0.9);
          ctx.fillRect(0, hash1(seed + k * 9) * H, W, 3 + hash1(k + seed) * 10);
        }
      }
      ctx.restore();
    },
    sfx: [{ t: 0.0, type: 'glitch', gain: 0.7, dur: 0.32 }],
  },
];
