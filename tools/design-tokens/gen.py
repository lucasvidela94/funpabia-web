"""Single source of truth for the design tokens.

Run: python3 -I tools/design-tokens/gen.py

Writes:
  docs/design-system/tokens.json   tokens + contrast report
  docs/design-system/tokens.css    plain :root variables (used by preview.html), with legacy Spanish aliases
  src/styles/tokens.css            Tailwind v4 @theme + shadcn semantic variables (used by the app)

Exits 1 when a required contrast pair falls below its minimum.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs" / "design-system"
SRC_CSS = ROOT / "src" / "styles" / "tokens.css"


def lum(h):
    r, g, b = [int(h[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def cr(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


# Reference only: sampled from the 320px Facebook profile photo. Never used at runtime.
brand_real = {
    "logo-black": "#010102",
    "dog-turquoise": "#5CC2C2",
    "ribbon-green": "#04847C",
    "rosette-yellow": "#EEED91",
    "cat-lilac": "#BE8AB7",
    "text-white": "#FFFFFF",
}

t = {
    "color": {
        "brand": {
            "teal-900": "#053F3B",
            "teal-700": "#04665F",
            "teal-600": "#04847C",
            "teal-100": "#D5EFEC",
            "turquoise-500": "#5CC2C2",
            "turquoise-100": "#E3F5F4",
            "yellow-400": "#EEED91",
            "yellow-100": "#FBFAE0",
            "lilac-400": "#BE8AB7",
            "lilac-700": "#7D4A76",
            "lilac-100": "#F3E8F1",
        },
        "neutral": {
            "ink": "#1C1B19",
            "ink-2": "#4A4642",
            "gray-500": "#736D66",  # was #7A746D: 4.14:1 on sand, now 4.58:1
            "line-strong": "#8A8379",  # input and control borders, >= 3:1 on every surface
            "line": "#E6DFD3",  # decorative dividers only
            "sand": "#F7F2E9",
            "paper": "#FFFDF9",
            "white": "#FFFFFF",
            # The logo's own background. Only for the footer, where the logo JPG sits on it seamlessly.
            "logo-black": "#010102",
            "gray-300": "#BDB6AC",  # secondary text on logo-black
        },
        # Status colors named after the domain states they paint; "-soft" is the tinted background.
        "status": {
            "adopted": "#2F7A47",
            "adopted-soft": "#E3F2E6",
            "urgent": "#9A4508",
            "urgent-soft": "#FDEBD7",
            "lost": "#B3261E",
            "lost-soft": "#FBE4E1",
            "found": "#1F5F8B",
            "found-soft": "#E1EEF7",
        },
    },
    "font": {
        "heading": "'Figtree Variable', 'Figtree', system-ui, sans-serif",
        "sans": "'Figtree Variable', 'Figtree', system-ui, sans-serif",
    },
    "fontSize": {
        "xs": "0.75rem",
        "sm": "0.875rem",
        "base": "1rem",
        "lg": "1.125rem",
        "xl": "1.375rem",
        "2xl": "1.75rem",
        "3xl": "2.25rem",
        "4xl": "3rem",
    },
    "lineHeight": {"heading": "1.15", "body": "1.55"},
    "space": {"1": "4px", "2": "8px", "3": "12px", "4": "16px", "5": "24px", "6": "32px", "7": "48px", "8": "64px"},
    "radius": {"sm": "6px", "md": "12px", "lg": "20px", "pill": "999px"},
    "shadow": {"card": "0 1px 2px rgba(28,27,25,.06), 0 4px 12px rgba(28,27,25,.06)"},
}

c = t["color"]
B, N, S = c["brand"], c["neutral"], c["status"]

# shadcn/ui semantic variables (light theme only for now) -> palette token
shadcn = {
    "background": "paper",
    "foreground": "ink",
    "card": "white",
    "card-foreground": "ink",
    "popover": "white",
    "popover-foreground": "ink",
    "primary": "teal-700",
    "primary-foreground": "white",
    "secondary": "teal-100",
    "secondary-foreground": "teal-900",
    "muted": "sand",
    "muted-foreground": "gray-500",
    "accent": "yellow-400",
    "accent-foreground": "ink",
    "destructive": "lost",
    "destructive-foreground": "white",
    "border": "line",
    "input": "line-strong",
    "ring": "teal-700",
    # Panel sidebar: the dark teal block of the site, with the rosette yellow marking where you are.
    "sidebar": "teal-900",
    "sidebar-foreground": "white",
    "sidebar-primary": "yellow-400",
    "sidebar-primary-foreground": "ink",
    "sidebar-accent": "teal-700",
    "sidebar-accent-foreground": "white",
    "sidebar-border": "teal-700",
    "sidebar-ring": "yellow-400",
}

# Spanish names used by docs/design-system/preview.html and design-system.md prose.
legacy_aliases = {
    "tinta": "ink",
    "tinta-2": "ink-2",
    "gris-500": "gray-500",
    "borde-fuerte": "line-strong",
    "borde": "line",
    "arena": "sand",
    "papel": "paper",
    "blanco": "white",
    "turquesa-500": "turquoise-500",
    "turquesa-100": "turquoise-100",
    "amarillo-400": "yellow-400",
    "amarillo-100": "yellow-100",
    "lila-400": "lilac-400",
    "lila-700": "lilac-700",
    "lila-100": "lilac-100",
    "exito-adoptado": "adopted",
    "exito-bg": "adopted-soft",
    "aviso-urgente": "urgent",
    "aviso-bg": "urgent-soft",
    "error-perdido": "lost",
    "error-bg": "lost-soft",
    "info-encontrado": "found",
    "info-bg": "found-soft",
}

# (label, fg, bg, minimum ratio). 4.5 = text, 3 = icons / control boundaries / large text.
pairs = [
    ("ink on paper", N["ink"], N["paper"], 4.5),
    ("ink-2 on paper", N["ink-2"], N["paper"], 4.5),
    ("ink-2 on sand", N["ink-2"], N["sand"], 4.5),
    ("gray-500 on paper", N["gray-500"], N["paper"], 4.5),
    ("gray-500 on sand (muted-foreground)", N["gray-500"], N["sand"], 4.5),
    ("gray-500 on white (card)", N["gray-500"], N["white"], 4.5),
    ("white on teal-700 (primary button)", "#FFFFFF", B["teal-700"], 4.5),
    ("white on teal-900 (dark CTA)", "#FFFFFF", B["teal-900"], 4.5),
    ("teal-700 on paper (links)", B["teal-700"], N["paper"], 4.5),
    ("teal-700 on sand (links)", B["teal-700"], N["sand"], 4.5),
    ("teal-700 on teal-100", B["teal-700"], B["teal-100"], 4.5),
    ("teal-900 on teal-100 (chip)", B["teal-900"], B["teal-100"], 4.5),
    ("teal-900 on turquoise-100 (dog chip)", B["teal-900"], B["turquoise-100"], 4.5),
    ("ink on turquoise-500", N["ink"], B["turquoise-500"], 4.5),
    ("ink on yellow-400 (yellow button)", N["ink"], B["yellow-400"], 4.5),
    ("yellow-400 on teal-900 (focus ring on dark blocks)", B["yellow-400"], B["teal-900"], 4.5),
    ("ink on lilac-400", N["ink"], B["lilac-400"], 4.5),
    ("lilac-700 on lilac-100 (cat chip)", B["lilac-700"], B["lilac-100"], 4.5),
    ("adopted on adopted-soft", S["adopted"], S["adopted-soft"], 4.5),
    ("urgent on urgent-soft", S["urgent"], S["urgent-soft"], 4.5),
    ("lost on lost-soft", S["lost"], S["lost-soft"], 4.5),
    ("found on found-soft", S["found"], S["found-soft"], 4.5),
    ("white on lost", "#FFFFFF", S["lost"], 4.5),
    ("white on adopted", "#FFFFFF", S["adopted"], 4.5),
    ("white on urgent", "#FFFFFF", S["urgent"], 4.5),
    ("white on teal-700 (sidebar hover)", "#FFFFFF", B["teal-700"], 4.5),
    ("ink on yellow-400 (sidebar active item)", N["ink"], B["yellow-400"], 4.5),
    ("white on logo-black (footer)", "#FFFFFF", N["logo-black"], 4.5),
    ("gray-300 on logo-black (footer notes)", N["gray-300"], N["logo-black"], 4.5),
    ("turquoise-500 on logo-black (footer links)", B["turquoise-500"], N["logo-black"], 4.5),
    ("yellow-400 on logo-black (focus ring in footer)", B["yellow-400"], N["logo-black"], 3.0),
    ("line-strong on paper (input)", N["line-strong"], N["paper"], 3.0),
    ("line-strong on sand (input)", N["line-strong"], N["sand"], 3.0),
    ("line-strong on white (input)", N["line-strong"], N["white"], 3.0),
    ("teal-700 on paper (focus ring)", B["teal-700"], N["paper"], 3.0),
    ("teal-600 on paper (goal bar)", B["teal-600"], N["paper"], 3.0),
    ("teal-600 on sand (goal bar on track)", B["teal-600"], N["sand"], 3.0),
]

# Known limits, reported but not enforced: these never carry text or meaning alone.
informational = [
    ("white on turquoise-500", "#FFFFFF", B["turquoise-500"]),
    ("white on lilac-400", "#FFFFFF", B["lilac-400"]),
    ("turquoise-500 on paper", B["turquoise-500"], N["paper"]),
    ("lilac-400 on paper", B["lilac-400"], N["paper"]),
    ("yellow-400 on paper", B["yellow-400"], N["paper"]),
    ("line (decorative) on paper", N["line"], N["paper"]),
]

rows, failed = [], []
for label, fg, bg, need in pairs:
    r = cr(fg, bg)
    ok = r >= need
    rows.append((label, fg, bg, int(r * 100) / 100, "OK" if ok else "FAIL", need))
    if not ok:
        failed.append((label, r, need))
for label, fg, bg in informational:
    r = cr(fg, bg)
    rows.append((label, fg, bg, int(r * 100) / 100, "DECORATIVE ONLY" if r < 3 else "OK", 0))

for row in rows:
    print(row)

json.dump(
    {
        "brand_real_logo": brand_real,
        **t,
        "shadcn": shadcn,
        "contrast_checks": [
            dict(pair=a, fg=b, bg=c_, ratio=d, verdict=e, minimum=f) for a, b, c_, d, e, f in rows
        ],
    },
    open(DOCS / "tokens.json", "w"),
    ensure_ascii=False,
    indent=2,
)

raw = []
for grp in ("brand", "neutral", "status"):
    raw += [f"  --color-{k}: {v};" for k, v in c[grp].items()]
fonts = [f"  --font-{k}: {v};" for k, v in t["font"].items()]
sizes = [f"  --text-{k}: {v};" for k, v in t["fontSize"].items()]
leading = [f"  --leading-{k}: {v};" for k, v in t["lineHeight"].items()]
radii = [f"  --radius-{k}: {v};" for k, v in t["radius"].items()]
spaces = [f"  --space-{k}: {v};" for k, v in t["space"].items()]
shadow = f"  --shadow-card: {t['shadow']['card']};"

# Plain CSS for preview.html (no Tailwind directives).
plain = [":root {", "  /* Reference only: sampled from the logo photo */"]
plain += [f"  --brand-real-{k}: {v};" for k, v in brand_real.items()]
plain += raw + fonts + sizes + leading + spaces + radii + [shadow]
plain += ["  /* Legacy Spanish names, kept only so preview.html and the design-system.md prose keep working */"]
plain += [f"  --color-{old}: var(--color-{new});" for old, new in legacy_aliases.items()]
plain += [
    "  --font-titulos: var(--font-heading);",
    "  --font-texto: var(--font-sans);",
    "  --color-primario: var(--color-teal-700);",
    "  --color-primario-hover: var(--color-teal-900);",
    "  --color-fondo: var(--color-paper);",
    "  --color-fondo-alt: var(--color-sand);",
    "  --color-texto: var(--color-ink);",
    "  --color-texto-suave: var(--color-ink-2);",
    "  --color-link: var(--color-teal-700);",
    "}",
]
(DOCS / "tokens.css").write_text("\n".join(plain) + "\n")

# Tailwind v4 + shadcn/ui file used by the app. --font-sans and --font-heading are theme variables
# directly, so no mapping is needed for them.
app = ["/* Generated by tools/design-tokens/gen.py. Do not edit by hand. */", "", "@theme {"]
app += raw + fonts + sizes + [f"  --leading-{k}: {v};" for k, v in t["lineHeight"].items()]
app += radii + [shadow, "}", "", ":root {", f"  --radius: {t['radius']['md']};"]
app += [f"  --{k}: var(--color-{v});" for k, v in shadcn.items()]
app += ["}", "", "@theme inline {"]
app += [f"  --color-{k}: var(--{k});" for k in shadcn]
app += ["}"]
SRC_CSS.parent.mkdir(parents=True, exist_ok=True)
SRC_CSS.write_text("\n".join(app) + "\n")

if failed:
    print("\nRequired contrast pairs FAIL:", file=sys.stderr)
    for label, r, need in failed:
        print(f"  {label}: {r:.2f} < {need}", file=sys.stderr)
    sys.exit(1)
print("\nAll required contrast pairs pass.")
