# Deno Permissions & Security — Wzorce i najlepsze praktyki

Deno działa w secure sandbox: kod nie ma dostępu do I/O systemowego bez zgody użytkownika.

## Model permisji

Domyślnie **wszystko jest zabronione**. Należy jawnie przyznać dostęp:

| Flaga | Opis | Skrót |
|-------|------|-------|
| `--allow-read` | Odczyt plików | `-R` |
| `--allow-write` | Zapis plików | `-W` |
| `--allow-net` | Sieć | `-N` |
| `--allow-env` | Zmienne środowiskowe | `-E` |
| `--allow-run` | Subprocesy | — |
| `--allow-sys` | Informacje systemowe | `-S` |
| `--allow-ffi` | Ładowanie bibliotek (FFI) | — |
| `--allow-import` | Import z sieci | — |
| `--allow-all` | Wszystko (wyłącza sandbox) | `-A` |

## Skalowanie permisji (scope)

```bash
# Konkretne ścieżki
deno run --allow-read=foo.txt,bar.txt script.ts

# Konkretne hosty
deno run --allow-net=github.com,jsr.io script.ts

# Konkretne zmienne środowiskowe
deno run --allow-env=HOME,FOO script.ts

# Konkretne informacje systemowe
deno run --allow-sys="systemMemoryInfo,osRelease" script.ts

# Subdomeny (wildcard)
deno run --allow-net="*.example.com" script.ts

# Zmienne env z suffix wildcard
deno run --allow-env="AWS_*" script.ts
```

## Deny flags (wykluczenia)

Deny flags mają pierwszeństwo przed allow flags:

```bash
deno run --allow-read=/etc --deny-read=/etc/hosts script.ts
deno run --allow-net --deny-net=github.com script.ts
```

## Permisje w deno.json

```json
{
  "permissions": {
    "allow-read": ["./data"],
    "allow-net": ["api.example.com:443"]
  }
}
```

## Audit permisji

```bash
# Zapis do pliku JSONL
DENO_AUDIT_PERMISSIONS=./audit.jsonl deno run script.ts

# Ze stack trace
DENO_TRACE_PERMISSIONS=1 DENO_AUDIT_PERMISSIONS=./audit.jsonl deno run script.ts

# OpenTelemetry
OTEL_DENO=true DENO_AUDIT_PERMISSIONS=otel deno run -A main.ts
```

## Domyślnie dozwolone importy (bez --allow-import)

Deno pozwala importować z tych hostów bez dodatkowych permisji:
- `deno.land`, `jsr.io`, `esm.sh`, `raw.esm.sh`
- `cdn.jsdelivr.net`, `raw.githubusercontent.com`, `gist.githubusercontent.com`
- Wszystkie `npm:` specifery

## Domyślnie dozwolone operacje

- `localStorage`, Deno KV, `caches`, `Blob` — używają FS ale nie wymagają permisji
- Statyczne importy z entrypoint — dozwolone bez `--allow-read`
- Importy z `node_modules/` — dozwolone bez `--allow-read`

## Subprocesy i bezpieczeństwo

**Uwaga:** `--allow-run` zasadniczo wyłącza sandbox bezpieczeństwa — subprocesy nie dziedziczą ograniczeń rodzica.

```bash
# Ograniczenie do konkretnych programów
deno run --allow-run="curl,whoami" script.ts
```

## FFI i bezpieczeństwo

`--allow-ffi` również wyłącza sandbox — biblioteki dynamiczne nie są sandboxowane.

## Dobre praktyki bezpieczeństwa

1. **Zasada najmniejszego przywileju** — daj tylko te permisje, które są potrzebne
2. **Używaj scoped flags** — `--allow-net=api.example.com` zamiast `--allow-net`
3. **Unikaj `-A` w produkcji** — wyłącza cały sandbox
4. **Testuj z różnymi permisions** — sprawdź czy fallbacki działają
5. **Używaj audit trail** — `DENO_AUDIT_PERMISSIONS` w środowiskach testowych
6. **Deny flags dla bezpieczeństwa** — jawnie blokuj wrażliwe ścieżki