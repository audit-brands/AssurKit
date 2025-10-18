# Accessibility Audit & WCAG 2.1 AA Compliance Specification

## Project Context

**Project:** AssurKit - Open-source SOX-first GRC platform
**Framework:** React + TypeScript + shadcn/ui + Recharts
**Current State:** MVP with core SOX workflows implemented
**Your Mission:** Audit and fix accessibility issues to achieve WCAG 2.1 AA compliance

## Objectives

1. Conduct comprehensive accessibility audit of the AssurKit frontend
2. Fix all WCAG 2.1 Level A and AA violations
3. Ensure keyboard navigation works throughout the application
4. Verify screen reader compatibility
5. Implement automated accessibility testing in CI
6. Document accessibility features and testing procedures
7. Achieve the "Definition of Done" requirement: "A11y & dark mode pass on dashboards"

## Why Accessibility Matters

- **Legal Compliance**: Many jurisdictions require WCAG 2.1 AA compliance
- **Enterprise Adoption**: Large organizations often mandate accessibility
- **Inclusive Design**: 15% of the global population has some form of disability
- **Better UX**: Accessibility improvements benefit all users
- **SEO Benefits**: Better semantic HTML improves search rankings

## WCAG 2.1 Overview

### WCAG 2.1 Conformance Levels

- **Level A**: Minimum level (must fix)
- **Level AA**: Target level (must fix)
- **Level AAA**: Enhanced level (nice to have, not required)

### Four Principles (POUR)

1. **Perceivable**: Information must be presentable to users in ways they can perceive
2. **Operable**: User interface components must be operable
3. **Understandable**: Information and UI operation must be understandable
4. **Robust**: Content must be robust enough for reliable interpretation

## Tools & Setup

### Automated Testing Tools

#### 1. axe DevTools (Browser Extension)
```bash
# Install Chrome extension
# https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd

# Or Firefox extension
# https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/
```

#### 2. Lighthouse (Built into Chrome DevTools)
```bash
# Open Chrome DevTools (F12)
# Go to "Lighthouse" tab
# Check "Accessibility" category
# Click "Generate report"
```

#### 3. axe-core (npm package for CI)
```bash
cd frontend
npm install -D @axe-core/react axe-core
```

#### 4. WAVE Browser Extension
```bash
# Install WAVE extension
# https://wave.webaim.org/extension/
```

#### 5. React axe (Development Runtime)
```bash
npm install -D @axe-core/react
```

### Manual Testing Tools

#### Screen Readers
- **Windows**: NVDA (free) - https://www.nvaccess.org/download/
- **macOS**: VoiceOver (built-in) - Cmd+F5 to toggle
- **Linux**: Orca (free)

#### Keyboard Navigation
- **Tab**: Move forward through interactive elements
- **Shift+Tab**: Move backward
- **Enter/Space**: Activate buttons/links
- **Arrow keys**: Navigate within components
- **Esc**: Close dialogs/modals

#### Color Contrast Checkers
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Colour Contrast Analyser**: https://www.tpgi.com/color-contrast-checker/

## Audit Process

### Phase 1: Automated Scanning (1-2 hours)

Run automated tools on every page and record violations:

#### Pages to Audit:
1. `/login` - Login page
2. `/dashboard` - Main dashboard
3. `/companies` - Companies list
4. `/companies/:id` - Company details
5. `/processes` - Processes list
6. `/processes/:id` - Process details
7. `/subprocesses` - Subprocesses list
8. `/risks` - Risks list
9. `/controls` - Controls list
10. `/rcm` - Risk-Control Matrix grid
11. `/tests` - Tests list
12. `/evidence` - Evidence list
13. Any modal dialogs or forms

#### Audit Template

Create a spreadsheet or markdown file: `frontend/accessibility-audit-report.md`

