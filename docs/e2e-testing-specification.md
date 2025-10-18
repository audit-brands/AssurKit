# E2E Testing Implementation Specification for Codex

## Project Context

**Project:** AssurKit - Open-source SOX-first GRC platform
**Framework:** React + TypeScript frontend with Slim PHP backend
**Current State:** MVP with core SOX workflows implemented, comprehensive demo data seeded
**Your Mission:** Implement end-to-end testing suite using Playwright to validate critical user workflows

## Objectives

1. Set up Playwright testing infrastructure in the frontend project
2. Implement E2E tests covering core SOX workflows (RCM → Test → Evidence → Issue → Dashboard)
3. Integrate tests into CI/CD pipeline (GitHub Actions)
4. Ensure tests are reliable, maintainable, and well-documented
5. Achieve the "Definition of Done" requirement: "Core flows usable end-to-end"

## Technical Stack

- **Testing Framework:** Playwright (latest version)
- **Language:** TypeScript
- **Frontend:** React running on http://localhost:3000 (Vite dev server)
- **Backend API:** Running on http://localhost:8080 (Slim PHP)
- **Database:** PostgreSQL with pre-seeded demo data
- **UI Components:** shadcn/ui (important for selectors)

## Demo User Accounts (Pre-seeded)

The database is already seeded with these test accounts:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Admin | `admin@assurkit.local` | `admin123` | Full system access, user management |
| Manager | `manager@assurkit.local` | `manager123` | Create/edit entities, controls, tests |
| Tester | `tester@assurkit.local` | `tester123` | Execute tests, upload evidence |
| Viewer | `viewer@assurkit.local` | `viewer123` | Read-only access |

## Demo Data Available

The seeder has created:
- **Company:** Acme Corporation
- **Processes:** Revenue Recognition, Procurement to Pay, Payroll Processing
- **Subprocesses:** 6 subprocesses with SOX assertions
- **Risks:** 3 risks (Premature Revenue Recognition, Incomplete Revenue Capture, Unauthorized Vendor Payments)
- **Controls:** 4 controls (mix of preventive/detective, manual/automated)
- **Tests:** 3 tests (Pass, Fail, In Progress statuses)
- **Evidence:** 3 evidence files attached to tests

## File Structure to Create

```
frontend/
├── e2e/
│   ├── tests/
│   │   ├── auth/
│   │   │   ├── login.spec.ts
│   │   │   ├── logout.spec.ts
│   │   │   └── role-based-access.spec.ts
│   │   ├── entities/
│   │   │   ├── companies.spec.ts
│   │   │   ├── processes.spec.ts
│   │   │   └── subprocesses.spec.ts
│   │   ├── rcm/
│   │   │   ├── risks.spec.ts
│   │   │   ├── controls.spec.ts
│   │   │   └── rcm-grid.spec.ts
│   │   ├── testing/
│   │   │   ├── test-creation.spec.ts
│   │   │   ├── test-execution.spec.ts
│   │   │   └── test-review.spec.ts
│   │   ├── evidence/
│   │   │   ├── evidence-upload.spec.ts
│   │   │   ├── evidence-search.spec.ts
│   │   │   └── evidence-management.spec.ts
│   │   ├── dashboard/
│   │   │   └── dashboard.spec.ts
│   │   └── workflows/
│   │       └── complete-sox-workflow.spec.ts
│   ├── fixtures/
│   │   ├── test-files/
│   │   │   ├── sample-evidence.pdf
│   │   │   ├── sample-document.docx
│   │   │   └── sample-spreadsheet.xlsx
│   │   └── test-data.ts
│   ├── helpers/
│   │   ├── auth-helpers.ts
│   │   ├── navigation-helpers.ts
│   │   └── assertion-helpers.ts
│   └── playwright.config.ts
├── .github/
│   └── workflows/
│       └── e2e-tests.yml  (NEW - create this)
└── package.json  (UPDATE - add Playwright dependencies)
```

