# MHADA e-Mitra — Project Brief & Development Handoff

**For:** Claude Code (continuing development of this project)
**Context:** This document consolidates everything decided across a long requirements/build
conversation with Claude (chat). The actual starter codebase (zip) already implements most of
this — this file is the **why** and **what's left**, so a fresh session has full context
without re-reading the whole chat history.

---

## 1. What this system is

A **dynamic, multi-board government e-service delivery platform** for **MHADA** (Maharashtra
Housing and Area Development Authority) — branded **"MHADA e-Mitra"**. The core design
principle, stated up front and followed throughout: **configuration over code**. The number of
boards, departments, services, form fields, workflow stages, roles, notification events, and
themes must all be data (rows in tables, edited via the admin UI), never hard-coded. The
backend implements a small set of generic engines (workflow engine keyed by stage type, generic
RBAC/permission evaluator, generic notification dispatcher, generic report filter) and every
service-specific behaviour is expressed by configuring these engines — not by writing new
service-specific Java/React code.

Architecturally, the system is **not MHADA-specific** — MHADA is just the first board seeded as
example data. Other government boards/departments can be onboarded the same way, through the UI.

## 2. Tech stack (fixed, do not change without asking)

- **Backend**: Java 21, Spring Boot 3.3, Spring Data JPA (Hibernate), Flyway migrations
- **Frontend**: React 18 (JavaScript, not TypeScript), Tailwind CSS, Vite, React Router,
  React Flow (visual workflow canvas), Recharts (dashboard charts), lucide-react (icons)
- **Database**: PostgreSQL (target: 18.4 in production; migrations were verification-tested
  against a real Postgres 16 instance in the build sandbox — same SQL, forward-compatible)
- **Auth**: JWT (custom, `JwtService`/`JwtAuthenticationFilter`), BCrypt password hashing
- **Payments**: Cashfree (online gateway) + offline bank/treasury payment with manual verification

## 3. Full functional requirements (as gathered from the user)

### 3.1 Master data — Board / Department / Service
- Board: `code`, `name_english`, `name_marathi`, `active` — full CRUD, list+slide-over UI
- Department: same bilingual pattern, scoped to a Board — full CRUD
- Service: **bilingual name** + a large set of real-world fields modeled directly off a
  reference "Add New Service" screen the user provided:
  - `serviceCategory`, `serviceType`, `applicability` (CITIZEN/GOVERNMENT/BOTH),
    `mode` (ONLINE/OFFLINE/BOTH)
  - `applicationFee`, `processingFee`, `securityDeposit` (all decimals)
  - `slaDays`, `applicationNumberFormat`, `certificateNumberFormat`
  - Toggles: `active`, `workingDaysOnly`, `approvalRequired`, `digitalSignatureRequired`,
    `aaplesarkarIntegrationRequired`, `digilockerIntegrationRequired`, `challanRequired`,
    `qrCodeRequired`, `appealAllowed`, `grievanceAllowed`
- Sidebar has a **"Master"** menu group with **separate pages**: Board, Department, Services,
  Form Fields (not the old combined drill-down page, which the user explicitly asked to split
  into standalone pages with filter dropdowns instead of forced parent-to-child navigation)
- Data-entry UX requirement (explicit user feedback that the always-open 3-column inline form
  felt clunky): replaced with a **list + "+ Add" button that opens a slide-over panel**, plus
  breadcrumb navigation where relevant. This slide-over pattern (`SlideOver` component) is now
  the standard for all "add/edit" flows across the app.

### 3.2 RBAC — Roles, Permissions, Users
- Role, Permission, AppUser, UserRole (with optional board/department/service scope + a
  `hasGlobalScope` flag for cross-boundary access, e.g. Helpdesk)
- Login accepts **either username or mobile number** + password
- `PermissionEvaluatorService.hasPermission(...)` is the one place every permission check goes
  through — see section 5 for a critical bug that lived here.

