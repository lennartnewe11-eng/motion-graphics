// Scene order of "Yamaguchi" (absolute times from timeline.js; hard cuts between scenes).
import { CUT } from './timeline.js';
import { V, R, night, word } from './common.js';
import * as A from './scenes-a.js';
import * as B from './scenes-b.js';
import * as C from './scenes-c.js';

const ORDER = ['hook', 'trip', 'last', 'flash', 'burn', 'shelter', 'office', 'boss', 'crazy', 'white', 'again', 'recog', 'end93', 'end'];
const MODS = { ...A, ...B, ...C };
// scene functions that would shadow a helper of the same name carry a suffix
for (const id of ['flash', 'shelter', 'white']) if (MODS[id + 'Scene']) { MODS[id] = MODS[id + 'Scene']; MODS[id + 'Blur'] = MODS[id + 'SceneBlur']; }
const todo = (id) => (ctx, t) => { night(ctx); word(ctx, t, id, 540, 960, 0, { role: R.G, size: 120, color: V.snow }); };
export const SCENES = ORDER.slice(0, -1).map((id, i) => ({
  id, start: CUT[id], end: CUT[ORDER[i + 1]],
  draw: MODS[id] || todo(id),
  blur: MODS[id + 'Blur'],
}));
SCENES[SCENES.length - 1].end = Infinity;
