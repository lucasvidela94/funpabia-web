import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth/client'
import { getSession } from '@/lib/auth/session'

export const Route = createFileRoute('/_public/login')({
  beforeLoad: async () => {
    if (await getSession()) {
      throw redirect({ to: '/panel' })
    }
  },
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const form = new FormData(event.currentTarget)

    const { error: signInError } = await authClient.signIn.email({
      email: String(form.get('email')),
      password: String(form.get('password')),
    })

    setPending(false)

    if (signInError) {
      setError(
        signInError.status === 429
          ? 'Demasiados intentos. Esperá un minuto y probá de nuevo.'
          : 'Email o contraseña incorrectos.',
      )

      return
    }

    await navigate({ to: '/panel' })
  }

  return (
    <div className="mx-auto flex max-w-md px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">
            <h1>Ingresar al panel</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* POST, so a submit before the page hydrates never puts the password in the URL. */}
          <form method="post" onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="username" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>
            {error ? (
              <p id="login-error" role="alert" className="text-sm font-semibold text-lost">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
