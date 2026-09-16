# Komponenty podglądu specyfikacji (HTML, design "Bauhaus technical")

Snippet'y do szablonu `template.html`. **Zasada: używaj krótkich klas komponentów z tego pliku** — warstwa CSS jest już w szablonie (`<style>`), więc sekcje pisze się 1–3 liniami zamiast długich list utility. Wygląd jest identyczny, a dokument generuje się znacznie szybciej.
**Nie zmieniaj systemu wizualnego i nie dodawaj klas `rounded-*`.**

## System wizualny

| Element | Wartość |
| --- | --- |
| Tło strony | `#f5f0e8` (krem) |
| Karta | `.card` = biała, `border 2px #1a1a1a`, `shadow 4px 4px 0` |
| Tusz | `#1a1a1a` |
| Akcenty | żółty `#ffcc00`, niebieski `#0055ff`, czerwony `#e63b2e` |
| Promienie | **brak** — wszystko kanciaste |
| Typografia | `.title` (Space Grotesk, uppercase), `.prose` (Inter), `.label` i `.metric` (JetBrains Mono) |

## Mapa: element źródła → komponent

| W markdownie | W HTML |
| --- | --- |
| akapit, lista | `<p class="prose">`, `<ul class="prose">` |
| tabela | `<div class="table-wrap"><table class="tbl">` |
| blok kodu | `<div class="codeblock">` |
| kroki, fazy | `<ol class="steps">` |
| checklista `- [ ]` | `<div class="checklist">` |
| liczby, metryki | `<div class="grid-3">` + `.card.tight` + `.metric` |
| wykres, porównanie | SVG w `<div class="figure">` |
| diagram, przepływ | SVG w `<div class="figure">` |
| ryzyko, ostrzeżenie | `<div class="card danger">` |
| uwaga, info | `<div class="card warn">` |
| status, tag | `<span class="chip k">` |

## Klas komponentów (ściąga)

| Klasa | Zastosowanie |
| --- | --- |
| `.card` / `.card.tight` (mniejsza) | karta: biała, obramowanie 2px, cień offsetowy |
| `.card.ink` / `.card.danger` / `.card.warn` | warianty tła: czarna / czerwona / żółta |
| `.title` | nagłówek sekcji i h3 (dodaj rozmiar Tailwinda: `text-xl md:text-2xl`) |
| `.prose` | treść akapitu |
| `.label` / `.label.out` | mono etykieta uppercase; `.out` = przygaszona |
| `code.ic` | kod inline |
| `.grid-2` / `.grid-3` | siatki (responsywne, `md:` wbudowane) |
| `.chip.k/.y/.b/.r/.n` | statusy: czarny / żółty / niebieski / czerwony / neutralny |
| `.table-wrap` + `.tbl` | tabela; komórki `td.k` (nazwa), `td.v` (wartość mono), `td.n` (notka mono) |
| `.metric` | duża liczba mono |
| `.codeblock` + `.cb-head` | blok kodu z belką (plik + `data-copy`) |
| `.figure` + `.figure-head` + `.legend` + `.figure svg` | karta diagramu/wykresu |
| `.steps` / `.step` / `.step .n` | oś czasu, kroki |
| `.checklist` / `.check-item` / `.checklist .sub` | lista kontrolna z licznikiem |

## 1. Sekcja (kontener)

```html
<section id="cel-i-zakres" class="space-y-4">
  <h2 class="title text-xl md:text-2xl">Cel i zakres</h2>
  <p class="prose">Treść akapitu z kodem <code class="ic">prog = 12</code>.</p>
</section>
```

Numer `01.`, kwadrat akcentowy i linia pod nagłówkiem generują się automatycznie — nie wpisuj numeru w tytuł.

## 2. Karty i banery

