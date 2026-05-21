/**
 * Helpers UI pour les tests E2E.
 * Encapsule les actions communes (login UI, logout, attente d'une page admin chargee).
 */
import { Page, expect } from '@playwright/test'
import { TestUser } from './api'

export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: /se connecter/i }).click()
  await page.waitForURL((url) => /\/(dashboard|admin)/.test(url.pathname), { timeout: 15_000 })
}

export async function loginInvestisseur(page: Page, user: TestUser) {
  await loginViaUI(page, user.email, user.password)
}

export async function expectAuthenticatedHome(page: Page) {
  // Heuristique : le sidebar contient un lien vers Dashboard
  await expect(page.getByRole('link', { name: /dashboard/i }).first()).toBeVisible({ timeout: 10_000 })
}
