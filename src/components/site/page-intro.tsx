import type { ReactNode } from 'react'

// The opening of every content page: a large title and one lead paragraph, left aligned.
export function PageIntro({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="max-w-3xl">
      <h1 className="font-heading text-5xl font-bold tracking-[-0.03em] text-balance text-teal-900 sm:text-6xl">
        {title}
      </h1>
      {children ? (
        <div className="mt-4 max-w-[60ch] text-lg text-ink-2 sm:text-xl">{children}</div>
      ) : null}
    </header>
  )
}
