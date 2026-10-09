// Page runtime: font loading, motion-blurred frame rendering, YUV export, preview player.
import { W, H, clamp } from './engine/core.js';
import { renderMix } from './audio/index.js';

// Which film to load: ?film=reel (default) or ?film=flow
const FILM = new URLSearchParams(location.search).get('film') || 'reel';
const FILMS = { reel: './reel.js', flow: './flow/film.js', pinterest: './pinterest/film.js' };
const film = await import(FILMS[FILM] || FILMS.reel);
const { compose, init, blurSamples, FPS, DURATION, cueSheet } = film;
const mixOpts = (o = {}) => ({
  ...o,
  score: film.score,
  voice: (film.voice || []).map((v) => ({ t: v.t, url: `/assets/vo/${v.id}.mp3` })),
});

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });

const FONTS = [
  '400 40px InterV', '900 40px InterV', '600 40px InterV',
  'italic 400 40px "Instrument Serif"', '400 40px "Instrument Serif"',
  '400 40px "JetBrains Mono"', '500 40px "JetBrains Mono"', '700 40px "JetBrains Mono"', '800 40px "JetBrains Mono"',
  '800 40px Syne', 'italic 900 40px "Playfair Display"', '900 40px Unbounded', '400 40px "Bebas Neue"',
  '900 40px Fraunces', '700 40px "Space Grotesk"',
  '400 40px Caveat', '700 40px Caveat', '800 40px InterV', '700 40px InterV', '500 40px InterV',
];

let ready = null;
function boot() {
  if (!ready) ready = (async () => {
    await Promise.all(FONTS.map((f) => document.fonts.load(f, 'AaÄÖÜß0123')));
    await document.fonts.ready;
    await init();
  })();
  return ready;
}

// ------------------------------------------------------------ frame core ---
const N_PIX = W * H;
const acc = new Uint16Array(N_PIX * 3);
// Per-film finishing: vignette depth and luma grain (base + midtone boost).
const FINISH = { vignette: 0.09, grainBase: 1.1, grainMid: 1.6, ...(film.finish || {}) };
const vignette = new Float32Array(N_PIX);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2);
  const d = Math.sqrt(dx * dx * 0.8 + dy * dy * 0.9);
  vignette[y * W + x] = 1 - FINISH.vignette * Math.pow(clamp(d - 0.35, 0, 1) / 0.65, 2.2);
}
// Pre-baked film grain tile (approximately gaussian, deterministic).
const GT = 1024;
const grain = new Float32Array(GT * GT);
{
  let s = 12345;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < grain.length; i++) grain[i] = (r() + r() + r() - 1.5) * 2.0;
}

const SHUTTER = 0.5; // 180°
const DRAFT = new URLSearchParams(location.search).has('fast');

function accumulate(frame, fps) {
  const t = frame / fps;
  const n = DRAFT ? 1 : blurSamples(t);
  acc.fill(0);
  for (let k = 0; k < n; k++) {
    const ts = n === 1 ? t : t + ((k + 0.5) / n - 0.5) * (SHUTTER / fps);
    compose(ctx, Math.max(0, ts), frame, k, n);
    const d = ctx.getImageData(0, 0, W, H).data;
    for (let p = 0, q = 0; p < d.length; p += 4, q += 3) {
      acc[q] += d[p];
      acc[q + 1] += d[p + 1];
      acc[q + 2] += d[p + 2];
    }
  }
  return n;
}

const yuv = new Uint8Array(N_PIX * 1.5);
const cbAcc = new Float32Array(N_PIX / 4);
const crAcc = new Float32Array(N_PIX / 4);

// BT.709 limited-range 4:2:0 with luma grain + vignette.
function toYUV(n, frame) {
  const inv = 1 / n;
  cbAcc.fill(0);
  crAcc.fill(0);
  const ox = (frame * 7919) % GT, oy = (frame * 104729) % GT;
  const W2 = W >> 1;
  for (let y = 0; y < H; y++) {
    const gRow = ((y + oy) % GT) * GT;
    const cRow = (y >> 1) * W2;
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const q = i * 3;
      const v = vignette[i] * inv;
      const r = acc[q] * v, g = acc[q + 1] * v, b = acc[q + 2] * v;
      const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const mid = 1 - Math.abs(Y / 127.5 - 1);
      let yv = 16 + Y * 0.858824 + grain[gRow + ((x + ox) & (GT - 1))] * (FINISH.grainBase + FINISH.grainMid * mid);
      yv = yv < 16 ? 16 : yv > 235 ? 235 : yv;
      yuv[i] = yv + 0.5;
      const c = cRow + (x >> 1);
      cbAcc[c] += b - Y;
      crAcc[c] += r - Y;
    }
  }
  const uo = N_PIX, vo = N_PIX + N_PIX / 4;
  const kb = (224 / 255) / 1.8556 / 4, kr = (224 / 255) / 1.5748 / 4;
  for (let c = 0; c < N_PIX / 4; c++) {
    yuv[uo + c] = clamp(128 + cbAcc[c] * kb, 16, 240) + 0.5;
    yuv[vo + c] = clamp(128 + crAcc[c] * kr, 16, 240) + 0.5;
  }
  return yuv;
}

