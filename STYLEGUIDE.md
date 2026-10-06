# Stil-Erkenntnisse — Motion-Design-Projekte

Gesammelte Regeln und Beobachtungen aus den Referenzen und dem Feedback zu den bisherigen Filmen.
Gilt für **alle zukünftigen Projekte** in diesem Repo, sofern das Briefing nichts anderes sagt.

---

## 0. Feste Regeln aus dem Feedback

1. **Keine kontextgebenden Stichpunkte in den Ecken.** Keine Eck-Labels, Kapitelnummern („03 — Die Frage“),
   Firmennamen-Zeilen, Koordinaten, Fadenkreuze/Eckwinkel-Rahmen oder Laufzeilen am Bildrand.
   Das Bild trägt nur, was gerade erzählt wird. (Im Assecor-Film war das `frameMarks()` + `label()` — künftig weglassen.)
2. **Analog-/CRT-Look nur als Hauch.** Wenn ein Retro-Filter gewünscht ist, sehr schwach einsetzen
   (`scripts/analog.mjs --strength 0.12` war die freigegebene Stärke; 0.3 war noch zu viel, 1.0 viel zu viel).
   Farben und Typo müssen klar und markengetreu bleiben.
3. **Typo ist der Star.** Jede Zeile Voice-over bekommt eine eigene typografische Idee — nie nur „Text einblenden“.

---

## 1. Typografie-Referenz („Typografie referenz Video“, *focus: — kinetic typography by noel*)

18 s · 702×494 · 30 fps · Musik ≈ **129 BPM** (Beat ≈ 0,465 s). Kinetische Lyric-Typografie.

### 1.1 Grundhaltung

- **Fast monochrom:** Hintergrund warmes Off-White **`#F6F4F5`**, Schrift fast-schwarz (~`#1A1A1A`).
  Farbe kommt *nur* über Objekte: UI-Elemente (macOS-Ordnerblau, blaue Textauswahl), Emojis, 3D-Objekte in Graustufen.
- **Ein Wort, eine Idee, Bildmitte.** Meist steht genau ein Wort/eine kurze Phrase zentriert, klein bis mittelgroß
  (≈ 8–15 % der Bildhöhe), mit viel Leerraum. Dazwischen **Ausbrüche, die das ganze Bild füllen**
  (BABY-Riesenbuchstaben, Textringe, Hangul-Kacheln) — der Kontrast klein ↔ formatfüllend ist das Hauptspannungsmittel.
- **Nichts steht still.** Jedes Element driftet, dreht oder skaliert minimal weiter (permanentes Mikro-Leben,
  ca. 0,5–2 % Skalierung bzw. 1–3° Rotation pro Sekunde). Auch „ruhige“ Wörter atmen.
- **Keine Deko-Rahmen, keine Labels.** Kein UI-Rahmen, keine Ecken-Infos — nur Typo, Objekt, Leerraum.

### 1.2 Schriften & Mischung

| Rolle | Charakter | Einsatz |
|---|---|---|
| Hauptschrift | Neo-Grotesk, **Bold/Black, sehr enges Tracking (≈ −3 bis −5 %)** (Helvetica-Now-/Neue-Haas-artig) | „Anything“, „Any“, „view“, „focus:“ |
| Kontrastschrift | **Kursive Serif mit hohem Strichkontrast** (Editorial-/Didone-Italic) | „i“, „n’t“, „on“ — Funktionswörter, Pronomen |
| Display-Akzent | Grotesk **Black Oblique** | „BUT“ — Wörter mit Wucht |
| Störschriften | **Pixel-/Bitmap-Font**, Slab, schmale Grotesk, Rundschrift | einzelne Buchstaben in „anything“, „focus“ |
| UI-Schrift | System-Sans (SF/Inter-artig), klein | Tooltips, Namens-Chips, Typing-Cursor |

- **Gemischte Wörter:** Ein Wort wird aus Buchstaben *verschiedener* Schriften gebaut („any thing“: Serif-Italic +
  Pixel + Slab + Grotesk, Buchstaben auf unterschiedlichen Grundlinien, versetzt und gestapelt).
- **Wort-Paare im Kontrast:** Kursiv-Serif + fette Grotesk direkt nebeneinander („*on* **anyone**“) — der Abstand
  zwischen beiden schließt sich in wenigen Frames.
- **Font-Flicker:** Einzelne Buchstaben wechseln 1–3 Frames lang durch mehrere Schriftschnitte, bevor sie in der
  Hauptschrift einrasten (Endtitel „f o c u s :“ — erst Serif-f, Pixel-c, Serif-o … dann sauber Grotesk).

### 1.3 Buchstaben werden zu Dingen (und umgekehrt)

- **Objekt ersetzt Glyphe:** „i can’t“ → das „ca“ ist eine **3D-Konservendose**; „Any{♞}“ → Schachpferd in
  geschweiften Klammern statt „thing“; Tastatur-Keycaps „m“ „y“ statt „my“; 👊-Emoji als Schlag auf „BUT“.
- **Glyphe als Badge:** Buchstaben in **schwarzen Kreisen** (B A B Y O U T als Kugelhaufen), „ON“ im Kreis,
  „+“-Button-Kreis am „c“ — Typo wird zu UI-Elementen.
