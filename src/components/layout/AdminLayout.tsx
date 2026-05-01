import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'

import { AdminSidebar } from './AdminSidebar'
import { NotificationsDropdown } from './NotificationsDropdown'

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:block fixed inset-y-0 left-0 w-[240px] z-40">
        <AdminSidebar />
      </aside>

      {/* Sidebar mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px] bg-earth border-none">
          <AdminSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Right column */}
      <div className="md:pl-[240px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 h-16 bg-sand-50/85 backdrop-blur-md border-b border-earth/8">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileOpen(true)}
                aria-label="Ouvrir le menu"
                className="md:hidden text-earth"
              >
                <Menu strokeWidth={1.75} />
              </Button>
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-earth text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                Back-office
              </span>
            </div>
            <NotificationsDropdown />
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
