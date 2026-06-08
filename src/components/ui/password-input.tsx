import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * V2 X (07/06/2026) : champ mot de passe avec toggle œil pour révéler/masquer.
 *
 * Wrapper autour de <Input/> qui :
 *   - démarre masqué (type=password)
 *   - bouton œil à droite qui bascule vers type=text
 *   - aria-pressed correct pour les lecteurs d'écran
 *   - autoComplete par défaut "current-password" (override possible via props)
 *
 * Utilisable comme un Input standard : accepte toutes les props HTML input
 * (placeholder, name, autoComplete, register react-hook-form, etc.).
 */
const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<'input'>, 'type'>
>(({ className, autoComplete = 'current-password', ...props }, ref) => {
  const [visible, setVisible] = React.useState(false)
  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        className={cn('pr-11', className)}
        ref={ref}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible ? 'true' : 'false'}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center text-earth-500 hover:text-earth hover:bg-sand-200 transition-colors"
      >
        {visible ? (
          <EyeOff className="w-4 h-4" strokeWidth={1.75} />
        ) : (
          <Eye className="w-4 h-4" strokeWidth={1.75} />
        )}
      </button>
    </div>
  )
})
PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
