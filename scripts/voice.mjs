// Generate the narration with ElevenLabs (text-to-speech with timestamps).
//   ELEVENLABS_API_KEY=... node scripts/voice.mjs [--film flow|assecor] [--only a03,a07]
// Writes <vo dir>/<id>.mp3 and src/<film>/voice.json (per-word timings). The key is never stored.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './server.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1]; };
const FILM = opt('film', 'flow');
const ONLY = opt('only', '') ? opt('only').split(',') : null;
const { LINES, VOICE_ID, MODEL = 'eleven_multilingual_v2', SETTINGS } = await import(`../src/${FILM}/voice-lines.js`);

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('Set ELEVENLABS_API_KEY'); process.exit(1); }
const outDir = path.join(ROOT, FILM === 'flow' ? 'assets/vo' : `assets/${FILM}/vo`);
const jsonFile = path.join(ROOT, `src/${FILM}/voice.json`);
fs.mkdirSync(outDir, { recursive: true });
const prev = fs.existsSync(jsonFile) ? JSON.parse(fs.readFileSync(jsonFile, 'utf8')) : [];
const result = [];
for (const [i, line] of LINES.entries()) {
  if (ONLY && !ONLY.includes(line.id)) { const p = prev.find((x) => x.id === line.id); if (p) result.push({ ...p, ...line }); continue; }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      text: line.text,
      model_id: MODEL,
      // neighbouring lines keep the intonation continuous across separately generated takes
      previous_text: LINES[i - 1]?.text,
      next_text: LINES[i + 1]?.text,
      voice_settings: SETTINGS || { stability: 0.5, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`${line.id}: ${res.status} ${await res.text()}`);
  const j = await res.json();
  fs.writeFileSync(path.join(outDir, `${line.id}.mp3`), Buffer.from(j.audio_base64, 'base64'));
  const { characters: ch, character_start_times_seconds: s, character_end_times_seconds: e } = j.alignment;
  // group characters into words
  const words = [];
  let cur = null;
  ch.forEach((c, k) => {
    if (/\s/.test(c)) { cur = null; return; }
    if (!cur) { cur = { w: '', s: s[k], e: e[k] }; words.push(cur); }
    cur.w += c;
    cur.e = e[k];
  });
  result.push({ ...line, dur: e[e.length - 1], words });
  console.log(`${line.id}  ${e[e.length - 1].toFixed(2)}s  ${line.text}`);
}
fs.writeFileSync(jsonFile, JSON.stringify(result, null, 1));
