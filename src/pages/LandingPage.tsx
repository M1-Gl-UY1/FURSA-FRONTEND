import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/landing/Hero'
import { PourquoiFursa } from '@/components/landing/PourquoiFursa'
import { Investisseurs } from '@/components/landing/Investisseurs'
import { Proprietaires } from '@/components/landing/Proprietaires'
import { Opportunites } from '@/components/landing/Opportunites'
import { CommentCaMarche } from '@/components/landing/CommentCaMarche'
import { Partenaires } from '@/components/landing/Partenaires'
import { Stats } from '@/components/landing/Stats'
import { InvestirConfiance } from '@/components/landing/InvestirConfiance'
import { Movement } from '@/components/landing/Movement'
import { CtaFinal } from '@/components/landing/CtaFinal'
import { FadeInSection } from '@/components/shared/FadeInSection'

export function LandingPage() {
  return (
    <div className="relative">
      <Header />
      <main>
        {/* Hero et Stats ont leurs propres animations (Ken Burns + counters scroll). */}
        <Hero />
        <Stats />

        {/* Toutes les autres sections sont wrappees pour le fade-up scroll-triggered.
            Inspire de Fumba.town / Paje Square (PROPOSITION_UX_FURSA.md). */}
        <FadeInSection><PourquoiFursa /></FadeInSection>
        <FadeInSection><Opportunites /></FadeInSection>
        <FadeInSection><Investisseurs /></FadeInSection>
        <FadeInSection><Proprietaires /></FadeInSection>
        <FadeInSection><Partenaires /></FadeInSection>
        <FadeInSection><CommentCaMarche /></FadeInSection>
        <FadeInSection><Movement /></FadeInSection>
        <FadeInSection><InvestirConfiance /></FadeInSection>
        <FadeInSection><CtaFinal /></FadeInSection>
      </main>
      <Footer />
    </div>
  )
}
