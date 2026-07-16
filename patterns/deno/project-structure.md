# Deno Project Structure — Wzorce i najlepsze praktyki

## Pliki konfiguracyjne

### deno.json (podstawowy)

```json
{
  "tasks": {
    "dev": "deno run --watch main.ts",
    "start": "deno run -A main.ts",
    "test": "deno test --allow-read",
    "lint": "deno lint",
    "fmt": "deno fmt"
  },
  "imports": {
    "@std/assert": "jsr:@std/assert@^1",
    "@std/http": "jsr:@std/http@^1",
    "express": "npm:express@^5"
  },
  "fmt": {
    "lineWidth": 100,
    "indentWidth": 2,
    "semiColons": true,
    "singleQuote": false
  },
  "lint": {
    "rules": {
      "tags": ["recommended"]
    }
  },
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### deno.json z workspacem (monorepo)

```json
{
  "workspace": ["./packages/*", "./apps/*"],
  "tasks": {
    "test": "deno test --parallel"
  }
}
```

## Struktura projektu

### Standardowa struktura aplikacji

```
my_project/
├── deno.json              # konfiguracja projektu
├── main.ts                # entrypoint
├── main_test.ts           # testy entrypoint
├── src/
│   ├── mod.ts             # barrel export
│   ├── routes/            # routing (jeśli HTTP)
│   │   ├── users.ts
│   │   └── products.ts
│   ├── controllers/       # logika biznesowa
│   │   ├── user_controller.ts
│   │   └── product_controller.ts
│   ├── models/            # typy/interfejsy/model
│   │   ├── user.ts
│   │   └── product.ts
│   ├── services/          # warstwa serwisów
│   │   ├── user_service.ts
│   │   └── product_service.ts
│   ├── middleware/        # middleware (dla Oak/Hono)
│   │   └── auth.ts
│   ├── utils/             # funkcje pomocnicze
│   │   └── helpers.ts
│   └── types/             # typy globalne
│       └── index.ts
├── tests/                 # testy integracyjne
│   ├── integration_test.ts
│   └── fixtures/
└── public/                # statyczne pliki
    └── index.html
```

### Struktura biblioteki/pakietu

```
my_lib/
├── deno.json
├── mod.ts                 # główny export
├── src/
│   ├── foo.ts
│   └── bar.ts
├── foo_test.ts            # testy obok kodu
├── bar_test.ts
└── README.md
```

## Konwencje nazewnicze

| Element | Konwencja | Przykład |
|---------|-----------|----------|
| Pliki | `snake_case` | `file_server.ts` |
| Klasy/typy/interfejsy/enumy | `PascalCase` | `UserService` |
| Funkcje/metody/pola | `camelCase` | `getUser()` |
| Stałe statyczne | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE` |
| Główny plik modułu | `mod.ts` | (nie `index.ts`) |
| Plik testowy | `{nazwa}_test.ts` | `foo_test.ts` |

## Zarządzanie zależnościami

### Dodawanie pakietów

```bash
# Z JSR (rekomendowane dla TypeScript)
deno add jsr:@std/assert

# Z npm
deno add npm:express

# Z URL
deno add https://deno.land/x/oak@v12.0.0/mod.ts
```

### Import mapy (deno.json)

```json
{
  "imports": {
    "@std/assert": "jsr:@std/assert@^1",
    "utils/": "./src/utils/"
  }
}
```

```ts
// import względem import mapy
import { assertEquals } from "@std/assert";
import { helper } from "utils/helper.ts";
```

## Wzorce architektoniczne

### Modularny barrel export

```ts
// src/mod.ts
export { UserService } from "./services/user_service.ts";
export type { User } from "./models/user.ts";
```

### Funkcje: max 2 parametry, reszta w options object

```ts
// Dobrze
export interface ResolveOptions {
  family?: "ipv4" | "ipv6";
  timeout?: number;
}

export function resolve(
  hostname: string,
  options: ResolveOptions = {},
): IPAddress[] { /* ... */ }
```

### Preferuj `function` nad arrow dla top-level

```ts
// Dobrze
export function foo(): string {
  return "bar";
}

// Źle
export const foo = (): string => "bar";
```

## Wbudowane narzędzia (bez zależności)

```bash
deno fmt          # formatowanie (odpowiednik prettier)
deno lint         # linter (odpowiednik eslint)
deno test         # test runner (odpowiednik jest/vitest)
deno check        # type checking (odpowiednik tsc --noEmit)
deno doc          # generowanie dokumentacji
deno task         # uruchamianie skryptów (odpowiednik npm run)
deno compile      # kompilacja do pojedynczego binary
deno bench        # benchmarki
deno coverage     # pokrycie kodu
```

## package.json support

Deno wspiera `package.json` jako first-class citizen. Możesz mieć oba pliki:

```json
// package.json — zależności i skrypty npm
{
  "scripts": {
    "dev": "deno task dev"
  },
  "dependencies": {
    "express": "^5"
  }
}
```

```json
// deno.json — konfiguracja narzędzi Deno
{
  "tasks": {
    "dev": "deno run --watch -A main.ts"
  }
}
```