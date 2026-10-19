import { KIND_LABEL, type ReportKind } from '@/lib/lost-found'
import { cn } from '@/lib/utils'

// The kind is written out as well as colored: color is never the only signal.
const KIND_STYLE: Record<ReportKind, string> = {
  lost: 'bg-lost-soft text-lost',
  found: 'bg-found-soft text-found',
}

export function KindTag({ kind }: { kind: ReportKind }) {
  return (
    <span className={cn('inline-flex rounded-pill px-3 py-1 text-sm font-bold', KIND_STYLE[kind])}>
      {KIND_LABEL[kind]}
    </span>
  )
}
