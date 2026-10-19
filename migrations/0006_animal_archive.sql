-- Animals can be archived from the panel: they leave the panel lists, the dashboard and the pickers
-- but keep their adoption and foster history. Archiving also unpublishes, so the public catalog,
-- profile and sitemap (which all filter on published) need no change. An animal with no history
-- can be deleted for good instead (src/lib/animals/lib/removal.ts).
ALTER TABLE animal ADD COLUMN discarded_at TEXT;
