# AssurKit Development Guide

## Project Overview
AssurKit is a community-driven, SOX‑first open‑source GRC platform that teams can self‑host, audit, and extend. Starting with airtight SOX workflows (RCM, controls, testing, issues, and evidence), AssurKit will grow toward broader GRC and continuous control monitoring.

**Mission:** Deliver a community-driven, SOX‑first open‑source GRC that teams can self‑host, audit, and extend.

**Design Tenets:**
- **SOX-first UX:** Optimize for the auditor's daily flow: RCM → test plan → PBC/evidence → review → issues/remediation → reporting
- **Open, modular, inspectable:** Simple schemas, explicit workflows, clean APIs, and pluggable integrations
- **Enterprise-ready basics:** RBAC, audit trails, immutable evidence, encryption in transit & at rest
- **Great defaults, easy override:** Ship with opinionated defaults (e.g., test states, issue lifecycle), allow org-level policy config

## Tech Stack

### Frontend
- **Framework**: React + TypeScript
- **UI Components**: shadcn/ui for components, theming, and primitives
- **Charts**: Recharts for charts/graphs (embedded inside shadcn `Card`, `Tabs`, etc.)
- **State Management**: TanStack Query for data fetching; Zustand for lightweight client state
- **Routing**: React Router
- **Forms**: React Hook Form + Zod validation

### Backend
- **Framework**: Slim PHP (pragmatic, fast to ship)
- **Database**: PostgreSQL primary store (ACID + JSONB for extensible metadata)
- **Object Storage**: MinIO / S3 / Wasabi for evidence storage
- **Cache**: Redis (optional) for cache/queues
- **API**: OpenAPI spec for REST; future GraphQL gateway is optional

### Workflow Engine
- Phase 1: model workflows in DB (state + transitions + triggers)
- Phase 2+: consider Temporal/Camunda if complex orchestrations needed

### Reporting/Analytics
- Server‑side aggregates; export CSV
- Phase 2+: DuckDB for ad‑hoc analytics; consider embedded Metabase dashboards (optional)

### Infrastructure
- Docker Compose dev; Docker images for Frontend & API; Nginx reverse proxy; Let's Encrypt TLS
- Production: single VM or Kubernetes (later)

## Project Structure (Monorepo)
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
    vision-roadmap.md    # vision & roadmap (source)
    api-openapi.yaml
    erd.png
  LICENSE
  CODE_OF_CONDUCT.md
  CONTRIBUTING.md
```

## Development Commands

### Frontend Scripts (package.json)
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start dev server (Vite)
npm run build        # Build for production
npm run preview      # Preview built app
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
npm test            # Run Jest tests (--passWithNoTests)
```

### Backend Scripts (Composer)
```bash
cd api
composer install                                    # Install dependencies
vendor/bin/php-cs-fixer fix --dry-run --diff      # Lint check (PHP-CS-Fixer)
vendor/bin/psalm --output-format=github           # Static analysis (Psalm)
vendor/bin/pest --ci --coverage-clover=coverage.xml # Unit tests (PHPUnit/Pest)
```

### Docker Development
```bash
cd infra && docker-compose up    # Start all services from infra directory
```

### Development Helper Script
```bash
# Use the development helper script for common operations
./infra/scripts/dev.sh up        # Start development environment
./infra/scripts/dev.sh down      # Stop development environment
./infra/scripts/dev.sh build     # Build all containers
./infra/scripts/dev.sh logs      # Show container logs
./infra/scripts/dev.sh migrate   # Run database migrations
./infra/scripts/dev.sh seed      # Seed database with default data
./infra/scripts/dev.sh shell     # Open shell (default: api, options: api|frontend|postgres)
```

## Git Commit Guidelines

### IMPORTANT: Commit Message Format
When making commits, DO NOT include the Claude co-authorship statement. Use clean, standard commit messages without:
- ❌ "🤖 Generated with Claude Code"
- ❌ "Co-Authored-By: Claude <noreply@anthropic.com>"

Instead, use conventional commit format:
```
feat: Add RCM grid component
fix: Resolve evidence upload checksum validation
docs: Update API documentation
test: Add unit tests for control lifecycle
```

## Core Domain Model (High-Level ERD)

### Key Entities
- **Entity / Process / Subprocess** hierarchy (e.g., Company → Process → Subprocess → Assertions/Accounts)
- **Risk** (description, drivers, assertion mapping)
- **Control** (type, frequency, automation, key/non-key, owner)
- **RCM** linkage (Process ↔ Risks ↔ Controls)
- **Test** (scope, method, sample, status, reviewer, conclusions)
- **Evidence** (uploads, metadata, checksum, retention policy)
- **Issue** (exception, severity, root cause, action plan, target date)

### Data Model Schema
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

### Baseline Workflows
- **Control lifecycle**: Draft → Active → Retired
- **Test lifecycle**: Planned → In Progress → Submitted → In Review → Concluded (Pass/Fail/Qualified)
- **Issue lifecycle**: Open → In Remediation → Ready for Retest → Closed

## UI/UX System – shadcn/ui + Recharts

### Component System
- **Do:** Build dashboards using `Card`, `Tabs`, `DropdownMenu`, `Table`, `Tooltip` from shadcn/ui; charts rendered with **Recharts**
- **Do:** Provide light/dark themes, responsive layouts, and A11y labels for chart datasets
- **Don't:** Use ECharts
- Embed Recharts components within shadcn/ui containers (Card, Tabs, etc.)