## Installation & Setup

### 1. Install Playwright

```bash
cd frontend
npm install -D @playwright/test
npx playwright install
npx playwright install-deps
```

### 2. Create Playwright Configuration

**File:** `frontend/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### 3. Update package.json

Add these scripts to `frontend/package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

## Test Implementation Guide

### Authentication Helper (CRITICAL - Reuse across all tests)

**File:** `frontend/e2e/helpers/auth-helpers.ts`

```typescript
import { Page } from '@playwright/test';

export type UserRole = 'admin' | 'manager' | 'tester' | 'viewer';

const CREDENTIALS = {
  admin: { email: 'admin@assurkit.local', password: 'admin123' },
  manager: { email: 'manager@assurkit.local', password: 'manager123' },
  tester: { email: 'tester@assurkit.local', password: 'tester123' },
  viewer: { email: 'viewer@assurkit.local', password: 'viewer123' },
};

export async function loginAs(page: Page, role: UserRole) {
  const { email, password } = CREDENTIALS[role];

  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for navigation after login
  await page.waitForURL(/^\/$|^\/dashboard/);
}

export async function logout(page: Page) {
  // Adjust selector based on actual UI implementation
  await page.click('[data-testid="user-menu"]');
  await page.click('text=Logout');
  await page.waitForURL('/login');
}
```

### Navigation Helper

**File:** `frontend/e2e/helpers/navigation-helpers.ts`

```typescript
import { Page } from '@playwright/test';

export async function navigateTo(page: Page, section: string) {
  const routes: Record<string, string> = {
    dashboard: '/dashboard',
    companies: '/companies',
    processes: '/processes',
    risks: '/risks',
    controls: '/controls',
    rcm: '/rcm',
    tests: '/tests',
    evidence: '/evidence',
  };

  await page.goto(routes[section] || section);
}
```

### Example Test 1: Login Flow

**File:** `frontend/e2e/tests/auth/login.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should successfully login with admin credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'admin@assurkit.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Should see user info or dashboard content
    await expect(page.locator('text=Admin User')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/invalid credentials|login failed/i')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/login');

    // Click submit without filling fields
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=/email.*required/i')).toBeVisible();
    await expect(page.locator('text=/password.*required/i')).toBeVisible();
  });
});
```

### Example Test 2: Role-Based Access Control

**File:** `frontend/e2e/tests/auth/role-based-access.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { loginAs } from '../../helpers/auth-helpers';

test.describe('Role-Based Access Control', () => {
  test('Viewer should only have read access', async ({ page }) => {
    await loginAs(page, 'viewer');

    // Navigate to companies page
    await page.goto('/companies');

    // Should see list but not "Add" or "Edit" buttons
    await expect(page.locator('button:has-text("Add Company")')).not.toBeVisible();

    // Click on a company to view details
    await page.click('text=Acme Corporation');

    // Should NOT see edit or delete buttons
    await expect(page.locator('button:has-text("Edit")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();
  });

  test('Manager should be able to create and edit entities', async ({ page }) => {
    await loginAs(page, 'manager');

    await page.goto('/companies');

    // Should see "Add Company" button
    await expect(page.locator('button:has-text("Add Company")')).toBeVisible();

    // Click on existing company
    await page.click('text=Acme Corporation');

    // Should see edit button
    await expect(page.locator('button:has-text("Edit")')).toBeVisible();
  });

  test('Admin should have full system access', async ({ page }) => {
    await loginAs(page, 'admin');

    // Should be able to access user management
    await page.goto('/users');

    // Should see user list and add user button
    await expect(page.locator('button:has-text("Add User")')).toBeVisible();
  });
});
```

### Example Test 3: Complete SOX Workflow

