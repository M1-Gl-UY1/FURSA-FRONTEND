# FURSA Frontend

Plateforme d'investissement immobilier fractionné en Afrique — interface web.

**Production** : https://fursa.seed-innov.com
**API** : https://api.fursa.seed-innov.com (Swagger : https://api.fursa.seed-innov.com/swagger-ui)

---

## Stack technique

| Composant | Choix |
|---|---|
| Build | Vite 8 |
| UI | React 19 + TypeScript |
| Style | Tailwind CSS v3 + shadcn/ui |
| Routing | React Router v6 |
| State serveur | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| HTTP | Axios |
| Auth | Access JWT (1h) + Refresh token (7j) en localStorage, intercepteur axios avec retry-on-401 + queue (Facebook-style) |
| Toasts | Sonner |
| Icons | Lucide React (+ SVG inline pour marques) |

---

## Lancement local

```bash
cp .env.example .env.local
# Editer .env.local pour pointer vers le backend voulu (local ou prod)
npm install
npm run dev
```

Le dev server tourne sur `http://localhost:5173`.

### Variables d'environnement

```env
VITE_API_BASE=http://localhost:8081       # local
# VITE_API_BASE=https://api.fursa.seed-innov.com  # prod
VITE_APP_NAME=Fursa
VITE_DEFAULT_CURRENCY=EUR
VITE_DEFAULT_LOCALE=fr-FR
```

`.env.production` contient les valeurs utilisées par `npm run build` (incluses dans le repo).
`.env.local` est gitignoré (override personnel pour le dev).
 
---

## Comptes de test (backend prod)

| Email | Password | Rôle |
|---|---|---|
| `tiomelajorel@gmail.com` | `jorel2026` | ADMIN |
| `admin@fursa.test` | `admin123` | ADMIN (dev seulement) |
| `investor1@fursa.test` | `password123` | INVESTISSEUR (dev seulement) |

---

## Structure du projet

```
src/
├── components/
│   ├── ui/             # shadcn/ui (button, input, dialog, sheet, slider, ...)
│   ├── layout/         # Header (landing) + AppLayout + AdminLayout + Sidebar + Topbar + Footer
│   ├── landing/        # Sections de la landing
│   ├── properties/     # PropertyCatalogCard, PropertyGallery, PropertySelector
│   └── shared/         # StatCard, DataTable, Money, StatusBadge, ProgressBar, EmptyState, WizardStepper, FileDropzone
├── lib/
│   ├── api/            # client axios + types miroir backend + hooks par domaine
│   ├── auth/           # AuthContext + useAuth + RequireAuth + RequireAdmin + token storage
│   ├── queryClient.ts  # TanStack Query config
│   └── utils.ts        # cn() helper
├── pages/              # Pages publiques + investisseur + propriétaire
│   └── admin/          # Pages admin (back-office sous /admin/*)
├── App.tsx             # Routes + providers
└── main.tsx
```

---

## Routes

### Public
- `/` — Landing
- `/login`, `/register` — Auth (style landing avec image hero)

### Investisseur (auth requise)
- `/dashboard`, `/opportunites`, `/opportunites/:id`, `/opportunites/:id/acheter`
- `/portefeuille`, `/transactions`, `/dividendes`, `/notifications`, `/compte`
- `/marche/secondaire`, `/marche/secondaire/:id`, `/marche/mes-annonces`, `/marche/nouvelle-annonce`

### Propriétaire (auth, sous-section investisseur)
- `/proposer-un-bien` (wizard 4 étapes)
- `/mes-proprietes`, `/mes-proprietes/:id`, `/mes-proprietes/:id/declarer-revenu`

### Admin (rôle ADMIN, layout sombre dédié)
- `/admin/dashboard`
- `/admin/proprietes`, `/admin/proprietes/:id` (validation soumissions)
- `/admin/revenus` (validation + distribution dividendes)
- `/admin/utilisateurs` (validation KYC)
- `/admin/transactions`, `/admin/dividendes` (audit)

---

## Design system

Conforme à `DESIGN_SYSTEM_FURSA.md` :

- **Palette** : Earth `#1A1A2E`, Terra `#C45D3E`, Sand `#F5F0EB`, Ocean `#2D6A7A`, Gold `#D4A853`, Success/Warning/Error
- **Fonts** : Plus Jakarta Sans (display), Inter (body), JetBrains Mono (montants)
- **Boutons CTA** : `rounded-full` (style pill)
- **Iconographie** : Lucide stroke 1.5

---

## Build & déploiement

```bash
npm run build        # → dist/
npm run preview      # serve dist/ en local
```

### CI/CD automatique (GitHub Actions)

Push sur `main` → `.github/workflows/deploy.yml` :

1. Checkout
2. Setup Node 20 + cache npm
3. `npm ci` + `npx tsc --noEmit`
4. `npm run build` (avec `VITE_API_BASE=https://api.fursa.seed-innov.com`)
5. SSH key + rsync de `dist/` vers `/var/www/fursa-frontend/` sur le VPS
6. Health check `https://fursa.seed-innov.com/`

### Secrets GitHub à configurer (Settings > Secrets and variables > Actions)

| Secret | Valeur |
|---|---|
| `VPS_HOST` | `84.247.183.206` |
| `VPS_USER` | `softengine` |
| `VPS_SSH_KEY` | Contenu de la clé `koursa_deploy` (privée) |
| `VITE_API_BASE` (optionnel) | Override du backend (défaut : `https://api.fursa.seed-innov.com`) |

### Déploiement manuel (fallback)

```bash
npm run build
scp -r -i ~/.ssh/koursa_deploy dist/. softengine@84.247.183.206:/var/www/fursa-frontend/
```

---

## Configuration VPS (référence)

Nginx config : `/etc/nginx/sites-available/fursa.seed-innov.com`
- HTTPS via Let's Encrypt (auto-renew)
- Redirect 80 → 443
- SPA fallback : `try_files $uri $uri/ /index.html;`
- Gzip + cache long sur `/assets/` (1 an)

---

## Référence d'architecture

- `ARCHITECTURE_UI_FURSA.md` (à la racine du projet) — design des flows + structure
- `ROADMAP_UI_FURSA.md` — historique des phases livrées (11 phases, refresh token V2 inclus)
- `DESIGN_SYSTEM_FURSA.md` — palette / typographie / composants
- `GUIDE_UTILISATION_FURSA.md` — guide utilisateur final (investisseur / propriétaire / admin)
