## Accessibility (WCAG)

### Intent / Problem

Approximately 15% of the global population experiences some form of disability. Inaccessible products exclude users, create legal liability, and lose market share. Accessibility (a11y) ensures that people with visual, auditory, motor, cognitive, or speech disabilities can perceive, operate, understand, and robustly interact with digital products. Beyond compliance, accessible design improves UX for everyone — better contrast helps in sunlight, larger targets help on mobile, captions help in noisy environments.

### WCAG Overview

The Web Content Accessibility Guidelines (WCAG) are the international standard for digital accessibility. WCAG 2.2 is the current version, organized around four principles known as **POUR** — every guideline falls under one of them.

### POUR Principles

#### Perceivable

Users must be able to perceive the content with at least one of their senses. This principle covers what is *presented* to users.

**Key guidelines**:
- **1.1 Text Alternatives**: All non-text content (images, icons, graphs) must have a text alternative (alt text). Decorative images use `alt=""` (empty) so screen readers skip them. Functional images (buttons, links) describe the action: `alt="Search"` not `alt="magnifying glass icon"`.
- **1.2 Time-Based Media**: Captions for audio, audio descriptions for video, sign language interpretation for pre-recorded content. Live audio needs real-time captions.
- **1.3 Adaptable**: Content must maintain meaning when presentation is changed. Information should not rely on sensory characteristics alone ("Click the green button"). Use semantic HTML to convey structure.
- **1.4 Distinguishable**: Sufficient color contrast (4.5:1 for normal text, 3:1 for large text), no information conveyed by color alone, resizable text up to 200% without loss, background/foreground separation.

#### Operable

Users must be able to operate the interface. This principle covers *interaction*.

**Key guidelines**:
- **2.1 Keyboard Accessible**: All functionality must be operable via keyboard. No mouse-only interactions. Custom widgets need ARIA keyboard roles.
- **2.2 Enough Time**: Users must be able to adjust or extend time limits. No auto-advancing content without warning. Moving/auto-updating content must have pause/stop/hide controls.
- **2.3 Seizures and Physical Reactions**: No content that flashes more than 3 times per second (photosensitive epilepsy). Animations must respect `prefers-reduced-motion`.
- **2.4 Navigable**: Skip to main content link, meaningful page titles, descriptive link text (not "Read more"), multiple ways to find content (search + nav), clear focus indicators, headings organized hierarchically (h1 > h2 > h3), breadcrumbs.
- **2.5 Input Modalities**: Touch targets must be at least 24×24 CSS pixels (44×44 recommended). Pointer gestures must have single-point alternatives (no swipe-only). Motion-activated features must have a UI alternative.

#### Understandable

Users must be able to understand the interface and how to operate it. This principle covers *comprehension*.

**Key guidelines**:
- **3.1 Readable**: Language of the page declared in HTML (`lang="en"`, `lang="pl"`). Unusual words, abbreviations, and jargon explained. Reading level should not exceed lower secondary education for essential content.
- **3.2 Predictable**: Navigation and behavior are consistent across pages. No unexpected context changes on focus or input. Same components behave the same way everywhere.
- **3.3 Input Assistance**: Labels and instructions provided for all inputs. Error suggestions (correct email format, required fields marked). Error messages are text-based and identify the problematic field. Legal/financial submissions are reversible, checked, and confirmed.

#### Robust

Content must be robust enough to work with current and future assistive technologies. This principle covers *compatibility*.

**Key guidelines**:
- **4.1 Compatible**: Valid, semantic HTML. ARIA used correctly and sparingly. All interactive elements expose their name, role, and value to the accessibility tree. Use native HTML elements before custom widgets.

### ARIA (Accessible Rich Internet Applications)

ARIA supplements HTML to make dynamic content and custom widgets accessible. Never use ARIA when a native HTML element provides the semantics — native is always more reliable.

**Rules**:
- **First rule of ARIA**: Don't use ARIA if you can use a native HTML element. `<button>` instead of `<div role="button">`.
- **Second rule**: Do not change native semantics. Don't add `role="heading"` to a `<button>`.
- **Third rule**: All interactive ARIA controls must be keyboard accessible.
- **Fourth rule**: Use `role="presentation"` or `aria-hidden="true"` with caution — they remove elements from the accessibility tree.
- **Fifth rule**: All ARIA elements must have an accessible name (via `aria-label`, `aria-labelledby`, or visible text content).

**Common ARIA patterns**:
- `role="alert"` / `aria-live="assertive"` for important dynamic messages
- `role="dialog"` with `aria-modal="true"` for modal dialogs
- `role="tablist"`, `role="tab"`, `role="tabpanel"` for tab interfaces
- `aria-expanded` for collapsible sections
- `aria-current="page"` for active navigation items
- `aria-describedby` for additional help text
- `aria-hidden="true"` for decorative content that should be invisible to AT

