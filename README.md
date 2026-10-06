# Claude — Motion Design Reel

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
