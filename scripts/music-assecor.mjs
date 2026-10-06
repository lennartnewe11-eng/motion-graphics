// Compose the score for the Assecor film with ElevenLabs Music (music_v2_5, composition plan).
// Section lengths follow the edit at 120 BPM (1 bar = 2 s).
//   ELEVENLABS_API_KEY=... node scripts/music-assecor.mjs [--seed 7] [--out assets/assecor/music/score.mp3]
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './server.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1]; };
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('Set ELEVENLABS_API_KEY'); process.exit(1); }

const GLOBAL = [
  'instrumental', 'modern indie electronic', 'warm analog synthesizers', 'retro 80s synth-pop touch',
  'tape saturated lo-fi texture', 'tight punchy drums', 'groovy syncopated bassline', '120 BPM', 'steady four-on-the-floor grid',
  'optimistic, confident, forward-moving', 'major key', 'great production quality',
];
const NEG = ['vocals', 'singing', 'choir', 'spoken word', 'ukulele', 'whistling', 'dubstep', 'heavy metal', 'tempo changes'];
const chunks = [
  { text: '[Intro] {soft filtered synth arpeggio, vinyl and tape hiss, gentle riser}', duration_ms: 4000, positive_styles: [...GLOBAL, 'sparse intro', 'low-pass filtered', 'anticipation'] },
  { text: '[Verse] {kick and rimshot groove, plucky synth chords, round bass}', duration_ms: 12000, positive_styles: ['light groove', 'curious', 'plucky staccato synth', 'clean kick', 'tight closed hi-hats', 'instrumental'] },
  { text: '[Groove] {full beat, bouncy bassline, bright analog lead hooks}', duration_ms: 18000, positive_styles: ['full groove', 'energetic', 'bright analog lead', 'claps on 2 and 4', 'driving bass', 'instrumental'] },
  { text: '[Build] {rising energy, layered arpeggios, snare build in the last bar}', duration_ms: 12000, positive_styles: ['building tension', 'rising arpeggios', 'driving', 'snare roll build at the end', 'instrumental'] },
  { text: '[Chorus] {big uplifting peak, wide synth chords, strong drums}', duration_ms: 10000, positive_styles: ['euphoric peak', 'wide stereo synth chords', 'strong drums', 'anthemic', 'instrumental'] },
  { text: '[Outro] {resolve on the tonic, final hit, warm synth tail fading out}', duration_ms: 8000, positive_styles: ['resolving', 'warm', 'final hit then decaying tail', 'calm ending', 'instrumental'] },
].map((c) => ({ ...c, negative_styles: NEG }));

const res = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192', {
  method: 'POST',
  headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
  body: JSON.stringify({ model_id: 'music_v2_5', composition_plan: { chunks }, seed: Number(opt('seed', 7)) }),
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const out = path.resolve(ROOT, opt('out', 'assets/assecor/music/score.mp3'));
fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
console.log('song-id', res.headers.get('song-id'), '→', path.relative(ROOT, out));
