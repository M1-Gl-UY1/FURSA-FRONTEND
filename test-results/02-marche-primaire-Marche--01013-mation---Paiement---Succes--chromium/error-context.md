# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-marche-primaire.spec.ts >> Marche primaire - Achat de parts (paiement async) >> Achat de 2 parts : 4 etapes (Selection -> Confirmation -> Paiement -> Succes)
- Location: e2e\02-marche-primaire.spec.ts:12:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /achat confirm/i })
Expected: visible
Timeout: 60000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 60000ms
  - waiting for getByRole('heading', { name: /achat confirm/i })

```

```yaml
- complementary:
  - complementary:
    - link "Fursa - Tableau de bord":
      - /url: /dashboard
      - img "Fursa"
    - navigation:
      - paragraph: Investir
      - list:
        - listitem:
          - link "Opportunités":
            - /url: /opportunites
        - listitem:
          - link "Marché secondaire":
            - /url: /marche/secondaire
      - paragraph: Mon activité
      - list:
        - listitem:
          - link "Dashboard":
            - /url: /dashboard
        - listitem:
          - link "Portefeuille":
            - /url: /portefeuille
        - listitem:
          - link "Transactions":
            - /url: /transactions
        - listitem:
          - link "Dividendes":
            - /url: /dividendes
      - paragraph: Compte
      - list:
        - listitem:
          - link "Notifications":
            - /url: /notifications
        - listitem:
          - link "Mon profil":
            - /url: /compte
      - paragraph: Propriétaire
      - list:
        - listitem:
          - link "Proposer un bien":
            - /url: /proposer-un-bien
    - text: E
    - paragraph: E2E Test
    - paragraph: e2e-mp-1779386368756-t0utb@fursa.test
    - button "Se déconnecter"
- banner:
  - navigation "Fil d'Ariane":
    - link "Opportunités":
      - /url: /opportunites
    - link "3":
      - /url: /opportunites/3
    - text: Acheter
  - button "Notifications"
- main:
  - link "Retour à la propriété":
    - /url: /opportunites/3
  - list "Progression":
    - listitem: Sélection
    - listitem: 2 Confirmation
    - listitem: 3 Paiement
    - listitem: 4 Succès
  - heading "Confirmation" [level=1]
  - paragraph: Vérifiez les détails avant de finaliser votre achat.
  - text: Propriété Stone Town Heritage House Localisation Stone Town, Zanzibar Nombre de parts 2 Prix unitaire 150 € Total à payer 300 € Revenus annuels estimés 36 €
  - paragraph: Paiement par USDC (stable-coin)
  - paragraph: Conversion automatique depuis votre devise locale. Mode démo actif.
  - checkbox "J'accepte les conditions générales d'investissement et je confirme avoir compris les risques." [checked]
  - text: J'accepte les
  - link "conditions générales d'investissement":
    - /url: "#"
  - text: et je confirme avoir compris les risques.
  - button "Retour"
  - button "Payer maintenant"
- region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | import { createAndLoginUser, getAvailableProperties, TestUser } from './helpers/api'
  3  | import { loginInvestisseur } from './helpers/ui'
  4  | 
  5  | test.describe('Marche primaire - Achat de parts (paiement async)', () => {
  6  |   let user: TestUser
  7  | 
  8  |   test.beforeAll(async () => {
  9  |     user = await createAndLoginUser('e2e-mp')
  10 |   })
  11 | 
  12 |   test('Achat de 2 parts : 4 etapes (Selection -> Confirmation -> Paiement -> Succes)', async ({ page }) => {
  13 |     test.setTimeout(120_000)
  14 | 
  15 |     // DEBUG : log les calls /paiements/init et leur reponse
  16 |     page.on('request', (req) => {
  17 |       if (req.url().includes('/paiements')) console.log('  >>>', req.method(), req.url())
  18 |     })
  19 |     page.on('response', async (res) => {
  20 |       if (res.url().includes('/paiements')) {
  21 |         console.log('  <<<', res.status(), res.url())
  22 |         try { console.log('      body:', (await res.text()).slice(0, 200)) } catch {}
  23 |       }
  24 |     })
  25 |     page.on('console', (msg) => {
  26 |       if (msg.type() === 'error') console.log('  [console.error]', msg.text())
  27 |     })
  28 | 
  29 |     await loginInvestisseur(page, user)
  30 | 
  31 |     // Trouver une propriete disponible via API (deterministe, pas de scraping UI)
  32 |     const props = await getAvailableProperties(user.token!)
  33 |     expect(props.length).toBeGreaterThan(0)
  34 |     // Eviter "Test" si possible, prendre une vraie propriete
  35 |     const prop = props.find((p) => !p.nom.toLowerCase().startsWith('test')) ?? props[0]
  36 | 
  37 |     // === Etape 1 : Selection ===
  38 |     await page.goto(`/opportunites/${prop.id}/acheter`)
  39 |     await expect(page.getByRole('heading', { name: /combien de parts/i })).toBeVisible({ timeout: 15_000 })
  40 | 
  41 |     // Cibler le spinbutton (input) pas le slider qui partage le meme aria-label
  42 |     const partsInput = page.getByRole('spinbutton', { name: /nombre de parts/i })
  43 |     await partsInput.fill('2')
  44 |     await page.getByRole('button', { name: /continuer/i }).click()
  45 | 
  46 |     // === Etape 2 : Confirmation ===
  47 |     await expect(page.getByRole('heading', { name: /confirmation/i })).toBeVisible({ timeout: 10_000 })
  48 |     // Cocher les CGV (Radix : utiliser click() plutot que check() pour bien trigger le state React)
  49 |     await page.getByRole('checkbox').first().click()
  50 |     // Attendre que le bouton ne soit plus disabled
  51 |     const payBtn = page.getByRole('button', { name: /payer maintenant/i })
  52 |     await expect(payBtn).toBeEnabled({ timeout: 5_000 })
  53 |     await payBtn.click()
  54 | 
  55 |     // === Etapes 3 (Paiement en cours) + 4 (Succes) ===
  56 |     // L'etape "Paiement en cours" peut etre tres breve (MockScheduler 5s + polling 10s),
  57 |     // on attend directement le passage final au succes.
  58 |     // Timeout 60s : mock confirm 5s + polling jusqu'a 10s + marge reseau.
> 59 |     await expect(page.getByRole('heading', { name: /achat confirm/i })).toBeVisible({ timeout: 60_000 })
     |                                                                         ^ Error: expect(locator).toBeVisible() failed
  60 |     await expect(page.getByRole('button', { name: /voir mon portefeuille/i })).toBeVisible()
  61 |   })
  62 | 
  63 |   test('Apres achat, les parts apparaissent dans le portefeuille', async ({ page }) => {
  64 |     await loginInvestisseur(page, user)
  65 |     await page.goto('/portefeuille')
  66 |     // On doit voir AU MOINS une possession (celle achetee dans le test precedent)
  67 |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
  68 |     // Heuristique : il existe au moins une carte/ligne contenant "part" ou un nombre
  69 |     const content = page.locator('main, [role="main"]').first()
  70 |     await expect(content).toContainText(/part/i, { timeout: 10_000 })
  71 |   })
  72 | })
  73 | 
```