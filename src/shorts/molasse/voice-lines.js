// Narration for "Die Melasse-Flut" (Boston, 15. Januar 1919).
// `text` is what ElevenLabs speaks (numbers spelled out); the scenes map word indices to on-screen typography.
// Start times are not fixed here: timeline.js places every line on the beat grid from the generated durations.
export const VOICE_ID = '2GbzpA60AS7Sdvj7zrZh'; // "Daniel – German Narrator" (ElevenLabs Voice Library)
export const MODEL = 'eleven_multilingual_v2';
export const SETTINGS = { stability: 0.42, similarity_boost: 0.8, style: 0.32, use_speaker_boost: true, speed: 1.12 };
export const LINES = [
  { id: 'm01', text: 'Diese Welle hat einundzwanzig Menschen getötet.' },
  { id: 'm02', text: 'Und sie bestand aus Sirup.' },
  { id: 'm03', text: 'Boston. Fünfzehnter Januar neunzehnhundertneunzehn. Kurz nach Mittag.' },
  { id: 'm04', text: 'Am Hafen steht ein Stahltank, so hoch wie ein fünfstöckiges Haus.' },
  { id: 'm05', text: 'Darin: fast neun Millionen Liter Melasse. Zäher, schwarzer Zuckersirup.' },
  { id: 'm06', text: 'Dann hören Anwohner ein Rattern. Wie Maschinengewehrfeuer.' },
  { id: 'm07', text: 'Es sind die Nieten. Sie platzen aus dem Stahl.' },
  { id: 'm08', text: 'Eine acht Meter hohe Welle rast mit sechsundfünfzig Stundenkilometern durch die Straßen.' },
  { id: 'm09', text: 'Sie zerdrückt Häuser und knickt die Hochbahn wie Streichhölzer.' },
  { id: 'm10', text: 'Doch das Tödliche kommt erst danach.' },
  { id: 'm11', text: 'Es ist Januar. Die Melasse kühlt ab und wird mit jeder Minute zäher.' },
  { id: 'm12', text: 'Wer feststeckt, kommt nicht mehr frei.' },
  { id: 'm13', text: 'Unter den Toten: zwei Kinder. Beide zehn Jahre alt.' },
  { id: 'm14', text: 'Und der Tank? Der hatte von Anfang an geleckt.' },
  { id: 'm15', text: 'Die Firma ließ ihn einfach braun anstreichen.' },
  { id: 'm16', text: 'Der Hafen blieb bis zum Sommer braun.' },
  { id: 'm17', text: 'Und noch Jahrzehnte später roch es dort an heißen Tagen … süß.' },
];
