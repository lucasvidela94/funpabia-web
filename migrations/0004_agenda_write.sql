-- Agenda events become editable (spec 6.7): who created one, and a soft delete so the public
-- agenda drops an event without losing it. `source` already holds where the data came from.
ALTER TABLE agenda_event ADD COLUMN created_by TEXT REFERENCES app_user (id);
ALTER TABLE agenda_event ADD COLUMN discarded_at TEXT;
