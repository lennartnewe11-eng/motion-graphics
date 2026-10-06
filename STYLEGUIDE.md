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

### 2.1 Grundprinzip

- **Satz baut sich Wort für Wort zum Voice-over auf**, jedes Wort erscheint im Moment des Sprechens
  (harter Pop-on, kein Fade); der Satz bleibt stehen, bis er komplett ist, dann harter Schnitt.
- **Mischsatz:** fette Grotesk + kursive Serif im selben Satz („**Edge** *is* ⚙ *working on something* **big**“).
  Regel: **Inhaltswort fett/Grotesk, Funktionswort kursiv/Serif** („*we need* to change *our entire* **way of thinking**“).
- **Pacing:** Wort-Takt der Stimme; Bildwechsel alle 0,5–2 s. Zwischen dichten Szenen immer wieder **Wort-Karten**
  (ein Wort auf Pastellfläche, Schnitt pro Wort: „At / Edge / decided / focus / things / that / can / do“) als Atempause.
- **Achtung:** Die Referenz nutzt Eck-Labels und Fadenkreuze — **diese übernehmen wir nicht mehr** (Regel 0.1).

### 2.2 Animierte Avatare / Figuren

Figuren sind in der Referenz **Mitspieler der Typo**, nie Deko. Beobachtete Typen:

| Typ | Beispiel (Zeit) | Wie animiert |
|---|---|---|
| **Linien-Figur** (monoline, schwarz, ~2 px, wie Icon-Stil) | Mann mit Tasche (3–7 s) | **Gehzyklus** (ca. 8 Phasen, 12,5 fps → bewusst „auf Zweien“), läuft *vor/hinter* Buchstaben her („HUGE“) und **wandert durch den Schnitt** in die nächste Szene (gleiche Bildposition) — er verbindet die Szenen |
| **Flache Charakter-Illustrationen** (Gouache-/Flat-Look, unterschiedliche Menschen) | Reihe „ALL OF US“ (7,5–9 s) | stehen in einer Reihe **vor einem Riesenwort**, das zwischen ihnen durchscheint; Animation nur **Idle-Loops**: Kopf neigen, Gewicht verlagern, Kind zupft am Arm, Kamera fährt langsam seitlich (Parallax: Figuren schneller als Wort). Neue Figuren schieben sich von rechts in die Reihe, sobald „all of us“ gesprochen wird |
| **Gravur-/Kupferstich-Figur** (Vintage-Ausschnitt) | Herr mit Zylinder „Walk the walk“ (19,5–21 s), Mann mit Globus „accounting for everything“ (77–79 s) | **Cut-out-Animation**: Körperteile als Einzelteile (Beine, Arm mit Stock) im Schritt-Zyklus, Körper fährt leicht auf/ab; Text links/rechts **um die Figur herum** gesetzt |
| **Silhouetten-Figur** (dunkle Fläche, wenige Linien) | kopfloser Torso mit Wasserglas (74–77 s) | fast still; nur Hand/Glas bewegt sich leicht — die **Ruhe der Figur** lässt den sich aufbauenden Satz wirken |
| **Foto-Mensch** | Kind im Astronautenhelm, Schwimmerin von oben | echtes Foto/Footage als Bildträger; Text daneben/darauf, Linien-Figur läuft davor |

Regeln für eigene Avatare:
- **Eine Figurenwelt pro Szene**, Stil passend zur Aussage (Linie = Konzept/Prozess, Flat-Charaktere = Menschen/Vielfalt,
  Gravur = Tradition/Ironie, Silhouette = Ernst/Nachdenken).
- **Figur reagiert aufs Wort:** „walk“ → sie geht; „all of us“ → Figuren treten hinzu; „big“ → sie wirkt winzig neben dem Wort;
  „change“ → sie hebt etwas hoch. Nie eine Figur, die nur herumsteht, während etwas anderes gesagt wird.
