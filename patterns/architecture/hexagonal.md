## Hexagonal Architecture (Ports & Adapters)

### Intent

Isolate the **domain / application core** from external concerns (databases, web frameworks, message brokers, file systems) by defining **ports** (interfaces) that the core owns and **adapters** that implement those ports. The core has no compile-time or runtime dependency on infrastructure.

### Problem

In layered architecture, the domain layer often depends on the persistence layer. This creates:
- Domain logic tangled with SQL, HTTP serialization, or framework annotations
- Impossible to unit test domain logic without infrastructure (database, HTTP server)
- Swapping technologies (e.g., PostgreSQL → DynamoDB) requires rewriting domain code
- Framework lock-in — the domain is coupled to a specific ORM, DI container, or HTTP library

### Structure

```
        ┌────────────────────────────────────────────────┐
        │                  Adapters (inbound)             │
        │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
        │  │  REST    │  │   gRPC   │  │  CLI / Batch  │  │
        │  │  Handler │  │  Handler │  │  Handler      │  │
        │  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
        └───────┼──────────────┼────────────────┼─────────┘
                │              │                │
                ▼              ▼                ▼
        ┌──────────────────────────────────────────────┐
        │            Ports (inbound / driving)          │
        │      Interfaces defined BY the core           │
        │  ┌────────────────────────────────────────┐   │
        │  │         Application / Domain Core        │   │
        │  │   ┌─────────────┐   ┌────────────────┐  │   │
        │  │   │ Domain      │   │ Application    │  │   │
        │  │   │ Entities    │   │ Services       │  │   │
        │  │   │ (no deps)   │   │ (use ports)    │  │   │
        │  │   └─────────────┘   └───────┬────────┘  │   │
        │  └──────────────────────────────┼───────────┘   │
        └─────────────────────────────────┼───────────────┘
                                          │
        ┌─────────────────────────────────┼───────────────┐
        │         Ports (outbound / driven)               │
        │      Interfaces defined BY the core             │
        └─────────────────────────────────┼───────────────┘
                                          │
                ┌─────────────────────────┼─────────────────┐
                │                         │                  │
                ▼                         ▼                  ▼
        ┌──────────────┐       ┌────────────────┐  ┌─────────────┐
        │  PostgreSQL  │       │     Redis       │  │   Event     │
        │  Adapter     │       │  Adapter        │  │   Bus       │
        │  (repo impl) │       │  (cache impl)   │  │   Adapter   │
        └──────────────┘       └────────────────┘  └─────────────┘
                  Adapters (outbound)
```

### Key Terminology

| Term | Meaning | Example |
|------|---------|---------|
| **Port** | Interface defined by the core | `OrderRepository` (interface), `SendEmail` (interface) |
| **Adapter** | Implementation of a port | `PostgresOrderRepository`, `SmtpEmailSender` |
| **Inbound/Driving Port** | Entry point into the core | `PlaceOrderUseCase` interface called by REST controller |
| **Inbound/Driving Adapter** | Triggers the core | REST handler, gRPC handler, CLI command, queue consumer |
| **Outbound/Driven Port** | Interface for something the core needs | `OrderRepository`, `PaymentGateway`, `NotificationSender` |
| **Outbound/Driven Adapter** | Implements the port using real infra | Postgres adapter, Stripe adapter, SendGrid adapter |

### Rules

1. **Dependency Rule**: dependencies point **inward**. The core does not import infrastructure code. Adapters depend on the ports (interfaces), not the concrete core implementations.
2. **Ports belong to the core**: the `OrderRepository` interface lives in the domain/application layer, not in the persistence layer.
3. **Adapters are replaceable**: swap an adapter without touching the core. The adapter's only job is to translate between the port's domain language and the external tool's language.
4. **Testing**: unit test the core by mocking ports. Integration test adapters separately.

### When to Use

- Application with non-trivial domain logic that should survive framework changes
- Multiple delivery mechanisms (REST API + CLI + batch + queue consumer) sharing one core
- Anticipated infrastructure changes (e.g., starting with SQLite, migrating to Postgres)
- Team wants pure unit tests without infrastructure setup
- DDD-style projects — the domain model stays clean of infrastructure concerns

### When NOT to Use

- Trivial CRUD with no domain logic — the indirection adds cost with no benefit
- Prototype / MVP where speed to first release is the primary goal
- Single-infrastructure application with no expected changes (e.g., rails app that will always use Postgres + sidekiq forever)
- Small team unfamiliar with the pattern — accidental complexity will slow everything down

### Pros

- **Domain purity** — zero infrastructure dependencies; domain is plain code
- **Testability** — core can be unit tested with trivial mocks/stubs
- **Technology flexibility** — swap DB, message broker, or HTTP framework by writing a new adapter
- **Independent delivery** — adapters can be developed and deployed on different cycles
- **Parallel work** — domain expert works on core, infra expert works on adapter, interface is the contract
- **Framework isolation** — a framework upgrade rarely touches domain code

### Cons

- **Indirection** — interfaces and adapter registration add ceremony for simple cases
- **Overengineering** — easy to create ports for everything when a concrete dependency would suffice
- **Boilerplate** — each external call means an interface + adapter pair; for a simple email send, it's a lot of files
- **Adapter coordination** — some operations span multiple adapters (saga — transaction across DB + queue) and are harder to coordinate without leaky abstractions
- **Learning curve** — team must understand the inversion direction, especially when ports have many operations

### Related Patterns

- **Clean Architecture** — concentric layers approach; hexagonal is a direct precursor/implementation
- **Dependency Injection** — wires adapters into ports; essential for the pattern (manually or via framework)
- **Repository** — the canonical outbound port in DDD; a `Repository` interface is an outbound port
- **Adapter Pattern** (GoF) — architectural adaptation of the same principle
- **CQRS** — command and query handlers live inside the core; ports define command buses, query buses, and persistence
- **Domain Event** — published through an outbound port (`EventPublisher`); each infrastructure adapter implements it differently

### Directory Layout Example

```
src/
├── domain/            ← core (no infra deps)
│   ├── model/
│   ├── ports/         ← interfaces (inbound + outbound)
│   └── services/
├── application/       ← core (use case layer)
│   └── ports/
├── adapter/
│   ├── inbound/       ← REST, gRPC, CLI, queue consumers
│   └── outbound/      ← Postgres, Redis, Stripe, SES
└── main/              ← composition root (wires adapters to ports)
```