```markdown
# AssurKit Accessibility Audit Report

**Date**: [Date]
**Auditor**: Codex
**Tools Used**: axe DevTools, Lighthouse, WAVE, Manual Testing

## Executive Summary
- Total pages audited: X
- Total violations found: X
- Critical (Level A): X
- Serious (Level AA): X
- Moderate: X
- Minor: X

## Violations by Page

### /login

#### Critical Issues (Level A)
1. **Issue**: Form inputs missing labels
   - **WCAG**: 1.3.1 Info and Relationships, 3.3.2 Labels or Instructions
   - **Impact**: Screen reader users cannot identify form fields
   - **Location**: Email and password inputs
   - **Fix**: Add proper <label> elements or aria-label

2. **Issue**: Missing focus indicators
   - **WCAG**: 2.4.7 Focus Visible
   - **Impact**: Keyboard users cannot see which element has focus
   - **Location**: All interactive elements
   - **Fix**: Add visible focus styles via CSS

#### Serious Issues (Level AA)
1. **Issue**: Insufficient color contrast
   - **WCAG**: 1.4.3 Contrast (Minimum)
   - **Impact**: Low vision users cannot read text
   - **Location**: "Forgot password" link
   - **Contrast Ratio**: 2.8:1 (needs 4.5:1)
   - **Fix**: Increase contrast or use darker color

[Continue for each page...]
```

### Phase 2: Manual Keyboard Testing (2-3 hours)

Test keyboard navigation on every page:

#### Keyboard Navigation Checklist

For each page, verify:

- [ ] **Tab order is logical**: Elements receive focus in reading order
- [ ] **All interactive elements are reachable**: No keyboard traps
- [ ] **Focus is visible**: Clear visual indicator on focused elements
- [ ] **Skip links work**: "Skip to main content" link present and functional
- [ ] **Modals trap focus**: Focus stays within modal when open
- [ ] **Modal closes with Esc**: Escape key closes dialogs
- [ ] **Focus returns after modal**: Focus returns to trigger element after closing
- [ ] **Dropdowns work with keyboard**: Arrow keys, Enter, Esc all work
- [ ] **Tables are navigable**: Can tab through table cells
- [ ] **Forms are submittable**: Enter key submits forms
- [ ] **No keyboard traps**: User can navigate away from all elements

#### Common Keyboard Issues & Fixes

**Issue 1: Divs/Spans used as buttons**
```tsx
// ❌ Bad: Not keyboard accessible
<div onClick={handleClick}>Click me</div>

// ✅ Good: Use semantic button
<button onClick={handleClick}>Click me</button>

// ✅ Alternative: Add keyboard support
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
  Click me
</div>
```

**Issue 2: Missing focus styles**
```css
/* ❌ Bad: Removing focus outline */
button:focus {
  outline: none;
}

/* ✅ Good: Visible focus indicator */
button:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

/* ✅ Better: Custom focus ring */
button:focus-visible {
  @apply ring-2 ring-primary ring-offset-2;
}
```

**Issue 3: Modal focus trap not implemented**
```tsx
// ✅ Good: Use shadcn Dialog (already has focus trap)
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
    </DialogHeader>
    {/* Content automatically traps focus */}
  </DialogContent>
</Dialog>
```

### Phase 3: Screen Reader Testing (2-3 hours)

Test with screen readers on key workflows:

#### Screen Reader Testing Checklist

**VoiceOver (macOS) Commands:**
- `Cmd + F5`: Toggle VoiceOver
- `VO + A`: Read all
- `VO + Right Arrow`: Next element
- `VO + Left Arrow`: Previous element
- `VO + Space`: Activate element

**NVDA (Windows) Commands:**
- `Ctrl + Alt + N`: Start NVDA
- `Insert + Down Arrow`: Read all
- `Tab`: Next element
- `Enter/Space`: Activate

**Test Scenarios:**

1. **Login Flow**
   - [ ] Form fields are announced with labels
   - [ ] Error messages are announced
   - [ ] Success messages are announced
   - [ ] Button states are clear ("Sign In" button)