- **Animation auf Zweien/Dreien** (8–12 Zeichnungen/s) statt butterweicher 60-fps-Interpolation — wirkt handgemacht.
- **Idle-Loop immer an** (atmen, Gewicht, Blinzeln), auch wenn die Figur „steht“.
- **Figuren als Bindeglied:** dieselbe Figur läuft über einen Schnitt weiter oder wechselt den Stil in der neuen Szene.
- Im Canvas-Code: Figur als Gelenk-Rig aus Teilen (`translate/rotate` je Glied, Winkel aus einer Pose-Tabelle pro Phase),
  Linien-Figuren mit `stroke()` aus `lib.js` (Boil an), Idle via `noise2(t*0.5, seed)` auf Kopf-/Rumpfwinkel.

### 2.3 Formen und Typografie folgen dem Gesagten

Die Referenz übersetzt fast jedes Schlüsselwort in eine **Bedeutungsgeste** — Form, Schnitt, Position oder Bewegung
des Wortes *zeigen*, was es sagt:

| Gesagt | Typografische / formale Antwort |
|---|---|
| „big“, „HUGE“ | Wort wächst von Satzgröße auf **formatfüllende Condensed Black**; „big“ bekommt einen Pfeil, der es anschiebt |
| „working“ | Zahnrad-Icon **ersetzt das Leerzeichen** und dreht sich |
| „planet“ | Wort wird **durchgestrichen** (Handstrich) — Bruch in der Aussage |
| „all of us“ | Riesenwort hinter einer Reihe Menschen; „all of us“ handschriftlich unterstrichen |
| „not just talking about“ | Wörter stapeln sich **eingerückt** mit senkrechter Linie links (Zitat-Geste) |
| „the time to talk“ | Collage aus **Mündern** (Foto-Schnipsel), Wörter erscheinen daneben |
| „Walk the walk“ | Wörter **links und rechts der gehenden Figur**, „Walk“ fett, „the walk“ leicht |
| „decided / focus“ | Wechsel der Wortbreite/Größe: „*focus*“ größer, kursiv, mittig |
| „CARBON“ | Buchstaben werden von **Bläschen/Partikeln gefüllt**, die sich auflösen → Wort wird massiv schwarz |
| „emissions worldwide“ | Riesenwort tauscht **im selben Layout** gegen das nächste (CARBON → IN → THE → WORLD), Buchstaben schnappen einzeln um; kleiner Globus-Badge bleibt als Konstante, „Worldwide“ als Handschrift-Anmerkung |
| „energy into improving“ | **Dutzende Handpfeile** zeigen aus allen Richtungen auf das Wort, immer mehr pro Wort — Energie wird gebündelt; bei „just this“ bleibt **ein** Pfeil |
| „IMAGINE … improved“ | Buchstaben fehlen und tauchen auf („IM GI E“ → „IMAGINE“), **„NEW“-Sticker** klebt sich auf; Wort zerfällt, nur „E“ bleibt; Wechsel zu kursiv „*Improved*“ mit Sticker |
| „our future“ | Wörter über **Luftbild einer Stadt**, mit Speed-Lines hineingezogen |
| „We’re NOT just …“ | „NOT“ als **verdrehte, gequetschte Riesenbuchstaben** in Weiß, eingeschoben zwischen kleine Wörter |
| „We do this already“ | **Handschwung** (dicker weißer Pinselstrich) wischt über eine Karte, während die Wörter erscheinen |
| „NO“ | Wort auf Schwarz in einem **Auswahlrahmen mit Anfassern** (Design-Tool-Geste), der Rahmen skaliert mit — Wort wird „angefasst“ und größer |
| „Going the extra mile“ | Wort **dehnt sich wörtlich**: „MIL———E“, eine Linie zieht „mile“ in die Länge |
| „change“ | Wort **wechselt beim Erscheinen die Schrift** (Serif-Italic → Grotesk Bold), Buchstaben einzeln — es ändert sich, während es gesagt wird |
| „offsetting emissions“ | Wörter über Langzeitbelichtung (Lichtspuren), kursiv/fett gemischt |
| „accounting for the embodied carbon in all materials“ | **Materialfotos** (Erde, Stahl, Holz, Maschinen) poppen rund um den Satz auf, je ein Bild pro Substantiv |
| „Not in 2050“ | Kreis im Zentrum eines Musters aus **Halbkreisen** (rhythmisch pulsierend), „2050“ wird **durchgestrichen**, „But now!“ in Handschrift darunter |
| „Absolutely“, „For sure“, „That’s right“, „Are you ready?“ | **Handschrift-Antworten** einer zweiten Stimme — kommentieren den Satz, oft eingekreist |
| Zahlen („22 % → 39 %“) | Zahl in **schwarzer Box**, zählt hoch, „Staggering“ handschriftlich daneben |

