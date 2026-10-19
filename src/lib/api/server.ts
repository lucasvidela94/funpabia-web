import { z } from 'zod'
import { logger } from '@/lib/logger'
import { ApiError, apiError, zodDetails } from './lib/errors'
import { checkRateLimit } from './lib/rate'
import { verifyToken, type VerifiedToken } from './lib/token'

// Server-only entry point for the REST route handlers (docs/spec/api-rest.md). It is only ever
// loaded with a dynamic import from inside `server.handlers` (like `@/lib/photos/server`), so
// the token verification and the rate counters never reach the browser bundle.

export { ApiError }

// withApi wraps a REST handler: it resolves the token, checks its scope, applies the rate
// limit, and turns exceptions into the error shape of docs/spec/api-rest.md (section 4). The
// token value is never logged, only its id.

type RateLimit = { max: number; windowSeconds: number }

type PublicOptions = {
  auth: 'public'
  /** Set for public GETs, which any site may call from a browser. Token writes never use CORS. */
  cors?: boolean
  limit: RateLimit
}

type TokenOptions = {
  auth: 'token'
  scope: string
  cors?: boolean
  limit: RateLimit
}

export function withApi(
  request: Request,
  options: TokenOptions,
  handler: (ctx: { token: VerifiedToken }) => Promise<Response>,
): Promise<Response>
export function withApi(
  request: Request,
  options: PublicOptions,
  handler: (ctx: { token: null }) => Promise<Response>,
): Promise<Response>
export async function withApi(
  request: Request,
  options: PublicOptions | TokenOptions,
  handler: (ctx: never) => Promise<Response>,
): Promise<Response> {
  async function cors(response: Response) {
    if (!options.cors) {
      return response
    }

    const headers = new Headers(response.headers)

    headers.set('Access-Control-Allow-Origin', '*')

    return new Response(response.body, { status: response.status, headers })
  }

  try {
    let token: VerifiedToken | null = null
    let key: string

    if (options.auth === 'token') {
      token = await verifyToken(request, options.scope)
      key = `token:${token.id}`
    } else {
      // An IP address is personal data (Ley 25.326): only its hash is stored, like the
      // public forms do in src/lib/rate-limit.
      const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'

      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`api|${ip}`))

      const hex = [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')

      key = `ip:${hex}`
    }

    const { limited, retryAfter } = await checkRateLimit(
      key,
      options.limit.max,
      options.limit.windowSeconds,
    )

    if (limited) {
      logger.warn('api.rate_limited', { tokenId: token?.id })
      const response = apiError(429, 'rate_limited', 'Too many requests.')

      response.headers.set('Retry-After', String(retryAfter))

      return cors(response)
    }

    // SAFETY: callers only see the overloads, which narrow the context to match the
    // options; the body below passes whichever context the options selected.
    const handle = handler as (ctx: { token: VerifiedToken | null }) => Promise<Response>
    const response = await handle({ token })

    logger.info('api.request', {
      method: request.method,
      status: response.status,
      tokenId: token?.id,
    })

    return cors(response)
  } catch (error) {
    if (error instanceof ApiError) {
      return cors(apiError(error.status, error.code, error.message))
    }

    if (error instanceof z.ZodError) {
      return cors(apiError(400, 'validation_failed', 'Some fields are invalid.', zodDetails(error)))
    }

    logger.error('api.failed', {
      method: request.method,
      message: error instanceof Error ? error.message : 'unknown',
    })

    return cors(apiError(500, 'internal_error', 'Something went wrong.'))
  }
}

// Bodies are small event objects; anything bigger is rejected before parsing.
const MAX_BODY_BYTES = 16 * 1024

// The schema validates at this boundary, so no unknown value reaches the caller.
export async function readJsonBody<Output>(
  request: Request,
  schema: z.ZodType<Output>,
): Promise<Output> {
  const declared = Number(request.headers.get('content-length') ?? 0)

  if (declared > MAX_BODY_BYTES) {
    throw new ApiError(400, 'body_too_large', 'The body is too large.')
  }

  const text = await request.text()

  if (text.length > MAX_BODY_BYTES) {
    throw new ApiError(400, 'body_too_large', 'The body is too large.')
  }

  let json: unknown

  try {
    json = JSON.parse(text)
  } catch {
    throw new ApiError(400, 'invalid_json', 'The body is not valid JSON.')
  }

  return schema.parse(json)
}
