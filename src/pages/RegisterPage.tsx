import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Mail, Lock, User, Phone, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'

import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { extractApiError, extractFieldErrors } from '@/lib/api/errors'
import { useAuth } from '@/lib/auth/AuthContext'

const registerSchema = z
  .object({
    nom: z.string().min(2, 'Au moins 2 caractères'),
    prenom: z.string().min(2, 'Au moins 2 caractères'),
    telephone: z
      .string()
      .min(8, 'Numéro invalide')
      .regex(/^\+?[0-9\s-]+$/, 'Format invalide (chiffres, +, espaces)'),
    email: z.string().min(1, 'Email requis').email('Email invalide'),
    password: z
      .string()
      .min(8, 'Au moins 8 caractères')
      .regex(/[A-Za-z]/, 'Au moins une lettre')
      .regex(/[0-9]/, 'Au moins un chiffre'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Les mots de passe ne correspondent pas',
  })

type RegisterForm = z.infer<typeof registerSchema>

const REDIRECT_HINTS: Record<string, string> = {
  '/proposer-un-bien': 'Créez votre compte pour proposer votre bien.',
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register: registerUser, isAuthenticated } = useAuth()
  const redirect = searchParams.get('redirect')

  useEffect(() => {
    if (isAuthenticated) navigate(redirect ?? '/dashboard', { replace: true })
  }, [isAuthenticated, redirect, navigate])

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      telephone: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const { confirmPassword, ...payload } = data
      void confirmPassword
      return registerUser(payload)
    },
    onSuccess: () => {
      const target = `/login?registered=true${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''}`
      navigate(target, { replace: true })
    },
    onError: (error) => {
      // Map les fieldErrors backend (ex: "email" déjà utilisé)
      const fieldErrors = extractFieldErrors(error)
      Object.entries(fieldErrors).forEach(([field, message]) => {
        form.setError(field as keyof RegisterForm, { type: 'server', message })
      })
      toast.error(extractApiError(error, 'Inscription impossible.'))
    },
  })

  const banner =
    redirect && REDIRECT_HINTS[redirect] ? (
      <div className="bg-ocean/95 backdrop-blur-sm text-white text-sm font-body rounded-md px-4 py-3 flex items-center gap-2 shadow-card">
        <Info className="w-4 h-4 shrink-0" strokeWidth={2} />
        <span>{REDIRECT_HINTS[redirect]}</span>
      </div>
    ) : null

  return (
    <AuthLayout banner={banner} cardSize="wide">
      <div className="text-center mb-7">
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-2">
          Bienvenue sur Fursa
        </h1>
        <p className="font-body text-earth-600 text-sm">
          Créez votre compte pour commencer à investir.
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        className="space-y-4"
        noValidate
      >
        {/* Nom + Prénom */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldText
            id="nom"
            label="Nom"
            placeholder="Tiomela"
            icon={<User className="w-4 h-4" strokeWidth={1.75} />}
            error={form.formState.errors.nom?.message}
            inputProps={{ autoComplete: 'family-name', ...form.register('nom') }}
          />
          <FieldText
            id="prenom"
            label="Prénom"
            placeholder="Jorel"
            icon={<User className="w-4 h-4" strokeWidth={1.75} />}
            error={form.formState.errors.prenom?.message}
            inputProps={{ autoComplete: 'given-name', ...form.register('prenom') }}
          />
        </div>

        {/* Téléphone */}
        <FieldText
          id="telephone"
          label="Téléphone"
          placeholder="+237 6XX XXX XXX"
          icon={<Phone className="w-4 h-4" strokeWidth={1.75} />}
          error={form.formState.errors.telephone?.message}
          inputProps={{
            type: 'tel',
            autoComplete: 'tel',
            ...form.register('telephone'),
          }}
        />

        {/* Email */}
        <FieldText
          id="email"
          label="Email"
          placeholder="vous@exemple.com"
          icon={<Mail className="w-4 h-4" strokeWidth={1.75} />}
          error={form.formState.errors.email?.message}
          inputProps={{
            type: 'email',
            autoComplete: 'email',
            ...form.register('email'),
          }}
        />

        {/* Password + Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PasswordField
            id="password"
            label="Mot de passe"
            error={form.formState.errors.password?.message}
            register={form.register('password')}
            autoComplete="new-password"
          />
          <PasswordField
            id="confirmPassword"
            label="Confirmer"
            error={form.formState.errors.confirmPassword?.message}
            register={form.register('confirmPassword')}
            autoComplete="new-password"
          />
        </div>

        <p className="text-xs font-body text-earth-500">
          Min 8 caractères, au moins 1 lettre et 1 chiffre.
        </p>

        <Button
          type="submit"
          size="lg"
          className="w-full mt-6"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Création...' : 'Créer mon compte'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm font-body text-earth-600">
        Vous avez déjà un compte ?{' '}
        <Link
          to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
          className="text-ocean font-semibold hover:underline"
        >
          Se connecter
        </Link>
      </div>
    </AuthLayout>
  )
}

// --- Sous-composant : un champ de form avec icône, error inline ---

type FieldTextProps = {
  id: string
  label: string
  placeholder?: string
  icon: React.ReactNode
  error?: string
  inputProps: React.InputHTMLAttributes<HTMLInputElement>
}

function FieldText({ id, label, placeholder, icon, error, inputProps }: FieldTextProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none">
          {icon}
        </span>
        <Input
          id={id}
          placeholder={placeholder}
          aria-invalid={!!error}
          className="pl-11"
          {...inputProps}
        />
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

// --- V2 X (07/06/2026) : champ mot de passe avec toggle oeil ---

type PasswordFieldProps = {
  id: string
  label: string
  error?: string
  register: ReturnType<ReturnType<typeof import('react-hook-form').useForm>['register']>
  autoComplete?: string
}

function PasswordField({ id, label, error, register, autoComplete }: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400 pointer-events-none z-10"
          strokeWidth={1.75}
        />
        <PasswordInput
          id={id}
          autoComplete={autoComplete}
          placeholder="••••••••"
          aria-invalid={!!error}
          className="pl-11"
          {...register}
        />
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
