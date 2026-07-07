## Test Pyramid & Test Trophy

### Intent / Problem

Teams dump most of their testing effort into either too many unit tests
(high coverage, low confidence) or too many E2E tests (high confidence,
slow and brittle). The classic test pyramid and the newer testing trophy
provide heuristics for allocating effort across test levels.

### Classic test pyramid (Mike Cohn)

```
    /\
   /  \      E2E (few)
  /    \
 / unit \    Integration (some)
/________\
  Unit tests (many)
```

- **Base** — fast, isolated unit tests (thousands).
- **Middle** — integration tests that cross module boundaries
  (hundreds).
- **Top** — E2E tests covering critical user journeys (dozens).

The pyramid shape says: invest most in the fastest, most reliable layer.
Each layer up is slower and more expensive, so write fewer of them.

### Testing trophy (Kent C. Dodds)

```
    .---.
   /     \     E2E
  /  int  \    Integration (most value)
 /   .-.   \
/  /     \  \ Static analysis (TS, lint) + Unit
/  '-----'   \
'-------------'
```

Dodds argues that **integration tests** provide the best
confidence-per-dollar. Static analysis catches type errors, units catch
logic errors, but integration tests catch the bugs that actually reach
users — broken contracts between modules, forgotten DI providers,
incorrect HTTP payload shapes.

### Where Angular & Rust tests fit

**Angular (frontend)**

| Test type | What |
|---|---|
| Static | TypeScript strict mode, TS strict templates |
| Unit | Pure functions, computed signals, utility services (with fakes) |
| Integration | Component + template (TestBed + `provideHttpClient` mock), guard + resolver wiring, store + effect interaction |
| E2E | Playwright or Cypress — login, create book, save scene, publish |

Key: Angular component tests using `TestBed` are *integration* tests,
not unit tests. They compile the template, wire DI, and render the DOM.
Treat them as such — don't mock every dependency, use fakes or the real
thing where fast enough.

**Rust (Tauri backend)**

| Test type | What |
|---|---|
| Static | `cargo check`, `clippy` — type and lint |
| Unit | `#[cfg(test)] mod` in same file — pure functions, validation |
| Integration | `tests/` directory — commands with in-memory state, DB queries via SQLite in-memory |
| E2E | Tauri driver or custom harness — full app startup + window testing |

Rust encourages in-module unit tests and separate integration tests.
Use `sqlite::memory` for persistence tests — they stay fast and
self-contained.

### Practical ratios

- **Small project** (<10 KLOC): no strict ratio — write tests where
  they add confidence.
- **Medium project** (10–100 KLOC): aim for ~70% unit, ~20%
  integration, ~10% E2E (by **time spent**, not count — a single E2E
  takes as long as 20 unit tests).
- **Large project** (100+ KLOC): shift toward ~50% integration, ~40%
  unit, ~10% E2E as complexity moves to wiring.

### Anti-patterns

**Ice-cream cone** (inverted pyramid)

```
    /\
   /  \      Unit (few)
  /    \
 / e2e  \    Integration (some)
/________\
  E2E (many)
```

Symptoms: most bugs found by E2E, slow CI pipelines, flaky tests
dominate developer time. Fix: push coverage down — write integration
tests for the flows covered by E2E, then unit tests for edge cases.

**Testing implementation details**

- ❌ Angular: asserting on `component.cartService` (private), snapshot
  testing without meaning.
- ❌ Rust: asserting on internal function call order that isn't part of
  the public API.
- ✅ Test **behaviour** — given input X, does the observable output Y
  happen? The internals can change freely.

**Test-induced design damage**

Writing tests forces design changes that make the code worse (e.g.
extracting classes only to make them mockable). Prefer fakes and
in-memory implementations over heavy mocking frameworks.

### Pros

- Clear mental model for where each test lives.
- Fast CI — most tests run in seconds.
- Easy to communicate strategy to the team.

### Cons

- Ratios are guidelines, not rules — blindly following them leads to
  waste.
- The trophy model works best in dynamically-typed languages; Rust's
  type system already catches many integration bugs statically.

### Related patterns

- [Test Strategies](test-strategies.md) — test doubles, AAA, factories.
- [Property-Based Testing](property-based-testing.md) — rich unit- and
  integration-level coverage.
- *Static analysis first* — in Rust, `clippy` + strict types eliminate
  entire categories of tests you'd write in JavaScript.
