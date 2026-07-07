## Concurrency Patterns in Rust

### Intent

Handle multiple concurrent operations — I/O-bound async tasks, CPU-bound parallel work, and shared mutable state — safely and efficiently in a Rust/Tauri desktop application.

### Problem

Desktop apps juggle many concerns simultaneously: UI events, database queries, file I/O, background sync, and AI inference. Without structure, you get:

- Data races on shared state (Rust's borrow checker prevents this, but `Arc<Mutex<T>>` proliferation)
- Deadlocks from circular locking
- Tokio tasks that block the runtime on CPU-heavy work
- Over-subscription from spawning too many OS threads
- Async spaghetti where ordering matters

### Approach

#### 1. Async/await with tokio

Tauri 2 uses tokio internally. Your Rust backend runs on the tokio multi-threaded runtime.

```rust
#[tauri::command]
async fn search_documents(query: String, state: tauri::State<'_, AppState>) -> Result<Vec<Document>, Error> {
    let results = state.service.search(&query).await?;
    Ok(results)
}
```

#### 2. Channels for communication

| Channel | Usage | Characteristics |
|---------|-------|-----------------|
| `tokio::sync::mpsc` | Many-to-one, one-to-many | Buffered, bounded, multi-producer single-consumer |
| `tokio::sync::oneshot` | Request-response | One-shot, single-value, pairs a sender with a receiver |
| `tokio::sync::broadcast` | Fan-out events | Multi-producer multi-consumer, all subscribers see every message |
| `tokio::sync::watch` | State observation | Single-producer, keeps last value, new subscribers get current value |

```rust
// Oneshot: request a computation and await the result
let (tx, rx) = tokio::sync::oneshot::channel();
tokio::spawn(async move {
    let result = expensive_work().await;
    let _ = tx.send(result);
});
let value = rx.await?;

// Broadcast: notify all listeners of a document change
let (tx, _) = tokio::sync::broadcast::channel::<DocumentEvent>(32);
let mut rx = tx.subscribe();
tokio::spawn(async move {
    while let Ok(event) = rx.recv().await {
        handle_event(event);
    }
});
```

#### 3. Shared state with `Arc + RwLock / Mutex`

```rust
pub struct AppState {
    pub documents: Arc<RwLock<HashMap<Uuid, Document>>>,
    pub config: Arc<RwLock<Config>>,
    pub event_tx: broadcast::Sender<AppEvent>,
}
```

- `RwLock` for read-heavy access (UI reads, background writes)
- `Mutex` for write-heavy or simple exclusive access
- Never hold a lock across an `.await` point — use `tokio::sync::Mutex` if you must

#### 4. CPU-bound work with `spawn_blocking` and Rayon

Blocking the tokio runtime on CPU work starves other tasks.

```rust
// For IO-like blocking (e.g., synchronous file read)
let result = tokio::task::spawn_blocking(|| {
    std::fs::read_to_string("large_file.txt")
}).await?;

// For parallel CPU work (e.g., batch processing, search indexing)
use rayon::prelude::*;

let processed: Vec<Output> = large_list
    .par_iter()
    .map(|item| compute_heavy(item))
    .collect();
```

Run Rayon on a dedicated thread pool, not tokio's:

```rust
use rayon::ThreadPoolBuilder;

lazy_static! {
    static ref CPU_POOL: rayon::ThreadPool = ThreadPoolBuilder::new()
        .num_threads(num_cpus::get())
        .build()
        .unwrap();
}

let result = tokio::task::spawn_blocking(move || {
    CPU_POOL.install(|| {
        heavy_computation(data)
    })
}).await?;
```

#### 5. Actor model for complex state machines

Encapsulate state behind a channel-driven task:

```rust
pub struct DocumentActor {
    receiver: mpsc::Receiver<DocumentCommand>,
    store: DocumentStore,
}

enum DocumentCommand {
    Create { title: String, respond: oneshot::Sender<Result<Document, Error>> },
    Delete { id: DocumentId, respond: oneshot::Sender<Result<(), Error>> },
}

impl DocumentActor {
    pub async fn run(mut self) {
        while let Some(cmd) = self.receiver.recv().await {
            match cmd {
                DocumentCommand::Create { title, respond } => {
                    let result = self.store.create(title).await;
                    let _ = respond.send(result);
                }
                // ...
            }
        }
    }
}
```

### When to use

| Pattern | When |
|---------|------|
| `async`/`await` | All I/O-bound work (DB, files, network) |
| `mpsc` | Event streams, task queues, background workers |
| `oneshot` | RPC-style request-response within the backend |
| `broadcast` | Global events (document changed, sync complete) |
| `Arc<RwLock<T>>` | Shared config, read-heavy caches |
| `spawn_blocking` | FFI, synchronous I/O, CPU-bound work |
| Rayon | Parallel collection processing, search indexing |
| Actor model | Complex state with ordering guarantees |

### Pros

- Async/await is zero-cost — no runtime overhead for idle tasks
- Channels give clear ownership and backpressure semantics
- Rust's type system prevents data races at compile time
- Rayon integrates seamlessly with `par_iter`
- Actors provide natural isolation and message ordering

### Cons

- `Send + Sync` bounds can be restrictive when wrapping third-party types
- Holding `MutexGuard` across `.await` is a runtime error (not compile-time in all cases)
- Actor model adds boilerplate for message types and dispatch loops
- Debugging deadlocks in async code is harder than sync code
- `spawn_blocking` has a limited pool — blocking too many tasks starves the pool

### Rust-specific considerations

- `Send` means a value can be transferred between threads. `Sync` means it can be shared by reference. Most types are auto-derived.
- `Rc<T>` is not `Send`. Use `Arc<T>` for shared state across tasks.
- `tokio::sync::Mutex` is `Send` but not `Sync` (it's `!Sync` in some contexts). Prefer `std::sync::Mutex` for short locks.
- `rayon`'s `par_iter` requires `Send + IndexedParallelIterator`.
- Tauri's `#[tauri::command] async fn` runs on tokio. Use `tauri::State` for managed state.
- `Instrument` futures with `tracing` spans for debugging: `async { ... }.instrument(info_span!("handler"))`.
- Use `tokio_util::CancellationToken` for graceful shutdown of background tasks.
- Be mindful of `tokio::select!` — it cancels branches on completion, which can drop in-flight work.