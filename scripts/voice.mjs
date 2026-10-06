// Generate the narration with ElevenLabs (text-to-speech with timestamps).
//   ELEVENLABS_API_KEY=... node scripts/voice.mjs
// Writes assets/vo/<id>.mp3 and src/flow/voice.json (per-word timings). The key is never stored.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './server.mjs';
import { LINES, VOICE_ID } from '../src/flow/voice-lines.js';

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('Set ELEVENLABS_API_KEY'); process.exit(1); }
const outDir = path.join(ROOT, 'assets/vo');
fs.mkdirSync(outDir, { recursive: true });
const result = [];
for (const line of LINES) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      text: line.text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`${line.id}: ${res.status} ${await res.text()}`);
  const j = await res.json();
  fs.writeFileSync(path.join(outDir, `${line.id}.mp3`), Buffer.from(j.audio_base64, 'base64'));
  const { characters: ch, character_start_times_seconds: s, character_end_times_seconds: e } = j.alignment;
  // group characters into words
  const words = [];
  let cur = null;
  ch.forEach((c, i) => {
    if (/\s/.test(c)) { cur = null; return; }
    if (!cur) { cur = { w: '', s: s[i], e: e[i] }; words.push(cur); }
    cur.w += c;
    cur.e = e[i];
  });
  result.push({ ...line, dur: e[e.length - 1], words });
  console.log(`${line.id}  ${e[e.length - 1].toFixed(2)}s  ${line.text}`);
}
fs.writeFileSync(path.join(ROOT, 'src/flow/voice.json'), JSON.stringify(result, null, 1));
