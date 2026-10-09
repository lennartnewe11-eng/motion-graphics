# Claude — Motion Design

Drei Filme, komplett aus Code gebaut:

- **Pinterest — „Finde Ideen. Mach was draus.“** (`renders/pinterest-spot.mp4`) — 36 s Werbespot, 16:9, 1080p60, Buntstift-Welt + 3D, H.264 2-Pass (~13 Mbit/s) + AAC.

- **Flow** (`renders/claude-flow.mp4`) — 50 s One-Take ohne einen einzigen Schnitt, mit Voice-over (ElevenLabs).
- **Motion Reel** (`renders/claude-motion-reel.mp4`) — 56 s Kapitel-Showreel.

## Pinterest — Spec-Spot (36 s, 1920×1080, 60 fps)

Inoffizieller Spec-/Portfolio-Spot (keine Beauftragung durch Pinterest). Thema: **Scrollen → Tippen → Speichern → Machen.**
Weißer Hintergrund, Pinterest-Bildsprache (Masonry-Feed, runde Pins, Pinterest-Rot `#E60023`, „Speichern“-Button, Boards),
alle Menschen und Pin-Motive als **Buntstiftzeichnungen** und dazwischen glänzende **3D-Formen**. Kein Stock-Material: jedes Bild, jede Figur und jeder Ton ist Code.

| Zeit | Akt | Was passiert |
|------|-----|--------------|
| 0:00 | Der erste Strich | 3D-Buntstifte fliegen ein, der rote zeichnet die Kontur einer Hand, ein zweiter schraffiert sie aus – die Zeichnung erwacht („Boiling“) |
| 0:02 | Ein Tipp | Die Hand tippt auf das weiße Blatt: der Feed poppt in Ringen aus dem Tipp (auf 16tel quantisiert, jeder Ring ein Ton) |
| 0:04 | Scrollen | Wisch-Gesten mit Trägheit, Jelly-Scroll (jede Spalte leicht verzögert), echter Motion Blur; acht Spalten richten sich exakt zu **S-C-R-O-L-L-E-N** aus |
| 0:06 | Entdecken | 3D-Kamerafahrt: die Pinnwand kippt zum Boden, schwingt, schwebende 3D-Formen mit weichen Schatten |
| 0:11 | Fangen & Tippen | Der Finger stoppt den Feed (Tape-Stop im Sound), tippt den Pasta-Pin an, der zur Detailseite aufgeht |
| 0:13 | Speichern | „Speichern“ → „Gespeichert“, 3D-Konfetti, der Pin fliegt ins Board; Wischen zum nächsten Pin, viermal im Rhythmus |
| 0:18 | Board | Das Board „Sonntagsideen“ öffnet sich, der Pasta-Pin wird zum Portal |
| 0:20 | Machen | Ein durchgehendes Skizzenbuch-Panorama mit Whip-Pans: Kochen, Töpfern, Gipfel, Tanzen – animierte Buntstift-Figuren mit handschriftlichen Notizen |
| 0:29 | Zurück aufs Board | Die Kamera zieht auf, die vier Szenen werden zu Pins |
| 0:30 | Logo | Die Karten stapeln sich, eine 3D-Pinnadel pinnt sie fest, ihr Kopf wird zum Logo; „Finde Ideen. Mach was draus.“, CTA „Jetzt entdecken“ wird angetippt |

**Technik**

- `src/pinterest/pencil.js` — Buntstift-Renderer: Scanline-Schraffur mit kurzen, gebogenen Strichen (ausgefranste Kanten wie echt),
  Kreuzschraffur für Schatten (Form-Licht statt Planar-Gradient), abgesetzte Konturen mit Druck-Taper, periodische Papierstruktur
  frisst Pigment weg, Multiply-Komposit; deterministisches „Boiling“ mit 8 fps; Zeichnen-/Reveal-Animation.
- `src/pinterest/figures.js` — gezeichnete Hand + 2D-Character-Rig (Becken → Wirbelsäule → Kopf, 2-Bone-IK für Arme/Beine,
  Gesichter mit Blinzeln/Lächeln/Mund, Frisuren, Kleidung, Accessoires).
- `src/pinterest/pins.js` — 26 prozedurale Pin-Illustrationen als Karten-Texturen (Pasta, Keramik, Berge, Café, Tarte, Camping, …).
- `src/pinterest/gl.js` — three.js-Ebene mit pixelgenauer Kamera (z = 0 ↔ Frame), Matcaps, die einmalig aus einer
  Clear-Coat-PBR-Kugel gebacken werden (PBR-Look für den Preis eines Texture-Lookups), 3D-Buntstift, Pinnadel, Herz, Stern, Knoten …
- `src/pinterest/wall.js` — Masonry-Feed in 3D, Scroll-Physik in geschlossener Form (Flicks + Reibung + „Fangen“), Buchstaben-Pins.
- `feed.js` / `make.js` / `end.js` — die drei Teile; `score.js` — die Musik.

**Sound** (Web Audio, `OfflineAudioContext`): 120 BPM, F-Dur (F – Dm – B♭ – C). Intro mit Stift-Kratz-Groove und Marimba-Motiv,
House-Groove beim Scrollen, Tape-Stop unter dem Finger, Half-Time-Bounce beim Speichern (jedes Speichern ein höherer Akkord),
Chorus mit Formant-„Vocal Chops“, Cowbell beim Tanzen, Drop-out vor dem Logo, Logo-Akkord und die Marimba-Antwort im Outro.
Über 50 eigene Effekte: Graphit-Striche, Schraffur, Fingertipps auf Glas, haptische Scroll-Ticks (aus der Scroll-Simulation
berechnet), gestimmte Pin-Pops, Whooshes, Konfetti, Töpferscheibe, Brutzeln, Blubbern, Wind, Vögel, Jubel, Plattennadel, Pinnadel-„Thunk“ …

```bash
node scripts/render.mjs --film pinterest --out renders/pinterest-spot.mp4    # final
node scripts/render.mjs --film pinterest --fps 30 --fast --out out/draft.mp4 # schneller Entwurf ohne Motion Blur
npm run preview   # dann /src/index.html?preview&film=pinterest
```

---

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
