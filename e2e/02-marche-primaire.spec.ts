import { test, expect } from '@playwright/test'
import { createAndLoginUser, getAvailableProperties, TestUser } from './helpers/api'
import { loginInvestisseur } from './helpers/ui'

test.describe('Marche primaire - Achat de parts (paiement async)', () => {
  let user: TestUser

  test.beforeAll(async () => {
    user = await createAndLoginUser('e2e-mp')
  })

  test('Achat de 2 parts : 4 etapes (Selection -> Confirmation -> Paiement -> Succes)', async ({ page }) => {
    test.setTimeout(120_000)

    // DEBUG : log les calls /paiements/init et leur reponse
    page.on('request', (req) => {
      if (req.url().includes('/paiements')) console.log('  >>>', req.method(), req.url())
    })
    page.on('response', async (res) => {
      if (res.url().includes('/paiements')) {
        console.log('  <<<', res.status(), res.url())
        try { console.log('      body:', (await res.text()).slice(0, 200)) } catch {}
      }
    })
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log('  [console.error]', msg.text())
    })

    await loginInvestisseur(page, user)

    // Trouver une propriete disponible via API (deterministe, pas de scraping UI)
    const props = await getAvailableProperties(user.token!)
    expect(props.length).toBeGreaterThan(0)
    // Eviter "Test" si possible, prendre une vraie propriete
    const prop = props.find((p) => !p.nom.toLowerCase().startsWith('test')) ?? props[0]

    // === Etape 1 : Selection ===
    await page.goto(`/opportunites/${prop.id}/acheter`)
    await expect(page.getByRole('heading', { name: /combien de parts/i })).toBeVisible({ timeout: 15_000 })

    // Cibler le spinbutton (input) pas le slider qui partage le meme aria-label
    const partsInput = page.getByRole('spinbutton', { name: /nombre de parts/i })
    await partsInput.fill('2')
    await page.getByRole('button', { name: /continuer/i }).click()

    // === Etape 2 : Confirmation ===
    await expect(page.getByRole('heading', { name: /confirmation/i })).toBeVisible({ timeout: 10_000 })
    // Cocher les CGV (Radix : utiliser click() plutot que check() pour bien trigger le state React)
    await page.getByRole('checkbox').first().click()
    // Attendre que le bouton ne soit plus disabled
    const payBtn = page.getByRole('button', { name: /payer maintenant/i })
    await expect(payBtn).toBeEnabled({ timeout: 5_000 })
    await payBtn.click()

    // === Etapes 3 (Paiement en cours) + 4 (Succes) ===
    // L'etape "Paiement en cours" peut etre tres breve (MockScheduler 5s + polling 10s),
    // on attend directement le passage final au succes.
    // Timeout 60s : mock confirm 5s + polling jusqu'a 10s + marge reseau.
    await expect(page.getByRole('heading', { name: /achat confirm/i })).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('button', { name: /voir mon portefeuille/i })).toBeVisible()
  })

  test('Apres achat, les parts apparaissent dans le portefeuille', async ({ page }) => {
    await loginInvestisseur(page, user)
    await page.goto('/portefeuille')
    // On doit voir AU MOINS une possession (celle achetee dans le test precedent)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
    // Heuristique : il existe au moins une carte/ligne contenant "part" ou un nombre
    const content = page.locator('main, [role="main"]').first()
    await expect(content).toContainText(/part/i, { timeout: 10_000 })
  })
})
