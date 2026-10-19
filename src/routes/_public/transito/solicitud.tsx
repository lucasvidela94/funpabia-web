import { createFileRoute } from '@tanstack/react-router'
import { ApplicationForm } from '@/components/site/application-form'
import { PageIntro } from '@/components/site/page-intro'

export const Route = createFileRoute('/_public/transito/solicitud')({
  head: () => ({
    meta: [{ title: 'Ofrecer tránsito | Funpabia' }, { name: 'robots', content: 'noindex' }],
  }),
  component: FosterRequest,
})

function FosterRequest() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:pt-14">
      <PageIntro title="Ofrecer tránsito">
        <p>Tres pasos cortos. Cuando haya un animal que encaje con tu casa, te escribimos.</p>
      </PageIntro>
      <div className="mt-8">
        <ApplicationForm type="foster" />
      </div>
    </div>
  )
}
