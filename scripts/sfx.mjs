// Generate the foley library of a short with ElevenLabs Sound Effects.
//   ELEVENLABS_API_KEY=... node scripts/sfx.mjs --film molasse [--only a,b] [--force]
// Prompts live in src/shorts/<film>/sfx-prompts.js. Multi-take prompts ("six separate ... silence between")
// are sliced into round-robin variants by scripts/slice.py afterwards. The key is never stored.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './server.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1] ?? true; };
const FILM = opt('film', 'molasse');
const { SFX } = await import(path.join(ROOT, `src/shorts/${FILM}/sfx-prompts.js`));
const only = opt('only') ? String(opt('only')).split(',') : null;
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('Set ELEVENLABS_API_KEY'); process.exit(1); }
const outDir = path.join(ROOT, `.scratch/${FILM}-sfx-raw`);
fs.mkdirSync(outDir, { recursive: true });

async function gen(s, take) {
  const file = path.join(outDir, `${s.id}${take ? '_' + take : ''}.mp3`);
  if (fs.existsSync(file) && !args.includes('--force')) return;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192', {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ text: s.prompt, duration_seconds: s.dur, prompt_influence: s.influence ?? 0.55 }),
    });
    if (res.ok) { fs.writeFileSync(file, Buffer.from(await res.arrayBuffer())); console.log('ok', path.basename(file)); return; }
    console.warn(s.id, res.status, (await res.text()).slice(0, 200));
    await new Promise((r) => setTimeout(r, 3000 * 2 ** attempt));
  }
}
const list = SFX.filter((s) => !only || only.includes(s.id));
// small concurrency pool
let i = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (i < list.length) {
    const s = list[i++];
    for (let k = 0; k < (s.takes || 1); k++) await gen(s, s.takes > 1 ? k + 1 : 0);
  }
}));
