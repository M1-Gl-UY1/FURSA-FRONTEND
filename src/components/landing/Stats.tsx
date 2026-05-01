type Stat = {
  value: string
  suffix?: string
  label: string
}

const stats: Stat[] = [
  { value: '+120', label: 'Investisseurs actifs' },
  { value: '+35', label: 'Biens financés' },
  { value: '+18M', suffix: 'FCFA', label: 'Distribués' },
]

export function Stats() {
  return (
    <section className="bg-sand-50 py-16 sm:py-20">
      <div className="max-w-container mx-auto px-5 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 max-w-4xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display font-bold text-ocean text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-2">
                {s.value}
                {s.suffix && (
                  <span className="text-base sm:text-lg align-top ml-1 text-ocean-600 font-semibold">
                    {s.suffix}
                  </span>
                )}
              </div>
              <p className="font-body text-earth-600 text-sm sm:text-base font-medium">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
