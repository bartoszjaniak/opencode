## Visual Hierarchy

### Intent / Problem

Users do not read interfaces — they scan them. Without deliberate visual hierarchy, every element competes for attention, resulting in cognitive overload, missed CTAs, and poor task completion. Visual hierarchy is the practice of arranging UI elements so that the eye is guided from most to least important in a predictable, intuitive sequence.

### Foundational Principles

#### 1. The 8-Point Grid System

The 8px grid is the industry standard for spacing and sizing because 8 divides evenly into 1280, 1440, 1920 (common viewport widths) and scales cleanly across breakpoints.

- **Base unit**: 8px. All margins, padding, and component heights are multiples of 8 (8, 16, 24, 32, 40, 48, 64, 96, 128).
- **Exceptions**: Typography line-height and fine UI (icons, avatars) sometimes use 4px increments.
- **Implementation**: Expose as spacing tokens (`--space-1: 8px`, `--space-2: 16px`, `--space-3: 24px`, `--space-4: 32px`).
- **Why 8 and not 10?**: 8 is the smallest integer that divides both 1440 and 1920 without remainder, and 8 × 12 = 96 (close to 100mm print baseline grid).

#### 2. Typography Scale

Type establishes the primary axis of hierarchy. A modular scale uses geometric ratios to define sizes.

| Role | Size | Weight | Line-Height | Use Case |
|---|---|---|---|---|
| Display | 48px | Bold (700) | 1.1 | Hero heading, splash pages |
| Heading 1 | 32px | Bold | 1.2 | Page title |
| Heading 2 | 24px | Semi-Bold (600) | 1.3 | Section heading |
| Heading 3 | 20px | Semi-Bold | 1.4 | Card title, subsection |
| Body | 16px | Regular (400) | 1.5 | Paragraphs, labels |
| Body Small | 14px | Regular | 1.5 | Captions, metadata |
| Caption | 12px | Regular | 1.4 | Footnotes, timestamps |

- **Contrast ratio**: The difference between adjacent sizes should be perceptually noticeable (at least 2–4px difference for body sizes, larger jumps for headings).
- **Max line length**: 60–75 characters per line for optimal readability (set via `max-width: 65ch`).
- **Line-height**: 1.5 for body text, tighter (1.2–1.3) for headings.

#### 3. Color Contrast for Hierarchy

Color guides attention via saturation, value, and hue — not just brightness.

- **Primary action**: high-contrast background (brand color) for the main CTA.
- **Secondary actions**: outline or lower-contrast (e.g., `--color-text-secondary` instead of full black).
- **Disabled / muted**: reduce opacity to 38% or use `--color-text-tertiary`.
- **Error / success**: use color semantically (red for errors, green for success) but never as the only indicator — pair with icons or text.
- **Text contrast**: body text should meet WCAG AA (4.5:1 ratio on normal text, 3:1 for large text). Use a contrast checker during token design.
- **Surface hierarchy**: backgrounds also form hierarchy — primary surface (white/`--color-bg`), elevated surface (`--color-bg-elevated` with shadow), overlay surface (modal scrim).

#### 4. The F-Pattern vs Z-Pattern

These are the two dominant eye-scanning models. The choice depends on content density.

- **F-Pattern**: Users scan the left side vertically, then horizontal lines across the top. Best for text-heavy interfaces (articles, search results, data tables). Place the most important information on the left and at the top of each row.
- **Z-Pattern**: Users scan in a Z shape — top-left to top-right, diagonal down-left, then bottom-left to bottom-right. Best for minimalist or brand-heavy pages (landing pages, login screens, dashboards). Place the logo top-left, CTA top-right, and the main action bottom-right.
- **Hybrid**: Many complex UIs use a modified F-pattern in the main content area with a Z-pattern header/footer.

#### 5. Proximity & Grouping (Gestalt Law of Proximity)

Elements that are close together are perceived as related. Spacing is the most powerful hierarchy tool — and the most neglected.

- **Rule of thumb**: Related items get `--space-2` (16px) or less between them. Unrelated groups get `--space-4` (32px) or more.
- **Whitespace (negative space)**: Breathing room around a section signals its importance. A CTA button with generous whitespace around it draws more attention than a larger button packed into a crowded toolbar.
- **Visual groupings**: Use `gap` in flex/grid layouts rather than individual margins. Group form fields with a shared border or background.

#### 6. The Squint Test

A practical validation technique: squint at the screen until it blurs. The only shapes visible are large blocks of color and whitespace. The most prominent block should be the most important element. If your eye goes to a secondary element first, the hierarchy is wrong.

### Implementation Checklist

- [ ] Scale defined via 8px grid for all spacing
- [ ] Type scale has at least 5 sizes with clear contrast between adjacent levels
- [ ] Color palette maps to semantic roles (primary, secondary, neutral, danger, success)
- [ ] Every text element has a defined role (heading vs body vs caption)
- [ ] F-pattern or Z-pattern consciously chosen for each page layout
- [ ] Squint test passes: the primary action is the first thing you see
- [ ] Proximity groups are consistent across all pages

### Pros

- Dramatically improves scanability and task completion rates
- Reduces cognitive load — users do not need to "parse" the interface
- Accessible by nature (clear focus order, contrast)
- Makes responsive design easier (hierarchy adapts with spacing tokens)

### Cons

- Hard to retrofit into an existing codebase with inconsistent spacing
- Requires buy-in from designers, engineers, and product managers
- Spacing tokens feel "wasteful" to stakeholders who want to cram more content
- Over-reliance on color for hierarchy creates accessibility problems

### Related Patterns

- **Design Systems** — tokens encode visual hierarchy rules into a reusable system
- **Responsive Patterns** — hierarchy must reflow across breakpoints (stacking, hiding, reordering)
- **Accessible Design** — visual hierarchy supports logical focus order and screen-reader flow
- **8-Point Grid** — the spacing methodology that enables consistent visual hierarchy