function accToCanvas(n) {
  const img = ctx.createImageData(W, H);
  const d = img.data;
  const inv = 1 / n;
  for (let i = 0, q = 0, p = 0; i < N_PIX; i++, q += 3, p += 4) {
    const v = vignette[i] * inv;
    d[p] = acc[q] * v; d[p + 1] = acc[q + 1] * v; d[p + 2] = acc[q + 2] * v; d[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

// ------------------------------------------------------- driver API ------
async function wsConnect(url) {
  const ws = new WebSocket(url);
  ws.binaryType = 'arraybuffer';
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let waiter = null;
  ws.onmessage = () => { const w = waiter; waiter = null; w && w(); };
  return {
    send: (buf) => new Promise((res) => { waiter = res; ws.send(buf); }),
    close: () => ws.close(),
  };
}

window.REEL = {
  FPS, DURATION, FILM,
  voice: () => film.voice || [],
  boot,
  async run({ from, to, fps = FPS, ws }) {
    await boot();
    const sock = await wsConnect(ws);
    const t0 = performance.now();
    for (let f = from; f < to; f++) {
      const n = accumulate(f, fps);
      await sock.send(toYUV(n, f));
      if ((f - from) % 60 === 0) console.log(`frame ${f} (${((performance.now() - t0) / (f - from + 1)).toFixed(0)} ms/f)`);
    }
    sock.close();
    return performance.now() - t0;
  },
  async still(t, fps = FPS, blur = true) {
    await boot();
    const frame = Math.round(t * fps);
    if (blur) {
      const n = accumulate(frame, fps);
      accToCanvas(n);
    } else {
      compose(ctx, t, frame);
    }
    return canvas.toDataURL('image/png');
  },
  async audio(ws, opts = {}) {
    await boot();
    const buf = await renderMix(cueSheet(), DURATION, mixOpts(opts));
    const sock = await wsConnect(ws);
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    const out = new Float32Array(L.length * 2);
    out.set(L, 0);
    out.set(R, L.length);
    await sock.send(out.buffer);
    sock.close();
    return { sampleRate: buf.sampleRate, length: L.length };
  },
  cues: () => cueSheet(),
};

// ------------------------------------------------------------- preview ---
if (location.search.includes('preview')) {
  document.body.classList.add('preview');
  const btn = document.getElementById('play');
  const scrub = document.getElementById('scrub');
  const tcEl = document.getElementById('tc');
  let playing = false, t = 0, audioBuf = null, actx = null, src = null, startedAt = 0;
  boot().then(() => compose(ctx, 0, 0));
  const stop = () => { if (src) { src.stop(); src = null; } playing = false; btn.textContent = 'Play'; };
  const play = async () => {
    if (!actx) actx = new AudioContext({ sampleRate: 48000 });
    if (!audioBuf) { btn.textContent = 'Rendering audio…'; audioBuf = await renderMix(cueSheet(), DURATION, mixOpts()); }
    src = actx.createBufferSource();
    src.buffer = audioBuf;
    src.connect(actx.destination);
    src.start(0, t);
    startedAt = actx.currentTime - t;
    playing = true;
    btn.textContent = 'Pause';
  };
  btn.onclick = () => (playing ? stop() : play());
  scrub.onclick = (e) => {
    const r = scrub.getBoundingClientRect();
    const was = playing;
    stop();
    t = clamp((e.clientX - r.left) / r.width) * DURATION;
    if (was) play();
  };
  window.addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); btn.click(); } });
  const loop = () => {
    if (playing) { t = actx.currentTime - startedAt; if (t >= DURATION) { stop(); t = 0; } }
    compose(ctx, t, Math.floor(t * FPS));
    scrub.firstElementChild.style.width = `${(t / DURATION) * 100}%`;
    tcEl.textContent = t.toFixed(2) + 's';
    requestAnimationFrame(loop);
  };
  boot().then(loop);
}
