// Foley for the Assecor film, generated with ElevenLabs text-to-sound-effects.
//   ELEVENLABS_API_KEY=... node scripts/sfx-assecor.mjs [--only tear,scribble]
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './server.mjs';

export const SFX = {
  crtOn: ['Old CRT television switching on: electric thump, rising high-pitched whine and brief static', 2.0],
  crtOff: ['Old CRT television switching off: electric zap collapsing into silence', 1.2],
  tear: ['Quickly tearing a sheet of thick paper in half, close mic', 0.9],
  scribble: ['Felt-tip marker scribbling fast on paper, close mic, dry', 1.0],
  circle: ['Marker pen drawing one quick circle on paper, close mic, dry', 0.8],
  underline: ['Single quick marker stroke on paper, short swipe, dry', 0.5],
  photo: ['Polaroid photo dropped flat onto a wooden table, crisp paper slap', 0.6],
  shutter: ['Analog film camera shutter click with film advance lever', 0.8],
  crumple: ['Crumpling a sheet of paper into a ball, fast', 1.0],
  stamp: ['Rubber stamp thumped onto paper on a desk, single hit', 0.5],
  glitch: ['VHS tape glitch, short burst of analog static and tape warble', 0.7],
  tape: ['Cassette tape fast forward whirr, short', 0.9],
  blocks: ['Wooden toy blocks clicking together quickly, several small dry clicks', 1.0],
  boom: ['Deep warm cinematic boom hit with tape saturation and short tail', 2.0],
  whoosh: ['Soft airy whoosh passing by, smooth and short', 0.8],
  type: ['Mechanical typewriter typing a short burst of keys', 1.0],
  paper: ['Sheet of paper sliding across a table, quick', 0.6],
};

if (process.argv[1] && process.argv[1].endsWith('sfx-assecor.mjs')) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--only');
  const only = i < 0 ? null : args[i + 1].split(',');
  const KEY = process.env.ELEVENLABS_API_KEY;
  if (!KEY) { console.error('Set ELEVENLABS_API_KEY'); process.exit(1); }
  const dir = path.join(ROOT, 'assets/assecor/sfx');
  fs.mkdirSync(dir, { recursive: true });
  // sequential: the API allows only a few concurrent requests
  for (const [k, [text, dur]] of Object.entries(SFX).filter(([k]) => !only || only.includes(k))) {
    if (!only && fs.existsSync(path.join(dir, `${k}.mp3`))) continue;
    const res = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ text, duration_seconds: dur, prompt_influence: 0.6 }),
    });
    if (!res.ok) throw new Error(`${k}: ${res.status} ${await res.text()}`);
    fs.writeFileSync(path.join(dir, `${k}.mp3`), Buffer.from(await res.arrayBuffer()));
    console.log('sfx', k);
  }
}
