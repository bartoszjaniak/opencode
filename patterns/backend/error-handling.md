## Error Handling in Rust

### Intent

Define a consistent, typed approach to error handling across the Rust backend — distinguishing recoverable errors from panics, enriching errors with context, and mapping domain errors to appropriate HTTP/gRPC/UI responses (or Tauri command failures).

### Problem

Rust has no exceptions. All errors are values. Without a deliberate strategy, you end up with:

- `Box<dyn Error>` soup that loses type information
- Mixed `anyhow`/`thiserror` usage across crate boundaries
- Panics in async code or Tauri commands crashing the backend
- Infrastructure errors (DB, network) leaking into domain logic
- Inconsistent error presentation to the frontend

### Approach

#### 1. Domain errors with `thiserror`

Define a `#[derive(Error)]` enum per crate or module. Each variant represents a known failure mode of that domain.

```rust
#[derive(Debug, thiserror::Error)]
pub enum DocumentError {
    #[error("document not found: {id}")]
    NotFound { id: DocumentId },
    #[error("document title already exists: {title}")]
    DuplicateTitle { title: String },
    #[error("validation failed: {0}")]
    Validation(String),
    #[error("persistence error: {0}")]
    #[from(ignore)]
    Persistence(Box<dyn std::error::Error + Send + Sync>),
}
```

#### 2. App-level errors with `anyhow`

Use `anyhow::Error` / `anyhow::Result<T>` for application glue code, CLI entry points, and Tauri commands — where you don't need callers to match on specific variants.

```rust
pub type AppResult<T> = Result<T, anyhow::Error>;
```

#### 3. Error context enrichment

Wrap low-level errors with context before they cross module boundaries:

```rust
use anyhow::Context;

let record = db.query(...)
    .await
    .context("failed to fetch document record")?;
```

#### 4. Mapping domain errors to app errors

Convert typed domain errors into `anyhow` at the boundary:

```rust
repository.find_by_id(id)
    .await
    .map_err(|e| match e {
        DocumentError::NotFound { .. } => anyhow::anyhow!("{e}"),
        DocumentError::Persistence(inner) => anyhow::anyhow!(inner),
        other => anyhow::anyhow!("{other}"),
    })
```

#### 5. Tauri command error boundary

Tauri commands must return `Result<T, String>` or `Result<T, E> where E: Serialize`. Use a serializable error type.

```rust
#[derive(Debug, Serialize, serde::Deserialize)]
pub struct CommandError {
    pub kind: String,
    pub message: String,
    pub details: Option<String>,
}

impl From<anyhow::Error> for CommandError {
    fn from(e: anyhow::Error) -> Self {
        CommandError {
            kind: "internal".into(),
            message: e.to_string(),
            details: None,
        }
    }
}

#[tauri::command]
async fn create_document(title: String) -> Result<Document, CommandError> {
    let doc = service.create(title).await?;
    Ok(doc)
}
```

#### 6. Panic boundaries

- All Tauri commands are already wrapped in a panic boundary by Tauri's runtime.
- For background threads/tasks, use `std::panic::catch_unwind` or `tokio::task::spawn_blocking` with `HandleError`.
- Log panics with `tracing` or `log`:

```rust
use std::panic;

let prev = panic::take_hook();
panic::set_hook(Box::new(move |info| {
    tracing::error!("panic: {info}");
    prev(info);
}));
```

### When to use

| Pattern | When |
|---------|------|
| `thiserror` enum | Per-crate domain errors, library crates, API boundaries |
| `anyhow` | Application glue, Tauri commands, CLI, where callers don't match variants |
| Error context | Anywhere you propagate a low-level error upward |
| Serializable error | Tauri command return types, IPC boundaries |
| Panic boundary | Background threads, FFI callbacks, worker pools |

### Pros

- Type-safe, exhaustive matching on known failures
- `thiserror` derives reduce boilerplate
- `anyhow` with `Context` gives rich error chains
- No hidden control flow (unlike exceptions)
- Panic boundaries prevent single-task crashes from taking down the app

### Cons

- `anyhow` loses typed error information — callers can't match on specific variants
- Requires boilerplate for mapping between error types at module boundaries
- `Box<dyn Error>` in variants can be awkward to construct
- `thiserror` + `anyhow` together add a dependency cost

### Rust-specific considerations

- `std::error::Error` requires `Debug + Display`. `thiserror` derives both.
- `#[from]` generates `From` impls, but use `#[from(ignore)]` for types that aren't `Into<Error>`.
- Tauri 2 uses `#[tauri::command]` with `Result<T, E>` where `E: Serialize`. If `E: Into<InvokeError>`, Tauri serializes it to the frontend.
- `Send + Sync` bounds on errors: `anyhow::Error` implements both, custom enums must too.
- `catch_unwind` requires `UnwindSafe` — use `AssertUnwindSafe` wrapper when needed.
- Prefer `tracing` over `log` for structured error fields (`tracing::error!(error = %e, "operation failed")`).
- For Tauri, never `unwrap()` in commands — the frontend has no way to recover from a panic.