### Keyboard Navigation

Many users cannot use a mouse — they rely on keyboard, switch devices, or voice control. Keyboard accessibility is the foundation of operable interfaces.

**Tab order**: The order in which focus moves between interactive elements. Must be logical (left-to-right, top-to-bottom in most cultures). Use DOM order — `tabindex` values > 0 are almost never needed and cause confusion.

**Focus indicators**: Every focusable element must have a visible focus ring. Never use `outline: none` without providing an alternative. WCAG requires minimum 2px offset or solid border with 3:1 contrast against the background.

**Keyboard patterns**:
- **Tab / Shift+Tab**: Move forward/backward between focusable elements
- **Enter / Space**: Activate the focused element
- **Arrow keys**: Navigate within a component (radio groups, lists, tabs, menus)
- **Escape**: Close overlays, dismiss modals, cancel menus
- **Home / End**: Jump to first/last item in a list or page

**Roving tabindex**: Technique where only one element in a group has `tabindex="0"` while others have `tabindex="-1"`. Arrow keys move focus within the group. Used for radio groups, tabs, and listboxes.

### Screen Reader Patterns

Screen readers (JAWS, NVDA, VoiceOver, TalkBack) convert digital content to speech or braille. Design must support linear content consumption.

**Landmarks**: Use HTML5 landmark elements (`<nav>`, `<main>`, `<aside>`, `<footer>`, `<header>`) or `role` equivalents. Users jump between landmarks to navigate the page quickly.

**Headings**: Must follow a logical hierarchy (h1 > h2 > h3) without skipping levels. Screen reader users navigate by headings. Every page needs exactly one h1.

**Links**: Link text must describe the destination ("View order history" not "Click here"). Avoid opening links in new tabs without warning (`target="_blank"` should include `rel="noopener noreferrer"` and a visual/text indicator).

**Images**: Decorative images use `alt=""`. Informative images describe the content. Complex images (charts, maps) use `alt` summary plus a long description (via `aria-describedby` or adjacent text).

**Dynamic content**: Use `aria-live` regions to announce content changes. `aria-live="polite"` waits for user idle; `aria-live="assertive"` interrupts immediately (use sparingly).

### Focus Management

Control where keyboard focus goes when the UI changes. Poor focus management traps screen reader users.

**Patterns**:
- **Page navigation**: Focus starts at the top of new page content (use skip link or move focus to h1)
- **Modals**: Trap focus inside the modal. Restore focus to the trigger element when closed.
- **Single-page app navigation**: Move focus to the new content heading, not back to top
- **Dynamic content**: After adding/removing items, move focus to the new item or a nearby stable element
- **Error states**: Move focus to the first error message or field

### Color Contrast

Text and UI elements must have sufficient contrast against their background.

**Minimum ratios (WCAG AA)**:
- Normal text (< 18pt or < 14pt bold): 4.5:1
- Large text (>= 18pt or >= 14pt bold): 3:1
- UI components and graphical objects: 3:1
- **WCAG AAA** (enhanced): 7:1 for normal text, 4.5:1 for large text

**Non-text contrast**: Icons, buttons, focus indicators, form field borders, and charts must meet 3:1 minimum.

**Tools**: WebAIM Contrast Checker, browser DevTools contrast inspector, axe DevTools, Color Contrast Analyser.

**Important**: Do not rely on color alone to convey information. Error states need icons + text, not just red borders. Charts need patterns or labels, not just color coding.

### Semantic HTML Foundations

Semantic HTML is the single most impactful accessibility practice. It provides structure, meaning, and built-in keyboard behavior at no extra cost.

**Key elements**:
- `nav` — primary navigation regions
- `main` — one per page, wraps primary content
- `article` — self-contained content (forum post, news story)
- `section` — thematic grouping, with a heading
- `aside` — complementary or tangential content
- `header`, `footer` — can be page-level or section-level
- `h1–h6` — heading hierarchy (must not skip levels)
- `ul`, `ol` — lists (screen readers announce item count)
- `table` — tabular data only (not layout). Use `thead`, `th` with `scope`, `caption`
- `button` — interactive action (instead of `div` + click handler)
- `a` — navigation to a URL (instead of `button` for links)
- `label` — associate with `input` via `for` attribute or wrapping
- `fieldset`, `legend` — group related form controls

**Forms**: Every input needs a label. Required fields use `required` attribute (not just an asterisk). Error messages use `aria-describedby` to associate with the input.

### Related Patterns

- [Interaction Patterns](interaction-patterns.md) — focus management, error handling, and feedback loops must be accessible
- [Information Architecture](information-architecture.md) — navigation must work for keyboard and screen reader users; labels must be descriptive
- [User Research](user-research.md) — include people with disabilities in usability testing; accessibility audits are a research method