### 3.3 Master: Form Fields (reusable field library)
- A separate master (`MasterFormField`) seeded with fields matching the `AppUser` table
  concept: **First Name, Middle Name, Last Name, Email, Mobile Number** (marked
  `systemDefined = true`, can't be hard-deleted, only deactivated)
- The Form Designer has an **"Insert from library"** button that pre-fills a new field from a
  master entry (key/label/type/options) — inserting copies values into an independent
  `FormField` row, so later editing/deleting the master entry never affects services already
  using it.

### 3.4 Dynamic Form Builder (per service)
- `FormTemplate` / `FormField`, full CRUD + **reordering** (up/down, persisted via a bulk
  reorder endpoint), dropdown options stored in `validationRules` JSONB
- **Conditional visibility**: a field can depend on another field in the same form —
  `conditionFieldKey` + `conditionOperator` (EQUALS/NOT_EQUALS/IN) + `conditionValue`
  (e.g. show "Caste Certificate Number" only when `category` IN `SC,ST,OBC`)
- **Conditional required** (separate from the static `required` flag): same
  field/operator/value shape but as `requiredConditionFieldKey`/`Operator`/`Value` — "if X then
  Y becomes mandatory", independent of whether Y is shown/hidden
- **Cross-field validation**: compare this field's value against another field's value —
  `crossValidateFieldKey` + `crossValidateOperator` (EQUALS/NOT_EQUALS/GREATER_THAN/
  GREATER_THAN_OR_EQUAL/LESS_THAN/LESS_THAN_OR_EQUAL) + a custom `crossValidateMessage`
  (e.g. End Date must be >= Start Date)
- The Form Designer has a **live, interactive preview** panel: fillable inputs, conditional
  fields actually appear/disappear as you type, and a **"Validate"** button that checks
  required + conditional-required + cross-field rules and shows inline errors
- Document checklist (`ServiceDocumentConfig`) per service: mandatory/optional, allowed file
  types, max size/count — same full CRUD + reorder + slide-over pattern

### 3.5 Workflow engine + Visual Workflow Builder
- `Workflow` / `WorkflowStage` (sequenceOrder, stageType, slaHours, escalationRoleId) /
  `WorkflowStageRole` (which roles are eligible per stage)
- `WorkflowEngineService`: submit (creates the instance at stage 1), forward (advances to the
  next stage **and** lets the officer pick a **specific person** from a dropdown of everyone
  holding an eligible role for that stage — not just the role in the abstract), send-back (to
  any earlier stage, for 2nd/3rd scrutiny rounds), SLA due-date calculation via a shared
  `BusinessDateCalculator` that is **holiday-calendar and working-day aware** (not just a naive
  hour count) — `HolidayCalendar`/`Holiday`/`WorkingDayConfig`, board-scoped calendars
- **Frontend is a real drag-and-drop canvas** (React Flow): Start/End nodes, colour-coded stage
  nodes by type, click a node to edit SLA/escalation/eligible roles in a slide-over, drag a node
  vertically to reorder (persists to the backend immediately), a palette on the left to add new
  stages by type
- **Explicit scope limitation (do not silently "complete" this differently)**: the engine is
  strictly **linear** — one "next" stage per stage, plus an officer-driven send-back to any
  prior stage at runtime. There is **no pre-configured decision/branching gateway** (no
  "Yes/No" diamond that routes automatically based on data). Building that needs
  conditional-transition logic inside `WorkflowEngineService` itself, not just a new canvas
  shape — flagged as a real, non-trivial follow-up, not something to fake cosmetically.

### 3.6 Application lifecycle
- Draft -> Submit -> In Progress -> Approved/Rejected -> Dispatched
- Draft allows partial data with no validation; strict validation only at formal submit
- `Application.formData` stored as JSONB snapshot (form definition can change later without
  corrupting old submissions)
- Documents: mandatory (from `ServiceDocumentConfig`) + citizen-added "extra" documents

### 3.7 Payments — dual/multi-payment
- **External reference** (Aaplesarkar portal fee) — stored by reference only, not processed here
- **Internal challan** — **multiple challans per application** are explicitly required (a
  senior authority can raise an additional challan later if the first amount was insufficient);
  the workflow's PAYMENT_CHECK stage is blocked until **every** challan for the application is
  PAID or CANCELLED (`ChallanService.allChallansSettled(...)`)
- **Online**: Cashfree integration behind a `PaymentGatewayProvider` interface (so another
  gateway can be added later without touching calling code) — webhook signature verification is
  mandatory before trusting a payment result, never trust the browser return URL alone
- **Offline**: citizen records bank/treasury payment + uploads proof; stays PENDING until an
  accountant/verifier approves it — this is a real, separate, required flow, not a stub

### 3.8 Notifications
- Config-driven: `NotificationEvent` / `NotificationConfig` (per service/event/channel on-off)
  / `NotificationTemplate` (placeholders) / `NotificationLog`
- `NotificationService.trigger(...)` and the `triggerForUser(...)` convenience overload
  (resolves mobile/email from an applicant id) — wired into **every** real transition:
  application submit/forward/send-back/dispatch, challan generated, payment received (online
  + offline), SLA breach, ticket created/replied/resolved
- **Not yet done**: SLA breach only notifies the applicant, not the stage's escalation role
  (would need to resolve all users holding that role and notify each, same pattern as
  `eligibleOfficersFor(...)`)

### 3.9 Theme & branding
- Per-board theme properties (colours, fonts) + logo/branding, served via `/api/theme`

### 3.10 Certificate + Notesheet
- Certificate: template with placeholders bound to application data
- **Notesheet**: auto-generated at dispatch — full application detail + complete stage-wise
  audit trail, explicitly requested for **legal/investigative use** (e.g. if a police enquiry is
  later raised against an application). SHA-256 checksum stored for tamper-evidence; access is
  permission-gated and every view is logged (`NotesheetAccessLog`).
  **Current limitation**: content is generated as plain text with a correct checksum mechanism,
  not a real formatted PDF yet — swap in iText/OpenPDF/wkhtmltopdf for production.

### 3.11 Reports
- Generic filter (board/department/service/date range) + example pendency report
- **Real bug fixed here**: the native SQL query originally used `:param IS NULL OR ...` without
  a cast, which Postgres can't type-infer — fixed by wrapping every parameter in
  `CAST(:param AS uuid/date)`. Verified against a real Postgres instance.

### 3.12 Support tickets
- Category (with default routing role + SLA), ticket, threaded messages (citizen/officer),
  status history — same generic status+history+SLA pattern as the workflow engine

### 3.13 Helpdesk (cross-boundary "stuck application" access)
- A role with `hasGlobalScope = true` can act across all boards/departments/services, but
  **only** through dedicated, narrow permissions (`HELPDESK_VIEW_APPLICATION`,
  `HELPDESK_REASSIGN`, `HELPDESK_FORCE_ADVANCE`, `HELPDESK_ADD_REMARK`), with a **mandatory
  reason** captured and logged for every access (`HelpdeskAccessLog`) — this is intentionally
  the most locked-down module given the sensitivity of bypassing normal scoping.
- **Not yet done**: `reassign`/`force-advance` endpoints currently only log access; they don't
  yet call into `WorkflowEngineService`/`ApplicationAssignmentRepository` to actually perform
  the reassignment/advance.

### 3.14 Non-functional requirements (from the SRS produced early in the process)
- Security: RBAC everywhere, encrypted credentials (payment gateway secrets — **not yet
  implemented**, currently plain columns, marked TODO), signature-verified webhooks
- Auditability: every stage transition, payment, notification, and helpdesk/notesheet access
  is logged with actor + timestamp
- Development process (explicitly requested after the user raised concern about AI-written
  code risk): code review before merge, staging environment + Cashfree sandbox testing, pilot
  rollout board-by-board (not big-bang), independent security review of auth/RBAC/payment flow,
  Git version control with migration-based schema changes (never edit an already-applied
  Flyway migration — always add a new one), documented backup/restore strategy.

## 4. UI/visual direction (from reference screenshots the user provided)

The user shared screenshots of a professional Indian government portal template (login page,
dashboard with charts, application list with filters, application detail with tabs, visual
workflow builder, dynamic form builder, "add new service" wizard) and asked for the **same
layout and colour scheme**, with **our own logo instead of the Ashoka Emblem** (Claude
deliberately avoided reproducing the actual national emblem to avoid any appearance of
impersonating an official government seal — this constraint should stay in place).

Implemented to match:
- **Login page**: two-panel layout — left gradient panel with feature-icon circle + headline,
  right "Welcome Back!" card (username/mobile + password, show/hide toggle, Remember Me,
  Forgot Password, LOGIN button, SSO button placeholder)
- **Header**: logo + title (left); A-/A/A+ font-size controls (**functional** — actually resizes
  the app's root font size), language toggle (English/Marathi label swap, **not** real i18n yet),
  notification bell with badge, help icon, user avatar + name + role + chevron + sign-out
- **Sidebar**: grouped/collapsible nav (Master, Services, Operations, Administration), **active
  item = solid navy-blue background with white text** (matches the reference's strong active
  state, changed from an earlier lighter blue-50 highlight), "All systems operational" status
  panel at the bottom
- **Dashboard**: stat cards + line chart (applications trend) + donut chart (status breakdown),
  all from real API data (Recharts)
- **Applications list**: search + board/department/service/status/date filters, pagination,
  links to a tabbed detail page (Details / Documents / Workflow & Timeline / Payment)
- **Add New Service wizard**: 5-step vertical stepper (Basic info -> Documents -> Form fields ->
  Workflow -> Review & publish), reusing the real hierarchy/form-designer/workflow-builder APIs
  rather than being a separate mocked flow

## 5. Critical bugs found during a real QA pass — read this before writing more code

A thorough test pass was done late in the project: PostgreSQL was actually installed and **all
19 Flyway migrations were run against a real database**, a full application lifecycle was
simulated with real inserts, and every frontend API call was cross-checked against every backend
endpoint. Two bug **classes** kept recurring — watch for both when adding new code:

### 5.1 LazyInitializationException from returning JPA entities with lazy collections directly
Any entity with a lazy `@OneToMany`/`@ManyToMany` (e.g. `Role.permissions`,
`Workflow.stages`, `FormTemplate.fields`) throws `LazyInitializationException` when Jackson
tries to serialize it, because `spring.jpa.open-in-view=false` closes the Hibernate session
before the HTTP response is written. **Fix pattern used throughout**: never return the raw
entity from a `@RestController` — always map to a DTO (`RoleResponse`, `WorkflowResponse`,
`WorkflowStageResponse`, `FormFieldResponse`, `UserRoleResponse`) that flattens nested
entities down to plain fields/ids before the method returns.

### 5.2 Spring's `@Transactional` is silently ineffective on self-invoked methods
This one caused a **real production-style bug** (confirmed via an actual runtime stack trace,
not just theory): `PermissionEvaluatorService` had `@Transactional(readOnly = true)` on its
5-argument `hasPermission(...)` method to keep the Hibernate session open long enough to read
`role.getPermissions()`. But `AppPermissionEvaluator` (the `@PreAuthorize` bridge) always calls
the **2-argument convenience overload**, which then calls the 5-arg method via **self-invocation
within the same class** — and Spring's proxy-based `@Transactional` does not apply to a method
calling another method on `this`; only externally-invoked calls go through the proxy. The fix
was adding `@Transactional(readOnly = true)` to the 2-arg method too, since that's the actual
external entry point. **This one bug silently broke 33 call sites across 11 controllers**
(basically every create/update action in the app) until it was caught from a live stack trace.
**Lesson for future code**: when a `@Transactional` method is only ever reached via another
method in the same class, the annotation does nothing — put it on whichever method is actually
called from outside the class.

### 5.3 A path that didn't need what it was nested under
`GET .../workflow/eligible-officers` was nested under `/api/applications/{applicationId}/...`
but never actually used `applicationId` (only `stageId`). The frontend was calling it with a
literal `"x"` string standing in for the UUID it didn't have — which would throw a 400 on the
first real use. Moved it to `/api/workflows/{workflowId}/stages/{stageId}/eligible-officers`,
which is what it actually depends on. **Lesson**: if an endpoint doesn't use a path variable, it
probably shouldn't be nested under it — a hint worth checking on every new endpoint.

### 5.4 Never edit an already-applied Flyway migration
Happened twice during the project (a username column added directly to an already-shipped
`V2__rbac.sql`, and a duplicate `updated_at` column re-added in a later migration) — both caused
real Flyway checksum/duplicate-column failures on the user's machine. **Always add a new
`V{n}__description.sql` file for schema changes after the fact, never edit a shipped one.**

## 6. Setup / credentials

- **Database**: `application.yml` currently points at `postgres`/`root` on `localhost:5432`,
  database `egov_platform` — update to match your real environment, and definitely rotate the
  password and move `app.jwt.secret` to an environment variable before anything beyond local dev.
- **Seed superadmin** (from `V12__seed_superadmin_user.sql`): username `superadmin` (or mobile
  `9999999999`), password `changeme123` — **change immediately**, this is not meant to survive
  past first login.
- 19 Flyway migrations (`V1`-`V19`) run automatically on `mvn spring-boot:run` against a fresh
  database with the `pgcrypto` extension enabled (also handled by `V1`, via
  `CREATE EXTENSION IF NOT EXISTS pgcrypto;`).

## 7. Suggested next steps, roughly in priority order

1. **Verify the fixes above actually resolve the reported errors** — restart the backend and
   re-test Board/Department/Service edit, Form field/document add, Workflow stage create, on
   the user's real machine (this could only be verified via migration+static analysis in the
   build sandbox, not a live JVM run — see the "verification limitations" note in the
   codebase's own README for exactly why).
2. Real PDF rendering for certificate/notesheet generation (currently text-based).
3. Encrypt `PaymentGatewayConfig` credentials at rest (currently plain columns).
4. Wire Helpdesk `reassign`/`force-advance` to actually call into the workflow engine.
5. SLA breach escalation to the stage's `escalationRoleId` holders, not just the applicant.
6. Extend `@PreAuthorize` beyond the handful of worked-example endpoints to every mutating one.
7. Decide which `GET` endpoints should require authentication once real citizen accounts exist
   (currently all GETs are public by design, for admin-console convenience during this build).
8. If a branching/decision workflow gateway is genuinely needed, design conditional-transition
   support in `WorkflowEngineService` deliberately — don't bolt it onto the canvas UI first.
9. Continued UI polish: real i18n (the language toggle is currently label-only), citizen-facing
   application form (everything built so far is the **admin/officer console** — there is no
   citizen-facing portal UI yet, only the APIs a citizen portal would call).

## 8. A general note on how this was built

This entire backend + frontend was written by Claude across a long, iterative chat session, in
a sandbox, **without the ability to actually run the Spring Boot application** (no network
access to Maven Central for backend dependencies). Verification therefore relied on: exhaustive
static/manual code review, `javac`-level syntax checking, an actual local PostgreSQL install to
run every migration for real, and repeatedly running the actual frontend build
(`npm install && npm run build`, which **does** work in that sandbox). Several real bugs were
still only caught from the user pasting back real backend stack traces during testing on their
own machine — which is exactly the intended, expected workflow (per the "Development, QA, and
rollout process" section already in the project's own SRS): AI-written code gets reviewed,
tested in a staging environment, and fixed iteratively like any other code, not trusted blindly.
Claude Code should continue that same pattern — make a change, and where possible actually
compile/run it (which Claude Code, unlike a plain chat sandbox, should be able to do), rather
than assuming correctness from reading alone.
