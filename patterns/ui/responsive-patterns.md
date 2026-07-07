## Responsive Design Patterns

### Intent / Problem

Users access interfaces on screens ranging from 320px (small phones) to 2560px+ (ultrawide monitors). Responsive design ensures that the UI adapts gracefully across this spectrum — not by shrinking everything, but by rethinking layout, typography, navigation, and touch targets per context.

### Mobile-First vs Desktop-First

| Aspect | Mobile-First | Desktop-First |
|---|---|---|
| Base styles | Mobile (320px) | Desktop (1280px+) |
| Override direction | `min-width` breakpoints | `max-width` breakpoints |
| Performance | Naturally leaner — forces critical-content prioritization | Risks shipping unused desktop assets to mobile |
| Team adoption | Easier to add than remove | Easier to remove than add |
| When to use | Consumer apps, greenfield projects, mobile-heavy audiences | Enterprise dashboards, internal tools, desktop-heavy audiences |

**Recommendation**: Default to mobile-first. It aligns with progressive enhancement and prevents layout bloat. Desktop-first makes sense only when 90%+ of users are on large screens and mobile is a secondary concern.

### Breakpoint Strategy

Do not target specific devices (iPhone 15, iPad Pro). Target content behavior.

#### Common Breakpoint Ranges

| Name | Range | Typical Layout |
|---|---|---|
| Small (mobile) | 0 – 599px | Single column, stacked |
| Medium (tablet) | 600 – 959px | 2 columns, side panels collapse |
| Large (desktop) | 960 – 1439px | Full layout, sidebar visible |
| Extra Large | 1440px+ | Max-width container, whitespace margins |

**Rules**:
- Add breakpoints only when content breaks, not when a device category comes to mind.
- Limit to 3–4 breakpoints maximum. More creates combinatorial testing hell.
- Use consistent values across the entire product (do not have one page breaking at 768 and another at 800).

### Fluid Grids & Layout Patterns

#### 1. Fluid Grid

Column widths are in `%` or `fr` (CSS Grid fractional units), not fixed px. Gaps use spacing tokens.

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}
```

This single declaration creates a responsive grid that adds/removes columns naturally as the viewport grows.

#### 2. Stacking Pattern

Elements that sit side-by-side on desktop stack vertically on mobile. This is the most common responsive pattern.

- **Desktop**: `flex-direction: row` with `gap`
- **Mobile**: `flex-direction: column` (or the grid's natural wrapping)

#### 3. Column Drop

Content rearranges from multi-column on desktop to single-column on mobile, with elements reordering.

```css
@media (min-width: 960px) {
  .layout { grid-template-columns: 1fr 2fr 1fr; }
}
@media (max-width: 959px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar { order: -1; } /* move sidebar above content on mobile */
}
```

#### 4. Off-Canvas / Drawer

Navigation or filters that are visible on desktop become a slide-in drawer on mobile. Requires a JavaScript toggle.

#### 5. Toggle / Show More

Non-critical content is hidden behind a "Show more" or expandable section on mobile, always visible on desktop.

#### 6. Font Scaling

Use `clamp()` for fluid typography that scales between breakpoints without media queries.

```css
font-size: clamp(1rem, 0.75rem + 1vw, 1.5rem);
```

### Layout Shift Prevention (Cumulative Layout Shift)

CLS is a Core Web Vital. Sudden layout shifts are caused by images without dimensions, dynamically injected content, and font swaps.

- **Images**: Always set `width` and `height` attributes, even in responsive images. Use `aspect-ratio` CSS property.
- **Fonts**: Use `font-display: swap` with `size-adjust` to reserve space during font load.
- **Dynamic content**: Reserve space for skeletons, ads, or async-loaded widgets with fixed min-heights.
- **Placeholders**: For lazy-loaded components, render an empty container with the same dimensions as the final content.

### Container Queries vs Media Queries

| Aspect | Media Queries | Container Queries |
|---|---|---|
| Query target | Viewport size | Parent container size |
| Reusability | Component behavior tied to global viewport | Component adapts to its own container — reusable anywhere |
| Browser support | Universal | ~85% (as of 2026, Chromium/Firefox/Safari) |
| Use case | Page-level layout (sidebar, header, footer) | Self-contained components (card grid, widget panel, data table) |

**Container query example**:

```css
.card-container {
  container-type: inline-size;
}
@container (min-width: 400px) {
  .card { flex-direction: row; }
}
```

**Best practice**: Use media queries for page chrome (shell layout) and container queries for reusable components that live in different contexts.

### Adaptive vs Responsive

| Approach | Description | When to Use |
|---|---|---|
| Responsive | Fluid, continuous adaptation via relative units + breakpoints | Most products — it covers the spectrum gracefully |
| Adaptive | Fixed layouts at specific breakpoints; layout "snaps" between preset designs | TV apps, game consoles, kiosks — where screen sizes are known |
| Hybrid | Responsive grid with adaptive component behavior at certain thresholds | The real-world best practice — fluid layout + component breakpoints |

### Pros

- One codebase serves all devices — lower maintenance than separate mobile/desktop
- Future-proof — new device sizes are handled by existing fluid behavior
- Better SEO (single URL per page, not `m.` subdomain)
- Core Web Vitals optimization forces performance discipline

### Cons

- Testing matrix is large (every breakpoint × every component state)
- Mobile-first can feel restrictive for desktop-heavy features
- Performance overhead from unused CSS at certain viewports
- Complex interactions (drag-and-drop, hover-dependent UI) are hard to make responsive
- Communication overhead — designers must produce multi-breakpoint mockups

### Related Patterns

- **Visual Hierarchy** — hierarchy must rework at each breakpoint (what is prominent on desktop may be secondary on mobile)
- **Design Systems** — tokens and components must include responsive behavior specs
- **Atomic Design** — Templates own breakpoint logic, keeping components breakpoint-agnostic
- **Progressive Enhancement** — build core functionality for mobile, enhance for desktop