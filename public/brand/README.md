# RhMask brand files

Rendered from the live mark (`src/app/icon.svg`) and the site's one face, JetBrains Mono. JPEG has no
transparency, so every file carries its own solid ground: pick the one that matches where it lands.

| File | Size | Ground | Use it for |
|:--|:--|:--|:--|
| `rhmask-icon-1024.jpg` | 1024×1024 | green, full bleed | App icon, profile picture, favicon source. Platforms apply their own rounding. |
| `rhmask-mark-dark-1024.jpg` | 1024×1024 | black `#000000` | The mark with breathing room, for dark surfaces. |
| `rhmask-mark-light-1024.jpg` | 1024×1024 | white | The same, for light surfaces and print. |
| `rhmask-logo-dark-2048x1024.jpg` | 2048×1024 | black `#000000` | Horizontal lockup, mark plus wordmark. The default logo. |
| `rhmask-logo-light-2048x1024.jpg` | 2048×1024 | white | Horizontal lockup on light backgrounds. |
| `rhmask-banner-3000x1000.jpg` | 3000×1000 | black `#000000` | Wide header, lockup with the tagline and a prompt line. Safe for a 3:1 crop. |

## Rules

- **Do not recolour the mark.** Green is `#ccff00`, the face is `#000000`. Both come from `globals.css`.
- **Do not stretch.** Scale proportionally; the lockup already carries its own spacing.
- **Keep clear space** of at least a quarter of the mark's height on every side.
- **The wordmark is lowercase.** `rhmask` in the lockup, `RhMask` only in running prose.
- **Need transparency or a vector?** Use `src/app/icon.svg` directly. These JPEGs exist because JPEG was asked
  for; SVG is the better source for anything you will resize or place on a coloured ground.

## Regenerating

These are rendered, not hand-drawn, so they never drift from the product. If the mark or the palette changes,
re-render rather than editing the JPEGs.
