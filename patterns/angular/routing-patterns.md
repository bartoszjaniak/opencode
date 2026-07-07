# Routing Patterns

## Intent

Define Angular routing architecture for standalone components: lazy loading, guards, resolvers, auxiliary routes, reuse strategies, and preloading.

## Problem

Poorly structured routing leads to large initial bundles, blank flashes during navigation, stale component state, and inaccessible auth flows. Angular's router is powerful but requires deliberate patterns to avoid common pitfalls.

## Approach

### Lazy Loading Standalone Components

Standalone components can be lazy-loaded directly via `loadComponent`:

```typescript
const routes: Routes = [
  {
    path: 'books',
    loadComponent: () => import('./book-overview/book-overview.component')
      .then(m => m.BookOverviewComponent),
  },
  {
    path: 'scene/:id',
    loadComponent: () => import('./scene-editor/scene-editor.component')
      .then(m => m.SceneEditorComponent),
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.routes')
      .then(m => m.settingsRoutes),
  },
];
```

Use `loadComponent` for single-route features and `loadChildren` for feature modules with child routes. Both produce separate chunks.

### Route Guards

Angular 15+ simplified guards into function-based forms:

**`canActivate`** — blocks navigation entirely. Use for auth checks.

```typescript
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? true : inject(Router).createUrlTree(['/login']);
};
```

**`canMatch`** — controls whether a route matches. Use for feature flags, A/B testing, or role-based routing.

```typescript
export const featureFlagGuard: CanMatchFn = () => {
  return inject(FeatureFlagService).isEnabled('scene-editor');
};
```

`canMatch` is evaluated before `canActivate` and can cause the router to fall through to the next route definition. This makes it ideal for:

```typescript
const routes: Routes = [
  {
    path: 'dashboard',
    canMatch: [roleGuard('admin')],
    loadComponent: () => import('./admin-dashboard.component'),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./user-dashboard.component'),
  },
];
```

**`canDeactivate`** — confirm navigation away (unsaved changes dialog).

```typescript
export const unsavedChangesGuard: CanDeactivateFn<EditorComponent> = (component) => {
  return component.hasUnsavedChanges()
    ? confirm('Discard changes?')
    : true;
};
```

### Resolvers vs Signals

**Classic resolvers** pre-fetch data before activating a route. They block navigation, which shows a blank screen:

```typescript
export const bookResolver: ResolveFn<Book> = (route) => {
  return inject(BookService).getById(route.paramMap.get('id')!);
};
```

**Signal-based approach** — navigate immediately and show a loading state:

```typescript
@Component({ ... })
export class BookDetailComponent {
  private service = inject(BookService);
  private id = toSignal(inject(ActivatedRoute).paramMap.pipe(map(p => p.get('id')!)));
  book = signal<Book | null>(null);
  loading = signal(true);

  constructor() {
    effect(async () => {
      this.loading.set(true);
      this.book.set(await this.service.getById(this.id()!));
      this.loading.set(false);
    });
  }
}
```

**Prefer signals over resolvers** when:
- You want instant navigation with loading spinners.
- The data fetch is not critical for the initial render.
- You need to refetch data when params change (resolvers don't re-run on param changes within the same route instance).

Keep resolvers only for data that must be present before the component renders (e.g., access control metadata).

### Auxiliary Routes

Auxiliary (named) outlets allow multiple independent router outlets on the same page:

```typescript
const routes: Routes = [
  {
    path: 'books',
    component: BookListComponent,
    children: [
      { path: ':id', component: BookDetailComponent, outlet: 'sidebar' },
    ],
  },
];
```

```html
<router-outlet />
<router-outlet name="sidebar" />
```

```typescript
this.router.navigate([{ outlets: { primary: ['books'], sidebar: ['books', '123'] } }]);
```

Use auxiliary routes for panels, drawers, and sidebars that should be bookmarkable and independent of the main navigation.

### Route Reuse Strategy

Default Angular behavior destroys and recreates components on every navigation. Override `RouteReuseStrategy` to preserve state:

```typescript
@Injectable({ providedIn: 'root' })
export class CustomRouteReuseStrategy extends RouteReuseStrategy {
  private store = new Map<string, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return route.routeConfig?.path === 'books';
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    this.store.set(this.getKey(route), handle);
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return this.store.has(this.getKey(route));
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return this.store.get(this.getKey(route)) ?? null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  private getKey(route: ActivatedRouteSnapshot): string {
    return route.routeConfig?.path ?? '';
  }
}
```

Use route reuse for master-detail views where the list should stay scrolled, or tab-based navigation where switching tabs should preserve state.

### Navigation Guards

Use `NavigationEnd` events for post-navigation side effects (analytics, breadcrumbs, scroll restoration):

```typescript
export class NavigationTracker {
  private router = inject(Router);
  private currentUrl = signal<string>('');

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    ).subscribe(e => {
      this.currentUrl.set(e.urlAfterRedirects);
      // analytics tracking
    });
  }
}
```

### Preloading Strategies

```typescript
// Default: no preloading
RouterModule.forRoot(routes, { preloadingStrategy: NoPreloading });

// Preload all lazy chunks
RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules });

// Custom: preload only specific routes
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    return route.data?.['preload'] ? load() : of(null);
  }
}
```

```typescript
{
  path: 'scene-editor',
  data: { preload: true },
  loadComponent: () => import('./scene-editor.component'),
}
```

## Trade-offs

| Pattern | Pros | Cons |
|---------|------|------|
| Lazy loadComponent | Small initial bundle, simple | One chunk per route |
| canMatch guards | Multi-tenant routing, feature flags | Evaluated before canActivate — can surprise |
| Signal-based data loading | Instant navigation, param reactivity | Separate loading state needed |
| Route reuse strategy | Preserves scroll/state | Memory usage, stale data risk |
| PreloadAllModules | Fast subsequent navigation | Larger initial load |

## Best Practices

- Always lazy load feature routes. Never eagerly import feature components.
- Prefer `canMatch` over `canActivate` for feature-flag-based routing.
- Avoid resolvers for non-critical data — use signal-based loading with loading states.
- Use auxiliary routes for bookmarkable side panels.
- Implement a custom `RouteReuseStrategy` for master-detail views.
- Use `PreloadAllModules` in production if bundle size allows; otherwise use selective preloading.
- Guard all lazy routes with `canActivate` for auth.
- Use `NavigationEnd` for analytics, not router lifecycle hooks.
- Keep route configs in separate files for features with more than 3 routes.