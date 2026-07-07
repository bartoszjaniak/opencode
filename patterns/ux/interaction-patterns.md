## Interaction Design Patterns

### Intent / Problem

Users form expectations about how interfaces behave based on years of digital experience. Interaction patterns codify proven solutions to recurring interface challenges — feedback, error handling, data submission, and state management. Applying consistent, predictable patterns reduces learning curves, prevents errors, and builds user trust.

### Feedback Loops

Every user action requires system feedback. The feedback must be immediate, informative, and appropriately salient.

**Types of feedback**:

| Type | Timing | Example |
|---|---|---|
| Visual | < 100ms | Button hover, focus ring, selection highlight |
| Confirmation | < 1s | "Saved" toast, checkmark on sent message |
| Progress | > 1s | Loading spinner, progress bar, skeleton screen |
| Error | Immediate | Inline validation error, submission failure toast |
| Success | After completion | Success page, celebration animation |

**Principles**:
- **Immediacy**: Feedback must appear within the user's attention window. Delayed feedback breaks the action-perception loop.
- **Proportionality**: Small actions get subtle feedback, high-stakes actions get prominent feedback.
- **Actionable**: Error feedback must explain what went wrong AND how to fix it. "Invalid date format. Use DD/MM/YYYY" not "Error 400."

**Common patterns**:
- **Skeleton screens**: Show content layout before content loads. Reduces perceived wait time by 30–50%.
- **Optimistic toasts**: After an action, briefly confirm success without blocking the user.
- **Inline validation**: Validate fields after the user moves to the next field (on blur), not after submit.

### Undo / Redo Patterns

The ability to reverse actions is one of the most important safety nets in UX. Without it, users fear making mistakes and become hesitant.

**Types**:
- **Sequential undo**: Reverse actions one at a time, in reverse order (Ctrl+Z / Cmd+Z). Required for content creation tools.
- **Timed undo**: "Undo" option appears temporarily after a destructive action (Gmail's "Undo send," Slack's "Undo delete"). Gives users a grace window.
- **Confirmational undo**: Ask "Are you sure?" before performing the action. Use sparingly — frequent confirmation dialogs train users to dismiss them reflexively.

**When to use each**:
- Sequential undo: Text editors, design tools, any multi-step creation flow
- Timed undo: Destructive actions in consumer apps (send, delete, archive)
- Confirmational undo: Irreversible actions with major consequences (account deletion, payment)

**Best practices**:
- Always provide undo for destructive actions if technically feasible
- Show what will be undone ("Undo: delete paragraph") not just "Undo"
- Store enough history for the user to feel safe (20+ steps in creation tools)
- Persist undo history across page navigations in long-form tools (local draft + undo stack)

### Optimistic UI

Update the interface immediately based on the expected outcome of an action, before the server confirms it. If the server rejects the action, roll back and show an error.

**Example**: Liking a post increments the counter and fills the heart icon instantly. If the network fails, decrement and show "Couldn't save your like."

**When to use**: Actions that are expected to succeed > 95% of the time, with fast server responses (< 1s typical). Common in social, collaboration, and productivity apps.

**Risks and mitigations**:
- **If the server rejects**: Roll back gracefully. Show a clear error and optionally retry.
- **If the user navigates away**: Sync in the background or warn about unsaved changes.
- **If multiple clients conflict**: Use conflict resolution (CRDT, last-write-wins, or manual merge).

**Pros**: Feels instant, responsive, and modern. Reduces perceived latency significantly.
**Cons**: Complex to implement, risky for high-stakes transactions (payments), can confuse users if rollbacks are frequent.

### Progressive Disclosure

Reveal complexity gradually so users are never overwhelmed by the full interface at once. Particularly important for feature-rich applications.

**Patterns**:
- **Walkthrough / wizard**: Break a complex task into sequential steps with a clear progress indicator. Each step shows only relevant options.
- **Expandable sections**: "Show advanced settings," "View more options." Advanced features are hidden by default but accessible in one click.
- **Gradual onboarding**: Introduce features over days/weeks, not all at once. Mobile apps show a feature on first relevant use, not at signup.
- **Role-based disclosure**: Show features based on user role, permissions, or usage patterns. A beginner sees basic options; an expert sees the full toolset.