Daraus abgeleitete Regeln:
1. **Pro Satz mindestens ein Wort mit Bedeutungsgeste** (dehnen, durchstreichen, ersetzen, füllen, wachsen, fallen, drehen).
2. **Wörtlich nehmen:** Verben werden zu Bewegungen (gehen, wachsen, wechseln, ziehen), Substantive zu Bildern/Icons,
   Adjektive zu Formeigenschaften (groß/fett, neu/Sticker, schnell/Speed-Lines).
3. **Form-Wechsel = Bedeutungs-Wechsel:** Schriftwechsel im Wort nur dort, wo sich inhaltlich etwas ändert („change“).
4. **Layout behalten, Inhalt tauschen:** Bei Aufzählungen bleibt das Raster gleich, nur das Wort springt (CARBON → WORLD).
5. **Zweite Stimme in Handschrift:** kurze Kommentare (max. 2–3 Wörter) als Reaktion auf die Aussage.
6. **Formen als Rhythmus-Träger:** Muster (Halbkreise, Pfeilfelder, Bläschen) pulsieren im Takt und werden mit dem Satz
   dichter oder lichter.

### 2.4 Weitere Mittel

- **Riesen-Wörter mit Bild:** formatfüllende Condensed-Black-Wörter („CARBON“, „HUGE“, „IMAGINE“), Fotos oder
  Illustrationen stehen *in* oder *vor* den Buchstaben.
- **Echte Fotos:** Polaroids, gerissene Fotos (Vulkan reißt entzwei → Szene kippt), Collage aus Ausschnitten,
  Luftbilder, Footage; Fotos fliegen in Raster mit kleiner Bildunterschrift.
- **Übergänge:** Papier zerknüllen (Foto knüllt sich zum Ball), Pinselstrich übermalt das Bild, Riss, harte Schnitte.
- **Handgezeichnete Ebene:** Pfeile, Unterstreichungen, Durchstreichen, Handschrift-Notizen, Strichzeichnungen (Stadt), Gravur-Figuren.
- **Zahlen als Event:** Zähler in dunkler Box, Sieben-Segment-Ziffern auf Schwarz.

## 3. Analog-Filter-Referenz („analog filter referenz Video“)

24,9 s · 18 fps. Röhrenmonitor-Look: vertikale RGB-Aperture-Grille, Halation/Bloom, Farbsäume, weiche Schärfe,
Wölbung, Vignette, Rauschen, Nachleuchten. Umgesetzt in `scripts/analog.mjs`, Stärke über `--strength`
(→ Regel 0.2: nur ~0.12).

## 4. Sounddesign — Vielfalt statt Wiederholung

### 4.1 Problem im Assecor-Film

Die Effekte wirkten repetitiv: `scribble` (11×), `blocks` (11×) und `underline` (10×) kamen jeweils aus **genau einem Sample**,
nur die Tonhöhe wurde leicht verschoben. Das Ohr erkennt dasselbe Geräusch nach dem 3. Mal.

### 4.2 Regeln gegen Wiederholung

1. **Jedes Geräusch gibt es in 4–6 Varianten** (Round-Robin): eigene Aufnahmen/Generierungen, nicht nur Pitch-Shift.
   Beim Abspielen zufällig (seeded) wählen, nie dieselbe Variante zweimal hintereinander.
2. **Pro Abspielung variieren:** Tonhöhe ±1–3 Halbtöne, Lautstärke ±2 dB, Start-Offset 0–30 ms, Pan je nach Bildposition,
   Hall-Anteil je nach Raum (Papier = trocken, Riesenwort = großer Raum).
