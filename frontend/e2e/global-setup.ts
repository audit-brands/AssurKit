import type { FullConfig } from '@playwright/test'
import { ensureApiAvailable } from '../playwright.config'

export default async function globalSetup(_config: FullConfig) {
  await ensureApiAvailable()
}
