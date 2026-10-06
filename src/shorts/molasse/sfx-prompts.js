// Foley prompts for ElevenLabs Sound Effects (scripts/sfx.mjs). `slice: true` = one take holds several
// separate hits that scripts/slice.py cuts into round-robin variants (style guide §4: never one sample).
export const SFX = [
  // ---- paper & collage material (most frequent: needs many variants)
  { id: 'paper_slide', dur: 10, slice: true, prompt: 'Ten separate sounds of a single sheet of paper being slid quickly across a wooden table, each one different, short silence between each, close-up, dry studio recording' },
  { id: 'paper_toss', dur: 10, slice: true, prompt: 'Ten separate sounds of an old photograph being tossed and landing flat on a wooden desk, quick paper flap and soft slap, silence between each, close, dry' },
  { id: 'paper_tear', dur: 8, slice: true, prompt: 'Six separate short tears of thick old paper and thin cardboard, each different length, silence between each, close, dry' },
  { id: 'paper_crumple', dur: 6, slice: true, prompt: 'Four separate quick crumples of a newspaper page, silence between each, close' },
  { id: 'newspaper', dur: 6, slice: true, prompt: 'Five separate sounds of a large newspaper being unfolded and snapped open, silence between each, close' },
  { id: 'calendar', dur: 7, slice: true, prompt: 'Twelve fast separate tear-offs of paper calendar pages, crisp rip, silence between each' },
  // ---- hand layer
  { id: 'marker', dur: 7, slice: true, prompt: 'Eight separate felt marker strokes on paper: a circle, an underline, a check mark, a short scribble, an arrow, silence between each, close' },
  { id: 'highlighter', dur: 6, slice: true, prompt: 'Six separate broad highlighter pen swipes across newspaper print, soft squeaky felt, silence between each, close' },
  { id: 'brush', dur: 7, slice: true, prompt: 'Six separate broad wet paint brush strokes on rough wood, thick paint, silence between each, close' },
  { id: 'stamp', dur: 5, slice: true, prompt: 'Six separate rubber stamps hitting paper on a wooden desk, silence between each' },
  { id: 'typewriter', dur: 6, slice: true, prompt: 'Antique 1910s typewriter, sixteen separate individual key strikes with irregular short pauses, mechanical, close' },
  // ---- clock
  { id: 'tick', dur: 4, slice: true, prompt: 'Antique brass pocket watch ticking loudly, very close up, mechanical, each tick clearly separated' },
  { id: 'clock_wind', dur: 2, prompt: 'Pocket watch hands being spun quickly, fast ratcheting clicks of a winding crown' },
  // ---- steel & rivets
  { id: 'rivet', dur: 8, slice: true, prompt: 'Eight separate single steel rivets snapping off a pressurized iron tank, sharp metallic ping and ricochet, silence between each' },
  { id: 'clank', dur: 8, slice: true, prompt: 'Six separate heavy steel plates being set down and bolted, deep metallic clank with resonance, silence between each' },
  { id: 'groan', dur: 4, prompt: 'Huge riveted steel tank groaning and creaking under enormous pressure, deep metallic stress, ominous, low' },
  { id: 'lewis', dur: 2.5, prompt: 'World War One Lewis machine gun firing one short burst outdoors, rattling, slightly distant' },
  // ---- the disaster
  { id: 'burst', dur: 5, prompt: 'A massive riveted steel tank bursts open: tearing steel plates, a deep muffled boom, then a heavy rushing roar of thick liquid' },
  { id: 'wave', dur: 7, prompt: 'A giant wave of thick viscous syrup rolling through a city street, deep heavy sloshing roar, wood splintering, debris tumbling' },
  { id: 'houses', dur: 3.5, prompt: 'Wooden houses being crushed and collapsing, beams cracking and splintering, heavy crash' },
  { id: 'girder', dur: 3, prompt: 'Steel girders of an elevated railway bending and snapping, deep metallic creak then a loud crack' },
  { id: 'matches', dur: 5, slice: true, prompt: 'Six separate thin wooden matchsticks snapping in half, close, dry, silence between each' },
  // ---- molasses
  { id: 'gloop', dur: 10, slice: true, prompt: 'Ten separate thick viscous syrup gloops and slow sticky bubbles popping, close, wet, silence between each' },
  { id: 'drip', dur: 8, slice: true, prompt: 'Twelve separate single drops of thick syrup dripping onto a metal plate, sticky plop, silence between each' },
  { id: 'stuck', dur: 4, prompt: 'Someone struggling in deep thick mud, slow heavy sticky suction sounds, squelching, close' },
  { id: 'pour', dur: 4, prompt: 'Thick dark syrup slowly pouring into a large metal tank, heavy viscous glugging' },
  // ---- worlds / ambiences
  { id: 'street', dur: 9, prompt: '1910s city street ambience: horse hooves on cobblestones, wooden cart wheels, distant crowd chatter, a far ship horn' },
  { id: 'harbor', dur: 9, prompt: 'Old wooden harbor ambience, seagulls, water lapping against a pier, distant steamship horn' },
  { id: 'wind', dur: 8, prompt: 'Cold winter wind over an empty harbor, desolate, quiet, low' },
  { id: 'summer', dur: 8, prompt: 'Hot summer afternoon ambience in an old city, cicadas buzzing, distant children, warm and still' },
  { id: 'el_train', dur: 4, prompt: 'An early 1900s elevated train passing overhead on steel tracks, rumble, clatter and brake screech' },
  { id: 'crowd', dur: 4, prompt: 'Distant crowd of people shouting in panic in a street, muffled, far away' },
  { id: 'sniff', dur: 2, prompt: 'A person slowly inhaling through the nose, savoring a sweet smell, close, intimate' },
  { id: 'flash', dur: 2, prompt: 'Old 1910s magnesium flash powder camera: a whoomp flash and a wooden shutter click' },
  { id: 'heart', dur: 4, prompt: 'Slow deep heartbeat, muffled, cinematic, close' },
];
