## Test Strategies: Unit vs Integration vs E2E & Test Maintainability

### Intent / Problem

Teams without a deliberate test strategy end up with slow, brittle, or
irrelevant tests. The hard part isn't writing tests — it's knowing what
to test at which level, what kinds of test doubles to use, and how to
keep the suite fast and trustworthy as the codebase grows.

### Core taxonomy

| Level | Scope | Speed | External deps | Confidence area |
|---|---|---|---|---|
| **Unit** | Single function/class/service | ms | None (doubles) | Logic correctness |
| **Integration** | Module boundary, DB, filesystem | 10–1000 ms | Real or lightweight | Contracts, wiring |
| **E2E** | Full user flow across layers | s–min | All real | System works end-to-end |

### When to use each

- **Unit** — always. Pure logic, utilities, state reducers, computed
  signals, validation rules. The foundation of any suite.
- **Integration** — whenever a unit talks to something outside its
  control: HTTP client → mock server, service → database repository,
  Angular component → template + DI.
- **E2E** — critical paths only: login, checkout, publish flow. Do not
  E2E-test every branch; cover those at lower levels.

### Test doubles decision table

| Double | Behaviour | When to use |
|---|---|---|
| **Stub** | Returns fixed values | Making a dependency answer a question |
| **Mock** | Asserts interactions were called | Verifying side-effects (e.g. `analytics.track` called with payload) |
| **Fake** | Lightweight working impl (e.g. in-memory DB) | Replacing something slow/brittle with same contract |
| **Spy** | Wraps real object, records calls | Partial mocking — real behaviour + assertions |
| **Dummy** | Passed but never used | Satisfying constructor parameters |

**Simple rule**: prefer fakes over mocks. Mocks couple tests to
implementation. Fakes let you test behaviour.

### AAA pattern

```
// Arrange — set up preconditions, doubles, inputs
const items = [/* ... */];
const service = new CartService();

// Act — invoke the behaviour under test
const result = service.applyDiscount(items, 'SUMMER10');

// Assert — verify outcome, not internals
expect(result.total).toBe(49.50);
expect(result.applied).toBeTrue();
```

Keep Act to one line. Multiple assertions are fine if they verify one
logical concept.

### Test data factories

Avoid sharing mutable test data across files. Use factory functions:

```
function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'b1',
    title: 'Default Title',
    author: 'Default Author',
    ...overrides,
  };
}
```

This pattern (sometimes called *Object Mother light*) keeps tests
readable when a constructor needs many parameters. The `overrides`
spread makes each test's relevant differences obvious.

### Test selection & risk-based testing

- Run **unit** and **fast integration** on every save (watch mode).
- Run **slow integration** on pre-push or CI per-commit.
- Run **E2E** only on CI main branch and before release.
- Risk-based: if a change touches auth, payments, or data migration,
  always run the full integration suite for that domain, not just the
  unit tests. If it's a cosmetic UI change, skip E2E entirely.

### Pros

- Clear separation of concerns makes debugging test failures fast.
- Fast feedback from unit tests; high confidence from E2E.
- Test doubles keep tests deterministic and independent.

### Cons

- Requires discipline to maintain the boundaries — leaking mocks
  between layers erodes value.
- E2E suites are expensive to write and maintain; over-investing here
  is a common mistake.
- Test factories can grow into their own maintenance burden.

### Related patterns

- [Test Pyramid & Trophy](test-pyramid.md) — how to balance coverage
  across layers.
- [Property-Based Testing](property-based-testing.md) — complement to
  example-based unit tests.
- *Behaviour-Driven Development (BDD)* — using natural-language
  scenarios (Given/When/Then) to drive integration and E2E tests.
