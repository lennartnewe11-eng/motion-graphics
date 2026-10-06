// Analog CRT finish for the Assecor film (after the "analog filter" reference): aperture-grille phosphor
// stripes, halation/bloom, soft focus, horizontal chroma bleed, barrel curvature, heavy vignette,
// lifted blacks, flicker, temporal noise and phosphor persistence (ghosting).
//
//   node scripts/analog.mjs                                   out/assecor-master.mp4 -> renders/assecor-imagefilm.mp4
//   node scripts/analog.mjs --in a.mp4 --out b.mp4
//   node scripts/analog.mjs --stills out/stills --out out/analog-stills   (single frames, for look development)
//   --strength 0..1   how much CRT (default 0.3 = light; 1 = full reference look)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './server.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1]; };

function run(cmd, argv) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, argv, { stdio: ['ignore', 'inherit', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (c) => (c === 0 ? res() : rej(new Error(`${cmd} ${c}\n${err.slice(-3000)}`))));
  });
}

// aperture grille: R G B phosphor columns, 6 px period, with a darker gap between triads
const GRILLE = path.join(ROOT, 'out/grille.png');
async function makeGrille() {
  fs.mkdirSync(path.dirname(GRILLE), { recursive: true });
  const col = (c) => `if(lt(mod(X,6),2),${c[0]},if(lt(mod(X,6),4),${c[1]},${c[2]}))`;
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=white:s=1920x1080:d=1', '-frames:v', '1', '-vf',
    `format=rgb24,geq=r='${col([255, 150, 150])}*(1-0.18*eq(mod(X,6),5))':g='${col([150, 255, 150])}*(1-0.18*eq(mod(X,6),5))':b='${col([150, 150, 255])}*(1-0.18*eq(mod(X,6),5))',gblur=sigma=0.5:sigmaV=0`, GRILLE]);
}

// the look, as one filtergraph: [0]=picture, [1]=grille.
// k = strength 0..1 (1 = full CRT, as in the reference; the film uses a light touch by default)
const K = Number(opt('strength', 0.3));
function look(k, still = false) {
  const f = (x, d = 3) => Number(x.toFixed(d));
  const op = 0.36 * k;
  const sw = Math.round((1920 * (1 + 0.04 * k)) / 2) * 2, sh = Math.round((1080 * (1 + 0.04 * k)) / 2) * 2;
  const shift = Math.max(1, Math.round(4 * k));
  return [
    '[0:v]format=gbrp,split=3[a][b][c]',
    // halation: wide, soft bloom of the highlights, screen-blended
    "[b]scale=384:216:flags=bilinear,gblur=sigma=5,scale=1920:1080:flags=bicubic,curves=all='0/0 0.55/0.25 1/1',format=gbrp[glow]",
    // horizontal colour bleed (CRT / composite smear)
    '[c]scale=640:1080:flags=bilinear,scale=1920:1080:flags=bicubic,format=gbrp[smear]',
    `[a]gblur=sigma=${f(0.3 + 0.8 * k)},format=gbrp[soft]`,
    `[soft][smear]blend=all_mode=normal:all_opacity=${f(0.35 * k)},format=gbrp[s1]`,
    `[s1][glow]blend=all_mode=screen:all_opacity=${f(0.5 * k)}[s2]`,
    `[s2]format=gbrp,rgbashift=rh=-${shift}:bh=${shift}:gh=0:edge=smear[ca]`,
    `[ca]eq=contrast=${f(1 + 0.06 * k)}:saturation=${f(1 + 0.42 * k)}:gamma=${f(1 + 0.06 * k)}:eval=frame:brightness='${f(0.012 * k, 4)}*sin(n*2.3)+${f(0.008 * k, 4)}*sin(n*0.71)',format=gbrp[eq]`,
    '[1:v]format=gbrp[gr]',
    `[eq][gr]blend=all_mode=multiply:all_opacity=${f(op)},format=gbrp,colorchannelmixer=rr=${f(1 + 0.55 * op)}:gg=${f(1 + 0.55 * op)}:bb=${f(1 + 0.55 * op)}[grille]`,
    // tube: lifted blacks, rolled-off whites, curvature, vignette, noise
    `[grille]curves=all='0/${f(0.035 * k)} 0.5/${f(0.5 + 0.02 * k)} 1/${f(1 - 0.025 * k)}',lenscorrection=k1=${f(0.03 * k, 4)}:k2=${f(0.012 * k, 4)}:i=bilinear,scale=${sw}:${sh},crop=1920:1080,vignette=angle=${f((Math.PI / 5) * Math.sqrt(k))}:mode=forward,noise=alls=${Math.max(1, Math.round(7 * k))}:allf=t+u[tube]`,
    // phosphor persistence
    still ? '[tube]format=rgb24[out]' : `[tube]tmix=frames=3:weights='1 ${f(0.45 * k)} ${f(0.18 * k)}',format=yuv420p[out]`,
  ].join(';');
}
const LOOK = look(K);
const STILL_LOOK = look(K, true);

if (opt('stills')) {
  await makeGrille();
  const dir = path.resolve(ROOT, opt('stills'));
  const out = path.resolve(ROOT, opt('out', 'out/analog-stills'));
  fs.mkdirSync(out, { recursive: true });
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.png'))) {
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(dir, f), '-loop', '1', '-i', GRILLE, '-filter_complex', STILL_LOOK, '-map', '[out]', '-frames:v', '1', path.join(out, f)]);
    console.log('look →', path.join(path.relative(ROOT, out), f));
  }
} else {
  await makeGrille();
  const input = path.resolve(ROOT, opt('in', 'out/assecor-master.mp4'));
  const mezz = path.resolve(ROOT, 'out/assecor-analog.mp4');
  const output = path.resolve(ROOT, opt('out', 'renders/assecor-imagefilm.mp4'));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const t0 = Date.now();
  const color = ['-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709'];
  // 1) the look, into a high-quality mezzanine
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-stats', '-i', input, '-loop', '1', '-i', GRILLE,
    '-filter_complex', LOOK, '-map', '[out]', '-map', '0:a?', '-shortest',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-profile:v', 'high', '-pix_fmt', 'yuv420p', ...color,
    '-c:a', 'copy', mezz]);
  // 2) delivery: two-pass at a fixed budget (the analog grain is expensive, keep it as grain, not mush)
  const kbps = Number(opt('kbps', 9500));
  const common = ['-c:v', 'libx264', '-preset', 'slow', '-tune', 'grain', '-b:v', `${kbps}k`, '-maxrate', `${Math.round(kbps * 1.4)}k`, '-bufsize', `${kbps * 2}k`, '-profile:v', 'high', '-pix_fmt', 'yuv420p', ...color];
  const log = path.join(ROOT, 'out/x264-2pass');
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', mezz, ...common, '-pass', '1', '-passlogfile', log, '-an', '-f', 'mp4', '/dev/null']);
  // audio from the uncompressed mix when it is there (no second lossy generation)
  const wav = path.join(ROOT, 'out/audio.wav');
  const audioIn = fs.existsSync(wav) ? ['-i', wav, '-map', '0:v', '-map', '1:a'] : [];
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', mezz, ...audioIn, ...common, '-pass', '2', '-passlogfile', log, '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', output]);
  console.log(`analog pass → ${path.relative(ROOT, output)} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
