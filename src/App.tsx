import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { RedirectToHost } from '@/lib/auth/RedirectToHost'
import { RequireAdmin } from '@/lib/auth/RequireAdmin'
import { RequireAuth } from '@/lib/auth/RequireAuth'
import { adminOrigin, investisseurOrigin, isAdminHost } from '@/lib/hosts'
import { queryClient } from '@/lib/queryClient'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminEscrowsPage } from '@/pages/admin/AdminEscrowsPage'
import { AdminRetraitsPage } from '@/pages/admin/AdminRetraitsPage'
import { AdminDeviseRatesPage } from '@/pages/admin/AdminDeviseRatesPage'
import { AdminEquipementsPage } from '@/pages/admin/AdminEquipementsPage'
import { AdminTypesBienPage } from '@/pages/admin/AdminTypesBienPage'
import { AdminCategoriesDocumentPage } from '@/pages/admin/AdminCategoriesDocumentPage'
import { AdminSectionsPhotoPage } from '@/pages/admin/AdminSectionsPhotoPage'
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'
import { AdminDistributionPage } from '@/pages/admin/AdminDistributionPage'
import { AdminDividendesPage } from '@/pages/admin/AdminDividendesPage'
import { AdminKycPage } from '@/pages/admin/AdminKycPage'
import { AdminAuditOnchainPage } from '@/pages/admin/AdminAuditOnchainPage'
import { AdminPaiementSessionsPage } from '@/pages/admin/AdminPaiementSessionsPage'
import { AdminPrixPartPage } from '@/pages/admin/AdminPrixPartPage'
import { AdminPrixPartExplicationPage } from '@/pages/admin/AdminPrixPartExplicationPage'
import { AdminProprieteDetailPage } from '@/pages/admin/AdminProprieteDetailPage'
import { AdminProprietesPage } from '@/pages/admin/AdminProprietesPage'
import { AdminRevenusPage } from '@/pages/admin/AdminRevenusPage'
import { AdminTransactionsPage } from '@/pages/admin/AdminTransactionsPage'
import { AdminUserDetailPage } from '@/pages/admin/AdminUserDetailPage'
import { AdminUtilisateursPage } from '@/pages/admin/AdminUtilisateursPage'
import { AdminWalletsPage } from '@/pages/admin/AdminWalletsPage'
import { AcheterPartsPage } from '@/pages/AcheterPartsPage'
import { AnnonceDetailPage } from '@/pages/AnnonceDetailPage'
import { ComptePage } from '@/pages/ComptePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DeclarerRevenuPage } from '@/pages/DeclarerRevenuPage'
import { DividendesPage } from '@/pages/DividendesPage'
import { KycPage } from '@/pages/KycPage'
import { MaProprieteDetailPage } from '@/pages/MaProprieteDetailPage'
import { MarcheSecondairePage } from '@/pages/MarcheSecondairePage'
import { MesAnnoncesPage } from '@/pages/MesAnnoncesPage'
import { MesProprietesPage } from '@/pages/MesProprietesPage'
import { NouvelleAnnoncePage } from '@/pages/NouvelleAnnoncePage'
import { ProposerBienPage } from '@/pages/ProposerBienPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { OpportuniteDetailPage } from '@/pages/OpportuniteDetailPage'
import { OpportunitesPage } from '@/pages/OpportunitesPage'
import { PortefeuillePage } from '@/pages/PortefeuillePage'
import { RegisterPage } from '@/pages/RegisterPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { RetraitsPage } from '@/pages/RetraitsPage'
import { WalletPage } from '@/pages/WalletPage'

/**
 * Le routing est isole par hostname :
 *  - admin.fursa.seed-innov.com  -> SEULEMENT routes /admin/* + auth
 *  - fursa.seed-innov.com         -> SEULEMENT routes investisseur + auth + landing
 *
 * Toute tentative d'acces a une route appartenant a l'autre hostname est redirigee
 * (RedirectToHost = window.location.replace cote client, preserve path + query).
 */
