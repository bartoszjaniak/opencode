## Event Sourcing

### Intent

Store the state of a system as an immutable, ordered sequence of **events** rather than as a snapshot of current state. To determine current state, replay all events for a given aggregate; to determine state at any point in time, replay up to that point.

### Problem

Traditional CRUD persistence overwrites the previous state — the "what happened" is lost. This creates problems:
- Audit trails must be built separately (and often inaccurately)
- Temporal queries ("what did the cart look like last Tuesday?") require complex versioning
- Debugging requires reproducing the exact sequence of operations
- Event-driven integrations require deriving events from state diffs (unreliable)

### Core Concepts

```
Time ──────────────────────────────────────────────────────►
                                                             current
Event[0] → Event[1] → Event[2] → ... → Event[N]          state
   │          │          │                   │
   │          │          │                   │
   ▼          ▼          ▼                   ▼
 ┌──────────────────────────────────────────────┐
 │            Event Store (append-only)          │
 │  id │ aggregate_id │ type │ data │ version    │
 │ ────┼──────────────┼──────┼──────┼────────── │
 │  1  │ ord-123      │ OrderCreated  │ {…} │ 1  │
 │  2  │ ord-123      │ ItemAdded    │ {…} │ 2  │
 │  3  │ ord-123      │ OrderShipped │ {…} │ 3  │
 └──────────────────────────────────────────────┘
```

**Event** — a fact that has happened in the past, named in past tense (`OrderPlaced`, `ItemShipped`). Immutable, append-only. Contains:
- Aggregate identifier
- Event type / version
- Timestamp
- Payload (the data that changed)
- Metadata (correlation ID, causation ID, user)

**Aggregate** — a cluster of domain objects that accepts commands and produces events. Its current state is derived by folding events left-to-right.

**Event Store** — an append-only database (specialized like EventStoreDB, or a regular DB with a structured `events` table). Supports:
- Append (by aggregate ID, with optimistic concurrency via version check)
- Read all events (by aggregate ID)
- Read events by type, time range, or global position

**Snapshot** — at a given version N, save the entire aggregate state. On replay, load the most recent snapshot + replay only events after it. Speeds up aggregates with long event streams.

**Projection** — a subscriber that reads events and builds a secondary read model (materialized view, search index, cache).

### Structure

```
                    ┌──────────────────┐
    Command ───────►│  Aggregate Root  │
                    │  (domain logic)  │
                    └────────┬─────────┘
                             │ produces
                             ▼
                    ┌──────────────────┐
                    │   Event[s]        │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Event Store      │
                    │  (append-only)    │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
         ┌────────┐   ┌──────────┐   ┌──────────┐
         │ Snapshot │   │ Projection│  │ Projection│
         │ Store   │   │ (Read 1)  │  │ (Read 2)  │
         └────────┘   └──────────┘   └──────────┘
```

### Loading and Saving

```
load(id):
  snapshot = snapshotStore.get(id)
  events = eventStore.getEvents(id, afterVersion: snapshot.version)
  aggregate = new Aggregate()
  for event in events:
    aggregate.apply(event)
  return aggregate

save(aggregate):
  newEvents = aggregate.pendingEvents()
  eventStore.append(id, aggregate.version, newEvents)
  if shouldTakeSnapshot(aggregate):
    snapshotStore.put(id, aggregate.state, aggregate.version)
  aggregate.clearPendingEvents()
```

### When to Use

- Full audit trail is a hard requirement (finance, compliance, healthcare)
- Temporal queries are frequent — "state as of date X"
- Complex, long-lived business processes where understanding past decisions matters
- Event-driven architecture with multiple downstream consumers (they read events directly)
- Debugging / replays in non-production to reproduce production scenarios
- CQRS is already in use (they pair naturally)

### When NOT to Use

- Simple CRUD — event sourcing adds massive complexity for no benefit
- High-volume, low-value data (e.g., IoT sensor readings — streams are too large)
- Frequent schema changes on historical events — event migration is hard
- Small team — replay logic, snapshot management, versioning, and projection rebuilds require significant knowledge
- Strong consistency across reads is needed immediately — event sourcing implies eventual consistency
- The domain has simple state with no interesting history

### Pros

- **Complete audit trail** — every change is recorded, cannot be tampered with
- **Temporal queries** — reconstruct state at any point in time
- **Event-driven** — events are naturally available for integration (no separate event derivation)
- **Debugging** — replay events in test to reproduce exact production state
- **No ORM impedance mismatch** — events map naturally to domain events
- **Regression safety** — new feature replays existing events and checks output
- **Versioning** — can run multiple versions of projection logic on the same event stream

### Cons

- **Learning curve** — thinking in events instead of state is non-trivial
- **Schema evolution** — changing event structure over time requires upcasting, versioning, careful migration
- **Consistency model** — eventual consistency for projections, no simple "save and read back"
- **Storage growth** — events accumulate indefinitely; snapshots mitigate but add complexity
- **Event store maturity** — specialized stores are less mature than general-purpose DBs
- **Deletion / GDPR** — deleting data requires rewriting or tombstone events (hard with immutable streams)

### Related Patterns

- **CQRS** — writes produce events, reads consume them through projections; the canonical pairing
- **Snapshot** — optimization pattern within event sourcing, not a standalone pattern
- **Saga** — composed from events; each step emits an event that triggers the next step
- **Transactional Outbox** — can feed into the event store for reliable publication
- **Command Sourcing** — store commands (intents) instead of events (facts); rarely used, much harder
- **Eventual Consistency** — the consistency model that projections operate under

### Event Schema Versioning Example

```
v1: OrderShipped { orderId, shippedAt }
v2: OrderShipped { orderId, shippedAt, carrier, trackingNumber }

Upcast function:
  def upcastV1toV2(event):
    return { **event, carrier: "unknown", trackingNumber: null }
```

Upcasting runs at load time, transparent to the domain.
