## Atomic Design

### Intent / Problem

UI codebases without a hierarchical component model descend into chaos: every page has its own Button, the same card pattern is copy-pasted 30 times with minor differences, and there is no vocabulary to discuss UI structure between designers and developers. Atomic Design (Brad Frost, 2013) provides a mental model and a naming convention for decomposing interfaces into a reusable, composable hierarchy.

### The Five Levels

#### 1. Atoms

The smallest, indivisible UI elements. They serve one purpose and have no dependence on other components.

- **Examples**: Label, Input, Button, Icon, Checkbox, Spinner, Badge, Avatar.
- **Rules**: An atom does not compose other components. It may use design tokens directly. It has clear states (default, hover, disabled, focus, error).
- **Caution**: Do not over-split. A Button is an atom. The text inside it is `string`, not an atom called "ButtonLabel".

#### 2. Molecules

Groups of atoms bonded together to perform a single, meaningful function.

- **Examples**: `SearchForm` (Input + Button + Icon), `Field` (Label + Input + ErrorMessage), `Card` (Image + Heading + Text).
- **Rules**: Molecules own layout relationships between their atoms (how far is Label from Input?). Molecules should not contain business logic — they are presentational.
- **Caution**: If a molecule needs conditional rendering based on data, it may actually be an Organism.

#### 3. Organisms

Complex, self-contained sections of a UI that combine molecules and atoms into distinct interface regions.

- **Examples**: `Header` (Logo + SearchForm + NavLinks + AvatarDropdown), `DataTable` (Table + Pagination + Toolbar), `ProductCardGrid` (Card + Card + Card).
- **Rules**: Organisms may fetch data, manage local state, and define page-level layout regions. They are the first level where concrete content appears.
- **Caution**: Organisms should not contain page-level routing logic. That belongs in Templates.

#### 4. Templates

Page-level skeletons that arrange organisms into a layout. Templates define the grid, the whitespace, the region order — without real content.

- **Examples**: `BlogPostTemplate` (Header + HeroImage + Sidebar + ArticleBody + Footer at breakpoints), `DashboardTemplate` (Sidebar + TopBar + MainContent + WidgetGrid).
- **Rules**: Templates are content-agnostic wireframes. They use placeholder data. They define responsive behavior (stack on mobile, side-by-side on desktop).
- **Caution**: Do not put API calls in templates. They are pure layout.

#### 5. Pages

Specific instances of a template populated with real data. Pages are what the user sees.

- **Examples**: `BlogPostPage` (BlogPostTemplate with actual article), `UserDashboardPage` (DashboardTemplate with real widgets and fetched data).
- **Rules**: Pages wire up data fetching, routing params, and state management to the template. If a page needs a layout adjustment for a specific case, that is a signal to update the template, not to override layout in the page.
- **Caution**: Pages should contain almost no custom CSS. All spacing and alignment belong one level down.

### When It Works Best

- **Design-system-driven products** where reuse is high (SaaS dashboards, design tools, admin panels).
- **Teams with 3+ frontend engineers** — Atomic Design gives a shared vocabulary for pull request reviews ("this atom needs a loading state", "extract this molecule from the organism").
- **Products that ship on multiple platforms** — the hierarchy maps naturally to React/Angular components, SwiftUI views, and Android Compose functions.
- **Design teams already using Figma component hierarchies** — the bridge between design layers and code components becomes intuitive.

### Pitfalls to Avoid

- **Over-abstraction**: Splitting a simple component into 6 atomic files. A `UserAvatar` with a status dot is a molecule, not an organism. Use judgment, not dogma.
- **The "atomic" trap**: Everything must be an Atom. No — Atoms are only the smallest meaningful pieces. A `Dropdown` with 5 sub-items is an organism.
- **Templates ignored**: Teams skip Templates and build Pages directly. Result: every page has unique layout code, no reuse, and any layout change requires touching every page.
- **Cross-level coupling**: An Atom knows about the Organism that contains it. Example: a `Button` atom that accepts `variant="primary"` because "the form organism needs it". Instead, the form should style the button via CSS or pass variant as a prop.
- **Flat folder structure**: All 500 components in one `components/` folder. Use subdirectories (`atoms/`, `molecules/`, `organisms/`, `templates/`) or a naming convention prefix (`AtomButton`, `MolSearchForm`).
- **Mixing concerns**: Organisms that also handle routing or global state break the separation.
- **Skipping design token usage**: Atoms hardcode values instead of referencing tokens.

### Pros

- Provides a clear, shared vocabulary for designers and developers
- Encourages systematic thinking about reuse
- Makes responsive design easier (Templates own breakpoint logic, not individual components)
- Naturally feeds into Design System documentation
- Easy to test: atoms are unit-testable, organisms can be integration-tested, pages are e2e-tested

### Cons

- Can feel rigid and academic — some components straddle levels
- Requires discipline to maintain the hierarchy under time pressure
- New developers may over-think where each new component belongs
- Without a design system/token layer, atoms proliferate
- Templates add overhead for simple apps (a form with 3 fields does not need atomic decomposition)

### Related Patterns

- **Design Systems** — Atomic Design is the organizational methodology that design systems formalize into a component library
- **Component-Driven Development (CDD)** — build components in isolation (Storybook) before composing them into pages; Atomic Design is a natural CDD taxonomy
- **Presentational vs Container Components** — Atoms/Molecules = presentational; Organisms = sometimes container; Pages = containers
- **Composition over Inheritance** — Atomic Design is an exercise in composition; children do not inherit from parents, they are passed as props/slots