import { test, expect } from '@playwright/test'
import { ADMIN_URL } from './helpers/api'

/**
 * Le login admin est fait UNE SEULE FOIS dans e2e/global-setup.ts pour eviter le rate limit
 * (5 tentatives/min/email+IP). Tous les tests ci-dessous reutilisent ce storageState.
 *
 * baseURL est override sur admin.fursa.seed-innov.com : sur le hostname principal,
 * les routes /admin/* redirigent vers le sous-domaine admin (cf App.tsx).
 */
test.describe('Admin - Navigation et pages principales', () => {
  test.use({
    storageState: 'e2e/.admin-storage.json',
    baseURL: ADMIN_URL,
  })

  test('Acces /admin/dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
  })

  test('/admin/proprietes - liste des biens', async ({ page }) => {
    await page.goto('/admin/proprietes')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/erreur interne|500/i)).toHaveCount(0)
  })

  test('/admin/utilisateurs - liste users', async ({ page }) => {
    await page.goto('/admin/utilisateurs')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/erreur interne|500/i)).toHaveCount(0)
  })

  test('/admin/transactions - audit transactions et paiements', async ({ page }) => {
    await page.goto('/admin/transactions')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/erreur interne|500/i)).toHaveCount(0)
  })

  test('/admin/paiements - sessions PSP', async ({ page }) => {
    await page.goto('/admin/paiements')
    await expect(page.getByRole('heading', { name: /sessions de paiement/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('tab', { name: /confirm/i })).toBeVisible()
    await page.getByRole('tab', { name: /confirm/i }).click()
    await expect(page.locator('main, [role="main"]').first()).toContainText(/#\d+/, { timeout: 10_000 })
  })

  test('/admin/devise-rate - taux de change', async ({ page }) => {
    await page.goto('/admin/devise-rate')
    await expect(page.getByRole('heading', { name: /taux de change/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('main, [role="main"]').first()).toContainText(/EUR|USD|XAF/, { timeout: 10_000 })
  })

  test('/admin/dividendes - vue globale', async ({ page }) => {
    await page.goto('/admin/dividendes')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/erreur interne|500/i)).toHaveCount(0)
  })

  test('/admin/revenus - liste revenus declares', async ({ page }) => {
    await page.goto('/admin/revenus')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/erreur interne|500/i)).toHaveCount(0)
  })
})
