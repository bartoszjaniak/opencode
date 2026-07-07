## DDD Tactical Patterns

### Intent

Provide a concrete toolkit of building blocks for implementing a domain model within a **Bounded Context**. Tactical patterns bridge strategic DDD (context mapping, ubiquitous language) to executable code — they give names and rules to the elements that model domain behavior, state, and identity.

### Problem

Without tactical guidance, domain logic leaks in every direction:
- Business rules end up in services, controllers, or SQL queries
- No distinction between things with identity (entities) and things without (value objects)
- Aggregate boundaries are ambiguous — transactions span too much or too little
- Domain events are either absent or ad-hoc
- Repositories become generic `save`/`find` with no domain-friendly interface

### Building Blocks

```
┌─────────────────────────────────────────────────────────────┐
│                    Bounded Context                            │
│                                                              │
│  ┌──────────┐   ┌──────────────────────────────────────┐    │
│  │ Service  │──►│           Aggregate Root              │    │
│  │ (Domain) │   │  ┌────────┐  ┌───────────┐           │    │
│  └──────────┘   │  │ Entity │  │ Value     │           │    │
│                  │  │        │  │ Object    │           │    │
│                  │  └────────┘  └───────────┘           │    │
│                  └──────────────────┬───────────────────┘    │
│                                     │                        │
│                                     │ produces               │
│                                     ▼                        │
│                           ┌─────────────────┐               │
│                           │  Domain Event    │               │
│                           └─────────────────┘               │
│                                                              │
│  ┌────────────────┐     ┌──────────────────────┐            │
│  │  Repository     │     │   Factory            │            │
│  │  (interface)    │     │   (creation logic)   │            │
│  └────────────────┘     └──────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### 1. Entity

An object with **identity** that continues to exist over time, even as its attributes change.

- Two entities are equal if their identities are equal, regardless of other fields
- Must have a stable identifier (`UUID`, `int`, natural key)
- Typically mutable — its behavior produces state changes
- Contains business logic that enforces invariants

```
class Order {
  constructor(readonly id: OrderId) {}     // identity
  private _status: OrderStatus;
  private _items: OrderLine[];

  addItem(product: Product, quantity: number): void {
    if (this._status !== 'pending') throw new Error('Order already placed')
    this._items.push(new OrderLine(product, quantity))
    this._total = this._items.reduce((sum, i) => sum + i.price, 0)
  }
}
```

### 2. Value Object

An object defined solely by its attributes — **immutable**, no identity.

- Two value objects are equal if all their attributes are equal
- Must be immutable (constructor sets everything, no setters)
- Self-validating on creation — an invalid value object cannot exist
- Can have methods that produce new value objects

```
class Money {
  constructor(readonly amount: number, readonly currency: Currency) {
    if (amount < 0) throw new Error('Negative money')
    if (!currency) throw new Error('Currency required')
  }
  add(other: Money): Money {
    if (this.currency !== other.currency) throw new Error('Currency mismatch')
    return new Money(this.amount + other.amount, this.currency)
  }
}
```

### 3. Aggregate

A cluster of entities and value objects treated as a single unit for data changes. One entity is the **Aggregate Root** — the only object external callers can reference directly.

**Rules:**
- **Consistency boundary**: all invariants within the aggregate are enforced atomically. References from outside the aggregate may only reference the aggregate root.
- **Transaction boundary**: one aggregate = one transaction. Do not modify multiple aggregates in a single transaction.
- **Persistence**: only the aggregate root has a Repository. Internal entities are reached through the root.
- **Identity**: the aggregate root has a globally unique identity; internal entities have locally unique identity.

```
class Order {                     // Aggregate Root
  private _items: OrderLine[]     // internal entity — not referenced by anything else
  private _shipping: Address      // value object
  private _total: Money           // value object

