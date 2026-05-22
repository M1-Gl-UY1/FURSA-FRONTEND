import { Eye, Search, ShieldCheck, ShieldX, Trash2, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminUsers, useDeleteUser, useValiderUser } from '@/lib/api/admin'
import { extractApiError } from '@/lib/api/errors'
import type { CurrentUser } from '@/lib/api/types'
import { cn } from '@/lib/utils'

type RoleFilter = 'ALL' | 'INVESTISSEUR' | 'ADMIN'
type KycFilter = 'ALL' | 'VERIFIED' | 'PENDING'

export function AdminUtilisateursPage() {
  const { data, isLoading } = useAdminUsers()
  const valider = useValiderUser()
  const deleteUser = useDeleteUser()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [kycFilter, setKycFilter] = useState<KycFilter>('ALL')
  const [toDelete, setToDelete] = useState<CurrentUser | null>(null)

  function approveKyc(id: number) {
    valider.mutate(id, {
      onSuccess: () => toast.success('KYC validé.'),
      onError: (e) => toast.error(extractApiError(e, 'Validation impossible.')),
    })
  }

  function confirmDelete() {
    if (!toDelete) return
    deleteUser.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success(`Compte ${toDelete.email} supprimé (soft delete).`)
        setToDelete(null)
      },
      onError: (e) => toast.error(extractApiError(e, 'Suppression impossible.')),
    })
  }

  // Filtres : search (email/nom/prenom/telephone) + role + KYC
  const users = useMemo(() => {
    const all = data ?? []
    const q = search.trim().toLowerCase()
    return all.filter((u) => {
      if (q) {
        const hay = `${u.email} ${u.nom} ${u.prenom} ${u.telephone}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false
      if (kycFilter === 'VERIFIED' && !u.isVerified) return false
      if (kycFilter === 'PENDING' && u.isVerified) return false
      return true
    })
  }, [data, search, roleFilter, kycFilter])

  const totalUsers = data?.length ?? 0
  const verifiedCount = data?.filter((u) => u.isVerified).length ?? 0
  const hasActiveFilter = search.trim() !== '' || roleFilter !== 'ALL' || kycFilter !== 'ALL'

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
          <span className="inline-flex items-center gap-1 text-warning text-xs font-semibold">
            <ShieldX className="w-4 h-4" strokeWidth={1.75} /> En attente
          </span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      noSort: true,
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          <Button asChild size="sm" variant="ghost" title="Voir le détail">
            <Link to={`/admin/utilisateurs/${u.id}`}>
              <Eye className="w-4 h-4" strokeWidth={1.75} />
            </Link>
          </Button>
          {!u.isVerified && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => approveKyc(u.id)}
              disabled={valider.isPending}
            >
              Valider KYC
            </Button>
          )}
          {u.role !== 'ADMIN' && (
            <Button
              size="sm"
              variant="ghost"
              className="text-error hover:bg-error/10 hover:text-error"
              onClick={() => setToDelete(u)}
              title="Supprimer"
              aria-label="Supprimer"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
            </Button>
          )}
        </div>
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
          {totalUsers} inscrit{totalUsers > 1 ? 's' : ''} · {verifiedCount} vérifié{verifiedCount > 1 ? 's' : ''}
          {hasActiveFilter && (
            <span className="ml-2 text-earth-500">
              · <strong>{users.length}</strong> resultat{users.length > 1 ? 's' : ''} apres filtre
            </span>
          )}
        </p>
      </header>

      {/* Barre de recherche + filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400 pointer-events-none"
            strokeWidth={1.75}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par email, nom, prenom, telephone..."
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth"
              aria-label="Effacer la recherche"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
        <FilterSelect
          value={roleFilter}
          onChange={(v) => setRoleFilter(v as RoleFilter)}
          ariaLabel="Filtrer par role"
          options={[
            { value: 'ALL', label: 'Tous les rôles' },
            { value: 'INVESTISSEUR', label: 'Investisseurs' },
            { value: 'ADMIN', label: 'Admins' },
          ]}
        />
        <FilterSelect
          value={kycFilter}
          onChange={(v) => setKycFilter(v as KycFilter)}
          ariaLabel="Filtrer par statut KYC"
          options={[
            { value: 'ALL', label: 'Tous KYC' },
            { value: 'VERIFIED', label: 'KYC vérifié' },
            { value: 'PENDING', label: 'KYC en attente' },
          ]}
        />
        {hasActiveFilter && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('')
              setRoleFilter('ALL')
              setKycFilter('ALL')
            }}
          >
            Reinitialiser
          </Button>
        )}
      </div>

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

      {/* Modal confirmation suppression */}
      <Dialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-error">
              <Trash2 className="w-5 h-5" strokeWidth={1.75} />
              Supprimer cet utilisateur ?
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <span className="block">
                <strong className="text-earth">{toDelete?.prenom} {toDelete?.nom}</strong>
                <br />
                <span className="font-mono text-xs">{toDelete?.email}</span>
              </span>
              <span className="block text-earth-600 text-sm pt-2">
                <strong>Soft delete</strong> : le compte ne pourra plus se connecter mais ses
                transactions, possessions et paiements restent en base pour la comptabilité et l'audit.
                Cette action peut être annulée (restore admin).
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={deleteUser.isPending}>
              Annuler
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleteUser.isPending}
              className="bg-error hover:bg-error/90 text-white"
            >
              {deleteUser.isPending ? 'Suppression...' : 'Confirmer la suppression'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  ariaLabel: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={cn(
        'h-11 px-3 rounded-md border-[1.5px] border-sand-400 bg-white text-sm font-body text-earth',
        'focus:outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15'
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
