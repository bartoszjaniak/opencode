# Deno Error Handling — Wzorce i najlepsze praktyki

## Obsługa błędów w async context

### Try/catch z web-standard Response

```ts
Deno.serve(async (req) => {
  try {
    const data = await req.json();
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }
});
```

### Obsługa błędów przy odczycie body requestu

```ts
Deno.serve(async (req) => {
  let body: string;
  try {
    body = await req.text();
  } catch {
    // Klient rozłączył się przed pełnym wysłaniem body
    return new Response("Connection lost", { status: 499 });
  }
  // ...
});
```

## Błędy w strumieniach (ReadableStream)

```ts
const body = new ReadableStream({
  start(controller) {
    // ...
  },
  cancel() {
    // WAŻNE: zawsze obsługuj cancel — klient może się rozłączyć
    cleanup();
  },
});
```

## Błędy permisji (Deno.errors.NotCapable)

```ts
try {
  const data = await Deno.readTextFile("./secrets.txt");
} catch (error) {
  if (error instanceof Deno.errors.NotCapable) {
    console.log("No permission to read file");
    // fallback
  } else {
    throw error;
  }
}
```

## Wzorzec: Result type (zamiast throw)

```ts
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return { ok: false, error: "Division by zero" };
  return { ok: true, value: a / b };
}

// Użycie
const result = divide(10, 0);
if (result.ok) {
  console.log(result.value);
} else {
  console.error(result.error);
}
```

## Obsługa błędów w testach

```ts
Deno.test("throws on invalid input", () => {
  // Testowanie że funkcja rzuca
  assertThrows(() => parseInput(""), Error, "Input cannot be empty");
});

// Z async
await assertRejects(
  () => fetch("https://invalid.url"),
  TypeError,
);
```

## Style komunikatów błędów (Deno Style Guide)

```ts
// Dobrze
throw new Error("Cannot parse input \"hello, world\"");
throw new Error("Cannot parse input x: value is empty");

// Źle
throw new Error("can't parse input");
throw new Error("Invalid input x.");
throw new Error("Input x cannot be parsed");
```

Zasady:
- Zaczynaj z wielkiej litery
- Nie kończ kropką
- Używaj cudzysłowów dla wartości
- Mów co się stało (active voice)
- Używaj dwukropka dla dodatkowych informacji
- Bez skrótów (nie "can't" tylko "cannot")
- Amerykański angielski

## Error boundary dla HTTP

```ts
function errorHandler(handler: (req: Request) => Response | Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (error) {
      console.error("Unhandled error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }
  };
}

Deno.serve(errorHandler(async (req) => {
  // Twój handler
  if (Math.random() < 0.5) throw new Error("Boom!");
  return new Response("OK");
}));
```

## Walidacja danych wejściowych

```ts
function validateUser(data: unknown): Result<User, string> {
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Invalid input: expected object" };
  }
  const obj = data as Record<string, unknown>;
  if (typeof obj.name !== "string" || obj.name.length === 0) {
    return { ok: false, error: "name is required and must be a string" };
  }
  return { ok: true, value: { name: obj.name } };
}
```