  submit(): OrderSubmitted {
    if (this._items.length === 0) throw new EmptyOrderError()
    const event = new OrderSubmitted(this._id, this._total, this._items)
    this._status = 'submitted'
    return event
  }
}
```

**How big should an aggregate be?** Small — typically 1-5 objects. The classic mistake is making a single aggregate that contains the entire database. Rule of thumb: modify one aggregate per transaction; if you need two, they are separate aggregates.

### 4. Domain Event

Something notable that happened in the domain. Named in past tense, immutable, carries data relevant to the event.

- Published by the aggregate root (returned from method, then dispatched by application layer)
- Consumed by other aggregates (same or different bounded context)
- Central to event-driven architecture and CQRS

```
class OrderSubmitted {
  constructor(
    readonly orderId: OrderId,
    readonly customerId: CustomerId,
    readonly total: Money,
    readonly occurredAt: Date = new Date()
  ) {}
}
```

### 5. Domain Service

An stateless operation that doesn't naturally fit on an Entity or Value Object. Typically coordinates multiple aggregates or calls external ports.

- Named after the domain activity (`TransferService`, `PricingEngine`)
- Stateless — state lives in entities
- Operates on domain objects, not infrastructure
- Use only when the operation would be unnatural on an entity (e.g., "calculate price across a product catalog")

```
class FraudDetectionService {
  constructor(private readonly ruleEngine: RiskRuleEngine) {}
  assess(order: Order, customer: Customer): FraudAssessment {
    // combines data from multiple aggregates, calls external rule engine
  }
}
```

### 6. Repository

A collection-like interface for retrieving and persisting aggregates. Each aggregate root has one repository. The interface is defined in the domain layer; the implementation is in infrastructure.

- Looks like a collection (`save`, `findById`, `findBy`, `remove`)
- Hides database concerns — domain code never sees SQL or ORM
- Returns fully constructed aggregates or null/empty

```
interface OrderRepository {
  save(order: Order): void
  findById(id: OrderId): Order | undefined
  findByCustomer(customerId: CustomerId): Order[]
}
```

### 7. Factory

Encapsulates complex creation logic — when the constructor is too simple or the creation involves multiple steps.

- Can be a static method on the aggregate root, a standalone factory class, or a Factory method on another aggregate
- Returns a fully initialized, consistent aggregate
- May also return events (creation often produces `AggregateCreated`)

```
class OrderFactory {
  static createNew(customer: Customer, items: InitOrderItem[]): { order: Order; event: OrderCreated } {
    const order = new Order(new OrderId(uuid()))
    // complex creation logic
    return { order, event: new OrderCreated(order.id, customer.id) }
  }
}
```

### Bounded Context

Each tactical model lives inside exactly one **Bounded Context**. A context is a semantic boundary — terms mean specific things inside it. `Product` in the "Catalog" context has different attributes and behavior than `Product` in the "Inventory" context. Contexts communicate via **Context Maps** (anti-corruption layer, shared kernel, customer-supplier, etc.).

### When to Use

- Complex domain with non-trivial rules, workflows, and invariants
- Strategic DDD is already done (context mapped, ubiquitous language defined)
- Team has or will invest in understanding the domain deeply
- Long-lived application where domain quality matters

### When NOT to Use

- Simple CRUD — value objects, aggregates, and domain events add cognitive load for no gain
- Prototypes — DDD tactical is expensive to implement before the domain is understood
- Anemic domain — if all entities are just getters/setters with no logic, DDD patterns don't help
- No domain expert available — tactical DDD without domain insight produces wrong models

### Pros

- **Domain alignment** — code speaks the same language as the business
- **Maintainability** — invariants are enforced in one place (the aggregate), not scattered
- **Testability** — aggregates are plain objects, tested without infrastructure
- **Traceability** — events capture business activity for audit and integration
- **Enforced boundaries** — aggregate rules prevent common transaction and consistency bugs

### Cons

- **Learning curve** — team must understand entities vs value objects, aggregate sizing, event semantics
- **Overengineering for simple domains** — not every business needs tactical DDD
- **Aggregate sizing is hard** — too big = transaction problems, too small = eventual consistency complexity
- **Eventual consistency** — aggregates should not share transactions; this surprises teams used to ACID
- **Repository overhead** — every aggregate needs an interface, an implementation, and mapping code

### Related Patterns

- **CQRS** — commonly paired: commands operate on aggregates, queries bypass them for read stores
- **Event Sourcing** — store aggregate state as a sequence of domain events
- **Hexagonal / Clean Architecture** — DDD tactical patterns live in the inner layers (entities, value objects) and use cases; ports adapters implement the repository interface
- **Anti-Corruption Layer** — protects a bounded context from another's model
- **Saga** — coordinates commands across aggregates in different contexts
