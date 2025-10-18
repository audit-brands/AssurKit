import { test, expect } from '@playwright/test'
import { loginAs } from '../../helpers/auth-helpers'

const ADMIN_ONLY_LINK = 'a:has-text("User Management")'

async function assertNavVisible(page, label: string) {
  await expect(page.locator(`nav >> text=${label}`)).toBeVisible()
}

test.describe('Role based access', () => {
  test('admin can access user management', async ({ page }) => {
    await loginAs(page, 'admin')
    await expect(page.locator(ADMIN_ONLY_LINK)).toBeVisible()
  })

  test('viewer cannot access user management', async ({ page }) => {
    await loginAs(page, 'viewer')
    await expect(page.locator(ADMIN_ONLY_LINK)).toHaveCount(0)
    await assertNavVisible(page, 'Dashboard')
  })
})
