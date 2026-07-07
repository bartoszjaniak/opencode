## Design Systems

### Intent / Problem

A design system solves the scaling problem of UI consistency across teams, products, and platforms. Without one, every screen reinvents components, leading to visual fragmentation, duplicated effort, inaccessible interfaces, and slow iteration. The system codifies the shared visual language so that designers and engineers speak the same vocabulary.

### Core Pillars

#### 1. Design Tokens

Tokens are the atomic variables that underpin every visual decision. They decouple the visual style from hard-coded values.

- **Color tokens**: semantic naming (`--color-primary`, `--color-danger`, `--color-bg-surface`) rather than literal (`--color-blue-500`). Support light/dark mode via token switching.
- **Typography tokens**: font family, weight, size, line-height, letter-spacing — usually mapped to a type scale (e.g., 12/14/16/20/24/32/48).
- **Spacing tokens**: based on a unit (4px or 8px grid), exposed as `--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px), etc.
- **Shadow / elevation tokens**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`.
- **Border / radius tokens**: `--radius-sm`, `--radius-md`, `--radius-full`.
- **Motion tokens**: `--duration-fast`, `--ease-in-out`, `--ease-bounce`.

Tokens are exported as CSS custom properties, JSON (for Figma), and platform-specific formats (Android XML, iOS asset catalogs).

#### 2. Component Library

A canonical set of reusable UI components built on top of tokens.

- **Primitives**: Button, Input, Select, Checkbox, Radio, Toggle, Tooltip, Modal, Dropdown.
- **Composites**: DataTable, DatePicker, Autocomplete, Dialog, Stepper, Tabs, Sidebar.
- **Layout**: Container, Grid, Stack, Flex, Divider.
- **Feedback**: Toast, Snackbar, Banner, Spinner, Skeleton, ProgressBar.

Each component has a defined API (props/slots), states (default, hover, active, disabled, error, loading, focus-visible), and responsive behavior.

#### 3. Documentation (The Source of Truth)

A living style guide — typically a Storybook or a dedicated doc site — that includes:

- Visual gallery of every component and its states.
- Usage guidelines ("when to use Button vs Link", "do not nest Dropdown inside another Dropdown").
- Code examples (React, Angular, HTML/CSS, SwiftUI).
- Accessibility notes (ARIA roles, keyboard navigation, color contrast ratios).
- Migration guides for breaking changes.

#### 4. Figma ↔ Code Bridge

The single biggest failure point. When design tokens live only in Figma and code tokens only in CSS, they drift.

- **Token sync tools**: Specify, Supernova, or custom GitHub Actions that pull token JSON from Figma and generate CSS/SCSS/Tailwind configs.
- **Component sync**: Anima, Plugin "Figma to Code", or manual spec reviews. Full auto-generation of production code from Figma is rarely viable for complex components.
- **Version tagging**: Match Figma library versions (e.g., `v2.3.0`) to npm package versions so designers and engineers can pin to the same release.

### Governance & Workflow

- **RFC process**: Every proposed component or token change goes through a lightweight RFC (template: problem, proposed solution, usage examples, alternatives considered).
- **Contributing model**: Central team owns tokens + primitives; squads own domain-specific composites. Any change to primitives requires central team approval.
- **Breaking change policy**: Deprecate over 2 releases. Provide codemods for automated migration. Announce in a #design-systems channel at least 1 sprint ahead.

### Versioning Strategy

| Change Type | Example | Semver Bump |
|---|---|---|
| New component | Add `DatePicker` | Minor |
| Non-breaking prop | Add `variant="ghost"` to Button | Minor |
| Breaking prop | Remove `size="xl"` | Major |
| Token value | Change `--color-primary` | Major (visual regressions) |
| Deprecation | Mark old `Tabs` as deprecated | Minor, removal is Major |

### Adoption Strategies

- **Incremental co-existence**: Old and new system run side-by-side. Teams migrate component-by-component. Requires CSS scoping (shadow DOM, CSS-in-JS, or prefix namespacing).
- **Big bang rewrite**: One branch, one release. High risk but fast. Only viable for small products or startups.
- **Strangler pattern**: Wrap old components in a layer that internally renders new ones. Remove old code once migration is at 100%.

### Pros

- Single source of truth for visual language
- Drastically reduces design → dev handoff friction
- Built-in accessibility (if tokens and components enforce contrast, focus, keyboard nav)
- Enables theming / white-labeling via token swap
- Faster onboarding for new team members

### Cons

- High initial investment (3–6 months for a mature system)
- Can become bureaucratic if governance is too rigid
- Risk of "design system as a silo" — disconnected from real product needs
- Over-abstraction: components with 50 props that try to do everything
- Maintaining backwards compatibility while evolving tokens is hard

### Related Patterns

- **Atomic Design** — provides the component hierarchy methodology that design systems codify
- **Visual Hierarchy** — design systems encode hierarchy rules into tokens (type scale, spacing, color)
- **Design Tokens** — the technical implementation layer beneath a design system
- **Storybook / Pattern Library** — the documentation delivery format