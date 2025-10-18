# AssurKit Playwright E2E Tests

## Prerequisites

1. Install dependencies:

```bash
npm install
npm install -D @playwright/test
npx playwright install
```

2. Ensure the backend API is running locally on `http://localhost:8080` (Docker compose stack: `cd infra && docker-compose up`).

## Running the tests

```bash
# Run the full suite in headless mode
npm run test:e2e

# Run with the Playwright UI
npm run test:e2e:ui

# Run a single spec
npx playwright test auth/login.spec.ts

# Run headed
npm run test:e2e:headed

# Debug a test interactively
npm run test:e2e:debug
```

### Test data

Tests rely on the seeded demo users:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@assurkit.local` | `admin123` |
| Manager | `manager@assurkit.local` | `manager123` |
| Tester | `tester@assurkit.local` | `tester123` |
| Viewer | `viewer@assurkit.local` | `viewer123` |

## Reports

Playwright stores HTML and JUnit reports in `playwright-report/` and `test-results/`. Opening `playwright-report/index.html` provides a rich run summary.

## CI

GitHub Actions workflow: `.github/workflows/e2e-tests.yml`
