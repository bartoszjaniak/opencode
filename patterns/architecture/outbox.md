## Transactional Outbox

### Intent

Reliably publish events (or messages) as part of a database transaction, ensuring that event publication is **atomic** with the data change — the event is never lost if the transaction commits, and never published if the transaction rolls back. This solves the "dual-write problem" between a database and a message broker.

### Problem

When a service needs to persist data AND publish an event in the same logical operation, a naive approach creates a **dual-write**:

```
// Naive — NOT safe
db.save(order)                  ← success
messageBus.publish(event)       ← FAILS → order saved, event lost
```

or:

```
messageBus.publish(event)       ← success
db.save(order)                  ← FAILS → event published, order not saved
```

There is no atomic commit across a database and a message broker. Distributed transactions (XA, 2PC) are slow, complex, and not supported by most brokers. Without the outbox pattern:
- Events are silently lost, breaking downstream consumers
- Events are duplicated when retry logic is added naively
- Manual reconciliation is required to detect missing events

### Structure

```
  ┌──────────────────────────────────────┐
  │           Service                     │
  │                                      │
  │   BEGIN TRANSACTION                  │
  │     db.save(aggregate)               │
  │     outbox.insert(event)             │← same transaction
  │   COMMIT                             │
  │                                      │
  │   ┌─────────────────────────┐        │
  │   │    Outbox Table          │        │
  │   │  id │ type │ payload │   │        │
  │   │  1  │ OrderCreated │ {…}│        │
  │   │  2  │ PaymentDone  │ {…}│        │
  │   └─────────────────────────┘        │
  └──────────────────┬───────────────────┘
                     │
                     ▼
           ┌─────────────────┐
           │  Message Relay   │
           │  (poll / CDC)    │
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │  Message Broker  │
           │ (Kafka, RabbitMQ,│
           │  SQS, Pub/Sub)   │
           └─────────────────┘
```

### Outbox Table

A table in the same database as the application data. Minimal schema:

```sql
CREATE TABLE outbox (
  id            UUID PRIMARY KEY,       -- globally unique
  aggregate_id  TEXT NOT NULL,           -- for ordering per aggregate
  aggregate_type TEXT NOT NULL,          -- e.g. "order"
  event_type    TEXT NOT NULL,           -- e.g. "OrderCreated"
  payload       JSONB NOT NULL,          -- event data
  created_at    TIMESTAMP NOT NULL,
  processed_at  TIMESTAMP,              -- null until relayed
  traceparent   TEXT,                    -- OpenTelemetry context
  -- optional:
  correlation_id TEXT,
  causation_id  UUID
);
```

### Message Relay Strategies

#### 1. Polling (Pull)

A background process polls the outbox table for unprocessed rows, publishes them to the broker, then marks them as processed (or deletes them).

```
while True:
  tx = db.begin()
  rows = db.query("SELECT * FROM outbox WHERE processed_at IS NULL ORDER BY created_at LIMIT 100")
  for row in rows:
    broker.publish(row.event_type, row.payload)
    db.execute("UPDATE outbox SET processed_at = NOW() WHERE id = $1", row.id)
  tx.commit()
  sleep(interval)
```

**Pros:** Simple, no extra infrastructure, works with any DB.
**Cons:** Polling latency (even with short intervals), DB load from repeated queries.

#### 2. Transaction Log Tailing (CDC)

A CDC connector (Debezium, AWS DMS, logical replication) reads the database's write-ahead log and streams changes to the broker. The outbox table's inserts are detected as WAL entries.

**Pros:** Low latency, no polling load, no timestamp column needed.
**Cons:** Requires CDC setup (extra infrastructure), complex, only works with databases that support log reading (PostgreSQL, MySQL, SQL Server).

#### 3. Outbox with SQS/Queue Integration

Write to outbox table + immediately send to an in-memory queue or local SQS for near-real-time relay, with the outbox table serving as the reliable fallback (outbox table is the source of truth, queue is optimization).

### Idempotent Consumption

Consumer must handle **at-least-once** delivery — the relay may publish the same event twice (crash after publish, before marking processed). Consumers use **idempotency keys**:

```
onMessage(event):
  if alreadyProcessed(event.id): return       // dedup
  process(event)
  markProcessed(event.id)
```

### Ordering Guarantees

| Guarantee | How |
|-----------|-----|
| Per-aggregate ordering | Insert rows in order; relay processes in `created_at` order per `aggregate_id` |
| Global ordering | Use a single-writer relay; or accept that global ordering is not needed (Kafka partitions) |
| Exactly-once delivery | Not realistic — aim for at-least-once + idempotent consumer |

### When to Use

- A service must publish events as part of a business transaction
- The broker cannot participate in distributed transactions (SQS, RabbitMQ, Kafka, Pub/Sub)
- Event loss is unacceptable (finance, order processing, compliance)
- Dual-write problems are causing inconsistency in production
- CQRS / Event Sourcing is in use — the command side publishes domain events

### When NOT to Use

- Event delivery can tolerate loss (e.g., cache invalidation — re-cache on next read)
- Broker is the primary data store, not the database (rare — event sourcing with event store as source of truth)
- Single-process, single-threaded application where dual-write can be synchronized (synchronous broker)
- Prototype / MVP — add outbox when event loss becomes a real problem

### Pros

- **Reliability** — events are never lost if the transaction commits
- **Atomicity** — no dual-write; data and events are consistent by definition
- **Recovery** — on relay crash, unprocessed events are still in the outbox table — processing resumes on restart
- **Audit** — the outbox table serves as a raw event log for debugging
- **Replay** — reprocess events by setting `processed_at = NULL`
- **Broker-agnostic** — relay can publish to any broker (or multiple) without changing application code

### Cons

- **Extra table** — adds a table to maintain, index, and clean up
- **Table growth** — outbox table grows until processed rows are deleted or archived
- **Polling latency** — polling-based relays introduce latency between event insertion and publication
- **Ordering complexity** — strict global ordering is hard; per-aggregate ordering is achievable but adds complexity
- **Storage cost** — events are stored twice (outbox table + broker topic)

### Variations

**Outbox + Delete**: delete processed rows immediately (saves space, but loses audit trail). Careful: deleting in the same transaction as marking processed adds complexity.

**Outbox + Move to Archive**: move processed rows to an `outbox_archive` table for querying.

**Dual Outbox**: write to two outbox tables (different databases) for cross-DB publication, though this introduces its own dual-write.

**Transactional Inbox** (reciprocal pattern): the consumer stores incoming events in a local inbox table, then processes them. Prevents duplicate processing from re-delivery.

### Related Patterns

- **CQRS** — command side uses outbox to publish domain events that the read side subscribes to
- **Event Sourcing** — the event store IS the outbox; events are appended in a transaction, then relayed to projections
- **Saga** — each saga step uses outbox to publish the event that triggers the next step or compensation
- **Idempotent Consumer** — complements outbox's at-least-once delivery
- **Polling Consumer / CDC** — the message relay strategies are instances of these broader patterns
- **Two-Phase Commit** — the alternative that outbox replaces (don't use 2PC for this)

### Example: Order Creation with Outbox

```
Service.createOrder(data):
  using (tx = db.begin()):
    order = new Order(data)
    db.orders.insert(order)
    db.outbox.insert({
      id: uuid(),
      aggregate_id: order.id,
      aggregate_type: "order",
      event_type: "OrderCreated",
      payload: { orderId: order.id, customerId: data.customerId, total: order.total },
      created_at: now()
    })
    tx.commit()
  // order is visible, event is safely stored
  // relay will pick it up and publish to Kafka/RabbitMQ/SQS
```
