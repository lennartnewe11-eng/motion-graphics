# Motion Design

# Assecor — Imagefilm

▶ **Video:** [`renders/assecor-imagefilm.mp4`](renders/assecor-imagefilm.mp4) — 64 s, 1920×1080, 25 fps, Stereo, analoger CRT-Look.

Ein Imagefilm, der die Leistungen der [Assecor GmbH](https://www.assecor.de) erklärt: KI-Beratung & -Integration,
Softwareentwicklung & -modernisierung, digitale Transformation — von der Idee bis zur Umsetzung, aus einer Hand.

**Storytelling** nach der Referenz „storytelling referenz Video“: Wort-für-Wort-Typografie synchron zur Stimme,
harte Schnitte auf gesprochene Wörter, Wechsel zwischen spannender Typo (Merriweather + Roboto, riesige Condensed-Wörter),
echten Fotos (S/W wie auf assecor.de, Polaroids mit Reißkante, Foto in Buchstaben, Mosaik), Icons und einer
handgezeichneten Ebene (Marker-Kreise, Pfeile, Durchstreichungen, Handschrift, Strichzeichnungen mit „Boil“).

**Visuelle Sprache von assecor.de:** Navy `#071225`, Mint `#00CDA5`, Blau `#5564D7`, Koralle `#FF6464`, Gelb `#FFFF58`
und ihre hellen Töne; die Pixel-Block-Icons der drei Leistungen (Block für Block animiert, Original-Vektoren),
die weißen Linien-Icons (Chip, Würfel, Handschlag …, als Draw-on), die Stage-Blöcke des Website-Heros, das Logo
(Buchstabe für Buchstabe maskiert) und der Website-Claim „Wir bringen Technologie dorthin, wo sie Wirkung entfaltet.“

**Analoger Look** nach „analog filter referenz Video“ (`scripts/analog.mjs`, ffmpeg): Aperture-Grille-Phosphorstreifen,
Halation/Bloom, Soft-Focus, horizontaler Farb-Smear und RGB-Versatz, Röhrenwölbung, Vignette, angehobene Schwarzwerte,
Flackern, Rauschen und Phosphor-Nachleuchten; dazu Staub/Haare und CRT-Ein-/Ausschalten im Bild.

**Ton:** Stimme ElevenLabs (`SiMvlSW9cKKHDYT4BzOp`, „Lola“, mit Wort-Zeitstempeln), Musik ElevenLabs Music
(`music_v2_5`, Composition Plan: Intro → Groove → Build → Drop → Outro, 120 BPM — jeder Schnitt sitzt im Beat-Raster),
17 Foley-Sounds per ElevenLabs Sound Effects (Papier reißen, Marker, Stempel, Polaroid, CRT …) plus synthetisierte
UI-Sounds aus dem Web-Audio-Kit; Musik duckt unter der Stimme, Master auf −14 LUFS.

| Zeit | Inhalt |
|------|--------|
| 0:00 | CRT schaltet ein, ein Pixel blinkt („Bereit?“), zerfällt in Blöcke → „Digitalisierung“ |
| 0:04 | „die WELT“ — Luftbild in riesigen Buchstaben, Orbit-Linie |
| 0:05 | „Aber / nicht / jede Technologie“ — Icon-Orbit, „jede“ wird durchgestrichen |
| 0:08 | Kick setzt ein: „Ihr Geschäft.“ — Foto-Slam |
| 0:09 | „Deshalb fragen wir zuerst: Was bringt echten Mehrwert?“ — Pfeile, Marker, Kreis |
| 0:13 | Die drei Leistungs-Icons bauen sich auf, Zoom in das KI-Icon |
| 0:16 | KI — Prozesse automatisieren (Serverraum + Prozess-Skizze), Kosten senken (Chart) |
| 0:20 | Software — skaliert, läuft stabil (Assecor-Foto + Status-Chip), wächst mit |
| 0:24 | Transformation — Teams (Marker-Kreise um Köpfe), mitnehmen |
| 0:27 | Kamerafahrt über ein Skizzenblatt: Idee → Strategie → Entwicklung → „UMGESETZT“ |
| 0:30 | „Alles aus einer Hand.“ — Handschlag-Icon zeichnet sich |
| 0:32 | 20+ Jahre (Zählwerk), 250+ Projekte (250 Blöcke), 120+ Expert:innen (Fotomosaik) |
| 0:41 | Mittelstand & Großunternehmen (Strichzeichnung), Standorte, Kund:innen im Achtel-Takt |
| 0:48 | Drop: „Skalierbar. Wirtschaftlich. Verantwortungsvoll.“ |
| 0:53 | Claim im Website-Hero-Layout, Blöcke „entfalten“ sich auf dem Schlusshit |
| 0:57 | Logo, „Lassen Sie uns gemeinsam starten.“, assecor.de, CRT schaltet aus |

```bash
ELEVENLABS_API_KEY=… node scripts/voice.mjs --film assecor   # Stimme -> assets/assecor/vo + src/assecor/voice.json
ELEVENLABS_API_KEY=… node scripts/music-assecor.mjs           # Score  -> assets/assecor/music/score.mp3
ELEVENLABS_API_KEY=… node scripts/sfx-assecor.mjs             # Foley  -> assets/assecor/sfx/*.mp3
node scripts/render.mjs --film assecor                        # sauberer Master -> out/assecor-master.mp4
node scripts/analog.mjs                                       # CRT-Look -> renders/assecor-imagefilm.mp4
npm run preview  # dann /src/index.html?preview&film=assecor
```

Fotos: S/W-Bearbeitungen von Pexels-Fotos (Pexels-Lizenz) und Bildern von assecor.de. Code: `src/assecor/`
(`timeline.js` Schnittraster, `lib.js` Design-System, `scenes-a…d.js` Szenen, `brand-data.js` Logo/Icon-Vektoren).

---

# Claude — Motion Design

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
