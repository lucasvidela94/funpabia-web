import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { getNewsPost } from '@/lib/news'
import { pageMeta, plainText } from '@/lib/seo'

export const Route = createFileRoute('/_public/noticias/$slug')({
  loader: ({ params }) => getNewsPost({ data: { slug: params.slug } }),
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: pageMeta(
            `${loaderData.title} | Funpabia`,
            plainText(loaderData.paragraphs.at(0) ?? loaderData.title, 160),
          ),
        }
      : { meta: [{ title: 'No encontramos esta noticia | Funpabia' }] },
  component: Post,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <h1 className="font-heading text-4xl font-bold">No encontramos esta noticia</h1>
      <Link
        to="/noticias"
        className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline"
      >
        Ver todas las noticias
      </Link>
    </div>
  ),
})

function Post() {
  const post = Route.useLoaderData()

  return (
    <article className="mx-auto max-w-3xl px-4 pt-6 pb-20">
      <Link
        to="/noticias"
        className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Noticias
      </Link>
      <p className="mt-6 text-sm text-muted-foreground">
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      </p>
      <h1 className="mt-1 font-heading text-5xl font-bold tracking-[-0.03em] text-balance text-teal-900">
        {post.title}
      </h1>
      {post.image ? (
        <img
          src={post.image}
          alt=""
          className="mt-8 aspect-[16/9] w-full rounded-lg bg-sand object-cover"
        />
      ) : null}
      <div className="mt-8 flex max-w-[65ch] flex-col gap-5 text-lg">
        {post.paragraphs.map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>
    </article>
  )
}
