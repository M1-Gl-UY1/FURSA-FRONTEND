/**
 * Global setup Playwright : un seul login admin pour toute la suite.
 * Sauvegarde le storageState dans e2e/.admin-storage.json qui sera consomme
 * par les tests admin via `test.use({ storageState: ... })`.
 *
 * Permet d'eviter le rate limit login (5/min/email+IP) quand 8 tests admin
 * tentent de se logger en moins d'une minute.
 */
import { chromium } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_URL } from './helpers/api'
import { loginViaUI } from './helpers/ui'

/**
 * Le login admin se fait obligatoirement sur le sous-domaine admin
 * (le hostname principal redirige toute route /admin/* vers admin.fursa.seed-innov.com).
 */
async function globalSetup() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ baseURL: ADMIN_URL })
  const page = await context.newPage()
  await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASSWORD)
  await context.storageState({ path: 'e2e/.admin-storage.json' })
  await browser.close()
}

export default globalSetup
