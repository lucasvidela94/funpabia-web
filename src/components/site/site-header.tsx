import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { FOOTER_NAV, HEADER_NAV } from './site-nav'

// Footer links that the header does not already show, for the bottom of the mobile menu.
const SECONDARY_NAV = FOOTER_NAV.flatMap((group) =>
  group.items.filter((item) => !HEADER_NAV.some((header) => header.to === item.to)),
)

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link to="/" className="flex flex-col leading-none">
          <span className="font-heading text-2xl font-bold tracking-tight text-teal-900">
            Funpabia
          </span>
          <span className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
            Bienestar animal en Cipolletti
          </span>
        </Link>

        <nav aria-label="Principal" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {HEADER_NAV.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="relative flex h-11 items-center px-3 text-[0.9375rem] font-semibold text-ink-2 transition-colors hover:text-ink data-[status=active]:text-teal-900 data-[status=active]:after:absolute data-[status=active]:after:inset-x-3 data-[status=active]:after:bottom-1.5 data-[status=active]:after:h-0.5 data-[status=active]:after:bg-teal-700"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            asChild
            className="h-11 bg-accent px-5 text-base font-bold text-accent-foreground hover:bg-yellow-400/80"
          >
            <Link to="/dona">Doná</Link>
          </Button>
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}

function MobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="size-11 lg:hidden" aria-label="Abrir menú">
          <Menu className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[min(22rem,100vw)] gap-0 overflow-y-auto bg-background p-0"
      >
        <SheetTitle className="px-5 pt-5 pb-2 font-heading text-xl">Menú</SheetTitle>
        <nav aria-label="Principal">
          <ul className="px-2">
            {HEADER_NAV.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center rounded-md px-3 font-heading text-xl font-semibold data-[status=active]:bg-secondary data-[status=active]:text-secondary-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-4 border-t px-5 py-4">
          <ul className="flex flex-col">
            {SECONDARY_NAV.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center text-ink-2 hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  )
}
