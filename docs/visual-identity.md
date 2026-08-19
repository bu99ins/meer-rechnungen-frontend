# Visual Identity

The frontend wears the **Deutsch und Meer** identity, taken from the company business card
(`_design/Deuch und meer vis 90x50 bleed3mm.pdf`, in the project root — two directories above this
repo's `src/frontend`, alongside `src/`).
This page records the palette, typeface and mark so later work doesn't reintroduce the previous
generic ("Invoice Builder" / indigo / Inter) identity by accident.

## Palette

Defined as the `brand` colour scale in [`tailwind.config.js`](../tailwind.config.js):

| Token | Hex | Role |
|---|---|---|
| `brand-deep` | `#1066A4` | Primary action colour — primary buttons, links, focus rings, active states, the header bar fill. |
| `brand-deep-dark` | `#0C4F80` | Hover/active shade of `brand-deep`. |
| `brand-sky` | `#1EABE2` | Accent only. Never the primary action colour, never the sole carrier of a meaning, never small text on a white background. |
| `brand-sky-dark` | `#1789B7` | Hover/active shade of `brand-sky`. |
| `brand-gray` | `#6A6B6D` | Muted text tone — subtitles, hints, table headers, dialog descriptions. |
| `brand-tint` | `#EAF3FA` | Light deep-blue wash for subtle backgrounds (e.g. icon circles). |

Red (`red-*`, Tailwind's stock palette) is deliberately **not** part of this scale — it stays as-is
for destructive actions (delete buttons) and validation/error states, which are semantic colours,
not brand colours.

`-dark` here names a hover/active shade, not a dark-mode variant — this app has no dark mode.

## Typography

Montserrat (Regular 400, Medium 500, SemiBold 600, Bold 700 — all four weights the UI's existing
`font-normal`/`font-medium`/`font-semibold`/`font-bold` utilities use) replaces Inter. Loaded via
Google Fonts in [`index.html`](../index.html); configured as the `sans` font family in
`tailwind.config.js`. The previously-unused `Söhne` entry in the font stack was removed along with
Inter.

## The mark

The seagull-and-waves mark ([`public/logo.svg`](../public/logo.svg)) is the favicon and the header
badge. It is not redrawn — its paths are extracted directly from the business card PDF's own vector
artwork: page 1 (0-indexed page 0), drawings at indices 0–4 (three `brand-deep` paths — the two
wave arcs plus a small accent — and two `brand-gray` seagull paths). Drawings 5–18 on that page are
the 14 glyphs of the circular "DEUTSCH
UND MEER" ring text and are excluded — the mark is the seagull and the two wave arcs only, per the
spec. The PDF's own fill colours round to `#1167A4`/`#6A6B6E` (colour-space rounding); the SVG's
fills are snapped one 8-bit value to the palette above (`#1066A4`/`#6A6B6D`), which changes no
shape.

In the header, the mark sits on a small white rounded tile rather than directly on the
`brand-deep` fill — its own colours (gray seagull, deep-blue arcs) don't read against a deep-blue
background, and the tile preserves the mark's original shapes and colours unaltered rather than
requiring a separate monochrome variant.

If the artwork ever needs re-extracting (e.g. the business card is redesigned), the source PDF's
vector drawings can be read with PyMuPDF (`page.get_drawings()`) — no exported SVG asset exists
anywhere except `public/logo.svg` itself.

## Header bar

The top header ([`src/components/Layout.tsx`](../src/components/Layout.tsx)) is filled with
`brand-deep`. Every piece of text in it (wordmark, nav links, signed-in email, sign-out control)
renders solid white — measured 6.07:1 contrast against the fill, comfortably over the 4.5:1 floor.
The active nav link is distinguished from inactive ones by font-weight and a bottom border, not by
colour — `brand-sky` measures only ~2.3:1 against `brand-deep` and was rejected as a text/indicator
colour there for that reason.
