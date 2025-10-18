import { defineConfig, devices } from '@playwright/test'
import path from 'path'

const PORT = process.env.PORT ?? '3000'
const API_HEALTHCHECK = process.env.PLAYWRIGHT_API_HEALTHCHECK ?? 'http://localhost:8080/health'

async function waitForApi(url: string, timeout = 30_000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // ignore errors during retries
    }
    await new Promise(resolve => setTimeout(resolve, 1_000))
  }
  throw new Error(`API server did not start within ${timeout}ms`)
}

export default defineConfig({
  testDir: path.join(__dirname, 'e2e/tests'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  webServer: {
    command: 'npm run dev -- --host',
    port: Number(PORT),
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  globalSetup: path.join(__dirname, 'e2e/global-setup.ts'),
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
})

export async function ensureApiAvailable() {
  if (process.env.SKIP_API_WAIT === '1') return
  await waitForApi(API_HEALTHCHECK)
}