```html
<div class="grid-2">
  <div class="card"><div class="label out">Diagnoza</div><p class="prose">Treść karty.</p></div>
  <div class="card tight"><div class="label out">Status</div><div class="metric">12 kroków</div><p class="prose">Notka.</p></div>
</div>

<div class="card danger"><div class="label">Ryzyko</div><p class="prose">Opis ryzyka.</p></div>
<div class="card warn"><div class="label">Uwaga</div><p class="prose">Opis uwagi.</p></div>
```

## 3. Chipy

```html
<span class="chip k">RFC // ARCHITECTURE RECORD</span>
<span class="chip y">DOC-ID: RFC-104</span>
<span class="chip r">BLOKUJĄCY</span>
<span class="chip b">INFO</span>
<span class="chip n">ŚREDNI</span>
```

## 4. Tabela

```html
<div class="table-wrap"><table class="tbl">
  <thead><tr><th>Metryka</th><th>Wartość docelowa</th><th>Metoda pomiaru</th></tr></thead>
  <tbody>
    <tr><td class="k">Opóźnienie E2E (P99)</td><td class="v">&lt; 45 ms</td><td class="n">OpenTelemetry span</td></tr>
  </tbody>
</table></div>
```

## 5. Blok kodu

```html
<div class="codeblock">
  <div class="cb-head">
    <span><span class="chip y">engine.js</span> <span style="color:rgba(255,255,255,.5)">JavaScript</span></span>
    <button class="label" style="color:#ffcc00" data-copy="#kod-1" type="button">Kopiuj</button>
  </div>
  <pre><code id="kod-1">const prog = 12;</code></pre>
</div>
```

Kolorowanie w `<code>`: słowa kluczowe `style="color:#ffcc00;font-weight:700"`, liczby/stringi `#ffffff`, komentarze `rgba(255,255,255,.4)`. Escapuj `&lt;`, `&gt;`, `&amp;`.

## 6. Siatka metryk

```html
<div class="grid-3">
  <div class="card tight"><div class="label out">Obciążenie CPU</div><div class="metric">28.4%</div><p class="prose">Pik 52% przy 120k RPS</p></div>
</div>
```

## 7. Lista kontrolna

```html
<div class="card space-y-5">
  <div class="figure-head"><span class="title">Lista kontrolna</span><span class="chip y" id="checklist-counter">Status: 0 / 1 (0%)</span></div>
  <div class="checklist">
    <label><input class="check-item" type="checkbox"/><div><strong>Punkt do odhaczenia</strong><span class="sub">Kryterium akceptacji</span></div></label>
  </div>
</div>
```

## 8. Kroki / oś czasu

```html
<ol class="steps">
  <li class="step"><span class="n">01</span><div><strong class="title text-base">Krok</strong><p class="prose">Opis kroku.</p></div></li>
</ol>
```

## 9. Wykres słupkowy (SVG)

```html
<div class="figure">
  <div class="figure-head"><span class="title text-sm">Opóźnienia centylowe: przed vs po</span><span style="color:#e63b2e;font-weight:700">-92%</span></div>
  <svg viewBox="0 0 320 160" role="img">
    <line stroke="#1a1a1a" stroke-width="1.5" x1="40" x2="40" y1="10" y2="130"></line>
    <line stroke="#1a1a1a" stroke-width="1.5" x1="40" x2="310" y1="130" y2="130"></line>
    <text fill="#1a1a1a" font-size="8" text-anchor="end" x="32" y="25">500ms</text>
    <rect fill="#eee9e0" height="40" stroke="#1a1a1a" stroke-width="1" width="20" x="60" y="90"></rect>
    <rect fill="#0055ff" height="4" stroke="#1a1a1a" stroke-width="1" width="20" x="84" y="126"></rect>
    <text font-size="9" font-weight="bold" text-anchor="middle" x="82" y="145">P50</text>
  </svg>
  <div class="legend">
    <span style="display:flex;align-items:center;gap:.375rem"><span style="width:.75rem;height:.75rem;background:#eee9e0;border:1px solid #1a1a1a"></span>Przed</span>
    <span style="display:flex;align-items:center;gap:.375rem"><span style="width:.75rem;height:.75rem;background:#0055ff;border:1px solid #1a1a1a"></span>Po</span>
  </div>
</div>
```

