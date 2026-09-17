# Komponenty podglądu specyfikacji — głębia (design "Bauhaus technical")

Podstawowe komponenty opisuje prompt agenta (`agents/bilbo.md`, sekcja „Biblioteka komponentów") — **agent pisze czysty HTML bez klas**, a wygląd pochodzi z warstwy semantycznej CSS szablonu (`template.html`, blok „WARSTWA SEMANTYCZNA"). Ten plik zawiera tylko to, czego agent nie musi mieć zawsze: pełne szablony wykresów i diagramów oraz przypadki brzegowe. Czytaj warunkowo.

## Sygnały, jakich wolno użyć

| Element / atrybut | Znaczenie |
| --- | --- |
| `<section id="slug">` | sekcja dokumentu (numer, kwadrat i linia dokładane skryptem) |
| `<h2>`, `<h3>`, `<h4>` | tytuł sekcji, podtytuł, etykieta techniczna |
| `<p>`, `<ul>`, `<ol>`, `<li>` | treść, listy (kroki = zwykłe `<ol>`) |
| `<table>` + `<thead>/<tbody>` | tabela (ramka i przewijanie dokładane skryptem) |
| `<pre><code>` | blok kodu (przycisk „Kopiuj" dokładany skryptem) |
| `<ul><li><input type="checkbox">` | lista kontrolna (nagłówek i licznik dokładane skryptem) |
| `<mark>` | wyróżniony status (żółty) |
| `<mark data-tone="danger｜info｜neutral｜ink">` | status czerwony / niebieski / neutralny / czarny |
| `<blockquote>` | ramka/callout (biała) |
| `<blockquote data-tone="danger｜warn｜ink">` | ramka czerwona / żółta / czarna |
| `<figure><figcaption>` + `<svg>` + `<ul>` | wizualizacja: tytuł, rysunek, legenda |
| `<hr>` | rozdzielenie |

Paleta: krem `#f5f0e8`, panel `#eee9e0`, karta `#ffffff`, tusz `#1a1a1a`, `#262626` (belka kodu), `#e2ddd4` (tekst kodu), akcenty `#ffcc00` / `#0055ff` / `#e63b2e`.
Zakazane: klasy, `rounded-*`, kolory spoza palety. Jedyne inline `style` poza SVG: próbka koloru w legendzie.

## 1. Wykres słupkowy (pełny wariant z osiami i legendą)

```html
<figure>
  <figcaption>Opóźnienia centylowe: monolit vs nowy silnik <span style="color:#e63b2e">-92% opóźnień</span></figcaption>
  <svg viewBox="0 0 320 160" role="img">
    <line stroke="#1a1a1a" stroke-width="1.5" x1="40" x2="40" y1="10" y2="130"></line>
    <line stroke="#1a1a1a" stroke-width="1.5" x1="40" x2="310" y1="130" y2="130"></line>
    <text fill="#1a1a1a" font-size="8" text-anchor="end" x="32" y="25">500ms</text>
    <text fill="#1a1a1a" font-size="8" text-anchor="end" x="32" y="75">250ms</text>
    <text fill="#1a1a1a" font-size="8" text-anchor="end" x="32" y="120">50ms</text>
    <rect fill="#eee9e0" height="40" stroke="#1a1a1a" stroke-width="1" width="20" x="60" y="90"></rect>
    <rect fill="#0055ff" height="4" stroke="#1a1a1a" stroke-width="1" width="20" x="84" y="126"></rect>
    <text fill="#1a1a1a" font-size="9" font-weight="bold" text-anchor="middle" x="82" y="145">P50</text>
    <rect fill="#eee9e0" height="75" stroke="#1a1a1a" stroke-width="1" width="20" x="140" y="55"></rect>
    <rect fill="#0055ff" height="9" stroke="#1a1a1a" stroke-width="1" width="20" x="164" y="121"></rect>
    <text fill="#1a1a1a" font-size="9" font-weight="bold" text-anchor="middle" x="162" y="145">P95</text>
    <rect fill="#eee9e0" height="110" stroke="#1a1a1a" stroke-width="1" width="20" x="220" y="20"></rect>
    <rect fill="#ffcc00" height="12" stroke="#1a1a1a" stroke-width="1" width="20" x="244" y="118"></rect>
    <text fill="#1a1a1a" font-size="9" font-weight="bold" text-anchor="middle" x="242" y="145">P99</text>
  </svg>
  <ul>
    <li><span style="width:.75rem;height:.75rem;background:#eee9e0;border:1px solid #1a1a1a"></span>Monolit</li>
    <li><span style="width:.75rem;height:.75rem;background:#0055ff;border:1px solid #1a1a1a"></span>P50 / P95</li>
    <li><span style="width:.75rem;height:.75rem;background:#ffcc00;border:1px solid #1a1a1a"></span>P99</li>
  </ul>
</figure>
```

## 2. Wykres liniowy (trend, próg nasycenia)

```html
<figure>
  <figcaption>Skalowalność i przepustowość liniowa <span style="color:#0055ff">Max: 135 000 req/s</span></figcaption>
  <svg viewBox="0 0 320 160" role="img">
    <line stroke="#1a1a1a" stroke-width="1.5" x1="35" x2="35" y1="10" y2="130"></line>
    <line stroke="#1a1a1a" stroke-width="1.5" x1="35" x2="310" y1="130" y2="130"></line>
    <line stroke="#e63b2e" stroke-dasharray="3,3" stroke-width="1.5" x1="35" x2="310" y1="35" y2="35"></line>
    <text fill="#e63b2e" font-size="8" font-weight="bold" text-anchor="end" x="305" y="30">Limit 145k</text>
    <polyline fill="none" points="40,125 90,105 150,75 210,48 270,42 300,41" stroke="#1a1a1a" stroke-width="2.5"></polyline>
    <circle cx="90" cy="105" fill="#0055ff" r="3" stroke="#1a1a1a" stroke-width="1"></circle>
    <circle cx="150" cy="75" fill="#0055ff" r="3" stroke="#1a1a1a" stroke-width="1"></circle>
    <circle cx="270" cy="42" fill="#ffcc00" r="4" stroke="#1a1a1a" stroke-width="1"></circle>
    <text fill="#1a1a1a" font-size="8" x="40" y="145">10k</text>
    <text fill="#1a1a1a" font-size="8" x="150" y="145">80k</text>
    <text fill="#1a1a1a" font-size="8" font-weight="bold" x="270" y="145">140k RPS</text>
  </svg>
</figure>
```

## 3. Diagram przepływu (siatka konstrukcyjna, wiele węzłów)

```html
<figure>
  <figcaption>Schemat architektoniczny: przepływ danych</figcaption>
  <svg viewBox="0 0 980 380" role="img" style="min-width:760px">
    <defs>
      <pattern id="bh-grid-2" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" opacity="0.2" stroke="#1a1a1a" stroke-dasharray="2,4" stroke-width="0.3"></path>
      </pattern>
      <marker id="bh-arrow-2" markerWidth="6" markerHeight="6" orient="auto-start-reverse" refX="6" refY="5" viewBox="0 0 10 10">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#1a1a1a"></path>
      </marker>
    </defs>
    <rect width="980" height="380" fill="#f5f0e8" stroke="#1a1a1a" stroke-width="2"></rect>
    <rect width="980" height="380" fill="url(#bh-grid-2)"></rect>
    <g transform="translate(30, 110)">
      <rect width="140" height="150" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"></rect>
      <rect width="140" height="24" fill="#1a1a1a"></rect>
      <text x="10" y="16" fill="#ffffff" font-size="10" font-weight="bold">01 // WEJSCIE</text>
      <text x="12" y="50" fill="#1a1a1a" font-size="10">• HTTPS / REST</text>
      <text x="12" y="72" fill="#1a1a1a" font-size="10">• strumień gRPC</text>
      <rect x="10" y="112" width="120" height="22" fill="#ffcc00" stroke="#1a1a1a" stroke-width="1.5"></rect>
      <text x="16" y="127" fill="#1a1a1a" font-size="9" font-weight="bold">&gt; 120k req/s</text>
    </g>
    <path d="M 170 185 L 220 185" stroke="#1a1a1a" stroke-width="2.5" marker-end="url(#bh-arrow-2)"></path>
    <text x="175" y="175" fill="#1a1a1a" font-size="9" font-weight="bold">TLS 1.3</text>
    <g transform="translate(225, 95)">
      <rect width="160" height="180" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"></rect>
      <rect width="160" height="24" fill="#0055ff" stroke="#1a1a1a" stroke-width="1"></rect>
      <text x="10" y="16" fill="#ffffff" font-size="10" font-weight="bold">02 // INGESTION</text>
      <rect x="12" y="60" width="136" height="26" fill="#f5f0e8" stroke="#1a1a1a" stroke-width="1"></rect>
      <text x="18" y="77" fill="#1a1a1a" font-size="9">Schema Validation</text>
      <rect x="12" y="96" width="136" height="26" fill="#f5f0e8" stroke="#1a1a1a" stroke-width="1"></rect>
      <text x="18" y="113" fill="#1a1a1a" font-size="9">Token-bucket Limiter</text>
      <rect x="12" y="132" width="136" height="26" fill="#f5f0e8" stroke="#1a1a1a" stroke-width="1"></rect>
      <text x="18" y="149" fill="#1a1a1a" font-size="9">Idempotency Filter</text>
    </g>
    <rect x="30" y="335" width="930" height="28" fill="#1a1a1a"></rect>
    <text x="45" y="353" fill="#ffffff" font-size="9">IZOLACJA STREF: wszystkie węzły mają redundantne łącza Cross-AZ</text>
  </svg>
</figure>
```

## 4. Przypadki brzegowe

- **Kiedy NIE rysować wykresu**: 1–2 punkty danych, pojedyncza wartość, brak jednostek w źródle → tabela albo zwykły akapit. Wykres tylko dla porównania lub trendu.
- **Skala**: SVG nie skaluje osi — wartości dobierasz ręcznie. Oś Y: 3–4 znaczniki, zawsze z jednostką. Próg/limit rysuj linią przerywaną `#e63b2e`.
- **Etykiety**: `font-size` 8–10 (rodzina czcionek dziedziczy z CSS). Długie etykiety skracaj, pełną treść zostaw w legendzie lub w akapicie.
- **Mobile**: szerokie diagramy wymagają `style="min-width:640px"` na `<svg>`.
- **Wiele wizualizacji w dokumencie**: unikalne `id` w `defs` (`bh-arrow-2`, `bh-grid-3`) — powtórzone `id` psują rysowanie.
- **Maksymalnie 2–4 wizualizacje na dokument.** Brak wykresu jest lepszy niż wykres zmyślony.
- **Checklista**: zwykłe `<ul>` z `<input type="checkbox">`; nagłówek z licznikiem dokłada skrypt (raz na listę).
- **Escaping**: w `<code>` i treściach technicznych zawsze `&lt;`, `&gt;`, `&amp;`.
- **Numeracja sekcji**: nie wpisuj jej w `<h2>` — skrypt dokłada `01.` i usuwa numer z markdowna.
