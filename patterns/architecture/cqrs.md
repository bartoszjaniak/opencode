## CQRS — Command Query Responsibility Segregation

### Intent

Separate the model that reads data from the model that writes data. Instead of a single CRUD-style representation, CQRS introduces distinct **command** (write) and **query** (read) interfaces, each with its own data structures, storage, and scaling characteristics.

### Problem

Traditional CRUD models use one entity representation for both reads and writes. This works for simple domains but breaks down when:
- Read and write shapes diverge (e.g., writes need normalized aggregates, reads need denormalized projections)
- Write throughput requires different infrastructure from read throughput
- Complex domain logic on writes conflicts with fast, simple query paths
- Multiple read representations are needed (reporting, search, dashboards)

### Structure

```
┌─────────────────────────────────────────────────┐
│                    Client                        │
└────┬──────────────────────────┬──────────────────┘
     │                          │
     ▼                          ▼
┌──────────┐            ┌────────────────┐
│ Command  │            │    Query       │
│  Model   │            │    Model       │
├──────────┤            ├────────────────┤
│ Command  │  (async)   │   Read Store   │
│ Handler  │──────────► │ (projected,    │
│   +      │  (event)   │  denormalized) │
│  Write   │            │                │
│  Store   │            │  Query         │
│ (normal) │            │  Handler       │
└──────────┘            └────────────────┘
     │                          ▲
     │  (event bus /           │
     ▼    message queue)       │
┌─────────────────────────────────────────┐
│         Projection / Sync               │
│  (event → update read model)            │
└─────────────────────────────────────────┘
```

**Components:**
- **Command**: a verb-based intent (`PlaceOrder`, `CancelBooking`). Named in imperative, contains only the data needed to execute.
- **Command Handler**: validates, applies domain logic, persists to write store, publishes resulting events.
- **Write Store**: normalized for consistency (typically OLTP — PostgreSQL, MSSQL, DynamoDB).
- **Read Store**: denormalized for query speed (Elasticsearch, Redis, read-only tables, materialized views).
- **Projection**: subscribes to events published after successful commands and updates the read store(s).
- **Query Handler**: simple data fetching — no business logic, no side effects.

### Synchronization Strategies

| Strategy | Description | When |
|----------|-------------|------|
| **Sync** | Projection updates read store in the same transaction | Low latency, strong consistency but couples write path |
| **Async / Event** | Write publishes event to a message bus; projection consumes it | Loose coupling, eventual consistency, best for most CQRS |
| **CDC** | Capture Data Change — stream DB write-ahead log to projection | Decouples entirely, no dual-write problem |
| **Batch** | Periodic materialized view refresh (e.g., every 5 min) | Reporting / analytics only |

### When to Use

- Read and write workloads have distinctly different shapes, volumes, or latency requirements
- The same data needs multiple read representations (REST + search + analytics)
- A team is already separating domain logic from queries (natural progression)
- Event sourcing is also in use (they pair naturally)
- Write concurrency is high and optimistic locking overhead is unacceptable

### When NOT to Use

- Simple CRUD with no divergence between read/write shapes
- Small team — CQRS adds ceremony (two models, sync infrastructure, projection management)
- Strong consistency required between read and write immediately (e.g., "write and immediately read back" on same screen)
- The domain logic is thin (CQRS repays complexity only when the write side has meaningful logic)

### Pros

- **Independent scaling** — read stores can replicate freely, write stores can be vertically scaled
- **Optimized schemas** — each model uses its ideal storage format (3NF for writes, denormalized/full-text/search-optimized for reads)
- **Security** — fine-grained: commands can authorize intent, queries authorize data access separately
- **Evolution** — read models can change without touching write model and vice versa
- **Performance** — query handlers are trivially fast (no domain logic), command handlers stay small

### Cons

- **Complexity** — two code paths, synchronization mechanism, potential duplication of transformation logic
- **Eventual consistency** — reads may lag behind writes; requires UI patterns (optimistic UI, stale indicators)
- **Infrastructure** — message bus, projection workers, separate stores increase ops burden
- **No ORM convenience** — hand-written handlers, no simple `.save()` from a single entity
- **Team cognitive load** — new members must understand the split and the sync mechanism

### Related Patterns

- **Event Sourcing** — natural pairing: commands produce events, events build read projections
- **Transaction Outbox** — reliable event publishing from command side without dual-write
- **Saga** — coordinates commands across services; each command in a saga is a CQRS command
- **Materialized View** — the read store is often exactly a materialized view pattern
- **Repository** — can wrap the write store behind a domain-oriented interface; the query side typically skips Repository for direct access
- **DDD Aggregate** — commands target a single aggregate; one command handler loads one aggregate, applies logic, saves

### Example Command/Query Shape

```text
COMMAND: PlaceOrder(customerId: UUID, items: LineItem[], shippingAddress: Address)
QUERY:   GetOrderSummary(orderId: UUID) → { id, status, total, itemCount }
QUERY:   SearchOrders(customerId: UUID, status: OrderStatus, page: int) → PageResult<OrderRow>
```

The command takes domain objects; the query returns flat DTOs. Two interfaces, two implementations, two stores — one domain.