**File:** `frontend/e2e/tests/workflows/complete-sox-workflow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { loginAs } from '../../helpers/auth-helpers';

test.describe('Complete SOX Workflow', () => {
  test('should complete end-to-end SOX workflow: RCM → Test → Evidence → Dashboard', async ({ page }) => {
    // Step 1: Login as Manager
    await loginAs(page, 'manager');

    // Step 2: Navigate to RCM and verify risk-control mappings exist
    await page.goto('/rcm');
    await expect(page.locator('text=Premature Revenue Recognition')).toBeVisible();
    await expect(page.locator('text=Revenue Recognition Review')).toBeVisible();

    // Step 3: Navigate to Controls and verify a control
    await page.goto('/controls');
    await page.click('text=Revenue Recognition Review');

    // Verify control details
    await expect(page.locator('text=Detective')).toBeVisible(); // Control type
    await expect(page.locator('text=Monthly')).toBeVisible(); // Frequency

    // Step 4: Navigate to Tests
    await page.goto('/tests');

    // Verify existing tests are visible
    await expect(page.locator('text=Concluded')).toBeVisible();
    await expect(page.locator('text=In Progress')).toBeVisible();

    // Step 5: View a completed test with Pass status
    await page.click('button:has-text("View")').first();
    await expect(page.locator('text=Pass')).toBeVisible();

    // Step 6: Navigate to Evidence
    await page.goto('/evidence');

    // Verify evidence files are listed
    await expect(page.locator('text=revenue_recognition_review_q2_2024.pdf')).toBeVisible();

    // Step 7: Navigate to Dashboard
    await page.goto('/dashboard');

    // Verify dashboard shows metrics
    await expect(page.locator('text=/test.*completion|control.*coverage/i')).toBeVisible();

    // Verify charts are rendered (look for Recharts SVG elements)
    const charts = page.locator('svg[class*="recharts"]');
    await expect(charts.first()).toBeVisible();
  });
});
```

### Example Test 4: Evidence Upload

**File:** `frontend/e2e/tests/evidence/evidence-upload.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { loginAs } from '../../helpers/auth-helpers';
import path from 'path';

test.describe('Evidence Upload', () => {
  test('should upload evidence file successfully', async ({ page }) => {
    await loginAs(page, 'tester');

    await page.goto('/tests');

    // Find a test that's "In Progress"
    await page.click('text=In Progress');

    // Click on "Upload Evidence" or "Add Evidence" button
    await page.click('button:has-text("Upload Evidence")');

    // Create a test file path
    const testFilePath = path.join(__dirname, '../../fixtures/test-files/sample-evidence.pdf');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Fill in evidence metadata
    await page.fill('input[name="description"]', 'E2E Test Evidence Upload');
    await page.fill('input[name="tags"]', 'e2e-test, automated');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('text=/uploaded.*success/i')).toBeVisible();

    // Verify evidence appears in list
    await expect(page.locator('text=E2E Test Evidence Upload')).toBeVisible();
  });

  test('should validate file type restrictions', async ({ page }) => {
    await loginAs(page, 'tester');

    await page.goto('/tests');
    await page.click('text=In Progress');
    await page.click('button:has-text("Upload Evidence")');

    // Try to upload an invalid file type (e.g., .exe)
    const invalidFilePath = path.join(__dirname, '../../fixtures/test-files/invalid.exe');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidFilePath);

    // Should show error
    await expect(page.locator('text=/invalid file type|file type not allowed/i')).toBeVisible();
  });
});
```

### Example Test 5: Dashboard Charts

