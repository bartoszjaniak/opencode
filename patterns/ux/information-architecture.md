## Information Architecture

### Intent / Problem

As content and features grow, users struggle to find what they need. Poor information architecture (IA) causes frustration, errors, abandonment, and support tickets. IA provides the structural foundation — how content is organized, labeled, and navigated — so users can find information and complete tasks efficiently without cognitive overload.

### Content Organization

How content is grouped and structured determines how easily users can scan, understand, and navigate. The four fundamental schemes:

**Hierarchical (Taxonomy)**: A tree structure with parent-child relationships. Most common. Users navigate from broad categories to specific items. Works well when content has clear categorical relationships.

**Sequential**: Content arranged in a linear order. Best for step-by-step processes, tutorials, checkout flows, or storytelling — places where one step naturally follows the next.

**Matrix / Faceted**: Content accessible via multiple attributes (e.g., by price, color, size, rating). Users filter and browse along multiple dimensions. Common in e-commerce, search results, and dashboards.

**Network / Hypertext**: Nodes connected by contextual links. No single hierarchy. Best for wikis, documentation, and exploratory learning. Flexible but can cause disorientation without clear wayfinding cues.

**When to choose**: Use hierarchy for broad content catalogs, sequential for guided tasks, faceted for multi-attribute browsing, and network for knowledge-heavy exploratory contexts.

### Navigation Patterns

**Global Navigation**: Persistent top-level navigation (header, sidebar). Provides orientation and access to primary sections. Should remain stable across pages.

**Local Navigation**: Sub-navigation within a section. Surfaces sibling pages and child content. Helps users understand "where am I within this section."

**Breadcrumbs**: A secondary navigation showing the current page's position in the hierarchy. Format: Home > Category > Subcategory > Page. Reduces steps to go back up. Best for hierarchies 3+ levels deep.

**Utility Navigation**: Secondary actions (account, settings, help, language selector, logout). Placed in a less prominent area (top-right or bottom-left). Kept separate from primary task navigation.

**Contextual Navigation**: Links embedded in content that lead to related information. Supports discovery and associative learning. Common in documentation, wikis, and editorial content.

**Pagination vs Infinite Scroll**:
- Pagination: Predictable, allows bookmarking, works for search/browse. Use when finding specific items is important.
- Infinite scroll: Seamless, engaging for discovery. Use for social feeds, image galleries, and exploration-focused browsing.

### Labeling

Labels are the words on navigation, buttons, links, and headings. Good labels make IA invisible; bad labels destroy usability.

**Principles**:
- **User-centered**: Use the audience's vocabulary, not internal jargon. "Find a doctor" not "Provider search tool."
- **Scannable**: Short (1–3 words), distinct, and specific.
- **Predictable**: Users should accurately guess what's behind a label before clicking.
- **Consistent**: Same label = same content everywhere. Capitalization, tone, and phrasing should be uniform.

**Techniques**:
- Conduct open card sorting to discover users' mental models and natural vocabulary
- Use closed card sorting to validate proposed labels
- A/B test labels on live traffic when possible
- Audit for ambiguous, overlapping, or redundant labels
- Add micro-labeling (short descriptions) for high-stakes navigation items

### Search

Search is a compensatory navigation mechanism — users turn to it when browsing fails. A well-designed search system includes:

**Search box**: Visible, accessible (often via Ctrl/Cmd+K), large enough for 20+ characters. Place in a consistent location (top of page or header).

**Autocomplete / Suggestions**: Predicts queries as users type. Reduces errors, speeds up input, and guides users toward valid queries. Base suggestions on real user search data or content inventory.

**Result presentation**:
- Show relevance indicators (e.g., match highlighting)
- Provide preview snippets (context around the match)
- Offer faceted filters to narrow results
- Use "Did you mean?" for spelling corrections
- Show result count and search time

**No results handling**:
- Never show an empty page
- Suggest related or popular queries
- Offer to search in broader categories
- Provide a clear next action (contact support, browse all)
- Log failed queries for content gap analysis

**When to prioritize search**: Large content catalogs (1000+ items), heterogeneous content types, expert users who know precisely what they want, mobile interfaces where browsing is cumbersome.

### Sitemaps

**Visual sitemaps**: Diagrams showing the full content hierarchy, used during design. Each node represents a page or content cluster. Arrows indicate parent-child relationships. Include page type (index, detail, form, tool) and status (new, existing, deprecated).

**XML sitemaps**: Machine-readable files for search engines. Not a UX pattern per se, but important for findability from external sources.

**Best practices for visual sitemaps**:
- Start with a content audit (what exists, what's missing, what's outdated)
- Aim for breadth over depth (3-click rule is myth — focus on semantic depth)
- Keep hierarchy to 3–5 levels maximum
- Label nodes with user-facing names, not internal codes
- Indicate dynamic content areas (e.g., user-generated content, search results)
- Validate with tree testing before building

### Card Sorting

A generative research method for discovering how users naturally categorize content.

**Open card sorting**: Users group unlabeled cards and name each group. Reveals users' mental models and preferred vocabulary. Use early in IA design.

**Closed card sorting**: Users place cards into predefined categories. Validates proposed IA. Use after open card sorting or when redesigning existing IA.

**Remote vs in-person**: Remote tools (OptimalSort, Miro, Trello) scale better. In-person provides richer qualitative discussion.

**Best practices**:
- 20–60 cards (too few = no patterns, too many = fatigue)
- 15–30 participants per sort
- Label cards with short, clear phrases (2–5 words)
- Include distractor cards that don't fit neatly (tests boundaries)
- Analyze with similarity matrices and dendrograms

**Pros**: Direct insight into user mental models, generates unexpected groupings.
**Cons**: Requires careful card creation, analyzing results takes skill, doesn't test task performance.

### Tree Testing

A validation method where users find items in a text-only hierarchy (no visual design, no search). Measures findability and label clarity.

**Metrics**:
- **Success rate**: Did users find the correct location?
- **Time on task**: How long did it take?
- **Directness**: Did users go straight to the answer or wander first?
- **Path**: Which branches did users explore? Where did they go wrong?

**When to use**: After card sorting (to validate a proposed IA), before wireframing (to catch structural issues early).

**Best practices**:
- 10–20 findability tasks (e.g., "Where would you find the privacy policy?")
- Test with 30–50 users per tree
- Don't let users search — only browse
- If success rate < 70%, restructure or relabel

### Progressive Disclosure

A pattern that reveals information incrementally to manage complexity. Users see only what they need at each step, with additional detail available on demand.

**Techniques**:
- **Show more / expand**: "Show advanced settings," "Read more"
- **Step-by-step wizards**: Break complex tasks into manageable steps
- **Accordion / tabs**: Group related content under expandable headings
- **Progressive reduction**: Hide rarely used actions behind menus or "more" buttons
- **Progressive onboarding**: Introduce features gradually over time

**When to use**: Complex forms, feature-rich applications, mobile interfaces, onboarding for new users.

**Best practices**:
- Expose the 20% of options that cover 80% of use cases
- Always provide a path to reveal hidden content
- Don't hide critical information (privacy, security, costs)
- Use progressive disclosure to reduce cognitive load, not to trick users

### Related Patterns

- [User Research](user-research.md) — card sorting and tree testing are primary IA research methods
- [Interaction Patterns](interaction-patterns.md) — navigation and progressive disclosure overlap with interaction design
- [Accessibility](accessibility.md) — IA must work for keyboard and screen reader users; labels must support assistive technology