# Component Composition

## Intent

Define how Angular components are structured, composed, and reused. Covers the split between smart and dumb components, content projection, host directives, and when to choose inheritance vs composition.

## Problem

Angular applications grow complex quickly. Without a clear composition strategy, components become bloated, tightly coupled, and hard to test. Developers need consistent patterns for deciding what goes where, how parent-child communication works, and how to reuse behavior across components.

## Approach

### Standalone Components (Angular 14+)

All new components should be standalone. No `NgModule` wrapper is needed. Import dependencies directly in `imports`:

```typescript
@Component({
  selector: 'app-entity-list',
  standalone: true,
  imports: [NgFor, NgIf, EntityCardComponent],
  templateUrl: './entity-list.component.html',
})
export class EntityListComponent { ... }
```

Standalone components can be lazy-loaded directly via routes, removing the need for feature NgModules.

### Smart vs Dumb (Container/Presentational)

**Smart (Container) Components** — manage state, orchestrate services, handle events. They are route-level components or page shells. They pass data down to dumb components via `@Input()` and receive events via `@Output()`.

**Dumb (Presentational) Components** — only receive data and emit events. No service injection, no direct state mutation. Pure template logic with `OnPush` change detection.

```typescript
// Smart (container)
@Component({
  standalone: true,
  template: `
    <app-entity-card
      *ngFor="let entity of entities()"
      [entity]="entity"
      (entityClick)="onSelect($event)"
    />
  `
})
export class EntityListContainer {
  private service = inject(EntityService);
  entities = signal<Entity[]>([]);
  constructor() { this.service.loadAll().then(e => this.entities.set(e)); }
  onSelect(id: string) { this.service.select(id); }
}

// Dumb (presentational)
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div (click)="entityClick.emit(entity.id)">{{ entity.name }}</div>`
})
export class EntityCardComponent {
  @Input({ required: true }) entity!: Entity;
  @Output() entityClick = new EventEmitter<string>();
}
```

### Content Projection

Use `<ng-content>` for slot-based composition, especially for layout and shell components.

**Single slot:**

```html
<div class="card">
  <ng-content></ng-content>
</div>
```

**Multi-slot (selectors):**

```html
<div class="panel">
  <header><ng-content select="[panel-header]"></ng-content></header>
  <main><ng-content select="[panel-body]"></ng-content></main>
  <footer><ng-content select="[panel-footer]"></ng-content></footer>
</div>
```

Usage:

```html
<app-panel>
  <div panel-header>Title</div>
  <div panel-body>Content</div>
  <div panel-footer>Actions</div>
</app-panel>
```

Multi-slot projection is ideal for reusable layout wrappers, dialogs, and page shells.

### Host Directives

Reuse behavior across components without inheritance by applying directives to the host element.

```typescript
@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective {
  @Input() appTooltip = '';
  @HostListener('mouseenter') show() { ... }
}
```

Apply to any component:

```html
<app-entity-card [appTooltip]="entity.description" />
```

Host directives are the preferred way to add cross-cutting behavior (tooltips, drag-and-drop, analytics tracking) to existing components.

### Composition Over Inheritance

**Prefer:**
- Host directives for shared behavior.
- Content projection for layout/shell reuse.
- Service-based logic (shared via `inject()`).
- Standalone component imports.

**Avoid:**
- Deep component inheritance hierarchies. Base classes with shared logic create tight coupling and make refactoring dangerous.
- Long extends chains — they break the single-responsibility principle and make testing harder.

### When to Use Inheritance

Inheritance is acceptable only for:
- Generic base classes that are never instantiated directly (abstract).
- Cases where the child is a true specialization (e.g., `BaseChart` → `BarChartComponent`).
- When behavior is tightly coupled to lifecycle hooks (e.g., `BaseFormComponent` with shared `ngOnInit` logic).

Even then, prefer composition via a dedicated service or directive.

## Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| Smart/Dumb split | Clear data flow, testable, reusable | More files, indirection for simple cases |
| Content projection | Flexible layout, no coupling | Limited two-way binding, harder to read |
| Host directives | Reusable behavior, no inheritance | Single directive per behavior, can't override |
| Component inheritance | Shared lifecycle, less boilerplate | Tight coupling, fragile hierarchy |

## Best Practices

- All new components are standalone.
- Default to `OnPush` change detection.
- Route-level components are smart; leaf components are dumb.
- Use `@Input({ required: true })` for mandatory inputs.
- Use `@Output()` with `EventEmitter` — never pass callbacks as `@Input()`.
- Prefer `signal` inputs (`input()`, `output()`) in Angular 17+ for signal-based components.
- Limit `ng-content` to 2-3 slots per component; beyond that, consider a structural directive pattern.
- Keep dumb components free of service injections.
- Use `inject()` over constructor injection for better readability and testability.