- **Glyphe als Piktogramm:** das „f“ von focus als **Pixel-Cursor-Hand**, darüber eine **Lupe**, die
  wie ein Pendel einschwingt.
- **Text als Fläche/Muster:** „I cannot focus.“ läuft in **konzentrischen Ringen** um ein 3D-Objekt, die Ringe
  drehen gegenläufig und füllen das Bild komplett schwarz-weiß.
- **Positiv/Negativ-Kacheln:** Hangul-Silben in schwarzen und weißen Blöcken, die sich überlappen, das Bild füllen
  und wieder auf eine kleine Gruppe zusammenschnurren.

### 1.4 UI als typografisches Material

- **Textauswahl:** Wort „focus“ mit blauem Selektions-Highlight und Anfasser-Punkten (wie auf macOS/iOS).
- **Typing:** „on|“ → „on…|“ mit blinkendem Cursor; das Wort zoomt dabei von klein auf Lesegröße (≈ 6 Frames).
- **Ordner & Zähler-Badges:** blaue macOS-Ordner und Thumbnails mit hochzählenden Notification-Badges schweben
  im Raum (leichter 3D-Parallax), Ordner „regnen“ als Übergang.
- **Chips & Tooltips:** dunkelgraue Namens-Chips mit Pfeilspitze poppen **einer pro Frame** um ein Wort herum auf,
  bis das Wort darunter verschwindet; danach skaliert der ganze Cluster in 3 Frames weg.
- **Sprechblase:** kleine graue Chat-Bubble mit Text als ruhiger Gegenpol im Ordner-Chaos.

### 1.5 Bewegungs-Vokabular (Frame-genau beobachtet, 30 fps)

| Technik | Ablauf | Dauer |
|---|---|---|
| **Pop-on** | Wort/Objekt erscheint ohne Fade in voller Größe auf dem Beat | 0 Frames (Schnitt) |
| **Scale-Pop mit Nachschwingen** | Objekt aus ~10 % auf ~110 %, Rotation schwingt aus | 3–6 Frames |
| **Tinten-Morph** | Pinselstrich verformt sich zur Glyphe („i“) | 2 Frames |
| **Letter-by-Letter mit Kerning-Kollaps** | jeder neue Buchstabe erscheint mit Lücke („Anyt h“), die im nächsten Frame zuschnappt | 1 Buchstabe/Frame |
| **Einrasten** | verstreute Buchstaben auf verschiedenen Grundlinien („f o c u s“ wild) springen in die Zeile | 2–3 Frames |
| **Slice-Glitch** | Wort zerfällt in horizontale Streifen mit Versatz, neues Wort entsteht aus Streifen („Anything“ → „BUT“) | 2–4 Frames rein/raus |
| **Overshoot-Glyphe** | ein Buchstabe kommt riesig ins Bild und schrumpft auf Wortgröße („c“ in focus) | 4–6 Frames |
| **Pendel** | Lupe fällt ein und schwingt 2× aus | ~10 Frames |
| **Zusammenziehen** | ganzes Motiv (Hangul, Chips, „i can’t“) skaliert in wenigen Frames auf Punktgröße → Schnitt | 3–5 Frames |
| **Formatfüllende Rotation** | Riesenbuchstaben (BABY) drehen/skalieren langsam weiter, Abgang = Wegfliegen in 2 Frames | — |
| **Flash-Karten** | einzelnes Zeichen (`*`, `?`, `@`) auf schwarzem oder hellem Grund, Hintergrund invertiert | 2–3 Frames je Karte |
| **Smear-Formen** | Buchstaben ziehen 1 Frame lang als schräge schwarze Bewegungs-Keile („s“, „5“) | 1 Frame |

### 1.6 Rhythmus

- **Jede Zustandsänderung liegt auf Beat (≈ 0,465 s) oder Achtel (≈ 0,23 s)**, Flash-Karten auf Sechzehnteln.
  Beispiele: „n’t“ auf 0,6 s, „focus“-Auswahl auf 1,07 s, „on|“ auf 1,53 s, „anything“ auf 2,0 s, „BUT“ auf 6,15 s,
  👊 auf 6,62 s, Schachpferd auf 7,06 s.
- **Halbsekunden-Takt** als Grundpuls: Ein Motiv lebt selten länger als 2 Beats; formatfüllende Ausbrüche
  dürfen 2–4 Beats stehen.
- **Echte Schnitte statt Überblendungen.** Übergänge sind entweder harte Schnitte, Glitch-Slices, Zusammenziehen
  auf einen Punkt oder ein 1-Frame-Flash.
- **Loop-Struktur:** Das Video endet, wie es beginnt (der Tinten-Morph zum „i“ kehrt bei 11,1 s wieder) — Wiedererkennung
  durch Wiederholung eines Motivs.

### 1.7 Übertragung auf Markenfilme

- Hintergrund = hellster Markenton (bei Assecor z. B. Weiß/`#F6F4F5` statt Navy), Schrift = dunkelster Markenton;
  Markenfarben **sparsam** als „Objektfarbe“ (Badges, Highlight, Auswahl-Markierung) statt als Flächen.
