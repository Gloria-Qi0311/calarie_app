# PLANS

## Current Stage
The repo started as a frontend prototype, but it is now in a transition stage between prototype and backend-backed product.

What already exists:
- Welcome screen and auth-style entry flow
- Multi-step setup flow
- Today screen
- Quick log screen
- Recommendations screen
- History screen
- Companion v1 frontend presence
- Settings and profile editing
- Exercise logging
- Edit / delete / undo flow
- App shell and primary navigation
- Analytics snapshot and experiment hooks
- Unified app client with local/remote adapters
- Mock API server
- First Postgres/Supabase repository path
- Schema, migration, preflight, smoke, and cutover tooling

What does not yet exist in a product-ready form:
- Real authentication
- Real profile persistence tied to auth/session ownership
- Timezone-safe daily summaries
- Full database cutover to a real Supabase project
- Fully trusted Postgres-mode history and Today reads against real data
- Real analytics pipeline beyond local/mock event storage
- Production-ready recommendation and companion services
- Stronger settings coverage for all profile and timezone inputs

What now exists beyond the original prototype:
- Shared domain logic for calorie, companion, recommendation, and pattern rules
- Unified app client and adapter structure
- Local and remote adapter split
- Mock API server contract
- First backend API contract document
- First Postgres/Supabase schema migration draft
- Postgres repository implementation path through Supabase REST
- Preflight, live probe, deep probe, bootstrap profile flow, and smoke validation

## Planning Assumptions
- Frontend structure is good enough to support backend integration
- The immediate goal is not to redesign the app again
- The immediate goal is to make the product real, measurable, and extensible
- v1 intelligence should be rule-based and explainable
- The companion should add warmth without adding friction

## Milestone 1: Product Foundation

### Goal
Define the product system clearly enough that engineering, data, and MLE can build against the same contracts.

### Outcome
The team has a shared definition of:
- domain objects
- events
- metrics
- decision logic boundaries
- API boundaries
- milestone acceptance

### Scope
- Freeze MVP scope for the first backend-backed release
- Define source-of-truth entities
- Define event taxonomy
- Define setup and target-generation rules
- Define companion state model v1
- Define API contracts for core flows

### Out Of Scope
- Full backend implementation
- Advanced companion progression
- AI meal parsing
- Advanced ML models

### Role Tasks

PM:
- Convert PRD into milestone-sized specs
- Define the activation journey
- Write acceptance criteria for auth, setup, first log, and Today revisit
- Define what is deferred versus MVP

Data:
- Draft schema for profiles, intake entries, exercise entries, daily summaries, meal patterns, and analytics events
- Define metrics for activation, logged day, setup completion, and companion engagement
- Define event naming and payload rules

MLE:
- Define target-generation logic v1
- Define rule-based pattern shortcut logic v1
- Define recommendation logic inputs and outputs v1
- Define companion short-term and long-term state model v1

Software Engineer:
- Propose backend architecture
- Define API contracts and validation boundaries
- Decide shared type structure
- Set up test strategy for calculation logic and data integrity

### Exit Criteria
- Core entities documented
- Event taxonomy documented
- Metric definitions documented
- API contract draft complete
- Decision logic spec complete
- Companion state spec complete

## Milestone 2: Core Product Backend

### Goal
Replace local-only prototype behavior with real persistence and trustworthy product logic.

### Outcome
A user can authenticate, complete or skip setup, log intake and exercise, and come back to real Today and History data.

### Scope
- Auth and session management
- Profile persistence
- Setup persistence
- Intake CRUD
- Exercise CRUD
- Undo and delete support
- Daily summary recompute
- Today queries
- History queries
- Timezone-safe day grouping

### Out Of Scope
- Advanced recommendation ranking
- Rich companion progression
- Deep settings management
- Weekly insights

### Role Tasks

PM:
- Lock M2 user stories
- Define empty, error, and partial-setup states
- Approve behavior for skip-setup users
- Sign off on what "trustworthy Today" means

