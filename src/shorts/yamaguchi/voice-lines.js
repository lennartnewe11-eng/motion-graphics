// Narration for "Yamaguchi" (Tsutomu Yamaguchi, 1916–2010: Hiroshima 6 Aug 1945, Nagasaki 9 Aug 1945).
// One continuous take; numbers spelled out. Facts: Wikipedia "Tsutomu Yamaguchi", The Guardian / The Independent
// obituaries (Jan 2010) — see assets/yamaguchi/SOURCES.md.
export const VOICE_ID = 'aTTiK3YzK3dXETpuDE2h'; // "Ben – Effortless and Casual" (house narrator, eleven_v4)
export const MODEL = 'eleven_v4';
export const LANGUAGE = 'de';
export const TEMPO = 1.22; // v4 ignores `speed`: the take is time-stretched evenly (scripts/voice.mjs)
export const ONE_TAKE = true;
export const SETTINGS = { stability: 0.5, similarity_boost: 0.8 };
export const LINES = [
  { id: 'y01', text: 'Dieser Mann hat die Atombombe von Hiroshima überlebt.' },
  { id: 'y02', text: 'Dann fuhr er nach Hause.' },
  { id: 'y03', text: 'Nach Nagasaki.' },
  { id: 'y04', text: 'Sechster August neunzehnhundertfünfundvierzig. Tsutomu Yamaguchi, neunundzwanzig, Schiffsingenieur bei Mitsubishi, ist auf Dienstreise in Hiroshima.' },
  { id: 'y05', text: 'Es ist sein letzter Tag. Acht Uhr fünfzehn.' },
  { id: 'y06', text: 'Drei Kilometer von ihm entfernt: der Blitz.' },
  { id: 'y07', text: 'Seine linke Körperhälfte verbrennt. Beide Trommelfelle platzen. Er ist vorübergehend blind.' },
  { id: 'y08', text: 'Er verbringt die Nacht in einem Luftschutzkeller. Am nächsten Morgen nimmt er den Zug. Nach Hause.' },
  { id: 'y09', text: 'Neunter August. Mit Verbänden geht er zur Arbeit, ins Büro der Werft in Nagasaki.' },
  { id: 'y10', text: 'Er erzählt seinem Chef: Eine einzige Bombe hat eine ganze Stadt zerstört.' },
  { id: 'y11', text: 'Der Chef hält ihn für verrückt.' },
  { id: 'y12', text: 'Elf Uhr zwei. Das Büro wird weiß.' },
  { id: 'y13', text: 'Wieder drei Kilometer. Wieder der Blitz. Und wieder überlebt er.' },
  { id: 'y14', text: 'Erst zweitausendneun erkennt Japan ihn offiziell an. Als einzigen Menschen, der beide Bomben überlebt hat.' },
  { id: 'y15', text: 'Er wurde dreiundneunzig Jahre alt. Und kämpfte bis zuletzt gegen Atomwaffen.' },
];
