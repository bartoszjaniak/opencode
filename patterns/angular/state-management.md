# State Management

## Intent

Define how application state is stored, accessed, and mutated in Angular. Covers signals, RxJS interop, service-based state, NgRx vs Signal Store, and local vs global state decisions.

## Problem

Angular applications must manage UI state, server cache, form state, routing state, and shared cross-component data. Without a consistent strategy, state ends up scattered across components, leading to stale data, race conditions, and untraceable bugs.

## Approach

### Signals (Angular 16+)

Signals are the primitive for reactive state. They are synchronous, granular, and eliminate zone.js overhead.

```typescript
import { signal, computed, effect } from '@angular/core';

const count = signal(0);
const doubled = computed(() => count() * 2);

effect(() => console.log('Count changed:', count()));
```

**Key rules:**
- `signal()` — writable state container.
- `computed()` — derived, read-only, lazily evaluated, memoized.
- `effect()` — side-effect runner, auto-tracks dependencies, runs outside change detection.
- Never mutate state outside the signal API (`count.set()`, `count.update()`).
- Avoid `effect()` for data flow — use `computed()` instead.

### RxJS Interop

Angular provides two-way interoperability between signals and RxJS:

```typescript
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

// RxJS → Signal
const data$ = this.http.get<Data>('/api/data');
const data = toSignal(data$, { initialValue: null });

// Signal → RxJS
const count = signal(0);
const count$ = toObservable(count);
```

Use `toSignal` to bridge existing RxJS streams (HttpClient, NgRx selectors) into the signal world. Use `toObservable` when you need RxJS operators (debounce, combineLatest) on a signal.

### Service-Based State (with Signals)

For most applications, service-based state with signals is sufficient and avoids the overhead of a full store library.

```typescript
@Injectable({ providedIn: 'root' })
export class EntityStore {
  private readonly _entities = signal<Entity[]>([]);
  readonly entities = this._entities.asReadonly();
  readonly selectedId = signal<string | null>(null);

  readonly selectedEntity = computed(() =>
    this._entities().find(e => e.id === this.selectedId()) ?? null
  );

  async loadAll(): Promise<void> {
    const result = await firstValueFrom(this.http.get<Entity[]>('/api/entities'));
    this._entities.set(result);
  }

  add(entity: Entity): void {
    this._entities.update(list => [...list, entity]);
  }

  remove(id: string): void {
    this._entities.update(list => list.filter(e => e.id !== id));
  }
}
```

**Pattern rules:**
- Expose state as `asReadonly()` to prevent external mutation.
- Use `private` backing signals with a public readonly signal.
- Keep mutation methods on the service (single responsibility).
- Use `computed` for derived/aggregated state.

### NgRx vs Signal Store

| Criterion | NgRx | Signal Store / NgRx Signal Store |
|-----------|------|----------------------------------|
| Boilerplate | Actions, reducers, effects, selectors | Minimal — just state + methods |
| Side effects | `Effects` (RxJS) | `rxMethod` or inline async |
| DevTools | Time-travel debugging, Redux DevTools | Limited or none |
| Testing | Well-documented patterns | Simple — just test signals |
| Learning curve | Steep | Shallow |
| Best for | Large teams, complex state, audit trails | Small/medium apps, rapid development |

**Signal Store** (NgRx or custom):

```typescript
// NgRx Signal Store
const EntityStore = signalStore(
  { providedIn: 'root' },
  withState({ entities: [] as Entity[], loading: false }),
  withComputed(({ entities }) => ({
    count: computed(() => entities().length),
  })),
  withMethods((store, http = inject(HttpClient)) => ({
    async loadAll() {
      patchState(store, { loading: true });
      const result = await firstValueFrom(http.get<Entity[]>('/api/entities'));
      patchState(store, { entities: result, loading: false });
    },
  })),
);
```

### Local vs Global State

**Local state** — belongs to a single component or a small feature. Use `signal()` directly in the component.

```typescript
@Component({ ... })
export class SearchComponent {
  query = signal('');
  results = computed(() => this.filter(this.query()));
}
```

**Global state** — shared across unrelated features, persisted, or server cache. Use a service or store.

**Decision flow:**
1. Is the state used by only one component? → Local signal.
2. Is the state shared by a parent and its children? → `@Input()` / `@Output()` or a shared service in the parent injector.
3. Is the state shared across unrelated features? → Global service/store.
4. Is the state persisted (localStorage, IndexedDB)? → Global service with persistence layer.
5. Is the state server cache? → Global service with stale-while-revalidate pattern.

### Entity State Patterns

For collections of entities, use a normalized store pattern:

```typescript
interface EntityState<T> {
  entities: Record<string, T>;
  ids: string[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}
```

This avoids array duplication and enables O(1) lookups:

```typescript
readonly entityList = computed(() => this.ids().map(id => this.entities()[id]));
```

## Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| Service + signals | Simple, no deps, testable | No devtools, manual persistence |
| NgRx | Predictable, scalable, devtools | Verbose, overkill for small apps |
| Signal Store | Minimal boilerplate, signals-native | Less mature ecosystem |
| Local signals | Zero overhead, trivial | Can't share across features |

## Best Practices

- Start with service-based signals. Only add a store library when you have clear pain points.
- Use `toSignal` for HTTP calls and existing RxJS streams.
- Never expose writable signals publicly — use `asReadonly()`.
- Keep derived state in `computed()`, not in `effect()`.
- Use `effect()` only for side effects (logging, localStorage sync, analytics).
- Normalize collections into `Record<id, T>` for performance.
- For undo/redo or optimistic updates, consider a dedicated store (NgRx or Signal Store).
- Test services by asserting on signal values, not on emitted events.