2. **Dashboard Navigation**
   - [ ] Page title is announced
   - [ ] Main navigation is announced
   - [ ] Cards/sections are properly labeled
   - [ ] Charts have text alternatives

3. **Form Submission**
   - [ ] Required fields are announced
   - [ ] Validation errors are announced
   - [ ] Success confirmation is announced

4. **Data Tables**
   - [ ] Table headers are properly associated
   - [ ] Row/column count is announced
   - [ ] Cell content is readable

#### Common Screen Reader Issues & Fixes

**Issue 1: Missing form labels**
```tsx
// ❌ Bad: Placeholder is not a label
<input type="email" placeholder="Email address" />

// ✅ Good: Explicit label
<label htmlFor="email">Email address</label>
<input type="email" id="email" name="email" />

// ✅ Alternative: Visual label with aria-label for screen readers
<Input
  type="email"
  placeholder="Email address"
  aria-label="Email address"
/>
```

**Issue 2: Icon buttons without text**
```tsx
// ❌ Bad: No text alternative
<button>
  <TrashIcon />
</button>

// ✅ Good: aria-label
<button aria-label="Delete company">
  <TrashIcon />
</button>

// ✅ Better: Visually hidden text
<button>
  <TrashIcon />
  <span className="sr-only">Delete company</span>
</button>
```

**Issue 3: Dynamic content not announced**
```tsx
// ❌ Bad: Toast appears but screen reader doesn't announce
<Toast>Success!</Toast>

// ✅ Good: Use aria-live region
<div role="status" aria-live="polite" aria-atomic="true">
  <Toast>Success!</Toast>
</div>

// ✅ Better: Use shadcn Toast (has aria-live built-in)
import { useToast } from "@/components/ui/use-toast"

const { toast } = useToast()
toast({
  title: "Success",
  description: "Company created successfully.",
})
```

**Issue 4: Charts without text alternatives**
```tsx
// ❌ Bad: Chart with no alternative
<BarChart data={data}>
  <Bar dataKey="value" />
</BarChart>

// ✅ Good: Add descriptive text and table alternative
<div>
  <div id="chart-desc" className="sr-only">
    Bar chart showing test completion rates. Q1: 75%, Q2: 82%, Q3: 90%, Q4: 88%
  </div>
  <BarChart data={data} aria-describedby="chart-desc">
    <Bar dataKey="value" />
  </BarChart>

  {/* Provide data table as alternative */}
  <details className="mt-4">
    <summary>View data as table</summary>
    <table>
      <thead>
        <tr>
          <th>Quarter</th>
          <th>Completion Rate</th>
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={item.quarter}>
            <td>{item.quarter}</td>
            <td>{item.value}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  </details>
</div>
```

### Phase 4: Color Contrast Verification (1-2 hours)

Check color contrast ratios for all text:

#### WCAG Contrast Requirements

- **Normal text**: 4.5:1 minimum
- **Large text** (18pt+ or 14pt+ bold): 3:1 minimum
- **UI components** (buttons, inputs, icons): 3:1 minimum
- **Graphical objects** (chart elements): 3:1 minimum

#### How to Check Contrast

1. Use Chrome DevTools:
   - Inspect element
   - Look for "Contrast ratio" in Styles panel
   - Green checkmark = passes, red X = fails

2. Use WebAIM Contrast Checker:
   - https://webaim.org/resources/contrastchecker/
   - Enter foreground and background colors
   - Check AA and AAA levels

#### Common Contrast Issues & Fixes

**Issue 1: Light gray text on white background**
```css
/* ❌ Bad: Contrast ratio 2.5:1 */
.text-muted {
  color: #999999; /* Too light */
}

/* ✅ Good: Contrast ratio 4.6:1 */
.text-muted {
  color: #6b7280; /* Tailwind gray-500 */
}
```

