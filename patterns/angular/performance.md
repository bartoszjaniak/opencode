# Performance

## Intent

Define Angular performance optimization strategies: change detection, signals, lazy loading, virtual scrolling, deferred loading, and bundle management.

## Problem

Angular applications can suffer from sluggish rendering, large bundle sizes, janky scrolling, and unnecessary change detection cycles. Without deliberate performance patterns, even well-structured apps degrade as features grow.

## Approach

### OnPush Change Detection

`ChangeDetectionStrategy.OnPush` tells Angular to skip a component's subtree unless:
- An `@Input()` reference changes.
- An event originates from within the component or its children.
- A bound signal emits a new value.
- `ChangeDetectorRef.markForCheck()` is called explicitly.

```typescript
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ value() }}`,
})
export class OnPushComponent {
  value = signal('unchanged');
}
```

**Default to `OnPush` for all components.** Only use `Default` for prototyping or legacy code.

### Signals Eliminating Zone.js (Zoneless)

Signals enable zoneless change detection. When every component uses signals, Angular can schedule change detection exactly when signal values change, without zone.js patching.

```typescript
// Bootstrap without zone.js
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { App } from './app.component';

bootstrapApplication(App, {
  providers: [provideExperimentalZonelessChangeDetection()],
});
```

**Requirements for zoneless:**
- All templates use signals, `async` pipe, or `OnPush`.
- No `NgZone` calls (no `run()`, `runOutsideAngular()`).
- No third-party libraries that depend on zone.js.
- Angular 18+ (experimental), Angular 19+ (stable).

**Benefits:**
- Smaller bundle (no zone.js).
- Faster change detection (no polling).
- Better debugging (no stale zone errors).

### trackBy in @for

Always provide a `trackBy` function for `@for` loops to prevent unnecessary DOM recreation:

```typescript
@Component({ ... })
export class ListComponent {
  items = signal<Entity[]>([]);

  trackById = (index: number, item: Entity) => item.id;
}
```

```html
@for (item of items(); track trackById($index, item)) {
  <app-card [item]="item" />
}
```

Angular 17+ `@for` requires `track`. Always use a unique identifier, never `$index`, unless the list is static and never reordered.

### Deferred Loading (@defer)

Angular 17+ `@defer` defers loading of component, its dependencies, and its standalone imports:

```html
@defer (on viewport) {
  <app-heavy-chart />
} @placeholder {
  <div>Loading chart...</div>
} @loading {
  <div>Loading...</div>
} @error {
  <div>Failed to load</div>
}
```

**Triggers:**

| Trigger | Behavior |
|---------|----------|
| `on viewport` | Load when element enters viewport |
| `on immediate` | Load immediately after render |
| `on idle` | Load when browser is idle |
| `on interaction` | Load on click/keyboard event |
| `on hover` | Load on hover |
| `on timer(5000)` | Load after 5 seconds |
| `when condition` | Load when expression becomes true |

**Best uses:**
- Heavy charts and data visualizations.
- Third-party widgets (maps, rich text editors).
- Below-the-fold content.
- Modals and dialogs.

### Lazy Loading Routes

See also [routing-patterns.md](./routing-patterns.md). Combine with `@defer` for nested lazy content:

```typescript
{
  path: 'reports',
  loadComponent: () => import('./reports/reports.component'),
}
```

### Virtual Scrolling (CDK)

For long lists (1000+ items), use `@angular/cdk/scrolling`:

```typescript
import { ScrollingModule } from '@angular/cdk/scrolling';
```

```html
<cdk-virtual-scroll-viewport itemSize="50" class="viewport">
  <div *cdkVirtualFor="let item of items">{{ item.name }}</div>
</cdk-virtual-scroll-viewport>
```

```scss
.viewport {
  height: 500px;
  // width is inherited
}
```

Use virtual scrolling for:
- Entity lists with 500+ items.
- Infinite scroll feeds.
- Log viewers and timeline panels.

### Chunk Splitting

Angular's default bundler (esbuild) splits code automatically at route boundaries. Optimize further:

**`angular.json` optimization settings:**

```json
"optimization": {
  "scripts": true,
  "styles": true,
  "fonts": true
}
```

**Code-split large libraries with dynamic imports:**

```typescript
async loadEditor() {
  const { EditorComponent } = await import('./editor/editor.component');
  this.editor.set(EditorComponent);
}
```

### Bundle Budgets

Set budgets in `angular.json` to catch regressions in CI:

```json
"budgets": [
  { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
  { "type": "anyComponentStyle", "maximumWarning": "2kB", "maximumError": "4kB" },
  { "type": "anyComponent", "maximumWarning": "10kB", "maximumError": "20kB" }
]
```

Targets:
- **Initial:** 500kB warning, 1MB error (after compression, aim for <200kB).
- **Any component:** 10kB warning, 20kB error.
- **Any component style:** 2kB warning, 4kB error.

### Change Detection Strategies Summary

| Strategy | How it works | When to use |
|----------|-------------|-------------|
| Default | Checks entire tree on any change | Legacy code, prototyping |
| OnPush | Checks only when inputs change, events fire, or signals update | All new components |
| Zoneless | No zone.js, signals-only scheduling | Greenfield apps, Angular 19+ |

## Best Practices

- Default all components to `OnPush`.
- Provide `track` with a unique key in every `@for`.
- Use `@defer` for heavy, below-the-fold, or non-critical components.
- Virtual-scroll lists with 500+ items.
- Lazy-load all feature routes.
- Set bundle budgets in CI.
- Use `signal` instead of `BehaviorSubject` for synchronous state.
- Avoid `NgZone` calls — use `toSignal` / `async` pipe instead.
- Prefer `@defer` `on viewport` for images and heavy content.
- Run Lighthouse and Angular DevTools performance tab regularly.
- Use `ng build --stats-json` and `esbuild-visualizer` to analyze bundles.