/**
 * Helpers API pour les tests E2E.
 * Utilise pour creer des users, propietes, annonces, etc. en bypass du frontend
 * (preparation des donnees avant un scenario UI).
 */
import { APIRequestContext, request } from '@playwright/test'

export const API_URL = process.env.FURSA_API_URL ?? 'https://api.fursa.seed-innov.com'
export const ADMIN_EMAIL = process.env.FURSA_ADMIN_EMAIL ?? 'tiomelajorel@gmail.com'
export const ADMIN_PASSWORD = process.env.FURSA_ADMIN_PASSWORD ?? 'jorel2026'

export type TestUser = {
  email: string
  password: string
  nom: string
  prenom: string
  telephone: string
  id?: number
  token?: string
}

let _apiCtx: APIRequestContext | null = null
async function getApi() {
  if (!_apiCtx) _apiCtx = await request.newContext({ baseURL: API_URL })
  return _apiCtx
}

/** Genere un user test unique pour cette execution (evite les conflits sur la prod) */
export function generateTestUser(prefix: string = 'e2e'): TestUser {
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 7)
  return {
    email: `${prefix}-${ts}-${rand}@fursa.test`,
    password: 'E2eTest2026',
    nom: 'Test',
    prenom: 'E2E',
    telephone: `+23760${String(ts).slice(-7)}`,
  }
}

export async function registerUser(user: TestUser): Promise<TestUser> {
  const api = await getApi()
  const res = await api.post('/api/user/auth/register', {
    data: {
      email: user.email,
      password: user.password,
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone,
    },
  })
  if (!res.ok()) throw new Error(`Register failed (${res.status()}): ${await res.text()}`)
  const data = await res.json()
  return { ...user, id: data.id }
}

export async function loginAndGetToken(email: string, password: string): Promise<string> {
  const api = await getApi()
  const res = await api.post('/api/user/auth/login', { data: { email, password } })
  if (!res.ok()) throw new Error(`Login failed (${res.status()}): ${await res.text()}`)
  const data = await res.json()
  return data.token
}

export async function loginAdmin(): Promise<string> {
  return loginAndGetToken(ADMIN_EMAIL, ADMIN_PASSWORD)
}

export async function createAndLoginUser(prefix: string = 'e2e'): Promise<TestUser> {
  const user = await registerUser(generateTestUser(prefix))
  user.token = await loginAndGetToken(user.email, user.password)
  return user
}

/** Recupere la liste publique des proprietes (statut=PUBLIEE, parts > 0). */
export async function getAvailableProperties(token: string) {
  const api = await getApi()
  const res = await api.get('/api/proprietes/public', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok()) throw new Error(`Get properties failed (${res.status()})`)
  const data = await res.json()
  const props = (Array.isArray(data) ? data : data.content ?? []) as Array<{
    id: number
    nom: string
    partsDisponibles: number
    statut: string
  }>
  return props.filter((p) => p.statut === 'PUBLIEE' && p.partsDisponibles > 0)
}
