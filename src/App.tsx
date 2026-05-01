import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { RequireAdmin } from '@/lib/auth/RequireAdmin'
import { RequireAuth } from '@/lib/auth/RequireAuth'
import { queryClient } from '@/lib/queryClient'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminDividendesPage } from '@/pages/admin/AdminDividendesPage'
import { AdminProprieteDetailPage } from '@/pages/admin/AdminProprieteDetailPage'
import { AdminProprietesPage } from '@/pages/admin/AdminProprietesPage'
import { AdminRevenusPage } from '@/pages/admin/AdminRevenusPage'
import { AdminTransactionsPage } from '@/pages/admin/AdminTransactionsPage'
import { AdminUtilisateursPage } from '@/pages/admin/AdminUtilisateursPage'
import { AcheterPartsPage } from '@/pages/AcheterPartsPage'
import { AnnonceDetailPage } from '@/pages/AnnonceDetailPage'
import { ComptePage } from '@/pages/ComptePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DeclarerRevenuPage } from '@/pages/DeclarerRevenuPage'
import { DividendesPage } from '@/pages/DividendesPage'
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
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

                {/* Stubs "Bientôt disponible" — remplacés au fil des phases */}
                <Route path="/portefeuille" element={<PortefeuillePage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/dividendes" element={<DividendesPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/marche/secondaire" element={<MarcheSecondairePage />} />
                <Route path="/marche/secondaire/:id" element={<AnnonceDetailPage />} />
                <Route path="/marche/mes-annonces" element={<MesAnnoncesPage />} />
                <Route path="/marche/nouvelle-annonce" element={<NouvelleAnnoncePage />} />
                <Route path="/proposer-un-bien" element={<ProposerBienPage />} />
                <Route path="/mes-proprietes" element={<MesProprietesPage />} />
                <Route path="/mes-proprietes/:id" element={<MaProprieteDetailPage />} />
                <Route path="/mes-proprietes/:id/declarer-revenu" element={<DeclarerRevenuPage />} />
              </Route>
            </Route>

            {/* Admin (rôle ADMIN requis) */}
            <Route element={<RequireAdmin />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/proprietes" element={<AdminProprietesPage />} />
                <Route path="/admin/proprietes/:id" element={<AdminProprieteDetailPage />} />
                <Route path="/admin/revenus" element={<AdminRevenusPage />} />
                <Route path="/admin/utilisateurs" element={<AdminUtilisateursPage />} />
                <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
                <Route path="/admin/dividendes" element={<AdminDividendesPage />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast: 'font-body',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
