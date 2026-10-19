import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

// Design system 6, "CTA de tránsito". The promise comes from what the foundation says in the press:
// fosters give the home, the foundation pays the vet.
export function FosterCta() {
  return (
    <section className="on-dark rounded-lg bg-teal-900 px-6 py-10 text-white sm:px-10 sm:py-12">
      <h2 className="max-w-[20ch] font-heading text-4xl font-bold tracking-tight sm:text-5xl">
        <span className="block">¿No podés adoptar?</span>
        <span className="font-medium">Sé tránsito</span>
      </h2>
      <p className="mt-4 max-w-[46ch] text-lg text-white/90">
        Vos ponés el cariño y un lugar en tu casa hasta que encuentre familia. La fundación cubre
        los gastos, veterinaria incluida.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Button
          asChild
          className="h-12 bg-accent px-6 text-base font-bold text-accent-foreground hover:bg-yellow-400/85"
        >
          <Link to="/transito/solicitud">Ofrecer tránsito</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-12 border-2 border-white bg-transparent px-6 text-base font-semibold text-white hover:bg-white/10 hover:text-white"
        >
          <Link to="/transito">Ver requisitos</Link>
        </Button>
      </div>
    </section>
  )
}
