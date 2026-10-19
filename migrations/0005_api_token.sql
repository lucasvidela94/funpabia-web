-- API tokens for the public REST API (docs/spec/api-rest.md, section 5). Own table: the
-- installed better-auth has no API key plugin, and scopes stay under our control. The value is
-- shown once at creation; only its SHA-256 hash is stored. Revoking is a soft delete so the
-- history (who created what) stays.
CREATE TABLE api_token (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_user (id),
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  scopes TEXT NOT NULL DEFAULT '["agenda-events:write"]',
  expires_at TEXT NOT NULL,
  discarded_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE INDEX idx_api_token_hash ON api_token (token_hash);
CREATE INDEX idx_api_token_user ON api_token (user_id);
