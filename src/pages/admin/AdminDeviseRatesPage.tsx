import { Check, Coins, Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminDeviseRates, useUpsertDeviseRate } from '@/lib/api/admin'
import { extractApiError } from '@/lib/api/errors'
import type { DeviseRate } from '@/lib/api/types'

export function AdminDeviseRatesPage() {
  const { data: rates, isLoading, isError } = useAdminDeviseRates()
  const mutation = useUpsertDeviseRate()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Taux de change fiat → USDC
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Conversion utilisée pour calculer le montant USDC equivalent lors d'un paiement.
          A mettre a jour si les taux du marche varient significativement.
        </p>
      </header>

      {isLoading && <Skeleton className="h-96 w-full" />}

      {isError && (
        <EmptyState
          icon={X}
          title="Erreur de chargement"
          description="Impossible de charger les taux. Reessayez plus tard."
        />
      )}

      {rates && rates.length === 0 && (
        <EmptyState
          icon={Coins}
          title="Aucun taux configure"
          description="La table devise_rate est vide. La migration 003 devrait la peupler automatiquement."
        />
      )}

      {rates && rates.length > 0 && (
        <div className="bg-white rounded-xl border border-earth/8 overflow-hidden">
          <table className="w-full">
            <thead className="bg-sand-200">
              <tr>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm">
                  Devise
                </th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm">
                  1 unite vaut (USDC)
                </th>
                <th className="text-left px-4 py-3 font-body font-semibold text-earth text-sm hidden sm:table-cell">
                  Derniere maj
                </th>
                <th className="px-4 py-3 w-32" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <DeviseRow
                  key={r.codeDevise}
                  rate={r}
                  onSave={(code, tauxVersUsdc) => {
                    mutation.mutate(
                      { code, tauxVersUsdc },
                      {
                        onSuccess: () => toast.success(`Taux ${code} mis a jour`),
                        onError: (err) => toast.error(extractApiError(err, 'Sauvegarde impossible')),
                      }
                    )
                  }}
                  isSaving={mutation.isPending && mutation.variables?.code === r.codeDevise}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

type DeviseRowProps = {
  rate: DeviseRate
  onSave: (code: string, tauxVersUsdc: number) => void
  isSaving: boolean
}

function DeviseRow({ rate, onSave, isSaving }: DeviseRowProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(rate.tauxVersUsdc.toString())

  function handleSave() {
    const n = parseFloat(value)
    if (Number.isNaN(n) || n <= 0) {
      toast.error('Le taux doit etre strictement positif')
      return
    }
    onSave(rate.codeDevise, n)
    setEditing(false)
  }

  function handleCancel() {
    setValue(rate.tauxVersUsdc.toString())
    setEditing(false)
  }

  return (
    <tr className="border-t border-earth/8">
      <td className="px-4 py-3 font-mono font-bold text-earth">{rate.codeDevise}</td>
      <td className="px-4 py-3">
        {editing ? (
          <Input
            type="number"
            step="0.000001"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-40 h-9 font-mono"
            autoFocus
            disabled={isSaving}
          />
        ) : (
          <span className="font-mono text-earth">{rate.tauxVersUsdc}</span>
        )}
      </td>
      <td className="px-4 py-3 hidden sm:table-cell font-mono text-xs text-earth-500">
        {new Date(rate.updatedAt).toLocaleString('fr-FR')}
      </td>
      <td className="px-4 py-3 text-right">
        {editing ? (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSaving}>
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Check className="w-3.5 h-3.5" strokeWidth={2} />
              {isSaving ? '...' : 'Sauver'}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
            Editer
          </Button>
        )}
      </td>
    </tr>
  )
}
