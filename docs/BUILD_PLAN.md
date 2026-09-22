# CatOps — Refined PRD & Phased Build Plan

## Context
The uploaded PRD describes an ambitious v1 (SSO + OTP auth, household sharing, full inventory burn-rate math, recurring scheduling, image attachments) for what is currently an **empty repository** (`cat-in-sack`, containing only a placeholder `test.txt`). The user wants to develop the idea further before committing to a build — this session is scoped to **planning only**, no scaffolding or code yet.

The user confirmed:
- **Goal**: produce a refined, phased build plan (not code).
- **MVP scope**: trim to a single-user core loop — email OTP auth only (no SSO), one Feline profile, manual Events, basic Inventory with reorder alerts. Household sharing, recurrence rules, and image attachments are deferred to Phase 2.
- **Infra**: no accounts exist yet for MongoDB Atlas, Resend, Upstash, or Apple/Google OAuth. The plan must account for this as a setup prerequisite and favor local/mocked equivalents so early development isn't blocked on provisioning.

## Revised Domain Model (MVP cut)
Keep the PRD's five entities, but simplify relationships for v1:
- `User` — email, single implicit personal `Household` (no invite/sharing flow yet, but the schema keeps the `Household` foreign key from day one so Phase 2 doesn't require a migration).
- `Household` — created automatically at signup, 1 user only in MVP.
- `Feline` — name, DOB, breed, target weight, dietary notes. Multiple cats per household allowed (not multiple users).
- `Event` — type (`VET`, `GROOMING`, `DAYCARE`, `WEIGHT`), required `Feline` reference, date, location, provider, notes (for `VET`/`GROOMING`/`DAYCARE`) or a numeric `value` in kg (for `WEIGHT`). Weight history and medical history are both just filtered views over a Feline's Events — no separate weight-log entity. **No recurrence engine in MVP** — user re-creates recurring events manually; `recurrenceRule` field left in schema but unused until Phase 2.
- `Inventory` — type (`FOOD`, `LITTER`, `MEDS`), total amount, daily burn rate, computed depletion date, reorder threshold (in days, default 3 — the dashboard low-stock highlight and the Pantry warning are the same computed signal). Household-scoped only; no `Feline` reference, even for `MEDS`.

## Phased Roadmap

### Phase 1 — MVP (single-user core loop)
1. **Auth**: Email OTP via Resend only. Apple/Google SSO deferred. Dev/local: console-logged OTP stub first; real Resend account wired in as a deliberate milestone before Phase 1 is considered done.
2. **Onboarding**: signup → create first `Feline` profile — hard gate, the bottom tabs don't unlock until one exists (PRD AC2).
3. **Home dashboard**: next 7 days of `Event`s + inventory items below reorder threshold (PRD 5.2 AC1/AC2).
4. **Pantry (Inventory)**: CRUD, burn-rate input, depletion-date calculation, 3-day-prior warning (PRD 5.3 AC1/AC2).
5. **Logistics**: manually log past/future vet visits with text notes (image attachments deferred). No recurrence rule engine yet (PRD 5.4 AC1 only; AC2 deferred).
6. **Cats tab**: profile view, weight trend (Events of type `WEIGHT`), medical history (Events of type `VET`/`GROOMING`/`DAYCARE`) — one Event stream per Feline, filtered by type.
7. **Settings tab**: minimal — account/email, logout. Household sharing UI deferred.

### Phase 2 — Collaboration & richer scheduling
- Household invites (multi-user), Apple/Google SSO, recurrence rules (auto-populate dashboard), image/receipt attachments on `Event` (needs object storage — S3-compatible or Cloudinary, to be decided), push notifications for low-inventory/upcoming-event alerts (Upstash-backed job scheduling).

### Phase 3 — Polish
- Weight trend charts, notification preferences, data export, offline support/local caching via React Query persistence.

## Tech Stack & Local-Dev Substitutes (given no infra accounts yet)
| PRD choice | MVP reality |
|---|---|
| MongoDB Atlas | `mongodb-memory-server` for local dev (in-process, no Docker install required); Atlas only needed at deploy time |
| Resend (OTP email) | Console-logged OTP stub for local dev from day one; real Resend account wired in as a deliberate Phase 1 milestone, not before |
| Upstash (Redis) | Not needed for MVP (no recurring jobs yet) — defer entirely to Phase 2 |
| Apple/Google SSO | Deferred to Phase 2, removes need for Apple Developer / Google Cloud console setup now |

Stack otherwise as specified: Expo (React Native, TypeScript, React Navigation) for the app; Next.js API routes + Mongoose for the backend; Zustand or React Query for state (React Query recommended for server-state given the dashboard/inventory are fetch-heavy).

## Suggested Repo Structure
Monorepo (npm/pnpm workspaces) inside `cat-in-sack`:
```
/apps
  /mobile      → Expo app
  /api         → Next.js API routes
/packages
  /shared      → shared TypeScript types (User, Household, Feline, Event, Inventory) and Zod validators used by both apps
```
Shared types package avoids drift between the Mongoose schema and the app's TypeScript models — worth setting up even for MVP since both apps need the same domain types.

## Build Order (first milestones once scaffolding starts)
1. Repo scaffold: workspaces, shared types package, Next.js API skeleton, Expo app skeleton with bottom-tab nav (Home/Cats/Pantry/Settings per PRD section 6).
2. Mongoose schemas for `User`, `Household`, `Feline`, `Event`, `Inventory` (with Phase-2 fields present-but-unused, per Domain Model above).
3. Auth: OTP request/verify API routes + Resend integration (or stub), session handling.
4. Onboarding flow: signup → create-first-Feline screen.
5. Pantry CRUD + depletion-date calculation (pure function, unit-testable independent of DB).
6. Home dashboard: combine upcoming-events query + low-inventory query.
7. Logistics: Event CRUD (no recurrence).
8. Cats tab: profile + manual weight log + medical history list.

## Verification
No code exists yet, so verification for *this* planning step is: confirm this phased scope and repo structure match the user's intent before scaffolding begins. Once scaffolding starts, each milestone above should be verified by running the Expo app (`expo start`) against the local Next.js API + `mongodb-memory-server`, exercising the flow described in that milestone's PRD acceptance criteria.

## Resolved via grilling session (2026-09-22)
- Monorepo confirmed — see `docs/adr/0001-monorepo-for-mobile-and-api.md`.
- OTP delivery: console-logged stub for dev, real Resend wired in as a Phase 1 milestone.
- Local Mongo: `mongodb-memory-server`, no Docker dependency.
- Domain model sharpened (Event↔Feline, Inventory scoping, weight-as-Event, kg-only, onboarding hard gate) — see `CONTEXT.md` for definitions.
