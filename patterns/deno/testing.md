# Deno Testing — Wzorce i najlepsze praktyki

Deno ma wbudowany runner testów — `deno test`. Nie wymaga instalacji dodatkowych zależności.

## Podstawowy test

```ts
import { assertEquals } from "jsr:@std/assert";

Deno.test("simple test", () => {
  const x = 1 + 2;
  assertEquals(x, 3);
});

Deno.test("async test", async () => {
  const x = 1 + 2;
  await delay(100);
  assertEquals(x, 3);
});
```

## Test z obiektem konfiguracyjnym

```ts
Deno.test({
  name: "read file test",
  fn: () => {
    const data = Deno.readTextFileSync("./somefile.txt");
    assertEquals(data, "expected content");
  },
});
```

## expect-style assertions (Jest-like)

```ts
import { expect } from "jsr:@std/expect";

Deno.test("add function", () => {
  expect(add(2, 3)).toBe(5);
});
```

## Uruchamianie testów

```bash
deno test                          # wszystkie testy w katalogu
deno test util/                    # testy w katalogu util
deno test my_test.ts               # konkretny plik
deno test --parallel               # równolegle
deno test --allow-read=. my_test.ts # z permissions

# Filtrowanie po nazwie
deno test --filter "my"
deno test --filter "/test-*\d/"

# Tylko zmienione pliki (git)
deno test --changed
deno test --changed=origin/main

# Zależne od plików
deno test --related=src/util.ts

# Zatrzymaj na pierwszym błędzie
deno test --fail-fast
```

## Test Steps (podtesty)

```ts
Deno.test("database operations", async (t) => {
  using db = await openDatabase();
  await t.step("insert user", async () => { /* ... */ });
  await t.step("insert book", async () => { /* ... */ });
});
```

## Timeout

```ts
Deno.test({
  name: "completes within deadline",
  timeout: 5000, // 5 sekund
  async fn() {
    const response = await fetch("https://example.com");
    await response.body?.cancel();
  },
});
```

## Retry i repeats

```ts
Deno.test({
  name: "flaky network call",
  retry: 3,    // powtórz do 3 razy, zalicza jeśli jeden przejdzie
  async fn() { /* ... */ },
});

Deno.test({
  name: "must be deterministic",
  repeats: 5,  // uruchom 5 razy, każdy musi przejść
  fn() { /* ... */ },
});
```

## Testy parametryzowane (Deno.test.each)

```ts
import { assertEquals } from "jsr:@std/assert";

// Array cases — argumenty pozycyjne
Deno.test.each([
  [1, 1, 2],
  [2, 3, 5],
])("add(%i, %i) = %i", (a, b, expected) => {
  assertEquals(a + b, expected);
});

// Object cases — interpolacja $key
Deno.test.each([
  { a: 1, b: 1, sum: 2 },
  { a: 2, b: 3, sum: 5 },
])("$a + $b = $sum", ({ a, b, sum }) => {
  assertEquals(a + b, sum);
});
```

## Hooks (beforeAll, beforeEach, afterEach, afterAll)

```ts
let db: DatabaseSync;

Deno.test.beforeAll(() => {
  db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT) STRICT");
});

Deno.test.beforeEach(() => {
  db.exec("DELETE FROM users");
});

Deno.test.afterEach(() => {
  // cleanup po każdym teście
});

Deno.test.afterAll(() => {
  db.close();
});

Deno.test("user creation", () => {
  const stmt = db.prepare("INSERT INTO users (name) VALUES (?) RETURNING *");
  const user = stmt.get("alice");
  assertEquals(user.name, "alice");
});
```

## Ignorowanie i focusowanie testów

```ts
Deno.test.ignore("my test", () => { /* ... */ });
Deno.test.only("focus on this", () => { /* ... */ });

// Warunkowe ignorowanie
Deno.test({
  name: "do macOS feature",
  ignore: Deno.build.os !== "darwin",
  fn() { /* ... */ },
});
```

## Testy i permisje

```ts
Deno.test({
  name: "File reader without permission",
  permissions: { read: false },
  fn: async () => {
    const result = await getFileText();
    assertEquals(result, "oops don't have permission");
  },
});

// Szczegółowa konfiguracja permisji
Deno.test({
  name: "scoped permissions",
  permissions: {
    read: ["./data", "./config"],
    write: false,
    net: ["example.com:443"],
    env: ["API_KEY"],
    run: false,
    ffi: false,
    hrtime: false,
  },
  fn() { /* ... */ },
});
```

## BDD (describe/it)

```ts
import { describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";

describe("add function", () => {
  it("adds two numbers correctly", () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

## Mockowanie

Mockowanie dostępne w `@std/testing/mock` — spy, stub, fake time.

## Coverage

```bash
deno test --coverage=coverage/
deno coverage coverage/
```

## Snapshot testing

```ts
// Deno automatycznie zarządza snapshotami
// Uruchom z --update aby zaktualizować snapshoty
```

## Testy dokumentacyjne (doc tests)

```bash
deno test --doc  # uruchamia przykłady z JSDoc jako testy
```

## node:test (kompatybilność z Node)

Deno wspiera też `node:test` — portable między Deno a Node:

```ts
import { test } from "node:test";
import assert from "node:assert";

test("works in both Deno and Node", () => {
  assert.strictEqual(1 + 1, 2);
});
```

## Reporterzy

```bash
deno test --reporter=dot    # zwięzły
deno test --reporter=junit  # XML
deno test --reporter=tap    # TAP format
deno test --junit-path=./report.xml  # zapisz raport JUnit
```