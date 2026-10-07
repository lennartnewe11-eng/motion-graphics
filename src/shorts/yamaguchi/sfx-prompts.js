// Foley prompts for ElevenLabs Sound Effects (scripts/sfx.mjs); `slice: true` = multi-take, cut by scripts/slice.py.
// Shared material (flaps, typewriter, stamp, paper, marker, heart, whoosh, wind) is copied from assets/vesna/sfx.
export const SFX = [
  { id: 'blast_far', dur: 8, prompt: 'A massive atomic explosion heard from three kilometres away: an enormous deep boom, rolling thunder, a shockwave of wind and debris, long rumbling decay, no music' },
  { id: 'rumble', dur: 6, prompt: 'Deep low sub-bass rumble rising, ominous, the ground trembling, no music' },
  { id: 'tinnitus', dur: 5, prompt: 'High pitched ringing in the ears right after an explosion, tinnitus, the world muffled, slowly fading' },
  { id: 'train_steam', dur: 8, prompt: 'A 1940s Japanese steam locomotive departing a station: chuffing, hissing steam, one whistle, rails clacking' },
  { id: 'train_pass', dur: 4, prompt: 'A steam train rushing past at full speed very close, roaring, clattering wheels, doppler' },
  { id: 'shelter', dur: 8, prompt: 'Night in a crowded underground air raid shelter, distant crackling fires outside, very quiet, dripping water, no voices' },
  { id: 'office', dur: 8, prompt: 'A 1940s office in summer: ceiling fan, a distant typewriter, papers, a wall clock ticking, quiet' },
  { id: 'cicadas', dur: 8, prompt: 'Hot Japanese summer morning, loud cicadas, still air, a city waking in the distance' },
  { id: 'glass', dur: 3, prompt: 'Office windows shattering inward from a blast wave, glass and debris crashing' },
  { id: 'ash_wind', dur: 8, prompt: 'Hot wind over a burnt city, crackling embers, distant fires, desolate, no music' },
  { id: 'bandage', dur: 6, slice: true, prompt: 'Five separate sounds of cloth bandages being torn and wrapped, silence between each, close' },
  { id: 'clock', dur: 4, slice: true, prompt: 'Antique wall clock ticking loudly, close up, mechanical, each tick clearly separated' },
];
