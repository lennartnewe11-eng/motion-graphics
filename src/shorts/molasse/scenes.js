// Scene order of "Die Melasse-Flut" (absolute times from timeline.js; hard cuts between scenes).
import { SCENES_A } from './scenes-a.js';
import { SCENES_B } from './scenes-b.js';
import { SCENES_C } from './scenes-c.js';
import { bg, P } from '../lib/collage.js';
import { CUT } from './timeline.js';
import { row } from '../lib/type.js';

const todo = (id, start, end) => ({ id, start, end, draw: (ctx, t) => { bg(ctx); row(ctx, t, [{ text: id, role: 'G', size: 120 }], 540, 960); } });
const ORDER = ['hook', 'sirup', 'boston', 'tank', 'inside', 'rattle', 'rivets', 'burst', 'wave', 'crush', 'deadly', 'cold', 'stuck', 'kids', 'leak', 'paint', 'harbor', 'smell', 'end'];
const have = new Map([...SCENES_A, ...SCENES_B, ...SCENES_C].map((s) => [s.id, s]));
export const SCENES = ORDER.slice(0, -1).map((id, i) => have.get(id) || todo(id, CUT[id], CUT[ORDER[i + 1]]));
SCENES[SCENES.length - 1].end = Infinity;
