import { Check, Link2, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// Spec 6.1: "Compartir por WhatsApp" (wa.me/?text=) and "Copiar link".
export function ShareActions({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        asChild
        variant="outline"
        className="h-11 border-input px-4 text-[0.9375rem] font-semibold"
      >
        <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} rel="noopener">
          <MessageCircle aria-hidden="true" />
          Compartir por WhatsApp
        </a>
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={copy}
        className="h-11 border-input px-4 text-[0.9375rem] font-semibold"
      >
        {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
        <span aria-live="polite">{copied ? 'Link copiado' : 'Copiar link'}</span>
      </Button>
    </div>
  )
}
