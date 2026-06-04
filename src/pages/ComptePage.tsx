import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Mail, User, Phone, AlertCircle, ShieldCheck, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api/client'
import { extractApiError, extractFieldErrors } from '@/lib/api/errors'
import { useAuth } from '@/lib/auth/AuthContext'

const profilSchema = z.object({
  nom: z.string().min(2, 'Au moins 2 caractères'),
  prenom: z.string().min(2, 'Au moins 2 caractères'),
  telephone: z.string().min(8, 'Numéro invalide').regex(/^\+?[0-9\s-]+$/, 'Format invalide'),
})

type ProfilForm = z.infer<typeof profilSchema>

export function ComptePage() {
  const { user, refresh } = useAuth()

  const form = useForm<ProfilForm>({
    resolver: zodResolver(profilSchema),
    defaultValues: { nom: '', prenom: '', telephone: '' },
  })

  // Synchroniser le form avec le user courant
  useEffect(() => {
    if (user) {
      form.reset({
        nom: user.nom ?? '',
        prenom: user.prenom ?? '',
        telephone: user.telephone ?? '',
      })
    }
  }, [user, form])

  const mutation = useMutation({
    mutationFn: async (data: ProfilForm) => {
      if (!user) throw new Error('Pas d\'utilisateur')
      // Le backend prend l'objet Investisseur complet, on ne change que ces 3 champs
      await api.put(`/api/user/update/${user.id}`, {
        ...data,
        email: user.email,
      })
    },
    onSuccess: async () => {
      await refresh()
      toast.success('Profil mis à jour.')
    },
    onError: (error) => {
      const fieldErrors = extractFieldErrors(error)
      Object.entries(fieldErrors).forEach(([field, message]) => {
        form.setError(field as keyof ProfilForm, { type: 'server', message })
      })
      toast.error(extractApiError(error, 'Modification impossible.'))
    },
  })

  if (!user) return null

  return (
    <div className="max-w-3xl">
      <header className="mb-8">
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-1">
          Mon profil
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Gérez vos informations personnelles.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card statut */}
        <aside className="lg:col-span-1">
          <div className="bg-sand-100 rounded-xl p-6 border border-earth/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-terra/15 flex items-center justify-center">
                <span className="font-display font-bold text-terra text-lg">
                  {(user.prenom?.[0] ?? user.email[0]).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-body font-semibold text-earth truncate">
                  {user.prenom} {user.nom}
                </p>
                <p className="font-body text-earth-500 text-xs truncate">{user.email}</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-earth/8">
              <Row label="Identifiant" value={`#${user.id}`} mono />
              <Row label="Rôle" value={user.role} />
              <div>
                <p className="font-body text-xs text-earth-500 mb-1">Vérification d'identité</p>
                {user.isVerified ? (
                  <span className="inline-flex items-center gap-1 text-success text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4" strokeWidth={1.75} /> Vérifié
                  </span>
                ) : (
                  <Link
                    to="/compte/kyc"
                    className="inline-flex items-center gap-1 text-warning text-xs font-semibold hover:underline"
                  >
                    <ShieldAlert className="w-4 h-4" strokeWidth={1.75} /> Verifier mon identite →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Form */}
        <section className="lg:col-span-2">
          <div className="bg-sand-100 rounded-xl p-6 sm:p-8 border border-earth/5">
            <h2 className="font-display font-semibold text-earth text-lg mb-6">
              Informations personnelles
            </h2>
            <form
              onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
              className="space-y-4"
              noValidate
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  id="nom"
                  label="Nom"
                  icon={<User className="w-4 h-4" strokeWidth={1.75} />}
                  error={form.formState.errors.nom?.message}
                  inputProps={form.register('nom')}
                />
                <Field
                  id="prenom"
                  label="Prénom"
                  icon={<User className="w-4 h-4" strokeWidth={1.75} />}
                  error={form.formState.errors.prenom?.message}
                  inputProps={form.register('prenom')}
                />
              </div>

              <Field
                id="telephone"
                label="Téléphone"
                icon={<Phone className="w-4 h-4" strokeWidth={1.75} />}
                error={form.formState.errors.telephone?.message}
                inputProps={{ type: 'tel', ...form.register('telephone') }}
              />

              {/* Email read-only */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400 pointer-events-none"
                    strokeWidth={1.75}
                  />
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="pl-11"
                  />
                </div>
                <p className="text-earth-500 text-xs font-body">
                  L'email ne peut pas être modifié.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={mutation.isPending || !form.formState.isDirty}>
                  {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    form.reset({
                      nom: user.nom ?? '',
                      prenom: user.prenom ?? '',
                      telephone: user.telephone ?? '',
                    })
                  }
                  disabled={!form.formState.isDirty}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

// --- Sous-composants ---

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="font-body text-xs text-earth-500 mb-0.5">{label}</p>
      <p className={mono ? 'font-mono text-sm text-earth' : 'font-body text-sm text-earth'}>
        {value}
      </p>
    </div>
  )
}

type FieldProps = {
  id: string
  label: string
  icon: React.ReactNode
  error?: string
  inputProps: React.InputHTMLAttributes<HTMLInputElement>
}

function Field({ id, label, icon, error, inputProps }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none">
          {icon}
        </span>
        <Input id={id} aria-invalid={!!error} className="pl-11" {...inputProps} />
      </div>
      {error && (
        <p className="text-error text-xs font-body flex items-center gap-1">
          <AlertCircle className="w-3 h-3" strokeWidth={2} />
          {error}
        </p>
      )}
    </div>
  )
}
