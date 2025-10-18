import { test, expect } from '@playwright/test'
import { loginAs } from '../../helpers/auth-helpers'

const randomSuffix = Date.now()

const dialogSelector = '[role="dialog"]'

test.describe('Companies CRUD smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'manager')
    await page.goto('/companies')
  })

  test('lists existing companies', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible()
  })

  test('opens and closes create company dialog', async ({ page }) => {
    await page.click('button:has-text("Add Company")')
    const dialog = page.locator(dialogSelector)
    await expect(dialog).toBeVisible()
    await dialog.locator('button:has-text("Cancel")').click()
    await expect(dialog).toHaveCount(0)
  })

  test('creates a company and sees it in list', async ({ page }) => {
    const name = `QA Corp ${randomSuffix}`
    await page.click('button:has-text("Add Company")')
    const dialog = page.locator(dialogSelector)
    await dialog.locator('input#company_name').fill(name)
    await dialog.locator('input#industry').fill('Technology')
    await dialog.locator('input#country').fill('USA')
    await dialog.locator('button[type="submit"]').click()
    await expect(dialog).toHaveCount(0)
    await expect(page.locator('table')).toContainText(name)
  })
})
