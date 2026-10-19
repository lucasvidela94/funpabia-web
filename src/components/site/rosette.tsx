import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// The prize rosette from the logo, drawn flat: a sawtooth disc in the rosette yellow with two
// ribbon tails in the ribbon teal. The content sits in HTML over the disc so it scales with the
// type and stays readable to screen readers.

const TEETH = 36
const CENTER = 100

function sawtooth(outer: number, inner: number) {
  const points: string[] = []

  for (let index = 0; index < TEETH * 2; index++) {
    const radius = index % 2 === 0 ? outer : inner
    const angle = (Math.PI * index) / TEETH - Math.PI / 2
    points.push(
      `${(CENTER + radius * Math.cos(angle)).toFixed(2)},${(CENTER + radius * Math.sin(angle)).toFixed(2)}`,
    )
  }

  return points.join(' ')
}

const DISC = sawtooth(96, 86)

export function Rosette({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rosette relative aspect-[200/280]', className)}>
      <svg viewBox="0 0 200 280" className="absolute inset-0 size-full" aria-hidden="true">
        <g className="rosette-tails">
          <polygon points="78,150 40,270 64,252 84,278 112,162" className="fill-teal-700" />
          <polygon points="122,150 160,270 136,252 116,278 88,162" className="fill-teal-600" />
        </g>
        <polygon points={DISC} className="fill-yellow-400" />
        <circle
          cx={CENTER}
          cy={CENTER}
          r="72"
          className="fill-none stroke-ink"
          strokeWidth="1.25"
          strokeDasharray="3 4"
        />
      </svg>
      <div className="absolute inset-x-0 top-0 flex aspect-square flex-col items-center justify-center px-[22%] text-center text-ink">
        {children}
      </div>
    </div>
  )
}