3. **Max. 3× dasselbe Sample pro 10 s.** Ab dem 4. Ereignis gleicher Art auf eine Nachbar-Kategorie ausweichen
   (z. B. statt Marker-Kritzeln → Bleistift → Kreide → Filzstift auf Karton).
4. **Bildgröße = Klanggröße:** kleines Wort → kleiner, trockener Klick; formatfüllendes Wort → Body + Sub + Hall.
5. **Schichten statt Einzelsounds:** Akzente aus 2–3 Lagen bauen (Transient + Körper + Luft/Tail), die Lagen getrennt variieren.
6. **Stille ist ein Effekt:** vor großen Momenten 2–4 Beats ohne SFX (nur Musik oder Atem), dann der Hit.
7. **Material des Bildes hören:** Papier klingt nach Papier, Pixel nach Digital, Foto nach Foto — Geräusch immer vom
   sichtbaren Material ableiten, nicht aus einer Standardliste.
8. **Quantisieren auf den Beat**, aber 10–20 ms vor dem Bild-Ereignis starten (Transienten wirken sonst verspätet).

### 4.3 Sound-Bibliothek (zu generieren, z. B. ElevenLabs Sound Effects, je 4–6 Varianten)

**Papier & Analog-Collage**
- Papier reißen: langsam, schnell, nur Ecke, dicker Karton, Zeitungspapier, Seidenpapier
- Papier knüllen: kurz, lang, Ball wird geworfen, Ball landet
- Blatt umblättern, Blatt gleitet über Tisch, Stapel abgelegt, Blatt in Mappe geschoben
- Schere schneidet (1 Schnitt / mehrere), Cutter-Klinge über Papier
- Klebeband abreißen und aufkleben, Masking-Tape, Sticker abziehen + aufdrücken („NEW“-Badge)
- Polaroid: Auswurf, Schütteln, auf Tisch fallen, Foto in Rahmen stecken
- Büroklammer, Heftklammer (Tacker), Reißzwecke in Kork, Gummiband schnalzt
- Stempel: Gummi auf Papier, Stempelkissen, Prägestempel (Metall)
- Briefumschlag öffnen, Karteikarte ziehen

**Schreib- und Zeichengeräusche (Hand-Ebene)**
- Filzstift: Strich kurz/lang, Kreis, Unterstreichen, Haken, Kreuz, Durchstreichen, Pfeil (2 Striche)
- Bleistift (weich/hart), Kugelschreiber klicken + schreiben, Füller kratzen
- Kreide an Tafel, Marker auf Whiteboard (quietschend), Edding auf Karton
- Pinselstrich nass (für Übermal-Wischer), Sprühdose kurz, Textmarker (breit, weich)
- Radiergummi, Spitzer, Lineal ablegen

**Typo-Bewegungen (abstrakt, für Wörter)**
- Wort-Pop: weich (Lippen-Pop), holzig (Woodblock), gläsern (Glas-Tick), gummiartig
- Buchstaben-Ticks: Schreibmaschine, Letterpress-Satz (Bleilettern), Scrabble-Steine, Fliesen-Klick
- Wort dehnt sich: Gummiband-Stretch, Tape-Stop/Tape-Start, Akkordeon
- Wort schrumpft/zieht ein: Reverse-Swell, Luft ansaugen, Maßband einrollen
- Wort fällt/landet: Holzklotz auf Tisch, Buch fällt, Sandsack, kleines Metall-Klonk
- Wort zerfällt/glitcht: Datenkorruption, Bitcrush-Stotter, Kassette verheddert, Funkstörung
- Schriftwechsel im Wort: Diaprojektor-Klack, Kamera-Blende, Lichtschalter, Karten-Shuffle
- Durchstreichen: Reißverschluss kurz, Marker schnell, Messer über Papier

