import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatCard } from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAdminCertificationsPending,
  useApprouverCertification,
  useRefuserCertification,
} from '@/lib/api/certification'
import { extractApiError } from '@/lib/api/errors'
import type { DocumentResponse, ProprieteResponse } from '@/lib/api/types'

const apiBase = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

/**
 * Phase Certification (Hugh 22/05/2026) : page admin pour valider/refuser les
 * demandes de certification soumises par les proprietaires.
 */
export function AdminCertificationsPage() {
  const { data, isLoading } = useAdminCertificationsPending()
  const approuver = useApprouverCertification()
  const [refusTarget, setRefusTarget] = useState<ProprieteResponse | null>(null)
  const [detailTarget, setDetailTarget] = useState<ProprieteResponse | null>(null)

  const pending = data ?? []

  const stats = useMemo(() => {
    return {
      pending: pending.length,
      totalDocs: pending.reduce(
        (s, p) => s + countDocsLegaux(p.documents),
        0
      ),
    }
  }, [pending])

  function handleApprouver(p: ProprieteResponse) {
    approuver.mutate(p.id, {
      onSuccess: () =>
        toast.success(`"${p.nom}" certifié. Les investisseurs peuvent maintenant acheter.`),
      onError: (e) => toast.error(extractApiError(e, 'Approbation impossible.')),
    })
  }

  const columns: Column<ProprieteResponse>[] = [
    {
      key: 'id',
      label: '#',
      width: 'w-12',
      align: 'right',
      render: (p) => <span className="font-mono text-xs text-earth-500">#{p.id}</span>,
    },
    {
      key: 'nom',
      label: 'Propriété',
      render: (p) => (
        <div>
          <Link
            to={`/admin/proprietes/${p.id}`}
            className="font-body font-semibold text-earth hover:text-terra"
          >
            {p.nom}
          </Link>
          <p className="font-body text-earth-500 text-xs">{p.localisation}</p>
        </div>
      ),
    },
    {
      key: 'docs',
      label: 'Documents',
      align: 'center',
      noSort: true,
      render: (p) => {
        const n = countDocsLegaux(p.documents)
        return (
          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-ocean">
            <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
            {n} PDF
          </span>
        )
      },
    },
    {
      key: 'soumiseLe',
      label: 'Soumise',
      hideOnMobile: true,
      sortAccessor: (p) => (p.certifSoumiseLe ? new Date(p.certifSoumiseLe) : new Date(0)),
      render: (p) =>
        p.certifSoumiseLe ? (
          <span className="font-body text-xs text-earth-600">
            {new Date(p.certifSoumiseLe).toLocaleDateString('fr-FR')}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      noSort: true,
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDetailTarget(p)}
            title="Voir les documents"
          >
            <FileText className="w-4 h-4 mr-1" strokeWidth={1.75} />
            Documents
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleApprouver(p)}
            disabled={approuver.isPending}
            title="Certifier"
            aria-label="Certifier"
            className="text-success hover:bg-success/10 hover:text-success"
          >
            <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRefusTarget(p)}
            title="Refuser"
            aria-label="Refuser"
            className="text-error hover:bg-error/10 hover:text-error"
          >
            <XCircle className="w-4 h-4" strokeWidth={1.75} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-terra" strokeWidth={1.75} />
          Certifications en attente
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Vérifiez les documents légaux uploadés par les propriétaires. Sans certification,
          les investisseurs ne peuvent pas acheter de parts.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-sand-300" />
          ))
        ) : (
          <>
            <StatCard
              label="Demandes en attente"
              value={stats.pending}
              icon={ShieldCheck}
              iconBg="bg-warning/15"
              iconColor="text-warning"
            />
            <StatCard
              label="Documents à vérifier"
              value={stats.totalDocs}
              icon={FileText}
              iconBg="bg-ocean/10"
              iconColor="text-ocean"
            />
          </>
        )}
      </section>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl bg-sand-300" />
      ) : (
        <DataTable
          data={pending}
          columns={columns}
          rowKey={(p) => p.id}
          initialSort={{ key: 'soumiseLe', direction: 'asc' }}
          pageSize={20}
          empty={
            <EmptyState
              icon={CheckCircle2}
              title="Aucune certification en attente"
              description="Toutes les demandes ont été traitées."
            />
          }
        />
      )}

      <RefusModal target={refusTarget} onClose={() => setRefusTarget(null)} />
      <DocumentsModal target={detailTarget} onClose={() => setDetailTarget(null)} />
    </div>
  )
}

