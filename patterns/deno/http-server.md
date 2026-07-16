# Deno HTTP Server — Wzorce i najlepsze praktyki

## Deno.serve — wbudowany serwer HTTP

Deno ma wbudowane API serwera HTTP: `Deno.serve`, które obsługuje HTTP/1.1 i HTTP/2 oraz działa z web-standardowymi obiektami `Request` i `Response`.

### Podstawowy serwer

```ts
Deno.serve((_req) => {
  return new Response("Hello, World!");
});
```

Uruchomienie: `deno run --allow-net server.ts`

### Konfiguracja portu i hosta

```ts
Deno.serve({ port: 4242, hostname: "0.0.0.0" }, handler);
```

### Obsługa requestu — metoda, URL, nagłówki, ciało

```ts
Deno.serve(async (req) => {
  const url = new URL(req.url);
  console.log("Method:", req.method);
  console.log("Path:", url.pathname);
  console.log("Query parameters:", url.searchParams);
  console.log("Headers:", req.headers);

  if (req.body) {
    const body = await req.text(); // możliwy błąd przy rozłączeniu — zawsze obsłuż
    console.log("Body:", body);
  }

  return new Response("Hello, World!");
});
```

### Odpowiedzi z kodem statusu, JSON-em i nagłówkami

```ts
Deno.serve((req) => {
  const body = JSON.stringify({ message: "NOT FOUND" });
  return new Response(body, {
    status: 404,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
});
```

### Odpowiedź strumieniowa (streaming)

```ts
Deno.serve((req) => {
  let timer: number;
  const body = new ReadableStream({
    async start(controller) {
      timer = setInterval(() => {
        controller.enqueue("Hello, World!\n");
      }, 1000);
    },
    cancel() {
      clearInterval(timer); // WAŻNE: obsługa rozłączenia klienta
    },
  });
  return new Response(body.pipeThrough(new TextEncoderStream()), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
});
```

### Routing z URLPattern (wbudowane API webowe)

```ts
const userPattern = new URLPattern({ pathname: "/users/:id" });

Deno.serve((req) => {
  const match = userPattern.exec(req.url);
  if (match) {
    const id = match.pathname.groups.id;
    return new Response(`User ${id}`);
  }
  return new Response("Not found", { status: 404 });
});
```

Do bardziej zaawansowanego routingu: `route()` z `@std/http` lub frameworki Oak/Hono.

### Serwowanie statycznych plików

```ts
import { serveDir } from "jsr:@std/http/file-server";

Deno.serve((req) => serveDir(req, { fsRoot: "./public" }));
```

Uruchomienie: `deno run -N -R server.ts`

### Graceful shutdown

```ts
const server = Deno.serve((_req) => new Response("Hello"));

Deno.addSignalListener("SIGINT", async () => {
  console.log("shutting down");
  await server.shutdown();
});
```

### HTTPS

```ts
Deno.serve({
  port: 8443,
  cert: Deno.readTextFileSync("./cert.pem"),
  key: Deno.readTextFileSync("./key.pem"),
}, (_req) => new Response("Hello over HTTPS!"));
```

### WebSocket

```ts
Deno.serve((req) => {
  if (req.headers.get("upgrade") != "websocket") {
    return new Response(null, { status: 426 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  socket.addEventListener("open", () => console.log("client connected!"));
  socket.addEventListener("message", (event) => {
    if (event.data === "ping") socket.send("pong");
  });

  return response;
});
```

### Automatyczna kompresja body

```ts
Deno.serve({ automaticCompression: true }, () => new Response("hello"));
```

Lub przez zmienną środowiskową: `DENO_SERVE_AUTOMATIC_COMPRESSION=1`

Kompresja gzip/brotli działa gdy:
- Request ma nagłówek `Accept-Encoding` z `br` lub `gzip`
- Response ma kompresowalny `Content-Type`
- Body > 64 bajtów

### Default fetch export (deno serve)

```ts
export default {
  fetch(request) {
    return new Response(`User Agent: ${request.headers.get("user-agent")}`);
  },
} satisfies Deno.ServeDefaultExport;
```

Uruchomienie: `deno serve server.ts`

## Zalecane frameworki

| Framework | Zastosowanie | Instalacja |
|-----------|-------------|------------|
| **Oak** | Middleware HTTP (Express-like) | `jsr:@oak/oak` |
| **Hono** | Lekki framework (Express/Sinatra) | `npm:create-hono` |
| **Fresh** | Framework full-stack (Deno-native) | `jsr:@fresh/init` |
| **Next.js** | React full-stack | `npm:create-next-app` |