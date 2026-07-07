## Clean Architecture

### Intent

Organize code into concentric layers where the **dependency rule** ensures that source code dependencies point **inward** — nothing in an inner circle can know anything about an outer circle. The innermost layers contain enterprise business rules; the outermost contain frameworks, drivers, and delivery mechanisms.

### Problem

Software systems start clean but quickly degrade into "big ball of mud" because:
- Business logic scatters across controllers, services, repositories, and views
- Framework annotations and imports appear in domain code
- Changing the database, UI, or external service requires rewriting core logic
- Tests are slow because they require infrastructure setup
- No clear rules for where code belongs — every developer creates their own layering

### Structure (Concentric Circles)

```
                    ┌──────────────────────────┐
                    │  Frameworks & Drivers     │
                    │  (Web, DB, UI, Devices)   │
                    │  ┌────────────────────┐   │
                    │  │ Interface Adapters  │   │
                    │  │ (Controllers,      │   │
                    │  │  Presenters,        │   │
                    │  │  Gateways)          │   │
                    │  │  ┌──────────────┐   │   │
                    │  │  │ Use Cases     │   │   │
                    │  │  │ (Application  │   │   │
                    │  │  │  Business     │   │   │
                    │  │  │  Rules)       │   │   │
                    │  │  │  ┌────────┐   │   │   │
                    │  │  │  │Entities│   │   │   │
                    │  │  │  │(Enter- │   │   │   │
                    │  │  │  │prise   │   │   │   │
                    │  │  │  │Rules)  │   │   │   │
                    │  │  │  └────────┘   │   │   │
                    │  │  └──────────────┘   │   │
                    │  └────────────────────┘   │
                    └──────────────────────────┘
```

### Layers

#### 1. Entities (Enterprise Business Rules)

The innermost layer. Contains enterprise-wide business objects and rules. These are the most stable, with the highest reuse potential across applications.

- No dependencies on any other layer
- No framework imports (no ORM annotations, no `@Entity`, no `@Column`)
- Plain objects with methods that encapsulate critical business logic
- Example: `Loan`, `Invoice`, `Order`, `Customer`

#### 2. Use Cases (Application Business Rules)

Contains application-specific business rules. Orchestrates the flow of data to and from entities, and directs entities to use their enterprise rules.

- Depends only on Entities (inner circle)
- Defines **input ports** (interfaces called by outer layers) and **output ports** (interfaces implemented by outer layers)
- No knowledge of HTTP, UI, database, or any framework
- Each use case typically handles one user story or sub-story
- Example: `SubmitOrderUseCase`, `ValidatePaymentUseCase`

#### 3. Interface Adapters

Converts data between the format most convenient for use cases/entities and the format most convenient for external frameworks.

- **Controllers** (inbound adapters): take HTTP request → convert to use case input → call use case
- **Presenters** (outbound adapters): take use case output → convert to response format (JSON, HTML, CLI)
- **Gateways** (outbound adapters): take use case output → convert to DB/API calls
- No direct dependency on frameworks — depends on abstractions defined in use case layer

#### 4. Frameworks & Drivers

The outermost layer. Glue code — frameworks, device drivers, ORMs, web servers, UI toolkits.

- This is where the ORM lives, the web framework runs, the DB connection pool exists
- Minimally cohesive — just enough code to make things work
- All dependencies point outward (framework → interface adapter → use case → entity)

### The Dependency Rule

**Source code dependencies can only point inward.** Nothing in an inner circle can know the name of something in an outer circle.

- Entity cannot import a Use Case
- Use Case cannot import a Controller
- Outer layers can use inner layer interfaces and classes, but inner layers never reference outer layer implementations

**How it works in practice:**

```
// Inner → defines interface (in use case layer)
interface OrderRepositoryPort {
  save(Order): void
  findById(id): Order | null
}

// Use case (depends on inner interface, not outer implementation)
class SubmitOrderUseCase {
  constructor(private repo: OrderRepositoryPort) {}
  execute(order: Order) { this.repo.save(order) }
}

// Outer → implements interface
class PostgresOrderRepository implements OrderRepositoryPort {
  save(order: Order) { /* SQL */ }
}
```

### Crossing Boundaries

When data crosses a layer boundary, it must be in a form convenient for the inner layer:

- **Request/Response Models**: outer layers create DTOs; inner layers receive domain objects
- **No ORM entities in inner circles**: an ORM `@Entity` class violates the dependency rule if it lives in the domain

### When to Use

- Complex business logic with a long expected lifespan (5+ years)
- Multiple delivery mechanisms (web + mobile + API + CLI)
- Enterprise applications with strict compliance or audit requirements
- Team has experience with layered/hexagonal patterns — clean architecture formalizes them
- Need to protect business logic from framework churn

### When NOT to Use

- CRUD/forms-over-data — the layers add ceremony with zero payoff
- Small team, tight deadlines — every layer crossing costs time
- Prototypes — build the tangled version first, refactor later
- Framework-first applications (Rails, Django, Laravel) where the framework IS the architecture
- Team lacks discipline — layer violations will accumulate silently

### Pros

- **Framework independence** — swap Spring for Micronaut, Express for Fastify, without touching business rules
- **Testability** — use cases can be unit tested with no infrastructure; entities need no mocks at all
- **Separation of concerns** — every developer knows exactly where to put a given piece of code
- **Parallel development** — frontend, backend, and domain logic can be developed independently
- **Protects investment** — business logic outlives frameworks and infrastructure

### Cons

- **Indirection** — many interfaces, many DTOs, many mapping calls
- **Ceremony** — a simple "save an email address" needs: controller → input DTO → use case → output port → gateway impl → SQL
- **Overengineering** — too easy to create interfaces for things that will never have multiple implementations
- **Performance** — data crossing boundaries (DTO mapping) adds CPU/memory overhead
- **Dogmatism** — strict adherence can lead to absurd designs (e.g., converting a string to a `StringValue` DTO at every boundary)

### Related Patterns

- **Hexagonal Architecture** — same dependency rule, same ports/adapters concept, fewer explicit layers
- **DDD Tactical** — Entities and Value Objects are the same concepts; use cases align with Application Services
- **CQRS** — command and query use cases at the use case layer; query paths may skip entities entirely
- **Repository** — the canonical output port pattern; ports defined in domain/use case, implementations in adapters
- **DTO** — used at every boundary to prevent leaking outer layer concepts inward

### Boundary Crossing with Dependency Injection

```
┌─ Controller ─┐      ┌─ UseCase ─┐      ┌─ Gateway ─┐
│ POST /order  │─────►│ SubmitOrder│─────►│ Postgres  │
│ adapter.in   │      │ port ○     │      │ adapter   │
└──────────────┘      └─────┬──────┘      │ ○ port    │
                            │              └───────────┘
                            │ (DI injects Postgres into UseCase)
                            ▼
                    ╔══════════════════╗
                    ║  Composition     ║
                    ║  Root (main)     ║
                    ╚══════════════════╝
```

The composition root wires everything at startup. The use case never knows the gateway exists — it only sees the port interface.