**Issue 2: Colored links without sufficient contrast**
```css
/* ❌ Bad: Blue link on light background, ratio 3.2:1 */
a {
  color: #4da6ff;
}

/* ✅ Good: Darker blue, ratio 4.5:1 */
a {
  color: #0066cc;
}
```

**Issue 3: Disabled button text too light**
```css
/* ❌ Bad: Very light gray on gray background */
button:disabled {
  color: #ccc;
  background-color: #f0f0f0;
}

/* ✅ Good: Sufficient contrast even when disabled */
button:disabled {
  color: #6b7280;
  background-color: #f3f4f6;
  opacity: 0.6; /* Use opacity instead of very light colors */
}
```

### Phase 5: Semantic HTML Review (1-2 hours)

Ensure proper HTML structure and landmarks:

#### HTML Landmarks Checklist

Every page should have:

- [ ] `<header>` or `role="banner"` for site header
- [ ] `<nav>` or `role="navigation"` for navigation
- [ ] `<main>` or `role="main"` for main content (only one per page)
- [ ] `<aside>` or `role="complementary"` for sidebars
- [ ] `<footer>` or `role="contentinfo"` for site footer
- [ ] `<section>` with `aria-label` for major content sections
- [ ] Proper heading hierarchy (h1 → h2 → h3, no skipping levels)

#### Common Semantic Issues & Fixes

**Issue 1: Missing main landmark**
```tsx
// ❌ Bad: Generic div wrapper
<div className="container">
  <h1>Dashboard</h1>
  {/* content */}
</div>

// ✅ Good: Proper main landmark
<main className="container">
  <h1>Dashboard</h1>
  {/* content */}
</main>
```

**Issue 2: Skipped heading levels**
```tsx
// ❌ Bad: Skips from h1 to h3
<h1>Dashboard</h1>
<h3>Recent Activity</h3> {/* Should be h2 */}

// ✅ Good: Proper hierarchy
<h1>Dashboard</h1>
<h2>Recent Activity</h2>
```

**Issue 3: Missing navigation landmarks**
```tsx
// ❌ Bad: Generic div for navigation
<div className="sidebar">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</div>

// ✅ Good: Proper nav landmark
<nav aria-label="Main navigation" className="sidebar">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>
```

**Issue 4: Improper use of tables for layout**
```tsx
// ❌ Bad: Using table for layout
<table>
  <tr>
    <td>Sidebar</td>
    <td>Main content</td>
  </tr>
</table>

// ✅ Good: Use CSS Grid/Flexbox for layout
<div className="grid grid-cols-[240px_1fr]">
  <aside>Sidebar</aside>
  <main>Main content</main>
</div>
```

## Component-Specific Fixes

### Dashboard Components

#### Cards/Metrics
```tsx
// Add proper labeling to metric cards
<Card>
  <CardHeader>
    <CardTitle id="total-controls">Total Controls</CardTitle>
  </CardHeader>
  <CardContent>
    <div
      className="text-2xl font-bold"
      aria-labelledby="total-controls"
      role="status"
    >
      124
    </div>
  </CardContent>
</Card>
```

#### Charts (Recharts)
```tsx
// Add descriptive text and alternative table
<div>
  <h3 id="completion-chart">Test Completion Trends</h3>
  <p id="completion-desc" className="sr-only">
    Line chart showing monthly test completion rates from January to December.
    Average completion rate is 85%.
  </p>

  <ResponsiveContainer width="100%" height={300}>
    <LineChart
      data={data}
      aria-labelledby="completion-chart"
      aria-describedby="completion-desc"
    >
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Line
        type="monotone"
        dataKey="completionRate"
        stroke="hsl(var(--primary))"
        aria-label="Completion rate line"
      />
    </LineChart>
  </ResponsiveContainer>

  {/* Provide data table alternative */}
  <details className="mt-4">
    <summary>View chart data as table</summary>
    <table className="w-full">
      <caption className="sr-only">Monthly test completion rates</caption>
      <thead>
        <tr>
          <th scope="col">Month</th>
          <th scope="col">Completion Rate (%)</th>
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={item.month}>
            <td>{item.month}</td>
            <td>{item.completionRate}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  </details>
</div>
```

