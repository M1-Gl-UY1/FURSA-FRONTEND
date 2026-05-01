import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useMesProprietesProposees } from '@/lib/api/submissions'

import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Affiche le groupe "Propriétaire" si l'user a au moins 1 bien proposé
  const { data: proposees } = useMesProprietesProposees()
  const hasProprietesProposees = (proposees?.length ?? 0) > 0

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Sidebar desktop (fixe) */}
      <aside className="hidden md:block fixed inset-y-0 left-0 w-[240px] z-40">
        <Sidebar hasProprietesProposees={hasProprietesProposees} />
      </aside>

      {/* Sidebar mobile (drawer via Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px] bg-sand-50">
          <Sidebar
            hasProprietesProposees={hasProprietesProposees}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Right column : topbar + content */}
      <div className="md:pl-[240px] flex flex-col min-h-screen">
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
