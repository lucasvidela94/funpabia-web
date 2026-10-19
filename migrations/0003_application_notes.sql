-- Internal notes on each application (spec 6.4: "notas internas"). Only the committee reads them;
-- they never reach the public site or the audit trail.
ALTER TABLE application ADD COLUMN internal_notes TEXT;
