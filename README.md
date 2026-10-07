# Claude — Motion Design

## Erklär-Shorts (9:16)

**Die Melasse-Flut** (`renders/molasse.mp4`) — 56 s, 1080×1920, 30 fps. Boston, 15. Januar 1919: eine 8 m hohe Welle aus
Sirup tötet 21 Menschen. Bewegte Collage aus gemeinfreiem Archivmaterial (Library of Congress, Wikimedia Commons),
echte Zeitungen vom Unglückstag mit wortgenauen Markierungen (ALTO-OCR), Melasse als einzige Farbe,
ElevenLabs-Stimme als eine durchgehende Aufnahme mit Wort-Zeitstempeln (Atempausen werden wie im Schnitt gekürzt), ElevenLabs-Foley in Round-Robin-Varianten, Score im Code.

```bash
ELEVENLABS_API_KEY=… node scripts/voice.mjs --film molasse   # Sprecher (eine Aufnahme) -> assets/molasse/vo/take.mp3 + voice.json
ELEVENLABS_API_KEY=… node scripts/sfx.mjs --film molasse     # Foley-Takes -> .scratch/molasse-sfx-raw
python3 scripts/slice.py molasse                              # Takes -> Varianten in assets/molasse/sfx
python3 scripts/molasse_cutouts.py && python3 scripts/molasse_plates.py   # Archiv -> Cut-outs/Plates (Quellen: .scratch)
node scripts/render.mjs --film molasse                        # -> renders/molasse.mp4
node scripts/render.mjs --film molasse --stills 0.5,24        # Standbilder
node scripts/render.mjs --film molasse --audio-only --solo sfx # Stem zur Mix-Analyse
```

**Vesna** (`renders/vesna.mp4`) — 61 s. 26. Januar 1972: Stewardess Vesna Vulović überlebt einen Sturz aus 10 160 m
ohne Fallschirm. Nur aus echten Fotos geschnittene Elemente (NASA-DC-9, das Auslieferungsfoto von YU-AHT, Wolken 1931/1940,
Highsmith-Schneewald, UPI-Fotos von ihr), kühles Monochrom auf Schwarz, Signalorange als einzige Farbe.
Sprecher: ElevenLabs `eleven_v4` („Ben“), eine Aufnahme, gleichmäßig gestreckt statt geschnitten. **Dieser Stil ist der Hausstil der Reihe (`CLAUDE.md`).**

```bash
python3 scripts/vesna_assets.py                               # Fotos -> Cut-outs/Plates (Quellen: .scratch/vesna)
ELEVENLABS_API_KEY=… node scripts/voice.mjs --film vesna      # Sprecher, eine Aufnahme
ELEVENLABS_API_KEY=… node scripts/sfx.mjs --film vesna && python3 scripts/slice.py vesna
node scripts/render.mjs --film vesna                          # -> renders/vesna.mp4
```

**Yamaguchi** (`renders/yamaguchi.mp4`) — 61 s. Tsutomu Yamaguchi überlebt Hiroshima (6. 8. 1945) und drei Tage später
Nagasaki. Hook: Silhouette vor der Hiroshima-Wolke → Zug → Fallblatt springt auf NAGASAKI → zweite Wolke. Akzent Karminrot.
Kein freies Foto von ihm → anonyme Silhouette aus einem Bahnsteigfoto von 1902 (gekennzeichnet in `SOURCES.md`).

```bash
python3 scripts/yamaguchi_assets.py && node scripts/render.mjs --film yamaguchi
```

**Spaghetti** (`renders/spaghetti.mp4`) — 53 s. Spaghettifizierung am Schwarzen Loch. Erstmals mit Kreide-Zeichenebene
(Schwarze Löcher, Raumzeit-Gitter, Pfeile — von Hand gezeichnet, „boilend“), 2.5D-Kamera (Fahrten, Rollen, Dolly-Zoom) und
dem echten NASA-Astronauten (McCandless 1984), der entlang einer Spirale zur Nudel gezogen wird. Sprecher: Dan (`eleven_v4`).

```bash
python3 scripts/spaghetti_assets.py && node scripts/render.mjs --film spaghetti
```