### Form Components

#### Text Inputs
```tsx
// ✅ Properly labeled input with error handling
<div>
  <Label htmlFor="company-name">
    Company Name <span aria-label="required">*</span>
  </Label>
  <Input
    id="company-name"
    name="name"
    type="text"
    required
    aria-required="true"
    aria-invalid={errors.name ? "true" : "false"}
    aria-describedby={errors.name ? "name-error" : undefined}
  />
  {errors.name && (
    <p id="name-error" className="text-sm text-destructive" role="alert">
      {errors.name.message}
    </p>
  )}
</div>
```

#### Select/Dropdown
```tsx
// ✅ Properly labeled select with placeholder
<div>
  <Label htmlFor="control-type">Control Type</Label>
  <Select
    value={controlType}
    onValueChange={setControlType}
  >
    <SelectTrigger id="control-type" aria-label="Select control type">
      <SelectValue placeholder="Select type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="preventive">Preventive</SelectItem>
      <SelectItem value="detective">Detective</SelectItem>
      <SelectItem value="corrective">Corrective</SelectItem>
    </SelectContent>
  </Select>
</div>
```

#### Checkbox/Radio Groups
```tsx
// ✅ Properly grouped and labeled checkboxes
<fieldset>
  <legend className="text-sm font-medium">
    SOX Assertions <span className="sr-only">(Select all that apply)</span>
  </legend>
  <div className="space-y-2">
    <div className="flex items-center space-x-2">
      <Checkbox
        id="assertion-existence"
        value="existence_occurrence"
        aria-labelledby="assertion-existence-label"
      />
      <label
        id="assertion-existence-label"
        htmlFor="assertion-existence"
        className="text-sm cursor-pointer"
      >
        Existence/Occurrence
      </label>
    </div>
    {/* More checkboxes... */}
  </div>
</fieldset>
```

### Data Table Components

#### Accessible Data Tables
```tsx
// ✅ Properly structured accessible table
<Table>
  <caption className="sr-only">List of controls with status and ownership</caption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Control ID</TableHead>
      <TableHead scope="col">Name</TableHead>
      <TableHead scope="col">Type</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col">Owner</TableHead>
      <TableHead scope="col">
        <span className="sr-only">Actions</span>
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {controls.map((control) => (
      <TableRow key={control.id}>
        <TableCell>{control.control_id}</TableCell>
        <TableCell>{control.name}</TableCell>
        <TableCell>{control.control_type}</TableCell>
        <TableCell>
          <Badge variant={control.status === 'Active' ? 'default' : 'secondary'}>
            {control.status}
          </Badge>
        </TableCell>
        <TableCell>{control.owner_email}</TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Edit ${control.name}`}
          >
            <PencilIcon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Edit</span>
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### Sortable Tables
```tsx
// ✅ Accessible sort buttons
<TableHead scope="col">
  <button
    className="flex items-center gap-1"
    onClick={() => handleSort('name')}
    aria-label={`Sort by name ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
  >
    Name
    <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
  </button>
</TableHead>
```

### Modal/Dialog Components

#### Accessible Modals
```tsx
// ✅ shadcn Dialog already implements accessibility
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete Company</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete this company? This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Focus Management
```tsx
// ✅ Return focus to trigger after close
const [isOpen, setIsOpen] = useState(false)
const triggerRef = useRef<HTMLButtonElement>(null)

const handleClose = () => {
  setIsOpen(false)
  // Focus returns automatically with shadcn Dialog
  // Manual focus management only needed for custom modals:
  // setTimeout(() => triggerRef.current?.focus(), 0)
}

<Button ref={triggerRef} onClick={() => setIsOpen(true)}>
  Open Modal
</Button>
```

### Navigation Components

