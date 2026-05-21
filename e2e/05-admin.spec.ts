import { test, expect } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './helpers/api'
import { loginViaUI } from './helpers/ui'

test.describe('Admin - Navigation et pages principales', () => {
  test('Login admin -> Dashboard admin', async ({ page }) => {
    await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    // Sur hostname normal, l'admin atterrit sur /dashboard. Aller manuellement vers /admin.
    await page.goto('/admin/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
  })

  test('Admin /admin/proprietes - liste des biens', async ({ page }) => {
    await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.goto('/admin/proprietes')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/erreur interne|500/i)).toHaveCount(0)
  })

  test('Admin /admin/utilisateurs - liste users', async ({ page }) => {
    await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.goto('/admin/utilisateurs')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/erreur interne|500/i)).toHaveCount(0)
  })

  test('Admin /admin/transactions - audit transactions et paiements', async ({ page }) => {
    await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.goto('/admin/transactions')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/erreur interne|500/i)).toHaveCount(0)
  })

  test('Admin /admin/paiements - sessions PSP (page neuve)', async ({ page }) => {
    await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.goto('/admin/paiements')
    await expect(page.getByRole('heading', { name: /sessions de paiement/i })).toBeVisible({ timeout: 10_000 })
    // Onglets visibles
    await expect(page.getByRole('tab', { name: /confirm/i })).toBeVisible()
    // Bascule sur CONFIRMED -> doit afficher des sessions (on en a >=7)
    await page.getByRole('tab', { name: /confirm/i }).click()
    await expect(page.locator('main, [role="main"]').first()).toContainText(/#\d+/, { timeout: 10_000 })
  })

  test('Admin /admin/devise-rate - taux de change (page neuve)', async ({ page }) => {
    await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.goto('/admin/devise-rate')
    await expect(page.getByRole('heading', { name: /taux de change/i })).toBeVisible({ timeout: 10_000 })
    // Au moins une devise affichee
    await expect(page.locator('main, [role="main"]').first()).toContainText(/EUR|USD|XAF/, { timeout: 10_000 })
  })

  test('Admin /admin/dividendes - vue globale dividendes', async ({ page }) => {
    await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.goto('/admin/dividendes')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/erreur interne|500/i)).toHaveCount(0)
  })

  test('Admin /admin/revenus - liste revenus declares', async ({ page }) => {
    await loginViaUI(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await page.goto('/admin/revenus')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/erreur interne|500/i)).toHaveCount(0)
  })
})
