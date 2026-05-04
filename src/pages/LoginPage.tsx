import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Mail, Lock, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { extractApiError } from '@/lib/api/errors'
import { useAuth } from '@/lib/auth/AuthContext'
import { isAdminHost } from '@/lib/hosts'

const loginSchema = z.object({
  email: z.string().min(1, 'Email requis').email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type LoginForm = z.infer<typeof loginSchema>

const REDIRECT_HINTS: Record<string, string> = {
  '/proposer-un-bien': 'Connectez-vous pour proposer votre bien.',
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isAuthenticated } = useAuth()

  // Sur admin.fursa.seed-innov.com, on redirige par défaut vers /admin/dashboard
  const defaultDest = isAdminHost() ? '/admin/dashboard' : '/dashboard'
  const redirect = searchParams.get('redirect') ?? defaultDest
  const expired = searchParams.get('expired') === 'true'
  const justRegistered = searchParams.get('registered') === 'true'

  // Si déjà connecté, on évite la page login
  useEffect(() => {
    if (isAuthenticated) navigate(redirect, { replace: true })
  }, [isAuthenticated, redirect, navigate])

  useEffect(() => {
    if (justRegistered) toast.success('Compte créé. Connectez-vous pour continuer.')
    if (expired) toast.info('Votre session a expiré. Reconnectez-vous.')
  }, [justRegistered, expired])

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const mutation = useMutation({
    mutationFn: (data: LoginForm) => login(data),
    onSuccess: () => {
      toast.success('Bienvenue !')
      navigate(redirect, { replace: true })
    },
    onError: (error) => {
      toast.error(extractApiError(error, 'Connexion impossible.'))
    },
  })

  const banner = REDIRECT_HINTS[redirect] ? (
    <div className="bg-ocean/95 backdrop-blur-sm text-white text-sm font-body rounded-md px-4 py-3 flex items-center gap-2 shadow-card">
      <Info className="w-4 h-4 shrink-0" strokeWidth={2} />
      <span>{REDIRECT_HINTS[redirect]}</span>
    </div>
  ) : null

  return (
    <AuthLayout banner={banner}>
      <div className="text-center mb-7">
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-2">
          {isAdminHost() ? 'Connexion administrateur' : 'Content de vous revoir !'}
        </h1>
        <p className="font-body text-earth-600 text-sm">
          {isAdminHost()
            ? 'Accédez au back-office Fursa.'
            : 'Connectez-vous pour accéder à votre espace.'}
        </p>
      </div>

      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4" noValidate>
        {/* Email */}
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
              autoComplete="email"
              placeholder="vous@exemple.com"
              aria-invalid={!!form.formState.errors.email}
              className="pl-11"
              {...form.register('email')}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-error text-xs font-body flex items-center gap-1">
              <AlertCircle className="w-3 h-3" strokeWidth={2} />
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400 pointer-events-none"
              strokeWidth={1.75}
            />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!form.formState.errors.password}
              className="pl-11"
              {...form.register('password')}
            />
          </div>
          {form.formState.errors.password && (
            <p className="text-error text-xs font-body flex items-center gap-1">
              <AlertCircle className="w-3 h-3" strokeWidth={2} />
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full mt-6"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Connexion...' : 'Se connecter'}
        </Button>
      </form>

      {/* Lien "Créer un compte" : masqué sur le sous-domaine admin (pas d'inscription publique côté back-office) */}
      {!isAdminHost() && (
        <div className="mt-6 text-center text-sm font-body text-earth-600">
          Pas encore de compte ?{' '}
          <Link
            to={`/register${redirect !== '/dashboard' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="text-ocean font-semibold hover:underline"
          >
            Créer un compte
          </Link>
        </div>
      )}

      {isAdminHost() && (
        <div className="mt-6 text-center text-xs font-body text-earth-500">
          Espace réservé aux administrateurs.
        </div>
      )}
    </AuthLayout>
  )
}
