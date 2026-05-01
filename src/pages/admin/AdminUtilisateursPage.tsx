import { ShieldCheck, Users } from 'lucide-react'
import { toast } from 'sonner'

import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminUsers, useValiderUser } from '@/lib/api/admin'
import { extractApiError } from '@/lib/api/errors'
import type { CurrentUser } from '@/lib/api/types'

export function AdminUtilisateursPage() {
  const { data, isLoading } = useAdminUsers()
  const valider = useValiderUser()

  function approveKyc(id: number) {
    valider.mutate(id, {
      onSuccess: () => toast.success('KYC validé.'),
      onError: (e) => toast.error(extractApiError(e, 'Validation impossible.')),
    })
  }

  const users = data ?? []

  const columns: Column<CurrentUser>[] = [
    {
      key: 'id',
      label: 'ID',
      width: 'w-16',
      align: 'right',
      render: (u) => <span className="font-mono text-xs text-earth-500">#{u.id}</span>,
    },
    {
      key: 'name',
      label: 'Nom',
      sortAccessor: (u) => `${u.nom} ${u.prenom}`,
      render: (u) => (
        <div>
          <p className="font-body font-semibold text-earth">
            {u.prenom} {u.nom}
          </p>
          <p className="font-body text-earth-500 text-xs">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'telephone',
      label: 'Téléphone',
      hideOnMobile: true,
      render: (u) => <span className="font-mono text-xs text-earth-600">{u.telephone}</span>,
    },
    {
      key: 'role',
      label: 'Rôle',
      align: 'center',
      render: (u) => (
        <span
          className={
            u.role === 'ADMIN'
              ? 'inline-flex items-center bg-terra/15 text-terra text-xs font-semibold rounded-full px-2.5 py-1'
              : 'inline-flex items-center bg-ocean/15 text-ocean text-xs font-semibold rounded-full px-2.5 py-1'
          }
        >
          {u.role}
        </span>
      ),
    },
    {
      key: 'isVerified',
      label: 'KYC',
      align: 'center',
      sortAccessor: (u) => (u.isVerified ? 1 : 0),
      render: (u) =>
        u.isVerified ? (
          <span className="inline-flex items-center gap-1 text-success text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" strokeWidth={1.75} /> Vérifié
          </span>
        ) : (
          <span className="text-warning text-xs font-semibold">En attente</span>
        ),
    },
    {
      key: 'actions',
      label: '',
      noSort: true,
      align: 'right',
      render: (u) =>
        u.isVerified ? (
          <span className="text-earth-400 text-xs">—</span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => approveKyc(u.id)}
            disabled={valider.isPending}
          >
            Valider KYC
          </Button>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Utilisateurs
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Liste des investisseurs inscrits sur la plateforme.
        </p>
      </header>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl bg-sand-300" />
      ) : (
        <DataTable
          data={users}
          columns={columns}
          rowKey={(u) => u.id}
          initialSort={{ key: 'id', direction: 'desc' }}
          empty={
            <EmptyState
              icon={Users}
              title="Aucun utilisateur"
              description="Aucun investisseur inscrit pour le moment."
            />
          }
        />
      )}
    </div>
  )
}