#### Skip Links
```tsx
// ✅ Add skip link for keyboard users (add to layout/root)
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
>
  Skip to main content
</a>

<main id="main-content">
  {/* Main content */}
</main>
```

#### Breadcrumbs
```tsx
// ✅ Accessible breadcrumb navigation
<nav aria-label="Breadcrumb">
  <ol className="flex items-center space-x-2">
    <li>
      <a href="/companies">Companies</a>
    </li>
    <li aria-hidden="true">/</li>
    <li>
      <a href="/companies/acme">Acme Corp</a>
    </li>
    <li aria-hidden="true">/</li>
    <li aria-current="page">
      <span>Processes</span>
    </li>
  </ol>
</nav>
```

## Dark Mode Accessibility

### Contrast in Dark Mode

Verify all text meets contrast requirements in dark mode:

```tsx
// ✅ Test both light and dark mode
// In Tailwind, use dark: variants
<div className="bg-white dark:bg-slate-900">
  <h1 className="text-gray-900 dark:text-gray-100">
    Dashboard
  </h1>
  <p className="text-gray-600 dark:text-gray-300">
    Overview of your SOX compliance status
  </p>
</div>
```

### Chart Colors in Dark Mode

```tsx
// ✅ Use CSS variables that adapt to theme
const chartColors = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  danger: 'hsl(var(--destructive))',
}

<BarChart data={data}>
  <Bar dataKey="value" fill={chartColors.primary} />
</BarChart>
```

## Automated Testing Setup

### 1. Add @axe-core/react for Development

**File:** `frontend/src/main.tsx`

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Add axe in development
if (process.env.NODE_ENV !== 'production') {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

### 2. Add Playwright Accessibility Tests

**File:** `frontend/e2e/tests/accessibility/wcag-compliance.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('WCAG 2.1 AA Compliance', () => {
  test('login page should not have accessibility violations', async ({ page }) => {
    await page.goto('/login')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('dashboard should not have accessibility violations', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@assurkit.local')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/dashboard/)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('RCM page should not have accessibility violations', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@assurkit.local')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/dashboard/)

    await page.goto('/rcm')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
```

**Install dependency:**
```bash
npm install -D @axe-core/playwright
```

### 3. Add Lighthouse CI

**File:** `.github/workflows/lighthouse-ci.yml`

```yaml
name: Lighthouse CI

on:
  pull_request:
    branches:
      - main
      - development
  push:
    branches:
      - main
      - development

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Build frontend
        working-directory: frontend
        run: npm run build

      - name: Run Lighthouse CI
        working-directory: frontend
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

**File:** `frontend/lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist",
      "url": [
        "http://localhost/index.html",
        "http://localhost/login/index.html",
        "http://localhost/dashboard/index.html"
      ]
    },
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

## Common shadcn/ui Accessibility Notes

Most shadcn/ui components are already accessible, but verify:

### Dialog
- ✅ Has focus trap
- ✅ Has ESC to close
- ✅ Returns focus to trigger
- ⚠️ **Verify**: DialogTitle and DialogDescription are present

### Dropdown Menu
- ✅ Keyboard navigation works
- ✅ Arrow keys work
- ⚠️ **Verify**: Menu items have clear labels

### Toast
- ✅ Has aria-live region
- ⚠️ **Verify**: Toast messages are descriptive

### Tabs
- ✅ Keyboard navigation works
- ⚠️ **Verify**: Tab labels are clear

### Form Components
- ⚠️ **Add**: Explicit labels for all inputs
- ⚠️ **Add**: Error messages with aria-describedby
- ⚠️ **Add**: Required field indicators

## Testing Checklist

### Automated Testing
- [ ] Run axe DevTools on all pages
- [ ] Run Lighthouse on all pages (target score: 90+)
- [ ] Run WAVE on all pages
- [ ] Add @axe-core/react to development build
- [ ] Add Playwright accessibility tests
- [ ] Set up Lighthouse CI

