import { test, expect } from '@playwright/test'
import { createAndLoginUser, getAvailableProperties, TestUser } from './helpers/api'
import { loginInvestisseur } from './helpers/ui'

/**
 * Verifie le flow KYC complet :
 *  - Un user fresh non-verifie voit le bandeau orange "Verifiez votre identite"
 *  - La garde backend bloque toute tentative d'achat (POST /api/paiements/init -> 400)
 *  - La page /compte/kyc est accessible et affiche le wizard
 */
test.describe('KYC investisseur - Garde et bandeau', () => {
  let user: TestUser

  test.beforeAll(async () => {
    user = await createAndLoginUser('e2e-kyc')
    // PAS de verification : on veut tester le blocage
  })

  test('User non-verifie voit le bandeau KYC sur le dashboard', async ({ page }) => {
    await loginInvestisseur(page, user)
    await page.goto('/dashboard')
    // Le bandeau orange "Verifiez votre identite" doit etre present
    await expect(page.getByText(/v[eé]rifiez votre identit[eé]/i).first()).toBeVisible({ timeout: 10_000 })
    // Avec un CTA vers /compte/kyc
    await expect(page.getByRole('link', { name: /commencer la v[eé]rification|v[eé]rifier/i }).first()).toBeVisible()
  })

  test('User non-verifie : la garde backend bloque /api/paiements/init', async ({ request }) => {
    const props = await getAvailableProperties(user.token!)
    expect(props.length).toBeGreaterThan(0)
    const prop = props[0]

    const res = await request.post('https://api.fursa.seed-innov.com/api/paiements/init', {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { proprieteId: prop.id, nombreParts: 1 },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.message).toMatch(/v[eé]rification d.identit[eé]/i)
  })

  test('Page /compte/kyc accessible avec wizard etape 1', async ({ page }) => {
    await loginInvestisseur(page, user)
    await page.goto('/compte/kyc')
    await expect(page.getByRole('heading', { name: /v[eé]rification d.identit[eé]/i })).toBeVisible({ timeout: 10_000 })
    // Etape 1 : champ nationalite visible
    await expect(page.locator('#nationalite')).toBeVisible()
  })
})

/**
 * Verifie cote admin : page /admin/kyc accessible avec compteurs stats.
 */
test.describe('KYC admin', () => {
  test.use({
    storageState: 'e2e/.admin-storage.json',
    baseURL: process.env.FURSA_ADMIN_URL ?? 'https://admin.fursa.seed-innov.com',
  })

  test('Admin acces /admin/kyc avec stats', async ({ page }) => {
    await page.goto('/admin/kyc')
    await expect(page.getByRole('heading', { name: /v[eé]rification d.identit[eé]/i })).toBeVisible({ timeout: 10_000 })
    // Au moins le tab "En attente" doit etre visible
    await expect(page.getByText(/en attente/i).first()).toBeVisible()
  })
})
