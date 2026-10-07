// Foley prompts for ElevenLabs Sound Effects (scripts/sfx.mjs); `slice: true` = multi-take, cut by scripts/slice.py.
// Shared material (whoosh, flap, paper, marker, clock, typewriter) is copied from earlier films.
export const SFX = [
  { id: 'bh_drone', dur: 10, prompt: 'Deep ominous cosmic drone of a black hole: sub-bass rumble slowly pulsing, dark and huge, no music' },
  { id: 'chalk', dur: 10, slice: true, prompt: 'Ten separate chalk strokes on a blackboard: quick lines, circles, arrows and scribbles, close up, silence between each' },
  { id: 'stretch', dur: 8, slice: true, prompt: 'Five separate sounds of thick rubber being stretched slowly, creaking elastic tension rising in pitch, silence between each' },
  { id: 'squish', dur: 6, slice: true, prompt: 'Five separate wet squishes of toothpaste being squeezed out of a tube, close, silence between each' },
  { id: 'slurp', dur: 3, prompt: 'A person slurping a long spaghetti noodle, short and funny, close' },
  { id: 'dissolve', dur: 4, prompt: 'Tiny glittering particles dissolving and scattering, granular crystalline shimmer fading away' },
  { id: 'tear', dur: 3, prompt: 'Thick rubber and fabric tearing apart violently, a stretched band snapping' },
  { id: 'tapestop', dur: 3, prompt: 'A sound slowing down to a complete stop like a tape stop, deep pitch drop, then silence' },
  { id: 'space', dur: 8, prompt: 'Calm deep space ambience, soft distant hum, very quiet, vast and still' },
  { id: 'warp', dur: 4, prompt: 'A fast cinematic whoosh rushing forward through space, rising, sci-fi transition' },
  { id: 'suck', dur: 3, prompt: 'A deep reverse suction whoosh pulling everything into a hole, sci-fi' },
];
