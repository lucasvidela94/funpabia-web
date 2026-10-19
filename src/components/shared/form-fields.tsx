import { useId, type ComponentProps, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Form fields with a visible label, an optional hint and the error right under the field.

// After a failed validation: scroll to the first field with an error and focus it, so someone using
// a keyboard or a screen reader does not have to look for it. Radio groups mark the fieldset, not
// the inputs, so the first radio of the group takes the focus.
export function focusFirstError(form: HTMLElement | null) {
  const field = form?.querySelector<HTMLElement>(
    '[aria-invalid="true"], fieldset[aria-describedby] input',
  )

  field?.scrollIntoView({ block: 'center' })
  field?.focus({ preventScroll: true })
}

function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={id} className="mt-1.5 text-sm font-semibold text-lost">
      {error}
    </p>
  ) : null
}

export function ChoiceField({
  legend,
  name,
  options,
  value,
  onChange,
  error,
}: {
  legend: string
  name: string
  options: { value: string; label: string }[]
  value: string | undefined
  onChange: (value: string) => void
  error?: string
}) {
  const errorId = useId()

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex min-h-12 cursor-pointer items-center gap-2.5 rounded-md border bg-card px-4 font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
              value === option.value
                ? 'border-teal-900 bg-secondary text-secondary-foreground'
                : 'border-input hover:border-teal-700',
              error && value === undefined && 'border-lost',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="size-5 accent-teal-700"
            />
            {option.label}
          </label>
        ))}
      </div>
      <FieldError id={errorId} error={error} />
    </fieldset>
  )
}

export function TextField({
  label,
  hint,
  error,
  ...props
}: { label: string; hint?: string; error?: string } & ComponentProps<'input'>) {
  const id = useId()

  return (
    <div>
      <Label htmlFor={id} className="mb-2 text-base font-semibold">
        {label}
      </Label>
      {hint ? (
        <p id={`${id}-hint`} className="-mt-1 mb-2 text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className="h-12 bg-card text-base"
        {...props}
      />
      <FieldError id={`${id}-error`} error={error} />
    </div>
  )
}

export function TextAreaField({
  label,
  hint,
  error,
  ...props
}: { label: string; hint?: string; error?: string } & ComponentProps<'textarea'>) {
  const id = useId()

  return (
    <div>
      <Label htmlFor={id} className="mb-2 text-base font-semibold">
        {label}
      </Label>
      {hint ? (
        <p id={`${id}-hint`} className="-mt-1 mb-2 text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <textarea
        id={id}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-base aria-invalid:border-lost"
        {...props}
      />
      <FieldError id={`${id}-error`} error={error} />
    </div>
  )
}

export function CheckboxField({
  checked,
  onChange,
  error,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
  children: ReactNode
}) {
  const id = useId()

  return (
    <div>
      <label className="flex min-h-12 cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 size-5 shrink-0 accent-teal-700"
        />
        <span>{children}</span>
      </label>
      <FieldError id={`${id}-error`} error={error} />
    </div>
  )
}

function describedBy(id: string, hint?: string, error?: string) {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean)

  return ids.length > 0 ? ids.join(' ') : undefined
}

// The bottom of every panel form: the submit button with its pending text, then the save error,
// the success note and the "check the marked fields" hint, in one place.
export function FormFooter({
  submitLabel,
  pending,
  pendingLabel,
  error,
  success,
  hasErrors,
}: {
  submitLabel: string
  pending: boolean
  pendingLabel?: string
  error?: string | null
  success?: string | null
  hasErrors: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit" disabled={pending} className="h-12 px-8 text-base font-bold">
        {pending ? (pendingLabel ?? 'Guardando…') : submitLabel}
      </Button>
      <p aria-live="polite" className="text-sm font-semibold">
        {error ? <span className="text-lost">{error}</span> : null}
        {success ? <span className="text-adopted">{success}</span> : null}
        {hasErrors ? <span className="text-lost">Revisá los campos marcados.</span> : null}
      </p>
    </div>
  )
}
