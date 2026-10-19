import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Newspaper, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { NewsForm, EMPTY_POST } from '@/components/panel/news-form'
import { PanelHeader } from '@/components/panel/panel-page'
import { useAction } from '@/components/panel/use-action'
import { Button } from '@/components/ui/button'
import {
  createNewsPost,
  editNewsPost,
  getNewsForEdit,
  listNewsPosts,
  removeNewsPost,
  type EditablePost,
  type NewsInput,
  type NewsListPost,
} from '@/lib/news'
import { formatDate } from '@/lib/format'

export const Route = createFileRoute('/_private/panel/noticias/')({
  loader: () => listNewsPosts(),
  component: NewsAdmin,
})

// `null` is the list alone, 'new' the empty form, a loaded post the form filled in to edit it.
// The list only carries titles: the full post loads on demand when editing starts.
type Editing = null | 'new' | EditablePost

function NewsAdmin() {
  const posts = Route.useLoaderData()
  const router = useRouter()
  const [editing, setEditing] = useState<Editing>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const removeAction = useAction()

  async function startEdit(id: string) {
    setLoadError(null)
    setLoadingId(id)

    try {
      setEditing(await getNewsForEdit({ data: { id } }))
    } catch {
      setLoadError('No se pudo abrir la noticia. Probá de nuevo en un momento.')
    } finally {
      setLoadingId(null)
    }
  }

  async function save(input: NewsInput) {
    if (editing === 'new') {
      await createNewsPost({ data: input })
    } else if (editing) {
      await editNewsPost({ data: { id: editing.post.id, values: input } })
    }

    await router.invalidate({ sync: true })
    setEditing(null)
  }

  async function remove(post: NewsListPost) {
    await removeAction.run(() => removeNewsPost({ data: { id: post.id } }))
  }

  return (
    <div>
      <PanelHeader
        title="Noticias"
        help="noticia"
        description="Novedades, campañas y comunicados que se ven en el sitio."
        actions={
          editing === null ? (
            <Button className="h-11 gap-2 px-4 font-bold" onClick={() => setEditing('new')}>
              <Plus className="size-5" aria-hidden="true" />
              Nueva noticia
            </Button>
          ) : null
        }
      />

      {editing !== null ? (
        <section aria-labelledby="noticia" className="mt-6">
          <h2 id="noticia" className="mb-3 font-heading text-xl font-bold">
            {editing === 'new' ? 'Nueva noticia' : 'Editar la noticia'}
          </h2>
          <NewsForm
            key={editing === 'new' ? 'new' : editing.post.id}
            initial={
              editing === 'new'
                ? EMPTY_POST
                : {
                    title: editing.post.title,
                    body: editing.post.body,
                    tags: editing.post.tags,
                    imageKey: editing.post.imageKey,
                    animals: editing.animals,
                    published: editing.post.published,
                  }
            }
            submitLabel={editing === 'new' ? 'Guardar noticia' : 'Guardar cambios'}
            onSave={save}
          />
          <Button variant="ghost" className="mt-3 min-h-11" onClick={() => setEditing(null)}>
            Cancelar
          </Button>
        </section>
      ) : null}

      <p aria-live="polite" className="mt-4 font-semibold text-lost">
        {loadError}
        {removeAction.error}
      </p>

      {posts.length > 0 ? (
        <ul className="mt-6 divide-y overflow-hidden rounded-lg border bg-card">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center gap-4 px-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-heading text-lg font-bold">{post.title}</p>
                <p className="text-sm text-ink-2">
                  {post.publishedAt ? <>Publicada el {formatDate(post.publishedAt)}</> : 'Borrador'}
                </p>
              </div>
              <Button
                variant="outline"
                className="min-h-11 font-semibold"
                disabled={loadingId !== null || removeAction.pending}
                onClick={() => void startEdit(post.id)}
              >
                {loadingId === post.id ? 'Abriendo…' : 'Editar'}
              </Button>
              <Button
                variant="ghost"
                className="min-h-11 text-lost"
                aria-label={`Quitar ${post.title}`}
                disabled={loadingId !== null || removeAction.pending}
                onClick={() => void remove(post)}
              >
                <Trash2 className="size-5" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-input bg-card p-8">
          <Newspaper className="size-6 text-teal-700" aria-hidden="true" />
          <p className="mt-2 font-heading text-xl font-bold">Todavía no hay noticias</p>
          <p className="mt-1 text-ink-2">Las que publiques se ven en las noticias del sitio.</p>
        </div>
      )}
    </div>
  )
}
