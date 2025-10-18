import { test, expect } from '@playwright/test'
import { loginAs } from '../../helpers/auth-helpers'
import { goToControls } from '../../helpers/navigation-helpers'

// High level smoke workflow interacting with controls list (read-only if API rejects create)
test('manager can review controls for a risk', async ({ page }) => {
  await loginAs(page, 'manager')
  await goToControls(page)
  await expect(page.locator('table tbody tr').first()).toBeVisible()
  await page.fill('input[placeholder="Search controls"]', 'Revenue')
  await page.waitForTimeout(500)
  await expect(page.locator('table tbody tr').first()).toBeVisible()
})
