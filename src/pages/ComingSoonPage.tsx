import { Link } from 'react-router-dom'
import { Hammer, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

type ComingSoonPageProps = {
  title: string
  description?: string
  phase?: string
}

export function ComingSoonPage({ title, description, phase }: ComingSoonPageProps) {
  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="bg-sand-100 rounded-xl border border-earth/5 p-8 sm:p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-terra/15 flex items-center justify-center mx-auto mb-5">
          <Hammer className="w-7 h-7 text-terra" strokeWidth={1.5} />
        </div>
        <h1 className="font-display font-bold text-earth text-2xl sm:text-3xl mb-3">
          {title}
        </h1>
        {description && (
          <p className="font-body text-earth-600 text-sm sm:text-base max-w-md mx-auto mb-2">
            {description}
          </p>
        )}
        {phase && (
          <p className="font-mono text-xs text-earth-500 mb-6">
            Disponible en {phase}
          </p>
        )}
        <Button asChild variant="outline">
          <Link to="/dashboard">
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            Retour au dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