### Manual Testing
- [ ] Test keyboard navigation on all pages
- [ ] Test with VoiceOver/NVDA on critical workflows
- [ ] Verify focus indicators are visible
- [ ] Check tab order is logical
- [ ] Verify skip links work
- [ ] Test modal focus trap and ESC key
- [ ] Verify all forms are keyboard submittable

### Content Testing
- [ ] Check all images have alt text
- [ ] Verify charts have text alternatives
- [ ] Check all icon buttons have labels
- [ ] Verify dynamic content is announced
- [ ] Check error messages are associated with fields
- [ ] Verify loading states are announced

### Color & Contrast
- [ ] Check all text meets 4.5:1 contrast (normal text)
- [ ] Check large text meets 3:1 contrast
- [ ] Check UI components meet 3:1 contrast
- [ ] Verify dark mode contrast ratios
- [ ] Check that information is not conveyed by color alone

### Structure & Semantics
- [ ] Verify proper heading hierarchy (h1→h2→h3)
- [ ] Check landmarks are present (header, nav, main, footer)
- [ ] Verify tables use proper markup (th, scope)
- [ ] Check forms use fieldset/legend for groups
- [ ] Verify lists use proper markup (ul/ol/li)

## Deliverables

When complete, you should have:

1. **Audit Report** (`frontend/accessibility-audit-report.md`)
   - List of all violations found
   - Severity ratings
   - Before/after screenshots
   - Fix descriptions

2. **Fixed Components**
   - All WCAG 2.1 Level A and AA violations fixed
   - Proper ARIA labels and roles
   - Keyboard navigation working
   - Screen reader friendly

3. **Automated Tests**
   - Playwright accessibility tests
   - axe-core integration in dev mode
   - Lighthouse CI workflow

4. **Documentation** (`frontend/ACCESSIBILITY.md`)
   - Accessibility features overview
   - Testing procedures
   - Common patterns and examples
   - Known issues (if any)

## Acceptance Criteria

Your work is complete when:

- [ ] All WCAG 2.1 Level A violations are fixed
- [ ] All WCAG 2.1 Level AA violations are fixed
- [ ] Lighthouse accessibility score is 90+ on all pages
- [ ] All pages are keyboard navigable
- [ ] Screen reader testing passes on critical workflows
- [ ] All form fields have proper labels
- [ ] All interactive elements have visible focus indicators
- [ ] Color contrast meets WCAG AA standards (4.5:1 for normal text)
- [ ] Dark mode maintains accessibility standards
- [ ] Charts have text alternatives
- [ ] Automated accessibility tests are in CI
- [ ] Documentation is complete

## Priority Fixes

### Critical (Must Fix)
1. Missing form labels
2. Missing alt text on images
3. Insufficient color contrast (< 3:1)
4. Keyboard traps
5. Missing focus indicators

### High (Should Fix)
1. Improper heading hierarchy
2. Missing ARIA labels on icon buttons
3. Tables without proper headers
4. Forms without error associations
5. Modals without focus management

### Medium (Nice to Fix)
1. Missing skip links
2. Redundant links/buttons
3. Missing landmarks
4. Charts without text alternatives
5. Dynamic content without announcements

## Resources

### Official Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### React/shadcn Resources
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [React ARIA](https://react-spectrum.adobe.com/react-aria/)
- [Inclusive Components](https://inclusive-components.design/)

## Questions or Issues?

If you encounter any issues:
1. Check WCAG 2.1 Quick Reference for guidance
2. Test with multiple screen readers if behavior is unclear
3. Use axe DevTools to identify specific violations
4. Review shadcn/ui documentation for component patterns
5. Check Radix UI docs (shadcn is built on Radix)

---

**Estimated Effort:** 12-16 hours for full audit and fixes

**Deliverables:**
- Comprehensive audit report
- All WCAG 2.1 AA violations fixed
- Automated accessibility tests
- Documentation

This accessibility work will make AssurKit usable by everyone and enterprise-ready!
