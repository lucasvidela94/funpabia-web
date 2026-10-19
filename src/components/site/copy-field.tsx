import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

// A value people paste into their bank app: shown large and copied with one tap.
export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-bold tracking-wide break-all tabular-nums">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md border border-input px-3 font-semibold hover:bg-muted"
      >
        {copied ? (
          <Check className="size-4 text-adopted" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}
        <span aria-live="polite">{copied ? 'Copiado' : 'Copiar'}</span>
      </button>
    </div>
  )
}
