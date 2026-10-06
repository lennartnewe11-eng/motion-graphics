// Render driver: headless Chromium renders motion-blurred frames, ffmpeg encodes them,
// the score is synthesised with an OfflineAudioContext and muxed in.
//
//   node scripts/render.mjs                         full reel -> renders/claude-motion-reel.mp4
//   node scripts/render.mjs --from 4 --to 12        partial render (seconds)
//   node scripts/render.mjs --stills 1,2.5,4.2      PNG stills into out/stills
//   node scripts/render.mjs --audio-only            just the soundtrack -> out/audio.wav
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { startServer, ROOT } from './server.mjs';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  if (i < 0) return def;
  const v = args[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};

let FPS = Number(opt('fps', 0)); // 0 = the film's own frame rate
let W = 1920, H = 1080;
const WORKERS = Number(opt('workers', Math.max(1, Math.min(4, os.cpus().length - 1))));
const OUT_DIR = path.join(ROOT, 'out');
const FILM = opt('film', 'reel');
const FINAL = path.resolve(ROOT, opt('out', FILM === 'reel' ? 'renders/claude-motion-reel.mp4' : FILM === 'flow' ? 'renders/claude-flow.mp4' : `renders/${FILM}.mp4`));
fs.mkdirSync(OUT_DIR, { recursive: true });

const LAUNCH = { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] };

function run(cmd, argv, { quiet = false } = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => { err += d; if (!quiet) process.stderr.write(d); });
    p.stdout.on('data', (d) => { if (!quiet) process.stdout.write(d); });
    p.on('close', (code) => (code === 0 ? res(err) : rej(new Error(`${cmd} exited ${code}\n${err.slice(-2000)}`))));
  });
}

async function openPage(srv, tag) {
  const browser = await chromium.launch(LAUNCH);
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('console', (m) => console.log(`[${tag}] ${m.text()}`));
  page.on('pageerror', (e) => console.error(`[${tag}] PAGE ERROR`, e));
  await page.goto(`http://127.0.0.1:${srv.port}/src/index.html?film=${FILM}${opt('cues') ? '&cues=' + encodeURIComponent(opt('cues')) : ''}`);
  await page.waitForFunction(() => window.REEL);
  return { browser, page };
}

async function stills(srv, times) {
  const dir = path.join(OUT_DIR, 'stills');
  fs.mkdirSync(dir, { recursive: true });
  const { browser, page } = await openPage(srv, 'still');
  for (const t of times) {
    const url = await page.evaluate(([t, fps]) => window.REEL.still(t, fps, true), [t, FPS]);
    const file = path.join(dir, `t${t.toFixed(3).padStart(7, '0')}.png`);
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log('wrote', path.relative(ROOT, file));
  }
  await browser.close();
}

