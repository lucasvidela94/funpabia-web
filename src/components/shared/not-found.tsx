import { Link } from '@tanstack/react-router'

// A URL that matches no page. The public layout draws it between its header and footer; anywhere
// else (the panel) the router's default draws it bare, so it carries its own way back.
export function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-4 py-20">
      <p className="font-heading text-2xl font-bold text-teal-900">Funpabia</p>
      <h1 className="mt-6 font-heading text-5xl font-bold tracking-[-0.03em]">
        Esta página no existe
      </h1>
      <p className="mt-3 text-lg text-ink-2">
        Puede que el link esté mal copiado o que la página ya no esté.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/"
          className="inline-flex h-12 items-center rounded-md bg-primary px-6 font-bold text-primary-foreground"
        >
          Ir al inicio
        </Link>
        <Link
          to="/adopta"
          className="inline-flex h-12 items-center rounded-md border border-primary px-6 font-semibold text-primary"
        >
          Ver animales en adopción
        </Link>
      </div>
    </div>
  )
}
