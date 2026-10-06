// Foley prompts for ElevenLabs Sound Effects (scripts/sfx.mjs). `slice: true` = one take holds several
// separate hits that scripts/slice.py cuts into round-robin variants (style guide §4: never one sample).
export const SFX = [
  // ---- the fall
  { id: 'wind_alt', dur: 7, prompt: 'Violent high-altitude wind roaring past at extreme speed, a falling aircraft, howling turbulent rush of air, intense, no music' },
  { id: 'dive', dur: 5, prompt: 'A 1970s jet airliner in a steep uncontrolled dive, turbine scream rising in pitch, wind howling over the fuselage, metal shaking' },
  { id: 'whoosh', dur: 9, slice: true, prompt: 'Eight separate fast deep whooshes of air rushing past the microphone, like falling through clouds, silence between each' },
  { id: 'impact_snow', dur: 3, prompt: 'A heavy aircraft fuselage crashes into a snowy pine forest: trees snapping, a deep thud into deep snow, metal crunch, then sudden silence' },
  { id: 'snow_burst', dur: 4, prompt: 'A huge cloud of powder snow thrown into the air after an impact, soft rushing hiss, snow falling back on branches' },
  // ---- flight
  { id: 'cabin', dur: 8, prompt: 'Inside a 1970s jet airliner cabin in cruise flight: steady low engine drone, soft air hiss, calm' },
  { id: 'jet_pass', dur: 5, prompt: 'A 1970s twin engine jet airliner passing overhead at altitude, rising and fading turbine roar' },
  { id: 'flap', dur: 10, slice: true, prompt: 'Split-flap departure board at an airport: ten separate short bursts of rapid mechanical clacking flaps, silence between each' },
  { id: 'typewriter', dur: 6, slice: true, prompt: '1970s office typewriter, sixteen separate individual key strikes with irregular short pauses, mechanical, close' },
  { id: 'stamp', dur: 5, slice: true, prompt: 'Six separate rubber stamps hitting paper on a wooden desk, silence between each' },
  { id: 'paper', dur: 10, slice: true, prompt: 'Ten separate sounds of an old photograph being tossed and landing flat on a desk, quick paper flap and soft slap, silence between each, close, dry' },
  { id: 'marker', dur: 7, slice: true, prompt: 'Eight separate felt marker strokes on paper: a circle, an underline, a check mark, a short scribble, an arrow, silence between each, close' },
  { id: 'scissors', dur: 5, slice: true, prompt: 'Four separate sounds of sharp scissors cutting through a thick photograph, crisp snips, silence between each, close' },
  // ---- the bomb
  { id: 'explosion', dur: 4, prompt: 'A bomb explodes inside an airliner at high altitude: a sharp violent blast, metal tearing apart, then a roaring rush of wind' },
  { id: 'metal_tear', dur: 8, slice: true, prompt: 'Five separate sounds of aircraft aluminium skin tearing and ripping apart, screeching metal, silence between each' },
  { id: 'debris', dur: 4, prompt: 'Small metal debris fragments clattering and tumbling through rushing wind' },
  { id: 'fire', dur: 3, prompt: 'A large fireball igniting, deep whoomp and roaring flames' },
  { id: 'switch', dur: 8, slice: true, prompt: 'Twelve separate soft clicks of old light switches turning off, small relay clicks, silence between each' },
  // ---- the forest, the hospital
  { id: 'forest', dur: 9, prompt: 'Silent snowy pine forest in winter, very quiet cold wind in the trees, a distant crow, desolate' },
  { id: 'cry', dur: 3, prompt: 'A woman crying out for help, very distant, echoing faintly through a snowy forest, far away' },
  { id: 'crack', dur: 6, slice: true, prompt: 'Six separate dry sharp cracks of thick frozen branches snapping, close, silence between each' },
  { id: 'xray', dur: 3, prompt: 'An old x-ray light box flickering on, fluorescent tube ping and electrical hum' },
  { id: 'beep', dur: 8, slice: true, prompt: 'Eight separate single beeps of a 1970s hospital heart monitor, clean electronic tone, silence between each' },
  { id: 'hospital', dur: 8, prompt: '1970s hospital room ambience: quiet ventilation hum, a distant corridor, very still' },
  { id: 'heart', dur: 4, prompt: 'Slow deep heartbeat, muffled, cinematic, close' },
  // ---- the record
  { id: 'flashbulb', dur: 7, slice: true, prompt: 'Six separate vintage press camera flashbulbs popping with shutter clicks, silence between each' },
  { id: 'applause', dur: 4, prompt: 'Warm audience applause in a hall, medium crowd, short' },
];
