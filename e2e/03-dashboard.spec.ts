import { test, expect } from '@playwright/test'
import { createAndLoginUser, TestUser } from './helpers/api'
import { loginInvestisseur } from './helpers/ui'

test.describe('Dashboard investisseur', () => {
  let user: TestUser

  test.beforeAll(async () => {
    user = await createAndLoginUser('e2e-dash')
  })

  test('Dashboard se charge avec les KPI', async ({ page }) => {
    await loginInvestisseur(page, user)
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })

    // Verifier qu'il n'y a pas d'erreur visible (toast d'erreur, ou texte "erreur")
    await expect(page.getByText(/erreur interne|500|chargement impossible/i)).toHaveCount(0)
  })

  test('Page Opportunites liste les biens publies', async ({ page }) => {
    await loginInvestisseur(page, user)
    await page.goto('/opportunites')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    // Au moins une carte propriete
    await expect(page.locator('main, [role="main"]').first()).toContainText(/villa|propri|fumba|paje/i, {
      timeout: 10_000,
    })
  })

  test('Page Marche secondaire se charge (peut etre vide)', async ({ page }) => {
    await loginInvestisseur(page, user)
    await page.goto('/marche/secondaire')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    // Empty state OK, juste pas d'erreur
    await expect(page.getByText(/erreur interne|500/i)).toHaveCount(0)
  })

  test('Page Notifications se charge', async ({ page }) => {
    await loginInvestisseur(page, user)
    await page.goto('/notifications')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/erreur interne|500/i)).toHaveCount(0)
  })

  test('Page Dividendes se charge', async ({ page }) => {
    await loginInvestisseur(page, user)
    await page.goto('/dividendes')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/erreur interne|500/i)).toHaveCount(0)
  })
})
