// Narration for "Spaghetti" (spaghettification: tidal forces at a black hole). One continuous take, numbers spelled
// out. Facts: tidal acceleration ~ 2GML/r³ (feet vs head), stellar vs supermassive black holes, gravitational time
// dilation/redshift for a distant observer, ESO/ZTF tidal disruption event AT2019qiz (215 million light years).
export const VOICE_ID = 'utkd5fchbspYG3Ld0zt0'; // "Dan – Radio Host & Moderator" (eleven_v4, German; closest, driest read)
export const MODEL = 'eleven_v4';
export const LANGUAGE = 'de';
export const TEMPO = 1.2; // v4 ignores `speed`: the take is time-stretched evenly (scripts/voice.mjs)
export const ONE_TAKE = true;
export const SETTINGS = { stability: 0.5, similarity_boost: 0.8 };
export const LINES = [
  { id: 's01', text: 'Wenn du in ein Schwarzes Loch fällst, wirst du zu Spaghetti.' },
  { id: 's02', text: 'Kein Witz. Das heißt wirklich so: Spaghettifizierung.' },
  { id: 's03', text: 'Stell dir vor, du fällst mit den Füßen voraus.' },
  { id: 's04', text: 'Die Schwerkraft zieht an deinen Füßen stärker als an deinem Kopf.' },
  { id: 's05', text: 'Und je näher du kommst, desto größer wird der Unterschied.' },
  { id: 's06', text: 'Erst spürst du nur ein Ziehen. Dann wirst du in die Länge gezogen. Und von den Seiten zusammengedrückt.' },
  { id: 's07', text: 'Wie Zahnpasta aus der Tube.' },
  { id: 's08', text: 'Am Ende bist du nur noch ein Faden aus einzelnen Atomen.' },
  { id: 's09', text: 'Das Absurde: Je größer das Schwarze Loch, desto sanfter ist es.' },
  { id: 's10', text: 'Ein kleines zerreißt dich, lange bevor du es erreichst.' },
  { id: 's11', text: 'Bei einem riesigen fällst du über den Rand, ohne etwas zu merken.' },
  { id: 's12', text: 'Und von außen? Sieht dich niemand hineinfallen.' },
  { id: 's13', text: 'Für jeden Beobachter wirst du am Rand immer langsamer, immer röter, bis du verblasst.' },
  { id: 's14', text: 'Zweitausendneunzehn haben Astronomen genau das beobachtet: Ein Stern, zweihundertfünfzehn Millionen Lichtjahre entfernt, wurde zu Spaghetti.' },
];
