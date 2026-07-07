## User Research Methods

### Intent / Problem

Building products without understanding users leads to misaligned features, low adoption, and high churn. User research closes the gap between assumptions and reality by systematically gathering evidence about who users are, what they need, how they behave, and why they behave that way. Without research, teams risk investing in solutions that solve the wrong problems or solve the right problems in the wrong way.

### Qualitative vs Quantitative

Both modes are essential and answer different questions.

**Qualitative research** answers *why* and *how*. It explores motivations, pain points, mental models, and emotional responses. Methods include interviews, contextual inquiry, diary studies, and usability testing. Sample sizes are small (5–15 participants per segment), and data is rich but not generalizable. Use qualitative early in the process (discovery, concept testing) and when you need deep understanding.

**Quantitative research** answers *what*, *how many*, and *how often*. It measures behavior at scale. Methods include surveys, analytics, A/B tests, and clickstream analysis. Sample sizes are large (hundreds or thousands), and data is statistically significant but lacks context. Use quantitative when validating hypotheses, prioritizing features, or tracking KPIs.

Combine both in a mixed-methods approach: start with qualitative to discover *what matters*, then use quantitative to measure *how much it matters*.

### Interviews (Semi-Structured)

One-on-one conversations following a discussion guide with open-ended questions. The semi-structured format lets researchers probe unexpected topics while ensuring coverage of key areas.

**When to use**: Discovery phase, early concept validation, understanding workflows, identifying unmet needs.

**Best practices**:
- Use a discussion guide, not a script — adapt questions to the flow
- Ask about specific past behavior ("Tell me about the last time you...") rather than hypotheticals
- Avoid leading questions ("How easy was that?" → "Walk me through what happened")
- Listen 80%, talk 20%
- Follow up with "Why?" and "Can you tell me more about that?"

**Pros**: Deep insights, flexible, builds empathy, captures unexpected findings.
**Cons**: Time-intensive, not generalizable, requires skilled moderation, small sample.

### Surveys & Questionnaires

Structured instruments for collecting self-reported data at scale. Effective for measuring satisfaction (e.g., SUS, NPS, CSAT), segmenting users, and validating qualitative findings.

**When to use**: Post-launch measurement, prioritization, demographic profiling, identifying feature demand.

**Best practices**:
- Keep it under 10 minutes (5–20 questions)
- Use validated scales when possible (SUS, UEQ, NASA-TLX)
- Avoid double-barreled questions ("How satisfied are you with the speed and accuracy?")
- Randomize answer order to reduce bias
- Pilot test with 5 users to catch confusing wording

**Pros**: Scalable, statistically analyzable, cost-effective per response.
**Cons**: Self-report bias, survey fatigue, shallow insights, no follow-up.

### Usability Testing

Observing real users attempting tasks with a prototype or live product. The goal is to identify where users struggle, what confuses them, and what works well.

**Moderated**: A facilitator guides the session, asks probing questions, and adapts tasks in real time. Richer data, harder to scale.

**Unmoderated**: Users complete tasks independently via a tool (e.g., UserTesting, Maze). Faster, larger sample, but less depth.

**When to use**: Before launch (formative), after launch (summative / benchmarking), when redesigning flows.

**Best practices**:
- Define 3–5 core tasks per session
- Measure task success, time on task, error rate, and satisfaction
- Use think-aloud protocol — ask participants to verbalize their thoughts
- Test with 5 users per segment (Nielsen's law)
- Remote testing is as effective as in-person for most scenarios

**Pros**: Direct behavioral evidence, identifies specific UI problems, builds team empathy.
**Cons**: Lab setting is artificial, requires recruiting, results are not statistical.

### Analytics & Behavioral Data

Quantitative tracking of actual user behavior via tools like Google Analytics, Mixpanel, Amplitude, or custom event tracking.

**Key metrics**: Page views, sessions, bounce rate, conversion rate, retention, funnel drop-off, DAU/MAU, feature adoption.

**When to use**: Continuous monitoring, funnel optimization, A/B test evaluation, identifying where users drop off.

**Best practices**:
- Define events and properties before development (tracking plan)
- Focus on behavioral metrics (what users do) over attitudinal (what they say)
- Segment data by user type, cohort, and device
- Pair analytics with qualitative research to explain *why* the numbers look that way

**Pros**: Objective behavior, continuous data, large scale, no recall bias.
**Cons**: No understanding of motivation, requires instrumentation, privacy/compliance concerns.

### Jobs-To-Be-Done (JTBD)

A framework that frames products around the progress users want to make in specific circumstances, rather than demographics or features. A "job" has functional, emotional, and social dimensions.

**Core concepts**:
- **Functional job**: The task the user wants to accomplish
- **Emotional job**: How the user wants to feel during and after
- **Social job**: How the user wants to be perceived by others
- **Hire / fire**: Users "hire" a product to do a job and "fire" it when a better alternative appears
- **Forces of progress**: Push (current struggles), Pull (new solution appeal), Anxiety (fear of change), Habit (inertia)

**When to use**: Product strategy, innovation, competitive positioning, defining MVPs, messaging.

**Best practices**:
- Interview people who recently hired or fired a solution
- Focus on the *switch* moment — what triggered the change?
- Capture the full timeline: before, during, after
- Write job statements in the format: "When [situation], I want to [motivation], so I can [expected outcome]"

**Pros**: Reveals true motivation, cuts through demographic noise, identifies unmet needs.
**Cons**: Requires skilled interviewing, abstract concept, hard to communicate to stakeholders.

### Method Selection Guide

| Phase | Recommended Methods |
|---|---|
| Discovery | Interviews, contextual inquiry, JTBD, diary studies |
| Definition | Card sorting, tree testing, competitive analysis |
| Design | Formative usability testing, concept testing, desirability testing |
| Development | Design validation, accessibility testing (WCAG), rapid iterative testing |
| Launch | Summative usability test, analytics baseline, benchmark survey |
| Post-launch | Analytics, surveys (NPS/SUS/CSAT), A/B testing, funnel analysis |

Choose methods based on the question you're answering, not the tools you prefer. Always triangulate — no single method provides the full picture.

### Related Patterns

- [Information Architecture](information-architecture.md) — organizing content so users can find what they need
- [Interaction Patterns](interaction-patterns.md) — how users interact with components and flows
- [Accessibility](accessibility.md) — ensuring research methods are inclusive and findings apply to all users