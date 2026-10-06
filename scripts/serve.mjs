// Live preview: open the printed URL in a browser (space = play/pause, click bar to seek).
import { startServer } from './server.mjs';
const { port } = await startServer(Number(process.env.PORT || 5173));
console.log(`Preview: http://localhost:${port}/src/index.html?preview`);
