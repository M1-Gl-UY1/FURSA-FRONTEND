import { test, expect } from '@playwright/test'
import { generateTestUser } from './helpers/api'

test.describe('Authentification', () => {
  test('Register puis login puis acces dashboard investisseur', async ({ page }) => {
    const user = generateTestUser('e2e-auth')

    // === Register ===
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /bienvenue sur fursa/i })).toBeVisible({ timeout: 10_000 })

    // Utilise les ids exacts pour eviter les conflits (ex: "Nom" matche aussi "Prenom")
    await page.locator('#nom').fill(user.nom)
    await page.locator('#prenom').fill(user.prenom)
    await page.locator('#telephone').fill(user.telephone)
    await page.locator('#email').fill(user.email)
    await page.locator('#password').fill(user.password)
    await page.locator('#confirmPassword').fill(user.password)

    const cgvCheckbox = page.getByRole('checkbox')
    if (await cgvCheckbox.count()) await cgvCheckbox.first().check()

    await page.getByRole('button', { name: /s'inscrire|cr[eé]er|register|continuer/i }).click()

    // Apres register : redirect vers /login?registered=true OU /dashboard
    await page.waitForURL(/\/(login|dashboard|opportunites)/, { timeout: 15_000 })

    if (/\/login/.test(page.url())) {
      await page.locator('#email').fill(user.email)
      await page.locator('#password').fill(user.password)
      await page.getByRole('button', { name: /se connecter/i }).click()
      await page.waitForURL(/\/(dashboard|opportunites)/, { timeout: 15_000 })
    }

    await expect(page.getByRole('link', { name: /dashboard/i }).first()).toBeVisible()
  })

  test('Login admin -> page /admin/dashboard', async ({ page }) => {
    const adminEmail = process.env.FURSA_ADMIN_EMAIL ?? 'tiomelajorel@gmail.com'
    const adminPassword = process.env.FURSA_ADMIN_PASSWORD ?? 'jorel2026'

    await page.goto('/login')
    await page.locator('#email').fill(adminEmail)
    await page.locator('#password').fill(adminPassword)
    await page.getByRole('button', { name: /se connecter/i }).click()
    // L'admin sur hostname normal est redirige vers /dashboard par defaut.
    // On navigue explicitement vers /admin/dashboard pour valider l'acces admin.
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
    await page.goto('/admin/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
  })
})
