# CLAUDE.md — Motion Graphics (Erklär-Shorts)

Code-generierte Videos: Canvas 2D in Headless-Chromium → ffmpeg. Alles ist eine Funktion der Zeit.
Ausführliche Regeln: `docs/STYLEGUIDE.md` (§6–§9), Themen: `docs/THEMEN.md`.

## Hausstil der Shorts-Reihe = „Nacht“ (Referenz: `src/shorts/vesna/`, `renders/vesna.mp4`)

Vom Nutzer als Standard bestätigt („visuell extrem stark, halte den Stil so fest“). Jeder neue Short übernimmt ihn,
außer der Nutzer verlangt ausdrücklich etwas anderes.

- **Format:** 9:16, 1080×1920, 30 fps, 45–61 s, Raster 128,57 BPM (Beat = 14 Frames). Text in y ≈ 220–1650.
- **Hook:** Frame 1 ist schon das absurde/dramatische Bild in Bewegung; der erste Satz benennt es in < 2 s.
  Keine Musik unter dem Hook — nur Welt-Sound. Danach Stille als Ereignis (Schwarz nach dem Höhepunkt).
- **Material:** Collage **nur aus echten, aus Fotos geschnittenen Elementen** (gemeinfrei: LoC, Wikimedia Commons PD,
  NASA, NOAA). Quellen in `assets/<film>/SOURCES.md`. Freistellen mit rembg `birefnet-general` (ein Prozess pro Cut-out),
  bei Weiß-auf-Weiß Handpolygon als Union. Fremde Markierungen wegretuschieren, wenn das Objekt ein anderes darstellt.
- **Farbe:** kühles Monochrom (Tinte `#090C11` → Stahl `#5C6570` → Schnee `#E8EBEE`), alle Fotos per `grade()` auf
  dieselbe Kurve; **genau eine Akzentfarbe** pro Film (Vesna: Signalorange `#FF541A`) — nur für das, was die
  Geschichte trägt (Zahl, Markierung, Bruch, Feuer, die eine Überlebende). Rote Logos im Foto werden zur Akzentfarbe.
- **Wenig Weiß:** dunkle Bühnen; **Dokumente/Fotos sind der Hintergrund** (Beleg-Foto mit Markierung, Durchschlag auf
  Kohlepapier-Blau, Zitat über dem Originalfoto). Wortstreifen sind dunkle gerissene Papiere; helle nur als Akzent.
- **Bewegung:** Kamera mit Mikro-Drift, Shake mit Abklingen, Parallax-Ebenen (Wolkenfelder mit Tiefe und freier Gasse
  fürs Motiv), Collage als Handlung (Objekt wird aus dem Foto geschnitten und hebt ab, Loch bleibt).
- **Typografie spannend:** pro Kernwort eine Geste, die seine Bedeutung *tut* — Fallblatt-Anzeige, fallende Buchstaben,
  Doppeldruck mit Versatz, zerquetscht, gerissen, Echo-Konturen, radiert, durchgestrichen, Zahl als Objekt/Zähler.
  Schriftmix: Inter Tight 900 · Bodoni Moda Italic · League Gothic · JetBrains Mono · Anton · Special Elite.
  Sonderzeichen (ć, Č …) brauchen die latin-ext-Fonts in `src/index.html`.
- **Ende:** Loop — die letzte halbe Sekunde ist der Moment *vor* Frame 1.

## Code-Bausteine

- Hausstil-Bibliothek: `src/shorts/lib/night.js` (Nacht-Hintergrund, Foto-Wolkenfelder, Fallblatt `flap`, Zähler `drum`,
  `word`/`tag`/`fallingWord`, `marker`, `flash`). Jeder Film setzt `V.accent` in seinem `common.js`.
  Vorlagen: `src/shorts/vesna/` (Orange), `src/shorts/yamaguchi/` (Karmin; Silhouette, Pilzwolke, Durchschlag, Stempel).
- Bildaufbereitung: `scripts/vesna_assets.py` ist importierbar (`grade`, `cutout`, `plate`, `cloud`), siehe `yamaguchi_assets.py`.
- Ohne freies Foto einer Person: anonyme Tinten-Silhouette aus einem PD-Foto, in `SOURCES.md` als Platzhalter kennzeichnen.

## Stimme & Ton

- **ElevenLabs `eleven_v4`**, Stimme **Ben – Effortless and Casual** (`aTTiK3YzK3dXETpuDE2h`, für v4/Deutsch verifiziert),
  `language_code: 'de'`, stability 0.5 · similarity 0.8. Zahlen ausgeschrieben.
- **Eine durchgehende Aufnahme** (`ONE_TAKE`). v4 ignoriert `speed` → die ganze Aufnahme wird gleichmäßig per
  Rubberband gestreckt (`TEMPO` in `voice-lines.js`, ≈ 1.2). **Nie innerhalb der Performance schneiden** (das klang
  „unflüssig“); Stille nur zwischen Zeilen am leisesten Punkt (`cut`) einfügen, wo das Bild Luft braucht.
- Neue Stimmen erst mit kurzen Proben vergleichen (Pausen im Satz, Satzpausen, Tonhöhenumfang); Kontingent ist knapp.
- Foley: ElevenLabs SFX als Mehrfach-Takes → `scripts/slice.py`; jedes Geräusch gehört zu einem Bildereignis.
  Mix messen (Stems `--solo`, Sprachband 300 Hz–4 kHz): Stimme ≥ 6 dB über SFX; Wind/Rauschen tiefpassen. −14 LUFS.

## Arbeitsweise

- Stills prüfen, bevor voll gerendert wird: `node scripts/render.mjs --film <f> --stills 1,2.5,…` (→ `out/stills`).
- Voll-Render ~20 min (4 Worker) im Hintergrund; Auslieferung: Master → `-crf 20 -maxrate 8.5M` (`renders/<f>.mp4`),
  Vorschau 720p < 30 MB für den Chat.
- **ElevenLabs-Key nie ins Repo** — nur per Umgebungsvariable `ELEVENLABS_API_KEY` übergeben.
- Rohdownloads in `.scratch/` (nicht versioniert); Python, das Downloads liest, mit `python3 -I`.