**When to use**: Complex forms (multi-step checkout, configurators), enterprise software with diverse user roles, mobile apps with small screens, data dashboards with deep drill-down capabilities.

### Onboarding Flows

The first-run experience that helps users reach the "aha moment" — the point where they understand the product's core value.

**Types**:
- **Value-first**: Users perform the core action immediately (e.g., "Upload a photo"). Minimal upfront instruction. Best for intuitive products.
- **Tour-based**: A sequence of tooltips or coach marks highlighting key UI areas. Weakest pattern — users skip or forget them.
- **Checklist-based**: A progress list of setup steps ("Complete your profile," "Invite a teammate"). Works well for multi-step setup.
- **Contextual / progressive**: Tips appear at the point of need, triggered by user behavior. Most effective, hardest to implement.

**Best practices**:
- Skip the splash screen — load directly into the product
- Start with a quick win (something that produces immediate value)
- Let users skip onboarding and access it later
- Measure activation (users reaching the aha moment) not just completion
- Personalize onboarding based on user role or goal (asked during signup)

### Empty States

What users see when there's no data yet. Often neglected, but critical for first impressions and continued engagement.

**Patterns**:
- **Blank slate**: Illustration or icon + headline + explanation + CTA. Appeal to emotion (calm, friendly, aspirational).
- **Instructional**: "Add your first document" with a clear next action. Guides users toward value.
- **Status-based**: "No results match your filters" (not "No results" — implies the data is there, just filtered out).
- **Educational**: Show an example of what the screen will look like with data (demo data, sample content).

**Best practices**:
- Never show a completely blank screen
- Include a clear primary action (button or link)
- Explain why the state exists (new user? filtered? error?)
- Use empty states to educate and motivate, not just inform
- Design empty states for all entities (lists, search results, feeds, notifications)

### Error Handling UX

Errors are inevitable. Good error handling turns a frustrating moment into a recoverable one.

**Inline validation**: Validate fields on blur (after user leaves the field) or on input (with debounce). Show the error next to the field, not at the top of the page.

**Error messages**: Structure: "What went wrong" + "Why it happened" + "How to fix it." Use plain language, no error codes unless the user needs to reference them (and then show them in a non-prominent position).

**Global errors**: For submission failures, server errors, and network issues. Use a persistent banner, not a fleeting toast. Include a retry button.

**Recovery suggestions**:
- "Connection lost. Retry" with automatic retry after 3s
- "Your session expired. Your work has been saved as a draft."
- "Payment declined. Try a different card or contact your bank."

**404 and 500 pages**:
- Don't show generic "404 Not Found" — explain what might have happened
- Offer next steps: search, go home, report a broken link, contact support
- 500 errors: apologize, explain it's not the user's fault, log the error, retry automatically

### Confirmation Patterns

Asking users to confirm actions before they execute. Used to prevent errors. Overused, they cause "confirmation blindness" where users accept without reading.

**When to confirm**: Irreversible actions (delete, archive, permanent changes), financial transactions, actions affecting other users, sending unsaved data.

**When NOT to confirm**: Routine actions, actions with easy undo, actions the user explicitly initiated (clicked "Delete" — confirm again?).

**Patterns**:
- **Dialog confirmation**: Modal dialog with clear action labels. "Delete file" not "OK." Avoid "Yes/No" — use action-specific verbs.
- **Action confirmation toast**: "File deleted. [Undo]" — non-blocking, allows reversal within a time window.
- **Two-step confirmation**: Type the entity name to confirm deletion. For critically destructive actions (delete workspace, permanently erase account).

**Best practices**:
- Label buttons with the action, not "OK / Cancel"
- Explain consequences: "This will permanently remove the document for all team members."
- Use destructive styling (red) for dangerous actions in confirmation dialogs
- Consider timed undo instead of confirmation dialogs — users prefer it

### Related Patterns

- [Information Architecture](information-architecture.md) — progressive disclosure is shared with IA; navigation and content structure influence interaction flows
- [User Research](user-research.md) — usability testing validates interaction patterns against real behavior
- [Accessibility](accessibility.md) — all feedback, error, and confirmation patterns must work for assistive technology users