function RefusModal({
  target,
  onClose,
}: {
  target: ProprieteResponse | null
  onClose: () => void
}) {
  const [motif, setMotif] = useState('')
  const refuser = useRefuserCertification()
  const valid = motif.trim().length >= 10

  function submit() {
    if (!target) return
    refuser.mutate(
      { proprieteId: target.id, motif: motif.trim() },
      {
        onSuccess: () => {
          toast.success(`Certification de "${target.nom}" refusée. Proprio notifié.`)
          setMotif('')
          onClose()
        },
        onError: (e) => toast.error(extractApiError(e, 'Refus impossible.')),
      }
    )
  }

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-error">
            <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
            Refuser la certification
          </DialogTitle>
          <DialogDescription className="pt-2">
            <strong>{target?.nom}</strong>
            <br />
            <span className="font-body text-earth-600 text-sm">
              Le propriétaire pourra re-uploader des documents corrigés et resoumettre.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="motif">
            Motif <span className="text-error">*</span>{' '}
            <span className="font-body text-earth-500 text-xs font-normal">(min 10 caractères)</span>
          </Label>
          <textarea
            id="motif"
            rows={4}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex : Titre foncier illisible, contrat manquant, document non daté…"
            disabled={refuser.isPending}
            className="w-full rounded-md border-[1.5px] border-sand-400 bg-white px-3 py-2 text-sm font-body text-earth focus:outline-none focus:border-error focus:ring-2 focus:ring-error/15 resize-y"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={refuser.isPending}>
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={!valid || refuser.isPending}
            className="bg-error hover:bg-error/90 text-white"
          >
            {refuser.isPending ? (
              <>
                <Loader2 className="animate-spin" strokeWidth={2} />
                Refus...
              </>
            ) : (
              'Confirmer le refus'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DocumentsModal({
  target,
  onClose,
}: {
  target: ProprieteResponse | null
  onClose: () => void
}) {
  const docs = (target?.documents ?? []).filter(
    (d) => (d.type === 'PDF' || !d.type) && !(d as { sectionPhoto?: string }).sectionPhoto
  )

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-earth">
            <FileText className="w-5 h-5" strokeWidth={1.75} />
            Documents légaux
          </DialogTitle>
          <DialogDescription>
            <strong>{target?.nom}</strong> — {docs.length} document(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2 max-h-[60vh] overflow-y-auto">
          {docs.length === 0 ? (
            <p className="font-body text-earth-500 text-sm">Aucun document uploadé.</p>
          ) : (
            docs.map((d) => {
              const url = d.url
                ? d.url.startsWith('http') ? d.url : `${apiBase}/api/fichiers/${d.url}`
                : null
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 p-3 bg-sand-50 rounded-md border border-earth/8"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-earth-500 flex-shrink-0" strokeWidth={1.75} />
                    <span className="font-body text-sm text-earth truncate">
                      {d.nom ?? d.fileName ?? `Document #${d.id}`}
                    </span>
                  </div>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-ocean text-xs font-semibold hover:underline flex-shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
                      Ouvrir
                    </a>
                  )}
                </div>
              )
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function countDocsLegaux(docs: DocumentResponse[] | undefined): number {
  if (!docs) return 0
  return docs.filter(
    (d) => (d.type === 'PDF' || !d.type) && !(d as { sectionPhoto?: string }).sectionPhoto
  ).length
}
