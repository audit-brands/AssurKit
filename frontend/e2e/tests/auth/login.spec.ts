import { test, expect } from '@playwright/test'
import { loginAs } from '../../helpers/auth-helpers'

const dashboardHeading = 'h1:has-text("Dashboard")'

test.describe('Login', () => {
  test('admin can sign in with valid credentials', async ({ page }) => {
    await loginAs(page, 'admin')
    await expect(page.locator(dashboardHeading)).toBeVisible()
  })

  test('shows validation error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'nobody@example.com')
    await page.fill('input[name="password"]', 'wrong-password')
    await page.click('button[type="submit"]')
    await expect(page.locator('[role="alert"]')).toContainText(/invalid/i)
  })
})
