-- Raffles (spec 6.12) as the committee's ledger, not a ticket office: the foundation keeps selling
-- the way it does today (paper books, payment by alias or cash) and the panel records who has each
-- number. Nothing is sold, paid or drawn through the site. The winner comes from an outside draw
-- (usually the Quiniela) and is only written down here.

CREATE TABLE raffle (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  -- Free text, one prize per line, in the order they are drawn.
  prizes TEXT NOT NULL,
  ticket_price INTEGER NOT NULL CHECK (ticket_price > 0),
  -- Numbers go from 0 to ticket_count - 1, shown with leading zeros (000 to 999).
  ticket_count INTEGER NOT NULL CHECK (ticket_count BETWEEN 10 AND 1000),
  draw_on TEXT,
  -- How the winner is picked, as it is announced: "Quiniela Nocturna de Río Negro".
  draw_method TEXT,
  -- Number of the provincial permit, when there is one. The public page (later) requires it.
  permit TEXT,
  goal_id TEXT REFERENCES goal (id),
  -- draft: being set up. selling: numbers are being sold. closed: no more sales. drawn: the winner
  -- is recorded and the raffle is read-only.
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'selling', 'closed', 'drawn')),
  winning_number INTEGER,
  -- When the paid total went into the goal as donations. From then on the tickets are frozen.
  proceeds_recorded_at TEXT,
  created_by TEXT REFERENCES app_user (id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK ((status = 'drawn') = (winning_number IS NOT NULL)),
  CHECK (winning_number IS NULL OR (winning_number >= 0 AND winning_number < ticket_count)),
  CHECK (proceeds_recorded_at IS NULL OR (goal_id IS NOT NULL AND status IN ('closed', 'drawn')))
) STRICT;

-- A number with no row is free. The primary key is what makes selling one number twice impossible.
-- Buyer data is personal data: committee only, never public.
CREATE TABLE raffle_ticket (
  raffle_id TEXT NOT NULL REFERENCES raffle (id) ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number >= 0),
  status TEXT NOT NULL CHECK (status IN ('reserved', 'paid')),
  buyer_name TEXT,
  buyer_phone TEXT,
  -- Who sold it: a volunteer's name, not necessarily a panel user.
  seller TEXT,
  payment_method TEXT CHECK (payment_method IN ('alias', 'cbu', 'mp_link', 'cash')),
  paid_on TEXT,
  recorded_by TEXT REFERENCES app_user (id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (raffle_id, number),
  CHECK ((status = 'paid') = (payment_method IS NOT NULL)),
  CHECK ((status = 'paid') = (paid_on IS NOT NULL))
) STRICT, WITHOUT ROWID;

-- The audit log learns a new entity. Enums are CHECK constraints, so the table is rebuilt; nothing
-- references it, and every row is copied as it is.
CREATE TABLE audit_log_next (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES app_user (id),
  entity TEXT NOT NULL CHECK (entity IN ('animal', 'application', 'donation', 'expense', 'raffle')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  changes TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (json_valid(changes))
) STRICT;

INSERT INTO audit_log_next (id, user_id, entity, entity_id, action, changes, created_at)
SELECT id, user_id, entity, entity_id, action, changes, created_at FROM audit_log;

DROP TABLE audit_log;

ALTER TABLE audit_log_next RENAME TO audit_log;

CREATE INDEX audit_log_entity ON audit_log (entity, entity_id, created_at);
