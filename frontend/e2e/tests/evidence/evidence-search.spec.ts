import { test, expect } from '@playwright/test'
import { loginAs } from '../../helpers/auth-helpers'

test('tester can filter evidence by search term', async ({ page }) => {
  await loginAs(page, 'tester')
  await page.click('a:has-text("Evidence")')
  await expect(page.locator('input[placeholder="Search evidence"]')).toBeVisible()
  await page.fill('input[placeholder="Search evidence"]', 'Revenue')
  await page.keyboard.press('Enter')
  await expect(page.locator('table tbody tr').first()).toBeVisible()
})
