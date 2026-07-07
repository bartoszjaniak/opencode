## Data Access Patterns in Rust

### Intent

Structure database access code for maintainability, testability, and performance in a Rust/Tauri desktop application — separating persistence concerns from business logic, managing connections and transactions, and handling the offline-first nature of a local desktop app.

### Problem

Desktop apps with local databases face unique challenges:

- No network latency, but high read/write volume from multiple UI components
- Mixed sync and async usage (Tauri commands are async, CPU work is sync)
- Offline-first means the local DB is the source of truth, not a cache
- Schema migrations must work without a server-side migration runner

### Approach

#### 1. Repository pattern with traits

Define a trait per aggregate root. Implement it for the real database and for tests.

```rust
#[async_trait]
pub trait DocumentRepository: Send + Sync {
    async fn find_by_id(&self, id: DocumentId) -> Result<Document, DocumentError>;
    async fn find_by_title(&self, title: &str) -> Result<Option<Document>, DocumentError>;
    async fn find_all(&self, filter: DocumentFilter) -> Result<Vec<DocumentSummary>, DocumentError>;
    async fn save(&self, document: &Document) -> Result<Document, DocumentError>;
    async fn delete(&self, id: DocumentId) -> Result<(), DocumentError>;
    async fn search(&self, query: &str, limit: usize) -> Result<Vec<DocumentSummary>, DocumentError>;
}
```

#### 2. Connection management

Tauri apps are single-process. Use a connection pool even for SQLite (it allows concurrent reads).

```rust
use sqlx::sqlite::{SqlitePoolOptions, SqlitePool};

pub type DbPool = SqlitePool;

pub async fn create_pool(database_url: &str) -> Result<DbPool, sqlx::Error> {
    SqlitePoolOptions::new()
        .max_connections(8)
        .min_connections(1)
        .connect(database_url)
        .await
}
```

#### 3. Migration patterns

**SQLx** — compile-time checked SQL in `migrations/` directory. Run via `sqlx::migrate!("./migrations").run(&pool).await`.

**Diesel** — `diesel migration generate` + `embed_migrations!()` + `embedded_migrations::run(&conn)`.

Pro tips: Store the DB path in `app.path().app_data_dir()`. Create the file on first launch. Run migrations at app startup.

#### 4. Transaction management

```rust
pub async fn update_document_title(pool: &DbPool, id: DocumentId, new_title: &str) -> Result<Document, DocumentError> {
    let mut tx = pool.begin().await.map_err(...)?;

    let existing = sqlx::query_as::<_, Document>("SELECT * FROM documents WHERE id = ?")
        .bind(&id).fetch_optional(&mut *tx).await?
        .ok_or(DocumentError::NotFound { id })?;

    let duplicate = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM documents WHERE title = ? AND id != ?"
    ).bind(new_title).bind(&id).fetch_one(&mut *tx).await?;

    if duplicate > 0 {
        return Err(DocumentError::DuplicateTitle { title: new_title.into() });
    }

    sqlx::query("UPDATE documents SET title = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(new_title).bind(&id).execute(&mut *tx).await?;

    tx.commit().await?;
    Self::find_by_id(pool, id).await
}
```

#### 5. Query optimization patterns

- **Pagination**: Use `LIMIT ? OFFSET ?` with a separate `COUNT(*)` query. Never return unbounded lists.
- **FTS5 full-text search**: Create an FTS virtual table for document content. Query via `MATCH ?` with `ORDER BY rank`.
- **WAL mode**: `PRAGMA journal_mode=WAL` + `PRAGMA synchronous=NORMAL` for concurrent reads.
- **Prepared statements**: SQLx caches prepared statements per pool automatically.
- **Indexes**: Always index foreign keys, sort columns, and search text columns.

#### 6. Offline-first strategies

- **Single writer, multiple readers**: SQLite WAL mode supports this natively.
- **Version columns**: Use `version INTEGER NOT NULL DEFAULT 1`. On update, check `version = ?` and increment — optimistic concurrency without locks.
- **Event-driven invalidation**: After writes, broadcast `DocumentChanged` events so the UI reactively refreshes.
- **Sync queue**: Write to the local DB immediately; queue changes in a `sync_queue` table for cloud sync.

### When to use

| Pattern | When |
|---------|------|
| Repository trait | All domain data access, enables test mocks |
| Pooled connection | Always (even for SQLite single-user) |
| SQLx migrations | Compile-time checked SQL, SQLite-first |
| Transactions | Multiple dependent writes, consistency guarantees |
| Pagination | Any list endpoint that could grow large |
| FTS5 | Full-text search in documents |
| WAL mode | All SQLite apps for concurrent read performance |
| Version columns | Offline-first concurrency control |

### Pros

- Repository traits make data access testable with mock implementations
- SQLx gives compile-time SQL verification (when using `query!` macros)
- SQLite WAL mode offers excellent desktop performance
- Migration files are version-controlled and reproducible
- Transaction scope is explicit and composable

### Cons

- SQLx `query_as!` macros require a running database at compile time (use runtime `query_as` for offline builds)
- Diesel's schema DSL is more verbose than raw SQL
- Repository traits add indirection for simple CRUD
- SQLite's single-writer limit can be a bottleneck under heavy write load

### Rust-specific considerations

- `sqlx::Pool` is `Clone` and `Send + Sync` — pass as `tauri::State` to all commands.
- `rusqlite` (sync) + `deadpool` works when you need synchronous access from `spawn_blocking`.
- Diesel requires `#[derive(Queryable, Insertable)]` and a schema module — more ceremony but strong type safety.
- SQLite `PRAGMA` must be re-applied per connection; use `after_connect` in pool setup.
- For Tauri, prefer `sqlx` over Diesel — async is the default and it fits the `tauri::command` pattern naturally.
- Use UUID primary keys (not auto-increment integers) to avoid ID conflicts when syncing between devices.