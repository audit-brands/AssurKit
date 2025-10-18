import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { users, type UserRole } from '../fixtures/test-data'

export async function loginAs(page: Page, role: UserRole) {
  const credentials = users[role]
  await page.goto('/login')
  await page.fill('input[name="email"]', credentials.email)
  await page.fill('input[name="password"]', credentials.password)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/dashboard/i)
}

export async function logout(page: Page) {
  await page.locator('button:has-text("Logout")').click()
  await expect(page).toHaveURL(/login/i)
}