function App() {
  const adminMode = isAdminHost()

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {adminMode ? <AdminRoutes /> : <InvestisseurRoutes />}
          {/* Style "subtil premium" defini dans index.css (data-sonner-toast).
              richColors retire : on gere nos propres couleurs (success/error/warning/ocean). */}
          <Toaster
            position="top-right"
            closeButton
            toastOptions={{
              classNames: { toast: 'font-body' },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// =========================================================================
// Mode INVESTISSEUR (hostname principal : fursa.seed-innov.com)
// =========================================================================

function InvestisseurRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Investisseur (auth requise) */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/opportunites" element={<OpportunitesPage />} />
          <Route path="/opportunites/:id" element={<OpportuniteDetailPage />} />
          <Route path="/opportunites/:id/acheter" element={<AcheterPartsPage />} />
          <Route path="/compte" element={<ComptePage />} />
          <Route path="/compte/kyc" element={<KycPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/retraits" element={<RetraitsPage />} />
          <Route path="/portefeuille" element={<PortefeuillePage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/dividendes" element={<DividendesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/marche/secondaire" element={<MarcheSecondairePage />} />
          <Route path="/marche/secondaire/:id" element={<AnnonceDetailPage />} />
          <Route path="/marche/mes-annonces" element={<MesAnnoncesPage />} />
          <Route path="/marche/nouvelle-annonce" element={<NouvelleAnnoncePage />} />
          <Route path="/proposer-un-bien" element={<ProposerBienPage />} />
          <Route path="/proposer-un-bien/:id" element={<ProposerBienPage />} />
          <Route path="/mes-proprietes" element={<MesProprietesPage />} />
          <Route path="/mes-proprietes/:id" element={<MaProprieteDetailPage />} />
          <Route path="/mes-proprietes/:id/declarer-revenu" element={<DeclarerRevenuPage />} />
        </Route>
      </Route>

      {/* Toute route /admin/* sur le hostname principal -> redirige vers le sous-domaine admin */}
      <Route path="/admin/*" element={<RedirectToHost targetOrigin={adminOrigin()} />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

// =========================================================================
// Mode ADMIN (sous-domaine : admin.fursa.seed-innov.com)
// =========================================================================

function AdminRoutes() {
  return (
    <Routes>
      {/* Public partout */}
      <Route path="/login" element={<LoginPage />} />

      {/* Sur admin, "/" et "/register" n'ont pas de sens cote admin */}
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/register" element={<RedirectToHost targetOrigin={investisseurOrigin()} />} />

      {/* Admin (role ADMIN requis) */}
      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/proprietes" element={<AdminProprietesPage />} />
          <Route path="/admin/proprietes/:id" element={<AdminProprieteDetailPage />} />
          <Route path="/admin/revenus" element={<AdminRevenusPage />} />
          {/* V2 M (07/06/2026) : prix dynamique */}
          <Route path="/admin/prix-parts/explication" element={<AdminPrixPartExplicationPage />} />
          <Route path="/admin/prix-parts/:id" element={<AdminPrixPartPage />} />
          {/* V2 Q (07/06/2026) : audit on-chain RevenueLedger */}
          <Route path="/admin/audit-onchain" element={<AdminAuditOnchainPage />} />
          {/* V2 K (06/06/2026) : /admin/declarations supprime, fusionne dans /admin/revenus (onglet "Statut par bien") */}
          <Route path="/admin/declarations" element={<Navigate to="/admin/revenus?onglet=statuts" replace />} />
          <Route path="/admin/escrows" element={<AdminEscrowsPage />} />
          <Route path="/admin/retraits" element={<AdminRetraitsPage />} />
          <Route path="/admin/utilisateurs" element={<AdminUtilisateursPage />} />
          <Route path="/admin/utilisateurs/:id" element={<AdminUserDetailPage />} />
          <Route path="/admin/wallets" element={<AdminWalletsPage />} />
          <Route path="/admin/kyc" element={<AdminKycPage />} />
          <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
          <Route path="/admin/paiements" element={<AdminPaiementSessionsPage />} />
          <Route path="/admin/devise-rate" element={<AdminDeviseRatesPage />} />
          <Route path="/admin/equipements" element={<AdminEquipementsPage />} />
          <Route path="/admin/types-bien" element={<AdminTypesBienPage />} />
          <Route path="/admin/categories-document" element={<AdminCategoriesDocumentPage />} />
          <Route path="/admin/sections-photo" element={<AdminSectionsPhotoPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/distribution" element={<AdminDistributionPage />} />
          <Route path="/admin/dividendes" element={<AdminDividendesPage />} />
        </Route>
      </Route>

      {/* Toute route investisseur (/dashboard, /opportunites, etc.) sur le hostname admin
          redirige vers le hostname principal. */}
      <Route path="/dashboard" element={<RedirectToHost targetOrigin={investisseurOrigin()} />} />
      <Route path="/opportunites/*" element={<RedirectToHost targetOrigin={investisseurOrigin()} />} />
      <Route path="/compte" element={<RedirectToHost targetOrigin={investisseurOrigin()} />} />
      <Route path="/portefeuille" element={<RedirectToHost targetOrigin={investisseurOrigin()} />} />
      <Route path="/transactions" element={<RedirectToHost targetOrigin={investisseurOrigin()} />} />
      <Route path="/dividendes" element={<RedirectToHost targetOrigin={investisseurOrigin()} />} />
      <Route path="/retraits" element={<RedirectToHost targetOrigin={investisseurOrigin()} />} />
      <Route path="/wallet" element={<RedirectToHost targetOrigin={investisseurOrigin()} />} />
      <Route path="/notifications" element={<RedirectToHost targetOrigin={investisseurOrigin()} />} />
      <Route path="/marche/*" element={<RedirectToHost targetOrigin={investisseurOrigin()} />} />
      <Route path="/proposer-un-bien" element={<RedirectToHost targetOrigin={investisseurOrigin()} />} />
      <Route path="/mes-proprietes/*" element={<RedirectToHost targetOrigin={investisseurOrigin()} />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
