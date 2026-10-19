"""Derives the site icons and the default share image from public/brand/logo-ref.jpg.

Run from the repo root: python3 -I tools/brand-assets/gen.py

The only source is the 320 px reference logo (docs/design-system/design-system.md, section 1), so
every output is an upscale of it. When the foundation sends the vector logo, replace the source
here and run the script again; nothing else changes.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "public" / "brand" / "logo-ref.jpg"
PUBLIC = ROOT / "public"

# The logo's own black (tokens: logo-black), so the JPG sits on it without a visible box.
LOGO_BLACK = (1, 1, 2)

# The rosette with the animals, without the lettering below it.
EMBLEM_BOX = (35, 12, 295, 262)

# Facebook and WhatsApp crop to 1.91:1; the logo is centered with room on both sides.
SHARE_SIZE = (1200, 630)


def square(image: Image.Image, size: int) -> Image.Image:
    side = max(image.size)
    canvas = Image.new("RGB", (side, side), LOGO_BLACK)
    canvas.paste(image, ((side - image.width) // 2, (side - image.height) // 2))

    return canvas.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    logo = Image.open(SOURCE).convert("RGB")
    emblem = logo.crop(EMBLEM_BOX)

    square(emblem, 512).save(PUBLIC / "icon-512.png", optimize=True)
    square(emblem, 192).save(PUBLIC / "icon-192.png", optimize=True)
    square(logo, 180).save(PUBLIC / "apple-touch-icon.png", optimize=True)
    square(emblem, 48).save(PUBLIC / "favicon.ico", sizes=[(32, 32), (48, 48)])

    plate = Image.new("RGB", SHARE_SIZE, LOGO_BLACK)
    height = SHARE_SIZE[1]
    scaled = logo.resize((height, height), Image.Resampling.LANCZOS)
    plate.paste(scaled, ((SHARE_SIZE[0] - height) // 2, 0))

    (PUBLIC / "og").mkdir(exist_ok=True)
    plate.save(PUBLIC / "og" / "default.png", optimize=True)


if __name__ == "__main__":
    main()
