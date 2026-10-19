# Anti-slop (vendored)

- Source: `dmmulroy/anti-slop`, skill `install-anti-slop`, bundle hash `1b9b5d3c0d9e0ef8dd7631f4d637e66b62a73e34dceaf4ae07c0d3de376fd7d7` (see `skills-lock.json`).
- Upstream commit: unknown. The copy comes from the skill bundle's `assets/anti-slop`, which does not record a commit.
- Installed: 2026-10-17 with `node .agents/skills/install-anti-slop/scripts/install.mjs`, unmodified.
- Plugin dependencies: `oxlint` and `@oxlint/plugins`, both pinned at `1.88.0`.
- Registered in `.oxlintrc.json` via `jsPlugins`; all 18 generic rules plus `oxc/no-accumulating-spread` are `error`. The Effect plugin is not enabled (the repo does not depend on `effect`).
- Local deviations: none. This directory is ignored by oxlint and oxfmt.
- Update path: the `install-anti-slop` skill, `references/update.md`. No pristine base is kept, so the next update is a conservative port.
