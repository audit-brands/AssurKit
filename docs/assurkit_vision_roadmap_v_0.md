# AssurKit – Vision & Roadmap (v0.1)

> **Scope change confirmed:** Use **shadcn/ui** for the design system and UI components. For charts/visualizations, use **Recharts** components styled and embedded within shadcn/ui primitives (e.g., `Card`, `Tabs`, `DropdownMenu`). **Do not use ECharts.**

---

## 1) Product Vision

**Mission:** Deliver a community-driven, SOX‑first open‑source GRC that teams can self‑host, audit, and extend. Start with airtight SOX workflows (RCM, controls, testing, issues, and evidence) and grow toward broader GRC and continuous control monitoring.

**Design Tenets**
- **SOX-first UX:** Optimize for the auditor’s daily flow: RCM → test plan → PBC/evidence → review → issues/remediation → reporting.
- **Open, modular, inspectable:** Simple schemas, explicit workflows, clean APIs, and pluggable integrations.
- **Enterprise-ready basics:** RBAC, audit trails, immutable evidence, encryption in transit & at rest.
- **Great defaults, easy override:** Ship with opinionated defaults (e.g., test states, issue lifecycle), allow org-level policy config.

**Initial Audience**
- Mid-market internal audit teams, boutique consulting firms, universities/teaching labs, OSS‑friendly enterprises.

---

## 2) MVP Scope (SOX Core)

**Core Objects**
- **Entity / Process / Subprocess** hierarchy (e.g., Company → Process → Subprocess → Assertions/Accounts)
- **Risk** (description, drivers, assertion mapping)
- **Control** (type, frequency, automation, key/non-key, owner)
- **RCM** linkage (Process ↔ Risks ↔ Controls)
- **Test** (scope, method, sample, status, reviewer, conclusions)
- **Evidence** (uploads, metadata, checksum, retention policy)
- **Issue** (exception, severity, root cause, action plan, target date)

**Baseline Workflows**
- Control lifecycle: **Draft → Active → Retired**
- Test lifecycle: **Planned → In Progress → Submitted → In Review → Concluded** (Pass/Fail/Qualified)
- Issue lifecycle: **Open → In Remediation → Ready for Retest → Closed**

**Dashboards & Reports (Recharts + shadcn/ui)**
- Status by process, due/overdue tests, exceptions by severity, upcoming PBCs.
- Export CSV; printable summaries.

---

## 3) Non‑Functional Requirements

- **Security:** OAuth2/OIDC (Keycloak) or JWT; HTTPS; role‑based access; row‑level protections where needed.
- **Auditability:** Field‑level history; who/when/what diffs; evidence immutability via checksums.
- **Performance:** Targets: p95 < 300ms API for core CRUD; evidence uploads streamed; pagination on heavy lists.
- **Privacy & Residency:** Self‑hosted; S3‑compatible storage options; data retention policies.
- **Accessibility:** WCAG 2.1 AA; keyboard nav; color‑contrast in charts & components.

---

## 4) Architecture (Initial)

**Frontend**
- **React + TypeScript**
- **shadcn/ui** for components, theming, and primitives
- **Recharts** for charts/graphs (embedded inside shadcn `Card`, `Tabs`, etc.)
- **TanStack Query** for data fetching; **Zustand** for lightweight client state
- Routing with **React Router**; form handling with **React Hook Form** + Zod validation

**Backend**
- **Slim PHP** (your preference, pragmatic, fast to ship)
- **PostgreSQL** primary store (ACID + JSONB for extensible metadata)
- **MinIO / S3 / Wasabi** for evidence storage
- **Redis** (optional) for cache/queues
- **OpenAPI** spec for REST; future GraphQL gateway is optional

**Workflow Engine**
- Phase 1: model workflows in DB (state + transitions + triggers)
- Phase 2+: consider Temporal/Camunda if complex orchestrations needed

**Reporting/Analytics**
- Server‑side aggregates; export CSV
- Phase 2+: DuckDB for ad‑hoc analytics; consider embedded Metabase dashboards (optional)

**Infrastructure**
- Docker Compose dev; Docker images for Frontend & API; Nginx reverse proxy; Let’s Encrypt TLS
- Production: single VM or Kubernetes (later)

