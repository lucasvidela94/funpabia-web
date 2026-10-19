import { Link, createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '@/components/site/page-intro'
import { formatDate } from '@/lib/format'
import { getNews } from '@/lib/news'
import { pageMeta } from '@/lib/seo'

export const Route = createFileRoute('/_public/noticias/')({
  loader: () => getNews(),
  head: () => ({
    meta: pageMeta(
      'Noticias y campañas | Funpabia',
      'Rescates, adopciones, campañas de castración y lo que pasa en el refugio de Funpabia.',
    ),
  }),
  component: News,
})

function News() {
  const posts = Route.useLoaderData()

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 pb-20 sm:pt-14">
      <PageIntro title="Noticias y campañas">
        <p>Rescates, adopciones, campañas de castración y lo que pasa en el refugio.</p>
      </PageIntro>

      {posts.length > 0 ? (
        <ul className="mt-10 flex flex-col divide-y border-y">
          {posts.map((post) => (
            <li key={post.id}>
              <article className="flex gap-5 py-6">
                {post.image ? (
                  <img
                    src={post.image}
                    alt=""
                    loading="lazy"
                    className="hidden size-28 shrink-0 rounded-md bg-sand object-cover sm:block"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">
                    <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                  </p>
                  <h2 className="mt-1 font-heading text-2xl font-bold">
                    <Link
                      to="/noticias/$slug"
                      params={{ slug: post.slug }}
                      className="hover:underline"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-1 line-clamp-2 text-ink-2">{post.excerpt}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 rounded-lg bg-muted p-6 text-ink-2">
          Todavía no publicamos noticias acá. Mientras tanto, las novedades salen en Instagram y
          Facebook.
        </p>
      )}
    </div>
  )
}
