// Scene order of "Vesna" (absolute times from timeline.js; hard cuts between scenes).
import { CUT } from './timeline.js';
import { V, R, night, word } from './common.js';
import * as A from './scenes-a.js';
import * as B from './scenes-b.js';
import * as C from './scenes-c.js';

const ORDER = ['fall', 'black', 'flight', 'board', 'roster', 'bomb', 'breakup', 'count', 'wedged', 'slope', 'honke', 'injuries', 'coma', 'record', 'quote', 'end'];
const MODS = { ...A, ...B, ...C };
const todo = (id) => (ctx, t) => { night(ctx); word(ctx, t, id, 540, 960, 0, { role: R.G, size: 120, color: V.snow }); };
export const SCENES = ORDER.slice(0, -1).map((id, i) => ({
  id, start: CUT[id], end: CUT[ORDER[i + 1]],
  draw: MODS[id] || todo(id),
  blur: MODS[id + 'Blur'],
}));
SCENES[SCENES.length - 1].end = Infinity;
