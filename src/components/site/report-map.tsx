import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import type { ReportSummary } from '@/lib/lost-found'

// The reports on a map (spec 6.6), one marker per zone with how many there are. It shows the
// center of each town, never a precise place: the approximate location the site promises. The
// list below is the full content; the map is a way in. Leaflet touches `window`, so it loads in
// the browser only, when the map appears.

type ZoneMarker = {
  slug: string
  name: string
  latitude: number
  longitude: number
  total: number
}

function markersOf(reports: ReportSummary[]) {
  const zones = new Map<string, ZoneMarker>()

  for (const report of reports) {
    const found = zones.get(report.zone.slug)

    zones.set(report.zone.slug, { ...report.zone, total: (found?.total ?? 0) + 1 })
  }

  return [...zones.values()]
}

// Alto Valle, when there is nothing to fit.
const DEFAULT_CENTER: [number, number] = [-38.95, -67.95]

export function ReportMap({ reports }: { reports: ReportSummary[] }) {
  const container = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const element = container.current
    let cleanup = () => {}
    let cancelled = false

    async function draw() {
      const [{ default: L }] = await Promise.all([
        import('leaflet'),
        import('leaflet/dist/leaflet.css'),
      ])

      if (cancelled || !element) {
        return
      }

      const map = L.map(element, { scrollWheelZoom: false }).setView(DEFAULT_CENTER, 11)

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      const markers = markersOf(reports)

      for (const zone of markers) {
        L.marker([zone.latitude, zone.longitude], {
          title: `${zone.name}: ${zone.total} ${zone.total === 1 ? 'reporte' : 'reportes'}`,
          alt: `${zone.name}, ${zone.total} reportes`,
          icon: L.divIcon({
            className: '',
            iconSize: [40, 40],
            html: `<span class="flex size-10 items-center justify-center rounded-full border-2 border-white bg-teal-700 font-bold text-white shadow-card">${zone.total}</span>`,
          }),
        })
          .addTo(map)
          .on('click', () => navigate({ to: '/perdidos', search: { zona: zone.slug } }))
      }

      if (markers.length > 1) {
        map.fitBounds(
          L.latLngBounds(markers.map((zone): [number, number] => [zone.latitude, zone.longitude])),
          { padding: [40, 40], maxZoom: 12 },
        )
      } else if (markers.length === 1) {
        map.setView([markers[0].latitude, markers[0].longitude], 12)
      }

      cleanup = () => map.remove()
    }

    void draw()

    return () => {
      cancelled = true
      cleanup()
    }
  }, [reports, navigate])

  return (
    <div
      ref={container}
      role="region"
      aria-label="Mapa de reportes por zona"
      className="h-72 w-full overflow-hidden rounded-lg border bg-sand sm:h-80"
    />
  )
}
