-- Lost and found reports (spec 6.6). A visitor reports without an account; the committee approves
-- before anything is public. Location is a zone (a town), never a street or a pin: that is the
-- approximate location the spec asks to publish, and it also gives proximity search without a map.

-- Town centers, rounded: only used to tell which zones are near each other. Which towns the
-- foundation really covers is still open (spec 17); change this list with a new migration.
CREATE TABLE zone (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  position INTEGER NOT NULL
) STRICT;

INSERT INTO zone (id, slug, name, latitude, longitude, position) VALUES
  ('zone-cipolletti', 'cipolletti', 'Cipolletti', -38.934, -67.990, 1),
  ('zone-fernandez-oro', 'fernandez-oro', 'Fernández Oro', -38.950, -67.870, 2),
  ('zone-allen', 'allen', 'Allen', -38.970, -67.830, 3),
  ('zone-cinco-saltos', 'cinco-saltos', 'Cinco Saltos', -38.820, -68.070, 4),
  ('zone-neuquen', 'neuquen', 'Neuquén capital', -38.950, -68.060, 5),
  ('zone-centenario', 'centenario', 'Centenario', -38.830, -68.130, 6),
  ('zone-general-roca', 'general-roca', 'General Roca', -39.030, -67.580, 7),
  ('zone-cervantes', 'cervantes', 'Cervantes', -39.000, -67.400, 8);

CREATE TABLE lost_found_report (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('lost', 'found')),
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'other')),
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female', 'unknown')),
  size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large')),
  color TEXT NOT NULL,
  marks TEXT,
  event_on TEXT NOT NULL,
  description TEXT NOT NULL,
  zone_id TEXT NOT NULL REFERENCES zone (id),
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  -- pending: waiting for the committee. active: public. reunited: closed by the owner or the
  -- committee, still readable as a happy ending. hidden: rejected or taken down.
  -- Expiry is not a status: an active report past expires_at just stops being listed.
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'reunited', 'hidden')),
  expires_at TEXT NOT NULL,
  -- SHA-256 of the secret in the owner's edit link, so a leak of this table opens nothing.
  edit_token_hash TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE INDEX lost_found_report_public ON lost_found_report (status, kind, event_on DESC);
CREATE INDEX lost_found_report_zone ON lost_found_report (zone_id);

CREATE TABLE lost_found_photo (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES lost_found_report (id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL UNIQUE,
  position INTEGER NOT NULL,
  width INTEGER,
  height INTEGER
) STRICT;

CREATE INDEX lost_found_photo_report ON lost_found_photo (report_id, position);
