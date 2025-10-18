import { expect, type Page } from '@playwright/test'

export async function expectToast(page: Page, message: string) {
  await expect(page.locator('[role="status"], [data-testid="toast"]')).toContainText(message)
}
