import { test, expect } from '@playwright/test'
import { loginAs } from '../../helpers/auth-helpers'
import { goToDashboard } from '../../helpers/navigation-helpers'

const metricsSelector = 'section:has-text("Executive Dashboard")'

test('dashboard displays key metrics', async ({ page }) => {
  await loginAs(page, 'manager')
  await goToDashboard(page)
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
  await expect(page.locator(metricsSelector)).toBeVisible()
})
