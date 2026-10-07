// Generate the narration with ElevenLabs (text-to-speech with timestamps).
//   ELEVENLABS_API_KEY=... node scripts/voice.mjs                       # "Flow" film
//   ELEVENLABS_API_KEY=... node scripts/voice.mjs --film molasse        # a short in src/shorts/<film>/
//   ... --only m03,m07                                                  # regenerate single lines
// Writes <vo dir>/<id>.mp3 and voice.json (per-word timings) next to the lines file. The key is never stored.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT } from './server.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1]; };
const FILM = opt('film', 'flow');
const dir = FILM === 'flow' ? 'src/flow' : `src/shorts/${FILM}`;
const { LINES, VOICE_ID, MODEL = 'eleven_multilingual_v2', SETTINGS, ONE_TAKE = false, LANGUAGE = null, TEMPO = 1 } = await import(path.join(ROOT, dir, 'voice-lines.js'));
const settings = SETTINGS || { stability: 0.5, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true };
const only = opt('only') ? opt('only').split(',') : null;

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('Set ELEVENLABS_API_KEY'); process.exit(1); }
const outDir = path.join(ROOT, FILM === 'flow' ? 'assets/vo' : `assets/${FILM}/vo`);
fs.mkdirSync(outDir, { recursive: true });
const jsonFile = path.join(ROOT, dir, 'voice.json');

// group alignment characters into words (audio tags like [pause] are dropped)
function toWords({ characters: ch, character_start_times_seconds: s, character_end_times_seconds: e }) {
  const words = [];
  let cur = null;
  ch.forEach((c, k) => {
    if (/\s/.test(c)) { cur = null; return; }
    if (!cur) { cur = { w: '', s: s[k], e: e[k] }; words.push(cur); }
    cur.w += c;
    cur.e = e[k];
  });
  return words.filter((w) => !/^\[.*\]$/.test(w.w));
}

if (ONE_TAKE) {
  // the whole script in one request; lines are recovered by counting their words
  const text = LINES.map((l) => l.text).join(' ');
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ text, model_id: MODEL, voice_settings: settings, ...(LANGUAGE ? { language_code: LANGUAGE } : {}) }),
  });
  if (!res.ok) throw new Error(`take: ${res.status} ${await res.text()}`);
  const j = await res.json();
  fs.writeFileSync(path.join(outDir, TEMPO !== 1 ? 'take_raw.mp3' : 'take.mp3'), Buffer.from(j.audio_base64, 'base64'));
  // eleven_v4 ignores the speed setting: the whole take is time-stretched evenly instead (pitch and formants kept),
  // so the read keeps its own breathing and melody — no cuts inside the performance
  if (TEMPO !== 1) {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(outDir, 'take_raw.mp3'), '-af', `rubberband=tempo=${TEMPO}:pitch=1:formant=preserved:transients=smooth:detector=soft`, '-c:a', 'libmp3lame', '-b:a', '192k', path.join(outDir, 'take.mp3')]);
    for (const k of ['character_start_times_seconds', 'character_end_times_seconds']) j.alignment[k] = j.alignment[k].map((x) => x / TEMPO);
  }
  const all = toWords(j.alignment);
  const count = (t) => t.replace(/\[[^\]]*\]/g, ' ').trim().split(/\s+/).length;
  let k = 0;
  const result = LINES.map((line) => {
    const ws = all.slice(k, k + count(line.text));
    k += ws.length;
    const t0 = ws[0].s;
    return { ...line, take: t0, dur: ws[ws.length - 1].e - t0, words: ws.map((w) => ({ w: w.w, s: w.s - t0, e: w.e - t0 })) };
  });
  if (k !== all.length) console.warn(`word count mismatch: ${k} of ${all.length}`);
  // the quietest 10 ms between two lines (`cut`): the only place the timeline may open the take for extra silence
  const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(outDir, 'take.mp3'), '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], { maxBuffer: 1 << 28 });
  const y = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.byteLength / 4);
  const rmsAt = (t) => { let q = 0; const i0 = Math.round(t * 16000); for (let i = i0; i < i0 + 160 && i < y.length; i++) q += y[i] * y[i]; return q; };
  result.forEach((l, i) => {
    if (!i) return;
    const a = result[i - 1].take + result[i - 1].dur - 0.15, b = l.take + 0.1;
    let best = a, bq = Infinity;
    for (let t = a; t < b; t += 0.005) { const q = rmsAt(t); if (q < bq) { bq = q; best = t; } }
    l.cut = +best.toFixed(3);
  });
  result.forEach((l) => console.log(`${l.id}  @${l.take.toFixed(2)}  ${l.dur.toFixed(2)}s  ${l.words.map((w) => w.w).join(' ')}`));
  fs.writeFileSync(jsonFile, JSON.stringify(result, null, 1));
  process.exit(0);
}
const prev = fs.existsSync(jsonFile) ? JSON.parse(fs.readFileSync(jsonFile, 'utf8')) : [];
const result = [];
for (const [i, line] of LINES.entries()) {
  const old = prev.find((p) => p.id === line.id && p.text === line.text);
  if (old && only && !only.includes(line.id)) { result.push({ ...line, dur: old.dur, words: old.words }); continue; }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      text: line.text,
      model_id: MODEL,
      voice_settings: settings,
      // neighbouring lines keep the intonation of one continuous read
      previous_text: LINES[i - 1]?.text,
      next_text: LINES[i + 1]?.text,
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