**File:** `frontend/e2e/tests/dashboard/dashboard.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { loginAs } from '../../helpers/auth-helpers';

test.describe('Dashboard', () => {
  test('should display all dashboard metrics and charts', async ({ page }) => {
    await loginAs(page, 'admin');

    await page.goto('/dashboard');

    // Verify key metrics cards are visible
    await expect(page.locator('text=/total.*controls|active.*controls/i')).toBeVisible();
    await expect(page.locator('text=/total.*tests|completed.*tests/i')).toBeVisible();
    await expect(page.locator('text=/evidence.*files/i')).toBeVisible();

    // Verify charts are rendered (Recharts uses SVG)
    const chartSvgs = page.locator('svg.recharts-surface');
    const chartCount = await chartSvgs.count();

    expect(chartCount).toBeGreaterThan(0);

    // Verify chart has data (check for paths/bars)
    await expect(page.locator('.recharts-bar, .recharts-line, .recharts-pie')).toBeVisible();
  });

  test('should filter dashboard by time period', async ({ page }) => {
    await loginAs(page, 'manager');

    await page.goto('/dashboard');

    // Look for period selector
    const periodSelector = page.locator('select[name="period"], button:has-text("Period")');

    if (await periodSelector.isVisible()) {
      await periodSelector.click();
      await page.click('text=Last Quarter');

      // Wait for charts to update
      await page.waitForTimeout(1000);

      // Verify data updated (this is framework-dependent)
      await expect(page.locator('.recharts-surface')).toBeVisible();
    }
  });
});
```

## Test Fixtures - Create Sample Files

Create these sample files in `frontend/e2e/fixtures/test-files/`:

### sample-evidence.pdf
Create a minimal valid PDF file (you can generate this programmatically):

```typescript
// frontend/e2e/fixtures/generate-test-files.ts
import fs from 'fs';
import path from 'path';

const testFilesDir = path.join(__dirname, 'test-files');

if (!fs.existsSync(testFilesDir)) {
  fs.mkdirSync(testFilesDir, { recursive: true });
}

// Create a minimal valid PDF
const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Evidence) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF`;

fs.writeFileSync(path.join(testFilesDir, 'sample-evidence.pdf'), pdfContent);

console.log('Test files generated successfully!');
```

Run this once: `npx ts-node e2e/fixtures/generate-test-files.ts`

## GitHub Actions CI Integration

**File:** `.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests

on:
  pull_request:
    branches:
      - main
      - development
    paths:
      - 'frontend/**'
      - 'api/**'
  push:
    branches:
      - main
      - development

jobs:
  e2e-tests:
    name: Run E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          extensions: mbstring, pdo, pdo_pgsql

      - name: Start PostgreSQL
        run: |
          docker run -d \
            --name postgres \
            -e POSTGRES_USER=assurkit \
            -e POSTGRES_PASSWORD=assurkit_test \
            -e POSTGRES_DB=assurkit_test \
            -p 5432:5432 \
            postgres:16-alpine

          # Wait for PostgreSQL to be ready
          for i in {1..30}; do
            PGPASSWORD=assurkit_test psql -h localhost -U assurkit -d assurkit_test -c "SELECT 1" > /dev/null 2>&1 && break
            echo "Waiting for PostgreSQL... ($i/30)"
            sleep 2
          done

      - name: Install API dependencies
        working-directory: api
        run: composer install --no-interaction --prefer-dist

      - name: Run database migrations
        working-directory: api
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_DATABASE: assurkit_test
          DB_USERNAME: assurkit
          DB_PASSWORD: assurkit_test
        run: php migrate.php migrate

      - name: Seed database
        working-directory: api
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_DATABASE: assurkit_test
          DB_USERNAME: assurkit
          DB_PASSWORD: assurkit_test
        run: php seed.php

      - name: Start API server
        working-directory: api
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_DATABASE: assurkit_test
          DB_USERNAME: assurkit
          DB_PASSWORD: assurkit_test
        run: php -S localhost:8080 -t public &

      - name: Install frontend dependencies
        working-directory: frontend
        run: npm ci

      - name: Install Playwright browsers
        working-directory: frontend
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        working-directory: frontend
        env:
          VITE_API_URL: http://localhost:8080
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 30

      - name: Upload test videos
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-videos
          path: frontend/test-results/
          retention-days: 7
