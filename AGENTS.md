# AGENTS

## Purpose
This repo is being organized as a small AI product team building a companion-led personal calorie balance tracker.

The frontend prototype is already far enough along to validate interaction direction. The next phase focuses on turning the prototype into a real product system with durable data, clear product logic, lightweight intelligence, and measurable outcomes.

## Product Direction
- Mobile-first calorie balance tracker
- Low cognitive load logging
- Companion-led emotional experience
- Personalized guidance without judgment
- Fast paths before precise paths

## Team Roles

### PM
Owns product direction, scope, acceptance criteria, and milestone sequencing.

Primary responsibilities:
- Break PRD into milestone-sized specs
- Define user journeys and product priorities
- Decide MVP scope versus deferred work
- Write acceptance criteria for each milestone
- Resolve tradeoffs across speed, trust, and delight
- Run weekly planning, review, and milestone signoff

PM deliverables:
- Milestone spec
- User flow definition
- Scope in/out list
- Acceptance checklist
- Risk log

### Data
Owns product data definitions, metric truth, analytics contracts, and quality checks.

Primary responsibilities:
- Design core schema with product and engineering
- Define event taxonomy and metric definitions
- Specify dashboard inputs for activation, retention, setup completion, and companion engagement
- Validate data quality, recompute correctness, and timezone handling
- Build the measurement foundation for experiments

Data deliverables:
- Data model draft
- Event taxonomy
- Metric definitions
- Data QA checks
- Dashboard requirements

### MLE
Owns decision logic, personalization logic, pattern logic, and companion state logic.

Primary responsibilities:
- Define v1 plan generation logic
- Define rule-based pattern detection for repeated meals
- Define recommendation logic for Today and Add Food
- Define companion short-term and long-term state rules
- Prepare a path from heuristics to ML once real product data exists

MLE deliverables:
- Decision logic spec
- Pattern engine spec
- Recommendation logic spec
- Companion state model
- Offline evaluation plan

### Software Engineer
Owns backend implementation, API contracts, shared types, persistence, integration, and test coverage.

Primary responsibilities:
- Set up backend and database foundations
- Implement auth, profile storage, intake/exercise CRUD, summary recompute, and settings persistence
- Replace local-only frontend state with real APIs
- Add validation, tests, and observability
- Keep contracts aligned with PM, Data, and MLE specs

Software Engineer deliverables:
- Backend architecture plan
- API contracts
- Schema migrations
- Integration implementation
- Test coverage for critical logic

## Collaboration Rules
- Spec before implementation for any new domain object, metric, or decision rule
- The frontend must not become the source of truth for calorie math or daily summaries
- All user-facing calculations must have one documented definition and tests
- Any personalization behavior must be explainable in v1
- Any companion behavior must support user value, not just decoration
- Each milestone must map to at least one measurable product outcome
- Every major feature should define: owner, contract, acceptance, and instrumentation

## Working Rhythm
- Monday: plan the week and confirm the current milestone
- Midweek: review implementation progress and open questions
- End of week: demo, metric review, and doc updates

## Milestone Workflow
1. PM writes a short milestone spec
2. Data defines metrics, events, and schema implications
3. MLE defines decision logic and state rules
4. Software Engineer defines API and implementation plan
5. Team reviews contracts before coding
6. Implementation happens against the approved spec
7. PM signs off against acceptance criteria
8. Team updates PLANS.md with status and next steps

## Definition of Done
A milestone or major feature is only done when:
- Scope is documented
- Contracts are documented
- Critical logic is implemented
- Tests cover the important behaviors
- Events are instrumented
- Risks and follow-up gaps are recorded

## Current Reality Of The Repo
Current prototype status:
- Frontend routes and flows exist
- Welcome, auth-like entry, setup, Today, log, recommendations, and history are present
- Data is currently local and mostly stored in `localStorage`
- History and recommendations still rely on mock or frontend-only logic
- There is no real backend, schema, API layer, analytics pipeline, or MLE layer yet

Implication:
- The next work should focus on backend, data, personalization logic, and instrumentation, not on large new frontend expansions by default

## Decision Principles
- Prefer simple, testable systems over impressive but fragile systems
- Prefer rules with clear outputs before ML with unclear outputs
- Prefer daily habit support over one-time wow moments
- Prefer encouraging language over judgmental feedback
- Defer heavy features unless they directly improve activation, logging speed, personalization, or retention