**UI & Digital (bei Tech-Kunden)**
- Tastatur: einzelner mechanischer Anschlag, Leertaste, Enter, schnelles Tippen, Laptop-Tastatur (flach)
- Maus: Klick, Doppelklick, Scrollrad-Ratschen, Trackpad-Tap
- Textauswahl/Drag (leises Gleiten), Ordner öffnen, Datei in Ordner fallen lassen, Papierkorb
- Notification-Varianten (mind. 3 unterschiedliche, nie Systemtöne kopieren), Chat-Bubble-Pop, Nachricht gesendet
- Toggle an/aus, Slider, Haken-Bestätigung, Fehler-Ton (weich), Ladebalken-Ticks
- Zähler: Odometer-Rollen, Zahlenrad, Kassenzähler, Sieben-Segment-Piepen
- Server/Daten: Lüfter-Swell, Festplatten-Seek, Modem-Fragment (sehr kurz), Datenpakete (Granular-Blips)
- Pixel-Blöcke: 8-Bit-Plink (3 Tonhöhen), Lego-Klick, Tetris-artiges Einrasten (eigenständig klingend)

**Übergänge & Bewegung**
- Whoosh: Luft kurz, Stoff-Wedeln, Papier-Wedeln, Pfeil vorbei, Peitsche (soft), Vorbeiflug tief
- Swipe/Wisch: Hand über Tisch, Pinsel, Rakel
- Riser: Atem einziehen, Streicher-Swell, Reverse-Becken, Shepard-Ton (kurz), Tape-Speed-Up
- Downer/Sub-Drops: Tape-Stop, Bass-Abfall, Fahrstuhl-Stopp
- Impacts: Tür zuschlagen (dumpf), Pauke, Faust auf Tisch, Buch zuklappen, Holzkiste, Sub-Thump
- Zoom/Kamera: Objektiv-Zoom-Motor, Fokus-Ring, Dia-Wechsel, Filmprojektor anlaufen
- Wipes: Vorhang, Rollladen, Jalousie, Schiebetür

**Figuren & Avatare**
- Schritte auf verschiedenen Böden (Holz, Kies, Teppich, Asphalt), Schritte auf Zweien passend zum Gehzyklus
- Stock/Schirm tippt auf, Tasche wird abgestellt, Kleidung raschelt (bei Bewegung)
- Menschen-Murmeln (kurz, ohne Worte), Lachen gedämpft, „hm?“-Atem, Klatschen einzeln/Gruppe
- Glas abstellen, Wasser einschenken, Kaffeetasse, Stuhl rücken

**Natur, Material & Welt (für Fotos/Footage)**
- Stadt-Ambience (fern), Verkehr vorbei, Baustelle (Kran, Hammer), Bahn/Tram, Wind auf Dach
- Wasser (Plätschern, Welle), Feuer (Knistern), Eis bricht, Steine rollen, Holz knarrt
- Strom/Energie: Summen, Funke, Schalter umlegen, Neon flackert an

**Analog-Look (sehr leise darunter)**
- CRT an/aus, Röhren-Brummen (50 Hz, kaum hörbar), Vinyl-Knistern, Tape-Hiss, Projektor-Rattern, VHS-Tracking-Glitch

### 4.4 Mischverhältnis

- Stimme vorne (−14 LUFS Master), Musik ducked unter Stimme, SFX **unter** der Stimme, nur Akzente (Impacts, Drops) dürfen sie kurz erreichen.
- Faustregel Dichte: **1–2 SFX pro Sekunde** in ruhigen Passagen, bis 4/s in Montage-Passagen; alle 8–16 s ein großer Akzent.
- Jede Szene bekommt eine **Klangfarbe** (z. B. Papier-Szene trocken & nah, Daten-Szene digital & weit) — Szenenwechsel
  hört man auch am Wechsel der Klangfamilie.

## 5. Allgemeine Arbeitsweise (bewährt)

- Voice-over zuerst (ElevenLabs mit Wort-Zeitstempeln), Musik mit Composition Plan auf festem BPM, dann jede
  Schnitt-/Wortzeit ins Beat-Raster legen (`timeline.js`).
- Foley + synthetische UI-Sounds pro Szene als Cue-Liste neben dem Bild definieren; Samples immer in Varianten generieren (→ Abschnitt 4).
- Markenanalyse von der Website: Farben aus CSS, Schriften aus `@font-face`, Logo/Icons als Original-Vektoren übernehmen.
- Vor dem Final-Render Standbilder pro Szene prüfen; den Master sauber rendern und Looks (Filter) als eigenen Pass darüber legen.
