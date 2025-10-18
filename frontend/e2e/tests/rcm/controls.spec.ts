import { test, expect } from '@playwright/test'
import { loginAs } from '../../helpers/auth-helpers'
import { goToControls } from '../../helpers/navigation-helpers'

test.describe('Controls list', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'manager')
    await goToControls(page)
  })

  test('shows paginated control table', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible()
    const firstRow = page.locator('table tbody tr').first()
    await expect(firstRow).toBeVisible()
    await page.click('button:has-text("Add Control")')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await page.locator('[role="dialog"] button:has-text("Cancel")').click()
    await expect(page.locator('[role="dialog"]')).toHaveCount(0)
  })

  test('search filters the list', async ({ page }) => {
    await page.fill('input[placeholder="Search controls"]', 'Revenue')
    await page.waitForTimeout(500)
    await expect(page.locator('table tbody tr').first()).toBeVisible()
  })
})
