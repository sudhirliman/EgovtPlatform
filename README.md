# MHADA e-Mitra — starter codebase

Built for MHADA (Maharashtra Housing and Area Development Authority) as a
configurable, multi-board e-Governance service delivery platform - the
architecture supports any number of boards/departments/services (not just
MHADA), so other departments can be onboarded the same way (see the
"Add new service" wizard).

This is a working starter codebase for the configurable Board \u2192 Department \u2192
Service platform described in the accompanying SRS and ER diagram. It now
covers the *generic engine* for every module in the SRS:

- Master hierarchy (Board / Department / Service)
- **Authentication**: JWT-based login (`AuthController` `/api/auth/login`, `/api/auth/me`) +
  `JwtAuthenticationFilter` + BCrypt password hashing. A seed superadmin is created by
  `V12__seed_superadmin_user.sql` (mobile `9999999999`, password `changeme123` - **change
  this immediately**, it is not a placeholder you should leave in place).
- RBAC (Role / Permission / AppUser / UserRole) + a scope-aware `PermissionEvaluatorService`,
  wired into Spring Security via `AppPermissionEvaluator` + `@EnableMethodSecurity` + the JWT
  filter above (see `BoardController` for a worked `@PreAuthorize("hasPermission(...)")` example)
- Dynamic form builder - **complete**: `FormTemplate`/`FormField` + `ServiceDocumentConfig`, full
  CRUD + reorder for both via `FormDesignerController` (dropdown options stored in
  `validationRules` JSON), served together via `GET /api/services/{id}/form-schema` for the
  citizen-facing form renderer. A `MasterFormField` library (Master > Form Fields - first/middle/
  last name, email, mobile seeded as system-defined) lets the Form Designer insert a pre-built
  field instead of typing key/label/type/options from scratch each time. Fields support
  **conditional visibility** (`conditionFieldKey`/`conditionOperator`/`conditionValue` - EQUALS/
  NOT_EQUALS/IN against another field in the same form), live-testable in the Form Designer's
  interactive preview panel. **Field-level cross-validation** adds two more rule types:
  conditional required (`requiredConditionFieldKey`/`Operator`/`Value` - "if X then Y is
  mandatory", independent of the static Required toggle) and cross-field comparison
  (`crossValidateFieldKey`/`Operator`/`Message` - e.g. End Date must be \u2265 Start Date),
  both checked live via the preview's "Validate" button.
- Holiday calendar + working-day config + a shared `BusinessDateCalculator` (SRS FR-4.7\u20134.9)
- Workflow engine: `Workflow` / `WorkflowStage` / `WorkflowStageRole` + `WorkflowEngineService`
  (submit, forward-with-officer-dropdown, send-back, SLA due-date calc) + hourly SLA breach scheduler,
  exposed via `WorkflowController` (runtime actions) + `WorkflowConfigController` (builder, with
  full stage CRUD + reorder). The builder UI is a real drag-and-drop canvas (see Frontend below).
  **Scope note**: the engine is strictly linear (each stage has one "next" stage by
  `sequenceOrder`) plus an officer-driven send-back to any prior stage at runtime - there is no
  pre-configured decision/branching gateway (the "Yes/No" diamond some reference designs show).
  Building that would need conditional-transition support in `WorkflowEngineService` itself, not
  just a canvas shape, so it's called out here rather than faked as a cosmetic node.
- Application lifecycle: draft, submit, documents (mandatory + citizen-added extra), exposed
  via `ApplicationController`
- Payments: external (Aaplesarkar) reference, multi-challan, Cashfree online provider +
  signature-verified webhook, offline payment + verification, all gated by `ChallanService.allChallansSettled(...)`,
  exposed via `ChallanController` + `CashfreeWebhookController`
- Notifications - **complete**: generic `NotificationService.trigger(eventCode, ...)` (and the
  `triggerForUser(...)` convenience overload that resolves mobile/email from an applicant id),
  wired into every real transition (application submit/forward/send-back/dispatch, challan
  generated, payment received online+offline, SLA breach, ticket created/replied/resolved),
  config on/off per
  service/event/channel, pluggable SMS/Email `NotificationSender` (stubbed - wire a real vendor before go-live)
- Theme & branding: per-board theme properties + logo/branding, served via `/api/theme`
- Certificate template + Notesheet generation (SHA-256 checksum) + access log
- Support tickets: category, ticket, threaded messages, status history, exposed via `TicketController`
- Helpdesk: global-scope cross-boundary access via the *same* `PermissionEvaluatorService`,
  with mandatory reason capture and full audit logging (`HelpdeskService` + `HelpdeskController`)
- Reports: a generic `ReportFilter` (board/department/service/date range) + one example
  pendency-report native query, exposed via `ReportController`, as a pattern for adding more
- **A real, backend-wired frontend** (see the Frontend section below) - not a mockup - covering
  login and every module above, verified with an actual `npm run build`

**What is intentionally left for you / Claude Code to build next:**
- `@PreAuthorize` has only been added to a handful of endpoints as worked examples (Board,
  Role, Workflow-add-stage, Challan-generate, offline-verify, Ticket-status, User-create) -
  add the same pattern to every other mutating endpoint before relying on it
- The current access rule permits ALL `GET /api/**` without login (see `SecurityConfig`) -
  revisit which read endpoints should actually require authentication once citizen accounts exist
- Real PDF rendering for certificates/notesheet (currently a text-based placeholder with
  a correct checksum mechanism - swap in iText/OpenPDF/wkhtmltopdf)
- Encryption at rest for `PaymentGatewayConfig` credentials (currently plain columns, marked TODO)
- The Helpdesk `reassign`/`force-advance` endpoints currently only log access - wire them to actually
  call into `WorkflowEngineService`/`ApplicationAssignmentRepository` (marked with TODOs)
- SLA breach notifications currently go to the applicant only, not the stage's
  `escalationRoleId` - escalating to all users holding that role is a reasonable next step
  (follow the same pattern as `WorkflowEngineService.eligibleOfficersFor(...)`)
- Refresh tokens / logout-everywhere / password reset flow - the current JWT is a simple
  24-hour bearer token with no revocation mechanism

## Stack

- Backend: Java 21, Spring Boot 3.3, Spring Data JPA, Flyway, PostgreSQL
- Frontend: React 18 (JavaScript) + Tailwind CSS, Vite
- Database: PostgreSQL 18.4

## Project layout

```
egov-platform/
  backend/src/main/java/com/egov/platform/
    hierarchy/    Board, Department, ServiceMaster + REST controllers (with @PreAuthorize example)
    rbac/         Role, Permission, AppUser, UserRole, PermissionEvaluatorService
    form/         FormTemplate, FormField, ServiceDocumentConfig + ServiceFormSchemaController
    sla/          HolidayCalendar, Holiday, WorkingDayConfig, BusinessDateCalculator
    workflow/     Workflow, WorkflowStage, WorkflowStageRole, WorkflowEngineService,
                  SlaBreachScheduler, WorkflowController
    application/  Application, ApplicationDocument, ApplicationWorkflowInstance,
                  ApplicationStageHistory, ApplicationAssignment
    payment/      ExternalPaymentReference, Challan, PaymentGatewayConfig, PaymentTransaction,
                  ChallanService, ChallanController, CashfreeWebhookController,
                  provider/ (PaymentGatewayProvider, CashfreeProvider)
    notification/ NotificationEvent/Config/Template/Log, NotificationService, provider/ (stub senders)
    theme/        Theme, ThemeProperty, BoardBranding, ThemeController
    certificate/  CertificateTemplate, Notesheet, NotesheetAccessLog, NotesheetService
    ticket/       TicketCategory, SupportTicket, TicketMessage, TicketStatusHistory,
                  TicketService, TicketController
    helpdesk/     HelpdeskAccessLog, HelpdeskService, HelpdeskController
    report/       ReportFilter, ReportRepository (example pendency report)
    config/       SecurityConfig, AppPermissionEvaluator (bridges @PreAuthorize to PermissionEvaluatorService)
  backend/src/main/resources/
    application.yml
    db/migration/   V1..V19 Flyway SQL, one module (or closely related group) per file
  frontend/
    src/api/client.js       complete fetch wrapper for every backend module, attaches JWT + handles 401
    src/auth/AuthContext.jsx    login/logout/session-check, stores JWT in localStorage
    src/auth/RequireAuth.jsx    route guard - redirects to /login when not authenticated
    src/layout/AppLayout.jsx     sidebar + routed shell + current user + sign-out
    src/components/ui.jsx        shared Card/Button/Input/Select/Table/Badge primitives
    src/pages/
      LoginPage.jsx               mobile + password login
      DashboardPage.jsx           stat cards + trend/status charts (recharts) + recent applications, from real API calls
      HierarchyPage.jsx           legacy combined Board/Department/Service drill-down (kept but not in the sidebar)
      BoardsPage.jsx              Master > Board - list + slide-over add/edit
      DepartmentsPage.jsx         Master > Department - list (board filter) + slide-over add/edit
      ServicesPage.jsx            Master > Services - list (board/department filter), links to the wizard
      MasterFormFieldsPage.jsx    Master > Form Fields - reusable field library (first/middle/last name,
                                   email, mobile seeded as system-defined), full CRUD
      ServiceWizardPage.jsx       5-step "Add new service" wizard - creates the service, then walks through
                                   documents, form fields, and workflow stages against those same APIs
      UsersRolesPage.jsx          create users (with password), create roles (+ permission checkboxes), assign role to user
      WorkflowBuilderPage.jsx     visual drag-and-drop canvas (React Flow) - pick board>dept>service,
                                   create workflow, add stages from a palette by type, drag nodes to
                                   reorder (persists via the reorder API), click a node to edit
                                   SLA/escalation/eligible roles in a slide-over
      FormDesignerPage.jsx        full CRUD for form fields + document checklist (add/edit/delete/reorder),
                                   dropdown option editor, and a live citizen-facing preview panel
      ApplicationsPage.jsx         filterable/paginated application list (search, board/dept/service, status, date range)
      ApplicationDetailPage.jsx    tabbed application detail (form data, documents, timeline, payment) at /applications/:id
      PaymentsPage.jsx            look up an application's challans, see the multi-challan gate status, generate a challan
      ReportsPage.jsx             pendency report with board/department/service/date filters
      TicketsPage.jsx             list a citizen's support tickets
```

**This frontend is real, not a mockup** - every page above calls the actual Spring Boot REST endpoints via `src/api/client.js` and was verified with an actual `npm install && npm run build` (see the verification section below) rather than just a syntax check, including after adding login. Payments/Tickets still ask you to paste in an application/user UUID rather than pull it from the logged-in session's own applications/tickets - that's a UX follow-up, not an auth gap (the calls themselves are already authenticated).

## Logging in

The first migrations create one superadmin so you're not locked out on first boot
(`V11__add_username_to_app_user.sql` adds the column, `V12__seed_superadmin_user.sql` inserts
the user). Login accepts **either** the username or the mobile number:

- Username: `superadmin` (or Mobile: `9999999999`)
- Password: `changeme123`

**Change or remove this immediately** once you can log in - either update the password hash
directly (generate a new BCrypt hash and `UPDATE app_user SET password_hash = ...`), or create
a new superadmin via the Users & Roles page and delete/deactivate the seed one.

## Running the frontend

```
cd frontend
npm install
npm run dev
```

This opens the real app (routed via react-router-dom) at `http://localhost:5173`, with a
sidebar covering every module built so far. It expects the backend running at
`http://localhost:8080` by default (override with a `.env` file: `VITE_API_BASE=http://your-host:port`).

**Frontend verification (unlike the backend, this WAS actually run):** this sandbox has
network access to the npm registry, so `npm install && npm run build` was executed for
real here and completed with zero errors (1526 modules transformed). The backend's Maven
Central restriction doesn't apply to npm, so the frontend has a stronger verification
guarantee than the backend code below.

## Running the backend

1. Create the Postgres 18.4 database (this config connects as the `postgres` superuser
   with password `root` - matching `application.yml`; update both if your local setup differs):
   ```sql
   CREATE DATABASE egov_platform;
   ```
   (If your local `postgres` user's password isn't already `root`, set it first:
   `ALTER USER postgres WITH PASSWORD 'root';`)
2. From `backend/`: `mvn spring-boot:run`
3. Flyway runs `V1`\u2013`V12` automatically on first boot: hierarchy, RBAC (seeds SUPERADMIN
   + baseline permissions), holiday calendar, workflow, application, payment, notification
   (seeds the starter event list), theme/certificate/ticket/helpdesk (seeds helpdesk permissions),
   form builder, extra permissions, username column, and the seed superadmin user/login.

## IMPORTANT — verification limitations from this sandbox

This code was written and **syntax-checked** (via `javac -Xmaxerrs 5000`, so nothing was
hidden by the default 100-error cap) but **the Java code itself could not be fully compiled
or run**, because this sandbox has no network access to Maven Central. All reported `javac`
errors are of the "cannot find symbol / package does not exist" kind, or cascading effects of
that (e.g. a repository method's return type erasing to `Object` without Spring Data JPA on
the classpath, which then makes a valid `.map(Repo::getX)` call look like an "invalid method
reference" to `javac`). Each cascading case was manually checked against the source and
confirmed to be a classpath artifact, not a real bug.

**What WAS actually run, end to end, in this sandbox (unlike the Java app itself):**
- Installed a real PostgreSQL 16 server and ran **all 19 Flyway migrations, in order, with
  real `psql` execution** (not just a read-through) - all passed with zero errors.
- Verified the resulting schema directly (43 tables, correct columns/constraints/defaults on
  `service_master`, `form_field`, etc.) and confirmed seed data is correct (SUPERADMIN has
  all 14 permissions granted, matching the total permission count exactly; the 5 master form
  fields; the notification event/config/template rows).
- Ran a full **simulated application lifecycle** as raw inserts (citizen + officer users, a
  role assignment, a 2-stage workflow, a form template with a conditional + cross-validated
  field, an application, a workflow instance, a challan, a payment transaction) - all
  succeeded against the real foreign keys and constraints.
- Re-ran the previously-buggy pendency report query directly against Postgres to confirm the
  `CAST(...)` fix holds.
- Audited **every** `@RequestMapping`/`@GetMapping`/etc. path across all 20 controllers against
  every method in `frontend/src/api/client.js`, one by one. **Found and fixed a real bug**:
  `workflowApi.eligibleOfficers` called a made-up path (`/api/applications/x/workflow/...`,
  with a literal `"x"` standing in for a UUID it didn't have) - the backend endpoint was
  nested under `applicationId` without ever using it. Moved it to
  `GET /api/workflows/{workflowId}/stages/{stageId}/eligible-officers`, which is what it
  actually depends on, and fixed the one caller. It wasn't wired into any page yet, so this
  was a latent bug, not a currently-visible one - but it would have broken the "forward to a
  specific officer" dropdown the moment someone built that screen.
- Re-swept the whole codebase for the lazy-loading-serialization bug class found earlier
  (Role, UserRole, Workflow/WorkflowStage, FormField) - confirmed no entity with a lazy
  `@OneToMany`/`@ManyToMany` is returned directly from any controller anymore.
- **A second, deeper instance of the same underlying issue was found from a real runtime stack
  trace** (`LazyInitializationException` on `Role.getPermissions()` inside
  `PermissionEvaluatorService.hasPermission`, hit via `@PreAuthorize` on `FormDesignerController.addField`
  and `WorkflowConfigController.create`): the earlier `@Transactional(readOnly = true)` fix on the
  5-arg `hasPermission(...)` was silently ineffective, because `AppPermissionEvaluator` always calls
  the 2-arg convenience overload, which then calls the 5-arg one via **self-invocation** - and
  Spring's proxy-based `@Transactional` does not apply to a method calling another method on
  `this` within the same class, only to externally-invoked calls. Fixed by adding
  `@Transactional(readOnly = true)` to the 2-arg overload too, since that's the actual external
  entry point. This one fix corrects the same latent bug across all 33 call sites
  (11 controllers) using the `hasPermission(null, '...')` SpEL pattern - i.e. nearly every
  create/update action in the app was silently broken by this until now.
- Frontend: `npm install && npm run build` actually run again after every fix above (2468
  modules, zero errors each time) - this part of the stack has a much stronger verification
  guarantee than the backend Java, for the reason above.

**Still true:** please run `mvn compile` yourself as the very first step in Claude Code / your
own machine - a sandbox migration test and a static Java read-through, however thorough, are
not the same as an actual JVM build, and something environment-specific could still surface.

1. The Cashfree integration (`CashfreeProvider`, `CashfreeWebhookController`) follows the
   documented Order API shape but has **not** been exercised against a live sandbox account -
   verify request/response field names against Cashfree's current docs before go-live, and
   test the webhook signature verification thoroughly (see SRS 7.3, independent security review).
2. Follow SRS section 7 (code review, staging, security review, phased rollout) for every
   module above before any production use - this codebase gives you the scaffolding, not a
   substitute for that process.

## Suggested next steps (in order)

1. `mvn compile` and fix real compiler errors.
2. Add real authentication (JWT/session) so `Authentication.getName()` returns a genuine
   user id - `@PreAuthorize` + `AppPermissionEvaluator` are already wired and will start
   enforcing correctly the moment that lands.
3. Extend `@PreAuthorize("hasPermission(...)")` from `BoardController` to the other
   mutating endpoints (Department/Service/Workflow/Challan/Ticket/Helpdesk controllers).
4. Swap the notesheet/certificate text placeholder for real PDF rendering.
5. Encrypt `PaymentGatewayConfig` credentials at rest.
6. Wire the `NotificationService.trigger(...)` calls marked with a comment in
   `WorkflowEngineService` / `ChallanService` / `TicketService`.
7. Build out the frontend screens (workflow builder, form designer, payment screens, etc.)
   against these APIs.