Data:
- Finalize schema and migrations
- Define data QA checks for daily summary correctness
- Validate metric capture for core funnel events
- Define timezone edge-case test cases

MLE:
- Provide rule outputs required by Today for users with and without targets
- Define simple recommendation stub logic that can run on real persisted data
- Define initial pattern candidate generation logic

Software Engineer:
- Implement backend data model
- Implement auth and profile services
- Implement intake/exercise APIs and persistence
- Implement daily summary recompute pipeline
- Integrate frontend with real APIs
- Add tests for calculations, undo, and timezone correctness

### Exit Criteria
- No critical user data depends on `localStorage` as the source of truth
- Auth works
- Setup persists
- Intake/exercise persist
- Today reads persisted summaries
- History reads real historical data
- Core calculations are tested

## Milestone 3: Personalization And Companion Intelligence

### Goal
Turn the product from a tracker into a personalized, companion-led daily decision tool.

### Outcome
Today feels meaningfully personalized, pattern shortcuts begin reducing effort, and the companion reflects user behavior in a useful way.

### Scope
- Personalized target-based Today messaging
- Pattern shortcut generation and display
- Recommendation logic based on user state and remaining calories
- Companion state service
- Companion reactions after meaningful user actions
- Analytics for companion and personalization outcomes

### Out Of Scope
- Customizable avatar system
- Heavy gamification
- Complex ML ranking infrastructure
- AI image or meal parsing features

### Role Tasks

PM:
- Define the companion's product role on Today
- Prioritize experiments around entry continuation, setup completion, and Today return
- Define acceptance for recommendation usefulness and companion usefulness

Data:
- Build dashboards for funnel and return behavior
- Track companion interaction and recommendation interaction events
- Measure shortcut adoption and return after interaction

MLE:
- Implement v1 recommendation logic
- Implement v1 pattern detection logic
- Implement companion progress-state logic
- Define offline evaluation against collected behavior data

Software Engineer:
- Expose personalization outputs to the frontend
- Integrate pattern shortcuts into logging flows
- Integrate companion state outputs into key surfaces
- Add feature flags or simple experiment hooks

### Exit Criteria
- Personalized Today logic is live
- Pattern shortcuts are generated from real use
- Companion state changes are backed by product logic
- Key personalization and companion events are measurable

## Recommended Build Order

### Specify First
1. Core data model
2. Metric definitions
3. Event taxonomy
4. Summary recompute rules
5. Target-generation rules
6. Recommendation input/output contract
7. Companion state model
8. API contracts

### Implement First
1. Auth and profile persistence
2. Intake and exercise persistence
3. Daily summary recompute
4. Real Today and History queries
5. Event tracking foundation
6. Rule-based recommendation and pattern services

### Defer For Now
- AI meal parsing
- Advanced avatar customization
- Weekly insights
- Weight tracking journeys
- Native/PWA packaging
- Complex ML infra

## Team Operating Model

### Default Workflow Per Feature
1. PM writes a short spec
2. Data adds metrics and schema impact
3. MLE adds decision logic rules
4. Software Engineer adds implementation plan
5. Team reviews the contract
6. Build starts
7. PM reviews against acceptance criteria
8. Results and gaps are written back here

### Default Artifact Checklist
Every milestone or major feature should have:
- Goal
- Scope
- Out of scope
- User-facing behavior
- Data contract
- Decision logic contract
- Engineering plan
- Acceptance criteria
- Metrics
- Risks

## Risks To Watch
- The companion could become decorative instead of useful
- Onboarding could become too long and reduce continuation
- Recommendation logic could feel arbitrary and reduce trust
- Frontend-specific assumptions could leak into backend source-of-truth systems
- Timezone and recompute logic could silently create incorrect history views

## Immediate Next Docs To Create
- `docs/product/mvp-spec.md`
- `docs/data/events-v1.md`
- `docs/mle/decision-logic-v1.md`
- `docs/engineering/test-strategy-v1.md`

## Completed Artifacts
- `docs/data/schema-v1.md`
- `docs/engineering/api-contract-v1.md`
- `supabase/migrations/20260327_000001_init.sql`
