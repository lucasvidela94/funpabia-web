import type { DonationAccount } from '@/lib/settings'
import { CopyField } from './copy-field'

// Alias and CBU with a copy button (spec 6.5). Transfers are not confirmed automatically: the
// committee records them from the panel, so the goal bar can lag a few days.
export function DonationAccounts({ accounts }: { accounts: DonationAccount[] }) {
  return (
    <section
      id="alias"
      aria-labelledby="alias-title"
      className="scroll-mt-24 rounded-lg border bg-card p-6 sm:p-8"
    >
      <h2 id="alias-title" className="font-heading text-2xl font-bold">
        Transferencia
      </h2>
      {accounts.length > 0 ? (
        <>
          <div className="mt-3 flex flex-col gap-6">
            {accounts.map((account) => (
              <div key={account.alias}>
                <p className="font-semibold">{account.bank}</p>
                {account.holder ? (
                  <p className="text-sm text-ink-2">A nombre de {account.holder}</p>
                ) : null}
                <div className="mt-1">
                  <CopyField label="Alias" value={account.alias} />
                  {account.cbu ? <CopyField label="CBU" value={account.cbu} /> : null}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-ink-2">
            Las transferencias se suman a mano a la meta, así que el avance puede tardar unos días
            en actualizarse.
          </p>
        </>
      ) : (
        <p className="mt-3 text-ink-2">
          Estamos por publicar los datos de la cuenta. Mientras tanto, escribinos por las redes y te
          los pasamos.
        </p>
      )}
    </section>
  )
}
