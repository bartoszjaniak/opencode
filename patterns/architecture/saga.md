## Saga / Process Manager

### Intent

Manage a **long-running**, **distributed transaction** that spans multiple services, aggregates, or bounded contexts by breaking it into a sequence of local transactions, each with a **compensation** action for rollback. A saga ensures overall consistency without distributed locking or two-phase commit.

### Problem

In a distributed system, a single business operation often spans multiple services (order → payment → inventory → shipping). Traditional ACID transactions cannot span separate databases or services (2PC is slow, fragile, and not supported by most NoSQL stores or message brokers). Without a saga,:
- Partial failures leave data inconsistent (payment deducted, inventory not reserved)
- Manual reconciliation is needed to detect and repair inconsistent state
- Distributed locking kills availability and performance

### Structure

```
Saga: PlaceOrder

  ┌─────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
  │ Order   │     │ Payment │     │ Inventory│     │ Shipping │
  │ Service │     │ Service │     │ Service  │     │ Service  │
  └────┬────┘     └────┬────┘     └────┬─────┘     └────┬─────┘
       │                │               │                │
  ───► CreateOrder ──► Authorize ───► Reserve ───────► Schedule
       │                │               │                │
       │    (forward)   │               │                │
       │                │               │                │
       │ (compensation) │               │                │
  ◄─── CancelOrder ◄─── Refund ◄───── Release ◄─────── Cancel
```

### Two Coordination Models

#### Choreography (Event-Driven)

Each service, after completing its local transaction, emits an event that triggers the next service. There is no central coordinator.

```
┌──────────┐     OrderCreated     ┌──────────┐
│  Order   │────────────────────► │  Payment  │
│  Service │                      │  Service  │
└──────────┘                      └──────────┘
                                       │
                                  PaymentAuthorized
                                       │
                                       ▼
                                  ┌──────────┐
                                  │Inventory │
                                  │ Service  │
                                  └──────────┘
                                       │
                                  InventoryReserved
                                       │
                                       ▼
                                  ┌──────────┐
                                  │ Shipping │
                                  │ Service  │
                                  └──────────┘
```

**Pros:** Simple, no single point of failure, natural event flow.
**Cons:** Logic is distributed — hard to understand the full saga by looking at one service. Compensation is scattered.

#### Orchestration (Central Coordinator)

A dedicated **Saga Orchestrator / Process Manager** tells each service what to do and handles failures.

```
┌──────────────────────────────────────┐
│         Saga Orchestrator            │
│                                      │
│  1. CreateOrder  ──► Order Service   │
│  2. Authorize    ──► Payment Service │
│  3. Reserve      ──► Inventory       │
│  4. Schedule     ──► Shipping        │
│                                      │
│  On failure → trigger compensations  │
└──────────────────────────────────────┘
```

**Pros:** Centralized logic — easy to understand, test, and monitor. Compensation orchestrated in one place.
**Cons:** Single point of failure, orchestrator can become a god object, couples services to the orchestrator.

### Saga Execution Flow

```
execute(order):
  try:
    orderId = orderService.createOrder(order)
    paymentId = paymentService.authorize(order.customer, order.total)
    reservationId = inventoryService.reserve(order.items)
    shipmentId = shippingService.schedule(order.address, order.items)
    orderService.confirmOrder(orderId)
  catch (PaymentFailed):
    inventoryService.release(reservationId)   // compensate
    orderService.cancelOrder(orderId)         // compensate
  catch (InventoryShort):
    paymentService.refund(paymentId)          // compensate
    orderService.cancelOrder(orderId)         // compensate
  catch (ShippingError):
    paymentService.refund(paymentId)          // compensate
    inventoryService.release(reservationId)   // compensate
    orderService.cancelOrder(orderId)         // compensate
```

### Key Concepts

**Local Transaction** — each step is a regular ACID transaction within a single service. No distributed locks.

**Compensation Action** — the reverse of a forward action. Must be idempotent and semantically correct (refunding a payment ≠ deducting payment; releasing inventory ≠ re-adding).

**Forward Action** — the step that progresses the saga (e.g., `AuthorizePayment`).

**Compensation Transaction** — what to run if a later step fails (e.g., `RefundPayment`).

**Saga Log** — persistent record of saga state (steps completed, compensations executed). Essential for recovery after crashes.

**Pivot Transaction** — the point of no return. Before pivot: compensations are straightforward. After pivot: the transaction cannot be undone (e.g., shipment dispatched). The saga can only proceed forward.

### Idempotency

Every saga action handler must be **idempotent** — the same command delivered twice must have the same effect as once. Messages can be duplicated (at-least-once delivery).

```
reserveInventory(sagaId, items):
  if alreadyReserved(sagaId): return existingReservation
  // actually reserve
```

### Failure Handling Strategies

| Strategy | Description |
|----------|-------------|
| **Forward recovery** | Retry the failed step (for transient failures like timeout) |
| **Backward recovery** | Execute all compensation actions, abort saga |
| **Manual intervention** | Escalate to operator — the saga enters a "failed" state awaiting human action |
| **Saga with timeout** | If a step doesn't complete within a deadline, trigger compensation |

### When to Use

- Business process spans multiple services, each with its own database
- The process takes seconds to hours/days (long-running transactions)
- No distributed locking is acceptable (most modern systems)
- Each step has a clear compensation action (refund, release, cancel)
- Event-driven architecture with eventual consistency tolerance

### When NOT to Use

- Single-database, single-service system — use ACID transactions
- The business requires strict rollback semantics — saga provides compensation, not atomic rollback
- No compensation can be defined (e.g., "send physical mail" cannot be unsent)
- Steps must be all-or-nothing — saga is inherently eventual (another step may succeed before a failure is detected)
- Very high throughput with simple state — consider workflow engine or process manager via state machine

### Pros

- **No distributed locks** — each service is independent and fully available
- **Resilience** — partial failures are handled gracefully (compensations, retries, timeouts)
- **Scalability** — each service scales independently
- **Audit** — saga log provides full trace of every step in every transaction
- **Flexibility** — choreography is simple, orchestration is explicit; choose per use case

### Cons

- **Eventually consistent** — there is a window of inconsistency (payment charged, then refunded)
- **Compensation complexity** — writing correct compensations is harder than writing forward actions
- **Idempotency mandate** — every step handler must be idempotent
- **Debugging** — saga failures span services; tracing requires correlation IDs through the entire flow
- **Orchestrator state management** — the orchestrator itself must be persistent and recoverable

### Related Patterns

- **CQRS** — saga commands are CQRS commands; saga events feed projections
- **Event Sourcing** — saga state can be event-sourced; saga events are domain events
- **Transactional Outbox** — reliable event publication from each saga step
- **Process Manager** — the orchestrator variant is also called Process Manager (EIP pattern)
- **Strangler Fig** — saga can coordinate migration from monolith to microservices
- **Two-Phase Commit** — the alternative that saga replaces (don't use 2PC in distributed systems)