---

## 5) Data Model (High‑Level ERD Outline)

```
Company(id, name)
Process(id, company_id, name)
Subprocess(id, process_id, name)
Risk(id, subprocess_id, description, assertions[])
Control(id, risk_id, name, type, frequency, automation, owner_user_id, key boolean, status)
Test(id, control_id, period_start, period_end, plan_json, status, tester_user_id, reviewer_user_id, conclusion)
Evidence(id, test_id, filename, storage_path, checksum_sha256, uploaded_by_user_id, uploaded_at, tags[])
Issue(id, test_id, control_id, title, severity, root_cause, action_plan, owner_user_id, target_date, status)
User(id, name, email)
Role(id, name)  -- Admin, Manager, Tester, Viewer
UserRole(user_id, role_id)
AuditTrail(id, actor_user_id, entity_type, entity_id, action, before_json, after_json, at)
Notification(id, user_id, message, link, read_at)
```

> Implementation note: keep JSONB columns (`plan_json`, `before_json`, `after_json`) for flexible extensions.

---

## 6) UI/UX System – shadcn/ui + Recharts

- **Do:** Build dashboards using `Card`, `Tabs`, `DropdownMenu`, `Table`, `Tooltip` from shadcn/ui; charts rendered with **Recharts**.
- **Do:** Provide light/dark themes, responsive layouts, and A11y labels for chart datasets.
- **Don’t:** Use ECharts.
- **Components to ship in MVP**
  - RCM grid (virtualized table)
  - Test runner view (checklist, sample picker, evidence panel)
  - Issue drawer (edit in place)
  - Dashboard cards with Recharts: Bar, Line, Pie/Donut, Stacked Bar

---

## 7) DevEx, Quality & CI/CD (GitHub Actions Required)

**Goals**
- Every PR runs full checks across **frontend** and **backend**.
- Build Docker images on `main` and version tags.
- Minimal friction for local dev via `docker-compose up`.

**Workflows (YAML snippets)**

### A) PR Checks – Frontend (React + TS + shadcn/ui + Recharts)
```yaml
name: pr-frontend
on:
  pull_request:
    paths:
      - 'frontend/**'
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - name: Install
        working-directory: frontend
        run: npm ci
      - name: Lint
        working-directory: frontend
        run: npm run lint
      - name: Typecheck
        working-directory: frontend
        run: npm run typecheck
      - name: Unit tests
        working-directory: frontend
        run: npm test -- --ci --reporters=default --reporters=jest-junit
```

### B) PR Checks – Backend (Slim PHP)
```yaml
name: pr-backend
on:
  pull_request:
    paths:
      - 'api/**'
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          coverage: xdebug
      - name: Install deps
        working-directory: api
        run: composer install --no-interaction --prefer-dist
      - name: Lint (PHP-CS-Fixer)
        working-directory: api
        run: vendor/bin/php-cs-fixer fix --dry-run --diff
      - name: Static analysis (Psalm)
        working-directory: api
        run: vendor/bin/psalm --output-format=github
      - name: Unit tests (PHPUnit/Pest)
        working-directory: api
        run: vendor/bin/pest --ci --coverage-clover=coverage.xml
```

### C) Docker Images on Main & Tags
```yaml
name: docker-build-push
on:
  push:
    branches: [ main ]
    tags: [ 'v*.*.*' ]
jobs:
  docker:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3
      - name: Set up Buildx
        uses: docker/setup-buildx-action@v3
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build & push API
        uses: docker/build-push-action@v6
        with:
          context: ./api
          push: true
          tags: ghcr.io/${{ github.repository_owner }}/assurkit-api:latest
      - name: Build & push Frontend
        uses: docker/build-push-action@v6
        with:
          context: ./frontend
          push: true
          tags: ghcr.io/${{ github.repository_owner }}/assurkit-frontend:latest
```

> Claude Code requirement: **Create these workflows from day one.** PRs must pass to merge.

**Branching & Environments**
- Default branch: `main`
- Long‑lived branches discouraged; use short‑lived feature branches
- Optional protected branch with required checks: `pr-frontend`, `pr-backend`

