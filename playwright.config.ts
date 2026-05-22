import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E config for FURSA Community.
 *
 * Cible : prod (api.fursa.seed-innov.com + fursa.seed-innov.com).
 *
 * Variables d'env utiles :
 *   FURSA_BASE_URL          override l'URL du front investisseur (defaut : https://fursa.seed-innov.com)
 *   FURSA_ADMIN_URL         override l'URL du backoffice admin (defaut : https://admin.fursa.seed-innov.com)
 *   FURSA_API_URL           override l'URL de l'API (defaut : https://api.fursa.seed-innov.com)
 *   FURSA_ADMIN_EMAIL       defaut : tiomelajorel@gmail.com
 *   FURSA_ADMIN_PASSWORD    defaut : jorel2026
 *
 * Run :
 *   npx playwright test                    # tous les tests, headless
 *   npx playwright test --headed           # voir le navigateur (utile pour la demo)
 *   npx playwright test --ui               # mode UI interactif
 *   npx playwright test e2e/auth.spec.ts   # un seul fichier
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,                  // serialiser pour eviter les race conditions sur la prod
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,                            // un seul worker pour ne pas saturer la prod
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL: process.env.FURSA_BASE_URL ?? 'https://fursa.seed-innov.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