```

## Critical Test Scenarios to Cover

### Priority 1 (Must Have):
1. **Authentication**
   - ✅ Login with valid credentials (all 4 roles)
   - ✅ Login with invalid credentials
   - ✅ Logout
   - ✅ Session persistence

2. **Role-Based Access Control**
   - ✅ Viewer: read-only access
   - ✅ Tester: can execute tests and upload evidence
   - ✅ Manager: can create/edit entities and controls
   - ✅ Admin: full access including user management

3. **Core SOX Workflow**
   - ✅ View RCM grid (risks mapped to controls)
   - ✅ View control details
   - ✅ View tests
   - ✅ Upload evidence
   - ✅ View dashboard with metrics

### Priority 2 (Should Have):
4. **Entity Management (CRUD)**
   - Create company
   - Edit company
   - Delete company (with confirmation)
   - Same for processes and subprocesses

5. **Risk & Control Management**
   - Create risk
   - Link risk to subprocess
   - Create control
   - Map control to risk
   - View effectiveness ratings

6. **Test Execution**
   - Create test plan
   - Update test status
   - Add test conclusions
   - Assign testers/reviewers

7. **Evidence Management**
   - Upload multiple file types
   - Search/filter evidence
   - Download evidence
   - View evidence metadata

### Priority 3 (Nice to Have):
8. **Advanced Features**
   - CSV export from RCM
   - Dashboard filtering
   - Bulk operations
   - Saved filters
   - Dark mode toggle

## Best Practices & Conventions

### 1. Use Data Test IDs
Recommend adding `data-testid` attributes to critical UI elements:

```tsx
// Example: Add to buttons
<Button data-testid="add-company-btn">Add Company</Button>

// Example: Add to forms
<form data-testid="login-form">
  <input data-testid="email-input" name="email" />
  <input data-testid="password-input" name="password" />
  <button data-testid="submit-btn" type="submit">Login</button>
</form>
```

Then in tests:
```typescript
await page.click('[data-testid="add-company-btn"]');
```

### 2. Use Explicit Waits
```typescript
// Good
await page.waitForSelector('[data-testid="dashboard-loaded"]');
await expect(page.locator('text=Dashboard')).toBeVisible();

// Avoid arbitrary timeouts
// Bad: await page.waitForTimeout(5000);
```

### 3. Clean Up After Tests
```typescript
test.afterEach(async ({ page }) => {
  // Close any open dialogs/modals
  const closeButton = page.locator('[data-testid="modal-close"]');
  if (await closeButton.isVisible()) {
    await closeButton.click();
  }
});
```

### 4. Use Page Object Model for Complex Pages
```typescript
// frontend/e2e/pages/LoginPage.ts
import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="submit-btn"]');
  }

  async getErrorMessage() {
    return this.page.locator('[data-testid="error-message"]').textContent();
  }
}

// Usage in test:
import { LoginPage } from '../pages/LoginPage';

test('login test', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('admin@assurkit.local', 'admin123');
});
```

### 5. Parallel Test Execution
- Tests should be independent (no shared state)
- Use `test.describe.configure({ mode: 'parallel' })` for test suites
- Avoid test interdependencies

### 6. Visual Regression Testing (Optional Enhancement)
Consider adding screenshot comparisons:

```typescript
test('dashboard layout remains consistent', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/dashboard');

  await expect(page).toHaveScreenshot('dashboard.png', {
    fullPage: true,
    maxDiffPixels: 100,
  });
});
```

## Environment Variables

Create `frontend/.env.test`:

```env
VITE_API_URL=http://localhost:8080
```

Reference in tests:
```typescript
const apiUrl = process.env.VITE_API_URL || 'http://localhost:8080';
```

## Debugging Tips

### Run tests in headed mode:
```bash
npm run test:e2e:headed
```

### Debug specific test:
```bash
npm run test:e2e:debug -- auth/login.spec.ts
```

### View test report:
```bash
npm run test:e2e:report
```

### Use Playwright Inspector:
```typescript
await page.pause(); // Add this line to pause test execution
```

## Acceptance Criteria

Your implementation is complete when:

1. ✅ Playwright is installed and configured
2. ✅ All Priority 1 test scenarios pass (11+ tests)
3. ✅ Tests run successfully in CI (GitHub Actions)
4. ✅ Test coverage includes all 4 user roles
5. ✅ Complete SOX workflow test passes end-to-end
6. ✅ Evidence upload test with real file works
7. ✅ Dashboard chart rendering verified
8. ✅ Tests are reliable (no flakiness, pass 3 consecutive times)
9. ✅ HTML report generates successfully
10. ✅ Documentation added to README or docs/

## Documentation to Create

Add a new file: `frontend/e2e/README.md`

```markdown
# AssurKit E2E Testing

