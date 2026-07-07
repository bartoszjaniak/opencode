# Testing Patterns

## Intent

Define Angular testing strategies: component testing with TestBed, service testing, signal testing, harness-based DOM testing, and integration vs unit test boundaries.

## Problem

Angular testing is notoriously complex. Without patterns, developers write brittle tests that depend on implementation details, take too long to run, or miss critical behaviors. The shift to signals and standalone components introduces new testing patterns.

## Approach

### Component Testing with TestBed

Set up standalone components directly — no NgModule needed:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntityCardComponent } from './entity-card.component';

describe('EntityCardComponent', () => {
  let fixture: ComponentFixture<EntityCardComponent>;
  let component: EntityCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityCardComponent], // standalone — just import
    }).compileComponents();

    fixture = TestBed.createComponent(EntityCardComponent);
    component = fixture.componentRef.instance;
    fixture.detectChanges();
  });

  it('should display entity name', () => {
    const entity = { id: '1', name: 'Test' };
    fixture.componentRef.setInput('entity', entity);
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('.entity-name');
    expect(el.textContent).toContain('Test');
  });
});
```

**Key patterns:**
- Use `fixture.componentRef.setInput()` for signal-based `@Input()` (Angular 17+).
- Call `fixture.detectChanges()` explicitly — never use `autoDetectChanges`.
- Access the DOM via `fixture.nativeElement.querySelector` or a component harness.
- For `@Output()`, subscribe to the emitter to assert emitted values.

### Component Harnesses

For complex components, use `ComponentHarness` from `@angular/cdk/testing`:

```typescript
import { ComponentHarness, HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';

class EntityCardHarness extends ComponentHarness {
  static hostSelector = 'app-entity-card';

  protected getName = this.locatorFor('.entity-name');
  protected getButton = this.locatorFor('button');

  async getNameText(): Promise<string> {
    return (await this.getName()).text();
  }

  async clickButton(): Promise<void> {
    return (await this.getButton()).click();
  }
}

describe('EntityCardComponent with harness', () => {
  let loader: HarnessLoader;

  beforeEach(async () => {
    const fixture = TestBed.createComponent(EntityCardComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should emit click on button press', async () => {
    const card = await loader.getHarness(EntityCardHarness);
    // interact and assert through the harness
  });
});
```

Harnesses decouple tests from DOM structure. When the template changes, only the harness needs updating.

### Service Testing (HttpClientTestingController)

```typescript
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

describe('BookService', () => {
  let service: BookService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BookService,
      ],
    });

    service = TestBed.inject(BookService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should load books', async () => {
    const loadPromise = service.loadAll();
    const req = httpMock.expectOne('/api/books');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: '1', title: 'Test Book' }]);

    const books = await loadPromise;
    expect(books).toHaveLength(1);
  });
});
```

### Signal Testing in Components

Components using signals are easier to test because you can assert on signal values directly:

```typescript
it('should update search results', () => {
  // Arrange: set input
  fixture.componentRef.setInput('items', mockItems);

  // Act: simulate user input
  const input = fixture.nativeElement.querySelector('input');
  input.value = 'test';
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();

  // Assert: check signal value (no need to wait for async)
  expect(component.filteredItems()).toEqual([mockItems[0]]);
});
```

For `effect()` testing, use `TestBed.flushEffects()`:

```typescript
it('should log on count change', () => {
  const spy = spyOn(console, 'log');
  component.increment();
  TestBed.flushEffects(); // flush pending effects
  expect(spy).toHaveBeenCalledWith('Count: 1');
});
```

### DOM Testing Patterns

**Best practices for DOM assertions:**

```typescript
// Prefer text content over class names
expect(el.textContent?.trim()).toBe('Expected');

// Use data-testid attributes for fragile selectors
// template: <div data-testid="entity-name">{{ name }}</div>
expect(el.querySelector('[data-testid="entity-name"]')?.textContent).toBe('Expected');

// Assert on rendered output, not component state
// BAD: expect(component.items).toEqual(...)
// GOOD: expect(listItems.length).toBe(3)
```

### Integration vs Unit Test Boundaries

| Test Type | Scope | What to mock | Speed |
|-----------|-------|-------------|-------|
| Unit (service) | Single service | All HTTP, all deps | Fast |
| Unit (component) | Single component | All child components, services | Fast |
| Integration | Feature composed of multiple components | Only HTTP, real child components | Medium |
| E2E | Full app | Nothing (real backend or test server) | Slow |

**Guidelines:**
- Write unit tests for services and pure functions (validators, guards).
- Write unit tests for simple presentational components.
- Write integration tests for container components (smart components with real children).
- Keep E2E tests for critical user journeys (login, create, delete).
- 80% unit + integration, 20% E2E.

### Vitest with Angular

When using Vitest (via `@angular/build`):

```typescript
// vitest.config.ts (or in angular.json builders)
// Globals: true in tsconfig.spec.json for vitest/globals types

// No explicit imports needed for describe/it/expect
describe('BookService', () => {
  it('should load books', () => {
    // ...
  });
});
```

**Vitest-specific patterns:**
- Use `vi.fn()` for spies instead of `jasmine.createSpy()`.
- Use `vi.useFakeTimers()` for debounce tests.
- Snapshot testing with `expect(container.innerHTML).toMatchSnapshot()`. Use sparingly — prefer targeted assertions.
- Coverage via `vitest --coverage` (configured in `angular.json`).

## Trade-offs

| Pattern | Pros | Cons |
|---------|------|------|
| Component harnesses | Stable tests, DDD-like API | Setup overhead for simple components |
| Signal assertions | Direct state check, no async | Tests coupled to signal shape |
| Integration tests | Catches composition bugs | Slower, harder to debug |
| Vitest | Fast, modern, ESM-native | Less Angular-specific documentation than Jest |

## Best Practices

- Test behavior, not implementation. Assert on rendered DOM, not private state.
- Use `TestBed` for component tests, not `TestBed.inject` mock patterns.
- Mock services at the HTTP level, not via `useValue` overrides.
- Use `data-testid` attributes for selector stability.
- Keep tests co-located with source files (`*.spec.ts`).
- Use `TestBed.flushEffects()` for signal effect assertions.
- For services, test the signal value after async operations.
- Avoid `async` from `zone.js` — use native Promise patterns.
- Run `ng test` with `--watch` during development, `--no-watch` in CI.
- Use `describe` blocks to organize tests by method or scenario, not by component structure.