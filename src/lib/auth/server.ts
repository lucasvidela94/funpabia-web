import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { env } from 'cloudflare:workers'
import { D1Dialect } from 'kysely-d1'
import { ROLES } from './lib/roles'
import {
  accountModel,
  rateLimitModel,
  sessionModel,
  userModel,
  verificationModel,
} from './lib/schema-map'

const THIRTY_DAYS = 60 * 60 * 24 * 30

export const auth = betterAuth({
  // Production pins the origin; local dev derives it from the request because the port changes.
  baseURL: import.meta.env.PROD ? env.BETTER_AUTH_URL : undefined,
  database: { dialect: new D1Dialect({ database: env.DB }), type: 'sqlite' },
  user: {
    ...userModel,
    additionalFields: {
      role: { type: [...ROLES], required: true, defaultValue: 'editor', input: false },
      discardedAt: { type: 'string', required: false, input: false, fieldName: 'discarded_at' },
    },
  },
  session: { ...sessionModel, expiresIn: THIRTY_DAYS, updateAge: 60 * 60 * 24 },
  account: accountModel,
  verification: verificationModel,
  // Accounts are created by an admin (pnpm create-admin), never by visitors.
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 12 },
  rateLimit: {
    enabled: true,
    storage: 'database',
    modelName: rateLimitModel.modelName,
    fields: rateLimitModel.fields,
    customRules: { '/sign-in/email': { window: 60, max: 5 } },
  },
  advanced: {
    useSecureCookies: import.meta.env.PROD,
    database: { generateId: () => crypto.randomUUID() },
    ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
  },
  plugins: [tanstackStartCookies()],
})
