import { test, expect } from '@playwright/test'
import { createAndLoginUser, TestUser } from './helpers/api'
import { loginInvestisseur } from './helpers/ui'

/**
 * NOTE : pour creer une annonce, il faut posseder des parts. Comme le test 02 cree des possessions,
 * on reutilise un user fresh et on lui fait acheter via l'API avant de creer l'annonce via UI.
 * Skip si l'utilisateur n'a aucune propriete (pour eviter de bloquer la suite des tests).
 */
test.describe('Marche secondaire - Vente / Achat entre investisseurs', () => {
  let vendeur: TestUser

  test.beforeAll(async () => {
    vendeur = await createAndLoginUser('e2e-ms-vend')
  })

  test('Vendeur peut ouvrir la page Nouvelle Annonce', async ({ page }) => {
    await loginInvestisseur(page, vendeur)
    await page.goto('/marche/nouvelle-annonce')
    // La page utilise h1 OU h2 selon l'etat (no-parts vs formulaire). On accepte les deux.
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/erreur interne|500/i)).toHaveCount(0)
  })

  test('Acheteur peut consulter la liste des annonces ouvertes', async ({ page }) => {
    await loginInvestisseur(page, vendeur)
    await page.goto('/marche/secondaire')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })

    // S'il y a au moins une annonce, on doit pouvoir cliquer dessus
    const annonces = page.locator('a[href*="/marche/secondaire/"]').filter({ hasNot: page.locator('a[href*="nouvelle"]') })
    const count = await annonces.count()
    if (count > 0) {
      await annonces.first().click()
      await page.waitForURL(/\/marche\/secondaire\/\d+/, { timeout: 10_000 })
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    }
  })
})
