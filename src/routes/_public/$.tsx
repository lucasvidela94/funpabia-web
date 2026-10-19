import { createFileRoute, notFound } from '@tanstack/react-router'
import { NotFound } from '@/components/shared/not-found'

// Any URL that matches no page. Catching it here, under the layout, keeps the header and footer
// around the 404.
export const Route = createFileRoute('/_public/$')({
  loader: () => {
    throw notFound()
  },
  head: () => ({ meta: [{ title: 'Página no encontrada | Funpabia' }] }),
  notFoundComponent: NotFound,
})