## Running Tests

# Run all tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test auth/login.spec.ts

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

## Test Structure

- `/auth` - Authentication and authorization tests
- `/entities` - Company, process, subprocess CRUD tests
- `/rcm` - Risk and control management tests
- `/testing` - Test creation and execution tests
- `/evidence` - Evidence upload and management tests
- `/dashboard` - Dashboard and reporting tests
- `/workflows` - End-to-end workflow tests

## Test Data

Tests use pre-seeded demo data. See `README.md` for demo credentials.

## CI/CD

E2E tests run automatically on PR creation and merges to main/development.
```

## Known Challenges & Solutions

### Challenge 1: API Server Not Ready
**Solution:** Add health check endpoint and wait for it:

```typescript
async function waitForApi(url: string, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('API server did not start in time');
}

// Use in playwright.config.ts
// await waitForApi('http://localhost:8080');
```

### Challenge 2: Database State
**Solution:** Tests should work with existing seeded data (read-only for most tests). For tests that modify data, either:
- Use unique identifiers (timestamps)
- Clean up created entities in afterEach
- Run against fresh database (slower but cleaner)

### Challenge 3: File Uploads
**Solution:** Use real fixture files in `e2e/fixtures/test-files/`. Playwright handles file uploads natively.

### Challenge 4: shadcn/ui Dialogs
**Solution:** shadcn uses Radix UI. Wait for dialog to be visible:

```typescript
// Open dialog
await page.click('button:has-text("Add Company")');

// Wait for dialog
await page.waitForSelector('[role="dialog"]');

// Fill form in dialog
await page.fill('[role="dialog"] input[name="name"]', 'Test Company');

// Submit
await page.click('[role="dialog"] button[type="submit"]');

// Wait for dialog to close
await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
```

## Final Checklist

Before marking complete, verify:

- [ ] `npm run test:e2e` passes locally
- [ ] All 4 user roles tested
- [ ] Complete SOX workflow test implemented
- [ ] File upload test works with real PDF
- [ ] Dashboard charts verified (Recharts SVG elements)
- [ ] CI workflow added to `.github/workflows/`
- [ ] Tests run in parallel where possible
- [ ] No hardcoded waits (use explicit waits)
- [ ] Screenshots/videos captured on failure
- [ ] Test report generates in `playwright-report/`
- [ ] Documentation added to `frontend/e2e/README.md`
- [ ] package.json scripts added

## Questions or Issues?

If you encounter any issues:
1. Check that Docker services are running (`docker ps`)
2. Verify API is accessible (`curl http://localhost:8080/health`)
3. Check database is seeded (`psql` and query users table)
4. Review Playwright trace for failed tests
5. Add `await page.pause()` to debug interactively

---

**Estimated Effort:** 8-12 hours for Priority 1 + Priority 2 tests

**Deliverables:**
- Configured Playwright setup
- 20-30 E2E tests covering core workflows
- CI integration
- Documentation

Good luck! This testing suite will be critical for maintaining AssurKit quality as development continues.