- Markenschriften als Haupt-/Kontrastpaar nutzen (bei Assecor: Roboto Black eng ↔ Merriweather Italic),
  plus **eine** Störschrift (Pixel-Font passt zu Pixel-Icons).
- Marken-Icons als Glyphen-Ersatz einsetzen (z. B. Pixel-Block statt „i“-Punkt, Icon statt Wortteil).
- UI-Elemente aus dem Produktkontext des Kunden (Textauswahl, Cursor, Chips, Ordner, Benachrichtigungen) als Typo-Material.

### 1.8 Umsetzung im Code (`src/engine`, Canvas)

- **Kerning-Kollaps:** `glyphs()` liefert Glyph-Positionen; neuen Buchstaben mit `+0.4em` Versatz zeichnen und per
  `ease.outExpo` über 1–2 Frames auf die Sollposition ziehen.
- **Font-Flicker:** pro Buchstabe eine Liste von Fonts, Index = `floor(t*30) % n` bis zum Einrasten.
- **Slice-Glitch:** `vhsTear()` aus `src/assecor/lib.js` (horizontale Streifen per `drawImage` versetzen) mit
  Seed pro Frame; Stärke 1→0 über 3 Frames.
- **Textringe:** Glyphen entlang Kreisbahn mit `rotate(angle)` pro Glyphe; Ringe mit wachsendem Radius und
  wechselnder Drehrichtung; Tracking so wählen, dass der Satz den Umfang exakt füllt.
- **Objekt statt Glyphe:** Bitmap/3D-Render als Bild in die Glyphen-Lücke setzen (Breite = Glyphenbreite).
- **Permanente Mikro-Drift:** jedem Element `noise2(t*0.3, seed)` auf Position/Rotation geben.
- Bei 30 fps Bewegungsunschärfe sparsam (2–3 Samples) — die Referenz wirkt hart und knackig.

---

## 2. Storytelling-Referenz („storytelling referenz Video“, Edge *Going Net Zero*)

88,9 s · 25 fps. (Die zuerst hochgeladene „Typografie“-Datei war ein Duplikat dieser Referenz.)

- **Satz baut sich Wort für Wort zum Voice-over auf**, jedes Wort erscheint im Moment des Sprechens
  (harter Pop-on, kein Fade); der Satz bleibt stehen, bis er komplett ist.
- **Mischsatz:** fette Grotesk + kursive Serif im selben Satz („**Edge** *is* ⚙ *working on something* **big**“),
  Betonungswort fett.
- **Wort-Karten:** Einzelwörter auf wechselnden Pastellflächen, Schnitt pro Wort („At / Edge / decided / focus / things …“).
- **Riesen-Wörter mit Bild:** formatfüllende Condensed-Black-Wörter („CARBON“, „HUGE“, „IMAGINE“), Fotos oder
  Illustrationen stehen *in* oder *vor* den Buchstaben; ein Wort tauscht im gleichen Layout gegen das nächste
  („CARBON“ → „THE“ → „WORLD“).
- **Echte Fotos:** Polaroids, gerissene Fotos, Collage aus Ausschnitten (Mund-Collage), Luftbilder, Footage.
- **Handgezeichnete Ebene:** Pfeile (auch viele, die auf ein Wort zeigen), Unterstreichungen, Durchstreichen
  („2050“), Handschrift-Notizen („Ready?“, „That’s right“, „But now!“), Strichzeichnungen (Stadt), Gravur-Figuren.
- **Zahlen als Event:** Zähler in dunkler Box („39 %“), Sieben-Segment-Ziffern auf Schwarz.
- **Pacing:** ruhiger als die Typo-Referenz — Wort-Takt der Stimme, Bildwechsel alle 0,5–2 s.
- **Achtung:** Die Referenz nutzt Eck-Labels und Fadenkreuze — **diese übernehmen wir nicht mehr** (Regel 0.1).

## 3. Analog-Filter-Referenz („analog filter referenz Video“)

24,9 s · 18 fps. Röhrenmonitor-Look: vertikale RGB-Aperture-Grille, Halation/Bloom, Farbsäume, weiche Schärfe,
Wölbung, Vignette, Rauschen, Nachleuchten. Umgesetzt in `scripts/analog.mjs`, Stärke über `--strength`
(→ Regel 0.2: nur ~0.12).

## 4. Allgemeine Arbeitsweise (bewährt)

- Voice-over zuerst (ElevenLabs mit Wort-Zeitstempeln), Musik mit Composition Plan auf festem BPM, dann jede
  Schnitt-/Wortzeit ins Beat-Raster legen (`timeline.js`).
- Foley (Papier, Marker, Stempel, Klicks) + synthetische UI-Sounds pro Szene als Cue-Liste neben dem Bild definieren.
- Markenanalyse von der Website: Farben aus CSS, Schriften aus `@font-face`, Logo/Icons als Original-Vektoren übernehmen.
- Vor dem Final-Render Standbilder pro Szene prüfen; den Master sauber rendern und Looks (Filter) als eigenen Pass darüber legen.