**Testing Pyramid**
- **Unit:** model/services; validators; RBAC; utilities
- **Integration:** API routes against a test Postgres via Docker
- **E2E (Phase 2):** Playwright (frontend) + ephemeral API

---

## 8) Project Layout (Monorepo)

```
/ (repo root)
  README.md
  /frontend              # React + TS + shadcn/ui + Recharts
    src/
    package.json
    tsconfig.json
  /api                   # Slim PHP API
    public/index.php     # front controller
    src/
    tests/
    composer.json
  /infra
    docker-compose.yml
    nginx/
    db/
    scripts/
  /.github/workflows
    pr-frontend.yml
    pr-backend.yml
    docker-build-push.yml
  /docs
    vision-roadmap.md    # this file (source)
    api-openapi.yaml
    erd.png
  LICENSE
  CODE_OF_CONDUCT.md
  CONTRIBUTING.md
```

---

## 9) Roadmap & Phases

### Phase 0 – Foundation (2–3 weeks)
- Finalize data model & OpenAPI spec
- Repo init, monorepo layout, Docker Compose
- Auth skeleton (JWT), RBAC scaffolding
- GitHub Actions: **PR checks + Docker builds** (required)

### Phase 1 – SOX MVP (8–10 weeks)
- Entities/Processes/Subprocesses CRUD
- RCM (Risks ↔ Controls) with grid UI
- Tests: plan, execute, conclude; evidence upload with checksums
- Issues & basic dashboards (Recharts inside shadcn Cards)
- Audit trail and CSV export

### Phase 2 – Collaboration & Review (6–8 weeks)
- Assignments/notifications; due/overdue
- Review workflows and approvals
- Advanced filters/search; saved views
- E2E tests, perf baselines

### Phase 3 – Reporting & Extensibility (6–8 weeks)
- More dashboards (period trends, exception heatmaps)
- Admin policies (period definitions, naming rules)
- Plugins/integrations skeleton (webhooks)
- Optional DuckDB analytics

---

## 10) Risks & Mitigations

- **Adoption depends on polish:** Invest in shadcn/ui quality; seed data & demo mode.
- **Evidence size & cost:** Offer S3‑compatible config + lifecycle policies; client‑side uploads.
- **Workflow complexity creep:** Keep MVP states minimal; document extension points.
- **Security posture:** Default‑deny RBAC, strict upload validation, size limits, antivirus hook (optional).

---

## 11) Licensing & Community

- **License:** AGPL‑3.0 for core (protects community) + allow commercial add‑ons later.
- **Docs:** Quickstart, API ref, contribution guide, code of conduct.
- **Backlog labels:** `good-first-issue`, `help-wanted`, `security`, `a11y`, `charts`.

---

## 12) “Definition of Done” (MVP)

- All PRs green on **pr-frontend** and **pr-backend** workflows
- Docker images published for `main`
- Install via `docker-compose up` + seed demo
- Core flows usable end‑to‑end (RCM → Test → Evidence → Issue → Dashboard)
- A11y & dark mode pass on dashboards

---

### Appendix A – Frontend Scripts (package.json excerpt)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "test": "jest --passWithNoTests"
  }
}
```

### Appendix B – API Composer (composer.json excerpt)
```json
{
  "require": {
    "php": ">=8.2",
    "slim/slim": "^4.12",
    "slim/psr7": "^1.6",
    "nyholm/psr7": "^1.8",
    "monolog/monolog": "^3.6",
    "vlucas/phpdotenv": "^5.6",
    "respect/validation": "^2.2"
  },
  "require-dev": {
    "pestphp/pest": "^3.0",
    "friendsofphp/php-cs-fixer": "^3.64",
    "vimeo/psalm": "^5.26"
  }
}
```

---

**Action for Claude Code:**
1) Scaffold the monorepo as shown.
2) Install React + TS + shadcn/ui; add **Recharts** for charts.
3) Implement the three GitHub Actions workflows exactly as specified and mark them as required.
4) Deliver `docker-compose.yml` with Nginx, API (Slim PHP), Frontend, Postgres, and MinIO services.
5) Seed demo data and a minimal dashboard using **Recharts** components in shadcn `Card`s.

