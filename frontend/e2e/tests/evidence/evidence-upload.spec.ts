import { test, expect } from '@playwright/test'
import { loginAs } from '../../helpers/auth-helpers'

const FILE_PATH = 'e2e/fixtures/test-files/sample-evidence.pdf'

test('tester can open evidence upload dialog', async ({ page }) => {
  await loginAs(page, 'tester')
  await page.click('a:has-text("Evidence")')
  await expect(page.locator('h1:has-text("Evidence")')).toBeVisible()
  await page.click('button:has-text("Upload Evidence")')
  const dialog = page.locator('[role="dialog"]')
  await expect(dialog).toBeVisible()
  const fileInput = dialog.locator('input[type="file"]')
  await fileInput.setInputFiles(FILE_PATH)
  await dialog.locator('button:has-text("Upload")').click()
  await expect(dialog).toHaveCount(0)
})