## 10. Wykres liniowy (SVG)

```html
<div class="figure">
  <div class="figure-head"><span class="title text-sm">Skalowalność</span><span style="color:#0055ff;font-weight:700">Max: 135k</span></div>
  <svg viewBox="0 0 320 160" role="img">
    <line stroke="#1a1a1a" stroke-width="1.5" x1="35" x2="35" y1="10" y2="130"></line>
    <line stroke="#1a1a1a" stroke-width="1.5" x1="35" x2="310" y1="130" y2="130"></line>
    <line stroke="#e63b2e" stroke-dasharray="3,3" stroke-width="1.5" x1="35" x2="310" y1="35" y2="35"></line>
    <text fill="#e63b2e" font-size="8" font-weight="bold" text-anchor="end" x="305" y="30">Limit</text>
    <polyline fill="none" points="40,125 90,105 150,75 210,48 270,42" stroke="#1a1a1a" stroke-width="2.5"></polyline>
    <circle cx="150" cy="75" fill="#0055ff" r="3" stroke="#1a1a1a" stroke-width="1"></circle>
    <circle cx="270" cy="42" fill="#ffcc00" r="4" stroke="#1a1a1a" stroke-width="1"></circle>
  </svg>
</div>
```

## 11. Diagram przepływu (SVG)

```html
<div class="figure">
  <div class="figure-head"><span class="title text-sm">Schemat: przepływ danych</span><span class="chip y">Wejście do logiki</span></div>
  <svg viewBox="0 0 700 300" role="img" style="min-width:640px">
    <defs>
      <pattern id="bh-grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" opacity="0.2" stroke="#1a1a1a" stroke-dasharray="2,4" stroke-width="0.3"></path>
      </pattern>
      <marker id="bh-arrow" markerWidth="6" markerHeight="6" orient="auto-start-reverse" refX="6" refY="5" viewBox="0 0 10 10">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#1a1a1a"></path>
      </marker>
    </defs>
    <rect width="700" height="300" fill="#f5f0e8" stroke="#1a1a1a" stroke-width="2"></rect>
    <rect width="700" height="300" fill="url(#bh-grid)"></rect>
    <g transform="translate(30, 100)">
      <rect width="140" height="100" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"></rect>
      <rect width="140" height="24" fill="#1a1a1a"></rect>
      <text x="10" y="16" fill="#ffffff" font-size="10" font-weight="bold">01 // WEJSCIE</text>
      <text x="12" y="50" fill="#1a1a1a" font-size="10">• sensor</text>
    </g>
    <path d="M 170 150 L 220 150" stroke="#1a1a1a" stroke-width="2.5" marker-end="url(#bh-arrow)"></path>
    <text x="175" y="140" fill="#1a1a1a" font-size="9" font-weight="bold">event</text>
    <g transform="translate(225, 100)">
      <rect width="140" height="100" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"></rect>
      <rect width="140" height="24" fill="#0055ff"></rect>
      <text x="10" y="16" fill="#ffffff" font-size="10" font-weight="bold">02 // LOGIKA</text>
      <text x="12" y="50" fill="#1a1a1a" font-size="10">• engine</text>
    </g>
  </svg>
</div>
```

Zasady SVG: `viewBox` (bez `width`/`height` — skaluje `.figure svg`), kolory wyłącznie z palety, węzły = biały `<rect stroke="#1a1a1a" stroke-width="2">` + kolorowy pasek nagłówka (`#1a1a1a`, `#0055ff`, `#ffcc00`, `#e63b2e`), strzałki `marker-end="url(#bh-arrow)"`. Przy kilku diagramach w pliku użyj unikalnych `id` w `defs` (`bh-arrow-2`, `bh-grid-2`). Diagram tylko dla danych obecnych w źródle.
