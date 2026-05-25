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
import { CtaFinal } from '@/components/landing/CtaFinal'

export function LandingPage() {
  return (
    <div className="relative">
      <Header />
      <main>
        <Hero />
        <Stats />
        <PourquoiFursa />
        <Opportunites />
        <Investisseurs />
        <Proprietaires />
        <Partenaires />
        <CommentCaMarche />
        <InvestirConfiance />
        <CtaFinal />
      </main>
      <Footer />
    </div>
  )
}
