import type { Page } from '@playwright/test'

export async function goToDashboard(page: Page) {
  await page.goto('/dashboard')
}

export async function goToControls(page: Page) {
  await page.goto('/controls')
}
