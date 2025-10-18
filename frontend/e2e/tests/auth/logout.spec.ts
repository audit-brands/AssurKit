import { test, expect } from '@playwright/test'
import { loginAs, logout } from '../../helpers/auth-helpers'

test('user can log out from the application', async ({ page }) => {
  await loginAs(page, 'admin')
  await logout(page)
  await expect(page).toHaveURL(/login/i)
})
