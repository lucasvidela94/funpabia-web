// Creates a panel user in D1: pnpm create-admin --email a@b.com --name "Ana" [--role admin] [--remote]
//
// The password is read from the terminal (hidden), or from ADMIN_PASSWORD, and never printed.
// It is hashed with Better Auth's own hasher, so the account can sign in through the normal flow.

import { hashPassword } from 'better-auth/crypto'
import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline'

const ROLES = ['superadmin', 'admin', 'editor', 'veterinarian', 'municipality']
const MIN_PASSWORD_LENGTH = 12

function readFlag(name: string) {
  const index = process.argv.indexOf(`--${name}`)

  return index === -1 ? undefined : process.argv[index + 1]
}

function fail(message: string): never {
  process.stderr.write(`${message}\n`)
  process.exit(1)
}

function quote(value: string) {
  return `'${value.replaceAll("'", "''")}'`
}

const ENTER = ['\r', '\n']
const BACKSPACE = ['\u007f', '\b']
const CTRL_C = '\u0003'

// Reads a line from the keyboard without echoing it. Falls back to a plain line when stdin is piped.
function readHidden(prompt: string) {
  process.stdout.write(prompt)

  if (!process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin })

    return new Promise<string>((resolve) => {
      rl.once('line', (line) => {
        rl.close()
        resolve(line)
      })
    })
  }

  return new Promise<string>((resolve) => {
    let typed = ''

    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    function onData(chunk: string) {
      for (const char of chunk) {
        if (char === CTRL_C) {
          process.stdin.setRawMode(false)
          process.exit(130)
        }

        if (ENTER.includes(char)) {
          process.stdin.setRawMode(false)
          process.stdin.pause()
          process.stdin.off('data', onData)
          process.stdout.write('\n')
          resolve(typed)

          return
        }

        typed = BACKSPACE.includes(char) ? typed.slice(0, -1) : typed + char
      }
    }

    process.stdin.on('data', onData)
  })
}

const email = readFlag('email')?.trim().toLowerCase()
const name = readFlag('name')?.trim()
const role = readFlag('role') ?? 'admin'
const target = process.argv.includes('--remote') ? '--remote' : '--local'

if (!email || !/^[^\s@']+@[^\s@']+\.[^\s@']+$/.test(email)) {
  fail('Missing or invalid --email.')
}

if (!name) {
  fail('Missing --name.')
}

if (!ROLES.includes(role)) {
  fail(`Invalid --role. Use one of: ${ROLES.join(', ')}.`)
}

const password = process.env.ADMIN_PASSWORD ?? (await readHidden('Password: '))

if (password.length < MIN_PASSWORD_LENGTH) {
  fail(`The password needs at least ${MIN_PASSWORD_LENGTH} characters.`)
}

const userId = randomUUID()
const now = new Date().toISOString()
const hash = await hashPassword(password)

const sql = [
  `INSERT INTO app_user (id, email, name, role, email_verified, created_at, updated_at) VALUES (${quote(userId)}, ${quote(email)}, ${quote(name)}, ${quote(role)}, 1, ${quote(now)}, ${quote(now)});`,
  `INSERT INTO account (id, user_id, account_id, provider_id, password, created_at, updated_at) VALUES (${quote(randomUUID())}, ${quote(userId)}, ${quote(userId)}, 'credential', ${quote(hash)}, ${quote(now)}, ${quote(now)});`,
].join('\n')

const dir = mkdtempSync(join(tmpdir(), 'create-admin-'))
const file = join(dir, 'user.sql')

writeFileSync(file, sql, { mode: 0o600 })

const result = spawnSync(
  'pnpm',
  ['exec', 'wrangler', 'd1', 'execute', 'funpabia', target, '--file', file],
  { stdio: 'inherit' },
)

rmSync(dir, { recursive: true, force: true })

if (result.status !== 0) {
  fail('wrangler failed; the user was not created.')
}

process.stdout.write(`Created ${role} ${email} (${target.slice(2)}).\n`)