Regeln für die Reihe: `docs/STYLEGUIDE.md` §6–§10, Themen-Pool: `docs/THEMEN.md`, Quellen: `assets/<film>/SOURCES.md`.

---

Zwei Filme, komplett aus Code gebaut:

- **Flow** (`renders/claude-flow.mp4`) — 50 s One-Take ohne einen einzigen Schnitt, mit Voice-over (ElevenLabs).
- **Motion Reel** (`renders/claude-motion-reel.mp4`) — 56 s Kapitel-Showreel.

## Flow — One Take, 0 Cuts

Jedes Element wird zum nächsten, die Kamera bleibt ununterbrochen in Bewegung:

Punkt → Linie → Welle → Ring → das „O" von **FLOW** → Slice-&-Smear → fließende Linien mit „Bewegung." als Text-on-Path →
die Linien wickeln sich zu Ringen → 3D-Tunnel (Ringe morphen auf dem Beat, Wörter fliegen durch die Kamera) → Licht →
3D-Punktfeld (2.560 Punkte, Kick-Wellen) → Punkte formen „TAKT." → Spirale → Tropfen → Liquid-Metaballs (SVG-Goo) →
„Flow." aus der Flüssigkeit gestanzt → drei Tropfen erstarren zu Karten (Easing-Kurve, Variable Font, Wireframe-Würfel) →
Flip, Stack, die oberste Karte fliegt in die Linse → der Punkt wird zum Ball der Marke → „Claude." → alles faltet sich zurück in den ersten Punkt.

**Voice-over:** ElevenLabs (`eleven_multilingual_v2`, Stimme `SiMvlSW9cKKHDYT4BzOp`) *mit Wort-Zeitstempeln*:
jedes Wort auf dem Screen erscheint exakt in dem Moment, in dem es gesprochen wird; Musik und Drums ducken unter der Stimme.
Neu generieren (Key wird nie gespeichert):

```bash
ELEVENLABS_API_KEY=… node scripts/voice.mjs          # -> assets/vo/*.mp3 + src/flow/voice.json
node scripts/render.mjs --film flow                   # -> renders/claude-flow.mp4
npm run preview  # dann /src/index.html?preview&film=flow
```

---

# Motion Reel

Ein 56-Sekunden-Showreel (1920×1080, 60 fps, Stereo-Sound), gebaut wie eine Bewerbung als Motion Designer.
**Jedes Frame und jeder Ton ist Code:** keine Keyframes von Hand, keine Samples, keine Loops, keine Stock-Assets.

▶ **Video:** [`renders/claude-motion-reel.mp4`](renders/claude-motion-reel.mp4) — H.264 1080p60 + AAC, 2-Pass-Delivery-Encode (~8,5 Mbit/s) des CRF-15-Masters, den `npm run render` erzeugt.

## Was im Reel steckt

| # | Zeit | Kapitel | Techniken |
|---|------|---------|-----------|
| 01 | 0:00 | Timing & Spacing | Physikalisch korrekter Bouncing Ball (Bounces exakt auf dem Beat), Squash & Stretch entlang der Geschwindigkeit, Onion Skins, Animator-Notes, Value-Graph mit Bezier-Handles, Anticipation |
| 02 | 0:04 | Kinetic Typography | Slam-in mit Camera Shake, maskierte Line-Reveals, Variable-Font-Gewichtswelle (100–900), Letter-Hops mit Squash, Step-Marquee, Zoom durch die Punze des „O" in die nächste Szene |
| 03 | 0:12 | Shape Layers & Morphing | Polar-Morphing (Kreis → Squircle → Dreieck → Stern → Blume), Repeater, Trim Paths, Bursts, Ripple-Stagger-Grid, Phyllotaxis-Choreografie (goldener Winkel) |
| 04 | 0:18 | Partikel & Generative Systeme | 4.600 Partikel, deterministische 240-Hz-Simulation, Curl-Noise-Flowfield, Partikel formen Text, Galaxie-Vortex, Kollaps & Flash |
| 05 | 0:24 | 3D & Kamera | Eigener 3D-Renderer: Perspektive, Painter's Algorithm, Lambert-Shading, Fog, Rim-Light; kick-reaktives Säulenfeld, Kamerafahrt, Whip-Pan |
| 06 | 0:30 | Datenvisualisierung | Echte Odometer-Zähler, Spring-Bar-Chart, Donut mit Trim Paths, die Energie-Kurve des Reels selbst mit Live-Playhead |
| 07 | 0:36 | UI / UX Motion | Phone-Prototyp: Stagger-Listen, Checkbox-Pops, Spring-Toggle, Slider, Cursor-Klick mit Ripple, Button → Spinner → Check-Morph, Konfetti, Notification-Stack, State Machine, Live-Spring-Kurve |
| 08 | 0:42 | Stil-Bandbreite | Ein Wort, acht Design-Sprachen (Swiss, Editorial, Brutal, Retro, Terminal, Outline, Soft, Glitch), Schnitte auf 8tel und 16tel, Mosaik |
| 09 | 0:46 | Logo & Abspann | Logo-Reveal (der Ball aus Szene 01 wird Teil der Marke), Light Sweep, Wordmark-Reveal, Endcard, der Ball landet als Schlusspunkt |

