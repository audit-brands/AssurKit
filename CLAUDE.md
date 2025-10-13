# AssurKit Development Guide

## Project Overview
AssurKit is a community-driven, SOX-first open-source GRC platform that teams can self-host, audit, and extend. The project starts with SOX compliance workflows (RCM, controls, testing, issues, and evidence) and will grow toward broader GRC and continuous control monitoring.

## Tech Stack

### Frontend
- **Framework**: React + TypeScript
- **UI Components**: shadcn/ui (design system and primitives)
- **Charts**: Recharts (embedded within shadcn/ui components)
- **State Management**: Zustand (lightweight client state)
- **Data Fetching**: TanStack Query
- **Routing**: React Router
- **Forms**: React Hook Form + Zod validation

### Backend
- **Framework**: Slim PHP 4
- **Database**: PostgreSQL (with JSONB for flexible metadata)
- **Object Storage**: MinIO/S3/Wasabi for evidence files
- **Cache**: Redis (optional)
- **API**: REST with OpenAPI spec

## Project Structure
```
/AssurKit/
├── frontend/           # React + TS + shadcn/ui + Recharts
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── api/               # Slim PHP API
│   ├── public/index.php
│   ├── src/
│   ├── tests/
│   └── composer.json
├── infra/
│   ├── docker-compose.yml
│   ├── nginx/
│   ├── db/
│   └── scripts/
├── .github/workflows/
│   ├── pr-frontend.yml
│   ├── pr-backend.yml
│   └── docker-build-push.yml
└── docs/
```

## Development Commands

### Frontend
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start dev server (Vite)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
npm test            # Run Jest tests
```

### Backend
```bash
cd api
composer install                                    # Install dependencies
vendor/bin/php-cs-fixer fix --dry-run --diff      # Lint check
vendor/bin/psalm --output-format=github           # Static analysis
vendor/bin/pest --ci                              # Run tests
```

### Docker Development
```bash
docker-compose up    # Start all services
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

## Core Domain Model

### Key Entities
- **Company** → **Process** → **Subprocess** (hierarchical structure)
- **Risk**: Linked to subprocess with assertions
- **Control**: Type, frequency, automation, owner, key/non-key status
- **RCM**: Links Process ↔ Risks ↔ Controls
- **Test**: Scope, method, sample, status, reviewer, conclusions
- **Evidence**: File uploads with checksums and metadata
- **Issue**: Exceptions, severity, root cause, action plans

### Workflows
- Control: Draft → Active → Retired
- Test: Planned → In Progress → Submitted → In Review → Concluded
- Issue: Open → In Remediation → Ready for Retest → Closed

## UI/UX Guidelines

### Component System
- Use **shadcn/ui** for all UI components (Card, Table, Tabs, DropdownMenu, etc.)
- Use **Recharts** for all charts and visualizations
- **DO NOT** use ECharts
- Embed Recharts components within shadcn/ui containers

### Key UI Components
- RCM grid (virtualized table for performance)
- Test runner view (checklist, sample picker, evidence panel)
- Issue drawer (in-place editing)
- Dashboard cards with Recharts (Bar, Line, Pie/Donut, Stacked Bar)

### Design Requirements
- Light/dark theme support
- Responsive layouts
- WCAG 2.1 AA accessibility compliance
- Keyboard navigation support

## Security & Compliance

### Authentication & Authorization
- OAuth2/OIDC (Keycloak) or JWT
- Role-based access control (Admin, Manager, Tester, Viewer)
- Row-level permissions where needed

### Audit & Evidence
- Field-level audit history with diffs
- Evidence immutability via SHA-256 checksums
- Audit trail tracking who/when/what for all changes

### Data Protection
- HTTPS/TLS for all communications
- Encryption in transit and at rest
- Self-hosted with data residency control
- Configurable retention policies

## Performance Targets
- API response: p95 < 300ms for core CRUD operations
- Evidence uploads: Streamed handling
- Large lists: Paginated responses
- Dashboard rendering: Optimized aggregates

## Testing Strategy

### Test Pyramid
1. **Unit Tests**: Models, services, validators, RBAC, utilities
2. **Integration Tests**: API routes against test PostgreSQL
3. **E2E Tests** (Phase 2): Playwright for frontend flows

### CI/CD Requirements
- All PRs must pass frontend and backend checks
- Required GitHub Actions workflows:
  - `pr-frontend.yml`: Lint, typecheck, and test React/TS
  - `pr-backend.yml`: PHP-CS-Fixer, Psalm, and Pest tests
  - `docker-build-push.yml`: Build and publish Docker images

## Development Phases

### Phase 0 - Foundation (Current)
- Repository setup with monorepo structure
- Docker Compose configuration
- GitHub Actions CI/CD pipelines
- Authentication skeleton
- Base RBAC implementation

### Phase 1 - SOX MVP
- Entity/Process/Subprocess CRUD
- Risk and Control management
- RCM grid interface
- Test planning and execution
- Evidence upload with checksums
- Basic issues tracking
- Initial dashboards with Recharts

### Phase 2 - Collaboration
- User assignments and notifications
- Review workflows and approvals
- Advanced filtering and search
- Saved views
- E2E testing implementation

### Phase 3 - Reporting & Extensions
- Advanced dashboards and trends
- Admin policy configuration
- Plugin/webhook system
- Optional DuckDB analytics

## Important Notes

### Do's
✅ Use shadcn/ui for all UI components
✅ Use Recharts for all charts and graphs
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
2. Run `docker-compose up` to start all services
3. Frontend will be available at http://localhost:3000
4. API will be available at http://localhost:8080
5. Use seed data for demo/development

## License
AGPL-3.0 for core (protects community) with allowance for commercial add-ons

## Contributing
- Use feature branches with descriptive names
- All PRs must pass CI checks
- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation as needed

## Support
- Create issues for bugs or feature requests
- Use labels: `good-first-issue`, `help-wanted`, `security`, `a11y`, `charts`
- Follow CODE_OF_CONDUCT.md guidelines