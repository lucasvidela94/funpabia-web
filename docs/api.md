# Public REST API v1

For a third party (today: the Municipio de Cipolletti or Zoonosis) to load or read data without using the panel. Versioned: breaking changes go to `/api/v2`, never into `/api/v1`. The full technical spec is `docs/spec/api-rest.md`.

Base URL: `https://funpabia.lucasan-videla.workers.dev/api/v1`.

## Resource: agenda events

Five endpoints on one resource, collection and item, no actions in the URL.

| Method | Route                | Auth                               | What it does                        |
| ------ | -------------------- | ---------------------------------- | ----------------------------------- |
| GET    | `/agenda-events`     | public                             | Upcoming events. Query: `limit` 1–100, default 20. |
| GET    | `/agenda-events/:id` | public                             | One event.                          |
| POST   | `/agenda-events`     | token, scope `agenda-events:write` | Creates an event. Replies `201`.    |
| PATCH  | `/agenda-events/:id` | token, scope `agenda-events:write` | Edits an event owned by the token.  |
| DELETE | `/agenda-events/:id` | token, scope `agenda-events:write` | Discards (soft delete) an event owned by the token. |

"Owned" means created by the token's own user: a Municipio token cannot edit Funpabia's events. Anything else is a `404`, so ownership never leaks.

The event fields are the module's (`type`, `title`, `startsAt`, `endsAt`, `venue`, `address`, `neighborhood`, `organizer`, `requirements`, `appointmentUrl`, `appointmentPhone`, `source`). Dates carry an offset (`2026-11-03T09:00:00-03:00`). A list replies `{ "data": [...] }`, one resource `{ "data": {...} }`.

## Auth

Token Bearer: `Authorization: Bearer fnp_...`. Tokens are created and revoked from the panel (`/panel/api`, committee only), belong to a municipality or admin user, and expire after 12 months. The value is shown once at creation; only its hash is stored.

## Example

```bash
curl https://funpabia.lucasan-videla.workers.dev/api/v1/agenda-events?limit=5

curl -X POST https://funpabia.lucasan-videla.workers.dev/api/v1/agenda-events \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer fnp_...' \
  -d '{"type":"neutering","title":"Castración gratuita","startsAt":"2026-11-10T09:00:00-03:00","endsAt":"","venue":"","address":"","neighborhood":"Centro","organizer":"municipality","requirements":"Con turno previo.","appointmentUrl":"","appointmentPhone":"","source":"Municipio"}'
```

## Errors

`{ "error": { "code": "...", "message": "...", "details": [...] } }` with the matching HTTP status. Validation details only carry the field path and the code (`{ "path": "startsAt", "code": "invalid_format" }`).

| Status | Code | When |
| ------ | ---- | ---- |
| 400 | `validation_failed` | A field is invalid. |
| 400 | `body_too_large` / `invalid_json` | The body is over 16 KB or is not JSON. |
| 401 | `unauthorized` | Missing, unknown, revoked or expired token. |
| 403 | `forbidden` | The token cannot do that. |
| 404 | `not_found` | No such event, or not owned by the token. |
| 429 | `rate_limited` | Too many requests (with `Retry-After`). |

Limits: 30 reads per minute per IP, 20 writes per minute per token. Public GETs allow any browser origin (`Access-Control-Allow-Origin: *`); token writes do not use CORS.