Übergänge: Ball-Expansion, Portal-Zoom durchs „O", Iris, Flash, Whip-Pan mit 14-fach Motion Blur, Card-Flick, RGB-Split-Slice-Glitch.

**Finishing:** echter Motion Blur (180°-Shutter, 4–14 Subframes pro Frame, akkumuliert), Film Grain auf Luma, Vignette, BT.709.

## Sound

Komplett synthetisiert mit der Web Audio API (`OfflineAudioContext`):

- **Musik:** 120 BPM, A-Moll (Am – F – C – G). Kick, Clap, Hats, Shaker, Snare-Rolls, Toms, Crashes, Bass mit Filter-Envelope, Supersaw-Pads, Chord-Stabs, Pluck-Arps über Ping-Pong-Delay, FM-Glocken. Sidechain-Ducking auf jeder Kick, Faltungshall mit generierter Impulsantwort, Glue-Kompressor + Limiter, Loudness-Normalisierung auf −14 LUFS.
- **Sound Design:** ~40 Effekt-Typen (Bonks, Whooshes, Risers, Impacts, Sub-Drops, UI-Clicks, Glitches, Zähler-Ticks …), jeder Cue ist in der Szene definiert, die ihn auslöst — Bild und Ton bleiben dadurch framegenau synchron.

## Selbst rendern

Voraussetzungen: Node 18+, ffmpeg, ein Chromium für Playwright.

```bash
npm install
npm run render                          # komplettes Reel -> renders/claude-motion-reel.mp4
node scripts/render.mjs --from 24 --to 30   # nur ein Ausschnitt
node scripts/render.mjs --stills 4.2,12.5   # PNG-Stills (mit Motion Blur) -> out/stills
node scripts/render.mjs --audio-only        # nur der Soundtrack -> out/audio.wav
node scripts/render.mjs --audio-only --solo sfx   # einzelner Stem (drums|music|sfx) zur Mix-Analyse
npm run preview                         # Live-Vorschau im Browser (Leertaste = Play/Pause)
```

## Aufbau

```
src/
  engine/core.js     Easing (inkl. Cubic-Bezier), Springs, Keyframes, Simplex-Noise, Farben
  engine/draw.js     Typo-Layout pro Glyphe, Masken, Shape-Morphing, Trim Paths, Bursts
  scenes/s01…s09     Die neun Kapitel – jede Szene ist eine reine Funktion der Zeit
  transitions.js     Szenenübergänge
  hud.js             Editorial-HUD mit Timecode und animierten Kapitel-Labels
  reel.js            Komposition, Motion-Blur-Sampling, Cue-Sheet
  audio/             Synth-Kit, Score/Arrangement, Mixer
  main.js            Frame-Pipeline im Browser (Akkumulation, Grain, YUV) + Preview-Player
scripts/render.mjs   Headless-Chromium → WebSocket → ffmpeg, parallele Worker, Audio-Mux
```