async function video(srv, f0, f1) {
  const segDir = path.join(OUT_DIR, 'segments');
  fs.rmSync(segDir, { recursive: true, force: true });
  fs.mkdirSync(segDir, { recursive: true });
  const total = f1 - f0;
  const per = Math.ceil(total / WORKERS);
  const jobs = [];
  const t0 = Date.now();
  let done = 0;
  for (let w = 0; w < WORKERS; w++) {
    const a = f0 + w * per, b = Math.min(f1, a + per);
    if (a >= b) continue;
    const seg = path.join(segDir, `seg_${String(w).padStart(2, '0')}.mp4`);
    jobs.push((async () => {
      const ff = spawn('ffmpeg', [
        '-y', '-loglevel', 'error',
        '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
        '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
        '-threads', '2', seg,
      ], { stdio: ['pipe', 'inherit', 'inherit'] });
      const closed = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
      srv.onStream('v' + w, (data) => new Promise((res) => {
        done++;
        if (done % 30 === 0) {
          const el = (Date.now() - t0) / 1000;
          process.stdout.write(`\r  ${done}/${total} frames  ${(done / el).toFixed(2)} fps  eta ${((total - done) / (done / el)).toFixed(0)}s   `);
        }
        if (ff.stdin.write(data)) res(); else ff.stdin.once('drain', res);
      }));
      const { browser, page } = await openPage(srv, 'w' + w);
      await page.evaluate(([a, b, fps, ws]) => window.REEL.run({ from: a, to: b, fps, ws }), [a, b, FPS, `ws://127.0.0.1:${srv.port}/?k=v${w}`]);
      await browser.close();
      ff.stdin.end();
      await closed;
      return seg;
    })());
  }
  const segs = await Promise.all(jobs);
  console.log(`\n  rendered ${total} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  const list = path.join(segDir, 'list.txt');
  fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
  const out = path.join(OUT_DIR, 'video.mp4');
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out]);
  return out;
}

function writeWav(file, L, R, sr) {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 8);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 8, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(3, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 8, 28); buf.writeUInt16LE(8, 32); buf.writeUInt16LE(32, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 8, 40);
  for (let i = 0; i < n; i++) { buf.writeFloatLE(L[i], 44 + i * 8); buf.writeFloatLE(R[i], 48 + i * 8); }
  fs.writeFileSync(file, buf);
}

async function audio(srv) {
  let payload = null;
  srv.onStream('a', (data) => { payload = Buffer.from(data); });
  const { browser, page } = await openPage(srv, 'audio');
  const t0 = Date.now();
  const solo = opt('solo') || null;
  const info = await page.evaluate(([ws, solo]) => window.REEL.audio(ws, { solo }), [`ws://127.0.0.1:${srv.port}/?k=a`, solo]);
  await browser.close();
  const f = new Float32Array(payload.buffer, payload.byteOffset, payload.byteLength / 4);
  const L = f.subarray(0, info.length), R = f.subarray(info.length);
  let peak = 0;
  for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  console.log(`  audio rendered in ${((Date.now() - t0) / 1000).toFixed(1)}s, peak ${(20 * Math.log10(peak)).toFixed(1)} dBFS`);
  const raw = path.join(OUT_DIR, opt('solo') ? `stem_${opt('solo')}.wav` : 'audio_raw.wav');
  if (opt('solo')) { writeWav(raw, L, R, info.sampleRate); return raw; }
  writeWav(raw, L, R, info.sampleRate);
  // two-pass loudness normalisation to -14 LUFS / -1 dBTP (streaming standard)
  const m = await run('ffmpeg', ['-hide_banner', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json', '-f', 'null', '-'], { quiet: true });
  const j = JSON.parse(m.slice(m.lastIndexOf('{'), m.lastIndexOf('}') + 1));
  console.log(`  measured ${j.input_i} LUFS, TP ${j.input_tp}`);
  const out = path.join(OUT_DIR, 'audio.wav');
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af',
    `loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,aresample=48000`,
    '-c:a', 'pcm_s24le', out]);
  return out;
}

const srv = await startServer();
{ // format of the film (frame size, frame rate, duration)
  const { browser, page } = await openPage(srv, 'meta');
  const m = await page.evaluate(() => ({ W: window.REEL.W, H: window.REEL.H, FPS: window.REEL.FPS }));
  await browser.close();
  W = m.W || W; H = m.H || H; if (!FPS) FPS = m.FPS || 60;
}
try {
  if (opt('stills')) {
    await stills(srv, String(opt('stills')).split(',').map(Number));
  } else if (opt('audio-only')) {
    console.log('audio →', await audio(srv));
  } else {
    let duration = 56;
    { const { browser, page } = await openPage(srv, 'meta'); duration = await page.evaluate(() => window.REEL.DURATION); await browser.close(); }
    const from = Number(opt('from', 0)), to = Number(opt('to', duration));
    console.log(`Rendering ${from}s → ${to}s @ ${FPS} fps with ${WORKERS} workers`);
    const v = await video(srv, Math.round(from * FPS), Math.round(to * FPS));
    if (opt('no-audio')) {
      fs.mkdirSync(path.dirname(FINAL), { recursive: true });
      fs.copyFileSync(v, FINAL);
    } else {
      const a = await audio(srv);
      fs.mkdirSync(path.dirname(FINAL), { recursive: true });
      await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', v, '-ss', String(from), '-t', String(to - from), '-i', a,
        '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-shortest', FINAL]);
    }
    console.log('done →', path.relative(ROOT, FINAL));
  }
} finally {
  srv.close();
}
