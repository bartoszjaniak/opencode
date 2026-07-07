## Property-Based Testing

### Intent / Problem

Example-based tests only cover the inputs you think of. They miss edge
cases, surprise combinations, and implicit assumptions. Property-based
testing (PBT) generates hundreds or thousands of random inputs and
checks that invariants hold for all of them, catching bugs you didn't
know to look for.

### Properties vs examples

| | Example-based | Property-based |
|---|---|---|
| Input | Fixed: `sum(2, 3)` | Generated: `sum(a, b)` for random `a`, `b` |
| Assertion | Single expected: `5` | Invariant: `sum(a, b) === sum(b, a)` (commutativity) |
| Fails on | Wrong output for one case | Any case violating the property |
| Shrinking | N/A | Automatically finds minimal failing input |

### How it works (proptest/quickcheck style)

```
// Property: reversing a string twice gives back the original
// for ALL strings, not just "hello" and "abc"

test!(
  fn reverse_twice_is_identity(s: &str) {
    let result = s.chars().rev().collect::<String>()
                    .chars().rev().collect::<String>();
    assert_eq!(result, s);
  }
);
```

The framework:
1. Generates random `s` values (empty, single char, Unicode, long).
2. Runs the assertion.
3. If a case fails, **shrinks** it to the smallest still-failing input.
4. Reports the minimal counter-example.

### When PBT adds value

| Domain | Example property |
|---|---|
| Serialization | `deserialize(serialize(x)) == x` (round-trip) |
| Validation | All accepted inputs satisfy the schema; all rejected don't |
| Sorting | Result is sorted AND is a permutation of the input |
| Math/arithmetic | Commutativity, associativity, identity element |
| State machines | After any sequence of operations, invariants hold |
| Parsers | All generated ASTs produce valid code when unparsed |

### Stateful (model-based) testing

For systems with state (DB, cache, editor buffer):

```
// Model: in-memory Vec
// Real: SQLite database

model: Vec<Book>

operations:
  insert(book)  → model.push(book);  real.insert(book)
  get_by_id(id) → model.find(..);    real.get_by_id(id)
  delete(id)    → model.remove(..);  real.delete(id)

invariant after each op:
  model.count() == real.count()
  model.get_all() == real.get_all()
```

The framework generates random sequences of operations and checks the
real system matches the model after each step. Catches race conditions,
missing rollbacks, and constraint violations.

### Shrinking

The killer feature of PBT. Without shrinking, a failing random test
gives you a 500-byte input with no clue what's relevant.

Example failure without shrink: `"aaaa...a\nb\tc...xyz"` (128 chars).
With shrink: `"\n"` — the newline character triggers the bug.

The shrinker tries removing characters, simplifying values, and
reducing numbers until the failure disappears. The report shows the
**minimal reproducer**, which makes debugging trivial.

### Fuzzing vs PBT

Fuzzing is PBT without properties — it generates inputs and checks for
crashes, hangs, or panics (via sanitizers). PBT checks semantic
correctness. Both are complementary:
- Fuzz: `does not crash on any input`.
- PBT: `satisfies the specification for all inputs`.

### Pros

- Finds bugs you'd never write an example for.
- Shrinking gives minimal, actionable failure reports.
- Properties are a formal (if lightweight) specification.
- Scales: same property works for empty, trivial, and complex data.

### Cons

- Not all code has good properties — UI rendering and complex business
  workflows are hard to specify as invariants.
- Initial setup cost is higher than writing five examples.
- Random generation can be slow for complex data structures without
  custom strategies.
- False positives: a property might be wrong (you specified the bug as
  the invariant).

### When NOT to use PBT

- Simple CRUD where example-based tests already cover every branch.
- Visual/rendering code (layout, styling) — properties are too
  abstract.
- One-shot scripts or prototypes.
- When the team isn't comfortable with the paradigm yet — start with
  PBT in one module, measure the value, then expand.

### Related patterns

- [Test Strategies](test-strategies.md) — PBT lives at the unit and
  integration levels; pair with example-based tests for regression.
- [Test Pyramid & Trophy](test-pyramid.md) — PBT shifts confidence
  downward (more bugs caught at unit/integration level).
- *Fuzzing* — crash-only testing; use as a first pass before writing
  properties.
- *Golden test / snapshot testing* — alternative to PBT for output
  that's too complex to assert piece-by-piece (but overlaps poorly with
  PBT).