### Components to Ship in MVP
- **RCM grid** (virtualized table for performance)
- **Test runner view** (checklist, sample picker, evidence panel)
- **Issue drawer** (edit in place)
- **Dashboard cards with Recharts**: Bar, Line, Pie/Donut, Stacked Bar

### Design Requirements
- Light/dark theme support
- Responsive layouts
- WCAG 2.1 AA accessibility compliance
- Keyboard navigation support
- Color-contrast in charts & components

## Non‑Functional Requirements

### Security
- **Authentication:** OAuth2/OIDC (Keycloak) or JWT; HTTPS; role‑based access; row‑level protections where needed
- **Authorization:** Role-based access control (Admin, Manager, Tester, Viewer)
- **Security posture:** Default‑deny RBAC, strict upload validation, size limits, antivirus hook (optional)

### Auditability
- **Field‑level history:** who/when/what diffs; evidence immutability via checksums
- **Audit trail:** Field-level audit history with diffs; tracking who/when/what for all changes
- **Evidence integrity:** SHA-256 checksums for immutability

### Performance
- **Targets:** p95 < 300ms API for core CRUD; evidence uploads streamed; pagination on heavy lists
- **Optimization:** Server‑side aggregates for dashboards; paginated responses for large lists

### Privacy & Residency
- **Data control:** Self‑hosted; S3‑compatible storage options; data retention policies
- **Encryption:** HTTPS/TLS for all communications; encryption in transit and at rest

### Accessibility
- **Standards:** WCAG 2.1 AA; keyboard nav; color‑contrast in charts & components

## DevEx, Quality & CI/CD (GitHub Actions Required)

### Goals
- Every PR runs full checks across **frontend** and **backend**
- Build Docker images on `main` and version tags
- Minimal friction for local dev via `docker-compose up`

### Testing Strategy

#### Test Pyramid
- **Unit:** model/services; validators; RBAC; utilities
- **Integration:** API routes against a test Postgres via Docker
- **E2E (Phase 2):** Playwright (frontend) + ephemeral API

### Required GitHub Actions Workflows
All PRs must pass to merge. Required workflows:

#### A) PR Checks – Frontend (React + TS + shadcn/ui + Recharts)
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

#### B) PR Checks – Backend (Slim PHP)
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

#### C) Docker Images on Main & Tags
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

### Branching & Environments
- Default branch: `main`
- Long‑lived branches discouraged; use short‑lived feature branches
- Optional protected branch with required checks: `pr-frontend`, `pr-backend`

## Roadmap & Phases

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

## Risks & Mitigations

- **Adoption depends on polish:** Invest in shadcn/ui quality; seed data & demo mode
- **Evidence size & cost:** Offer S3‑compatible config + lifecycle policies; client‑side uploads
- **Workflow complexity creep:** Keep MVP states minimal; document extension points
- **Security posture:** Default‑deny RBAC, strict upload validation, size limits, antivirus hook (optional)

## "Definition of Done" (MVP)

- All PRs green on **pr-frontend** and **pr-backend** workflows
- Docker images published for `main`
- Install via `docker-compose up` + seed demo
- Core flows usable end‑to‑end (RCM → Test → Evidence → Issue → Dashboard)
- A11y & dark mode pass on dashboards

## Important Notes

### Do's
✅ Use shadcn/ui for all UI components (Card, Table, Tabs, DropdownMenu, etc.)
✅ Use Recharts for all charts and graphs (embedded within shadcn/ui containers)
✅ Follow existing code patterns and conventions
✅ Maintain PostgreSQL with JSONB for flexibility
✅ Implement proper RBAC from the start
✅ Create audit trails for all data changes
✅ Use Docker Compose for local development

### Don'ts
❌ Don't use ECharts
❌ Don't skip CI/CD checks
❌ Don't store secrets in code
❌ Don't bypass RBAC controls
❌ Don't modify evidence after upload
❌ Don't use long-lived feature branches
❌ Don't add Claude co-authorship to commits

## Quick Start

1. Clone the repository
2. Run `cd infra && docker-compose up` to start all services
3. Frontend will be available at http://localhost:3000
4. API will be available at http://localhost:8080
5. Use seed data for demo/development

### First-Time Setup
When you run `docker-compose up` from the `infra/` directory for the first time, the system will automatically:
1. Initialize the PostgreSQL database with the required schema
2. Run database migrations to create all tables (users, roles, user_roles, etc.)
3. Seed default data including default roles and admin user account

### Default Admin Account
- **Email**: `admin@assurkit.local`
- **Password**: `admin123`
- **Role**: Admin (full system access)

**⚠️ IMPORTANT**: Change the default admin credentials immediately after first login!

## Licensing & Community

- **License:** AGPL‑3.0 for core (protects community) + allow commercial add‑ons later
- **Docs:** Quickstart, API ref, contribution guide, code of conduct
- **Backlog labels:** `good-first-issue`, `help-wanted`, `security`, `a11y`, `charts`

## Contributing
- Use feature branches with descriptive names
- All PRs must pass CI checks (pr-frontend, pr-backend workflows)
- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation as needed

## Support
- **Issues**: GitHub Issues for bugs or feature requests
- **Discussions**: GitHub Discussions for questions and community
- **Security**: Report security vulnerabilities to security@assurkit.org
- Use labels: `good-first-issue`, `help-wanted`, `security`, `a11y`, `charts`