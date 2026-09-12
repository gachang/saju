# Report fonts

Self-hosted fonts used by the supplied Figma report designs. These are genuine
Google Fonts sources, not replacement typefaces or traced glyphs.

| Asset | Family | CSS weight | Style |
| --- | --- | --- | --- |
| `NotoSansKR-400-700.woff2` | Noto Sans KR | `400 700` (variable) | normal |
| `NotoSerifKR-Bold.woff2` | Noto Serif KR | `700` | normal |

The files are 1,284,556 and 1,270,796 bytes, respectively (2,555,352 bytes total),
about 64% smaller than the unrestricted WOFF2 assets.

Prefer `preload: false` so opening the landing page does not eagerly download
report fonts before they are used. These are Korean-oriented subsets, not
the complete upstream fonts; nicknames in other scripts use the system font
fallback.

## Sources and license

Downloaded from the official [Google Fonts repository](https://github.com/google/fonts)
on 2026-09-12. Both fonts are licensed under the SIL Open Font License 1.1;
the corresponding complete copyright/license notices are included alongside
the assets as `NotoSansKR-OFL.txt` and `NotoSerifKR-OFL.txt`.

- [Noto Sans KR source](https://github.com/google/fonts/blob/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf)
  — SHA-256 `194018e6b2b293a7964f037b25c0249ce1418bc9ab3c971060a03aa57861e252`
- [Noto Serif KR source](https://github.com/google/fonts/blob/main/ofl/notoserifkr/NotoSerifKR%5Bwght%5D.ttf)
  — SHA-256 `11f8d5de6f1b79195efba3828aaa2ec95c1178f5ae976fb23c8d53250a9938f3`

The originals were processed with FontTools 4.65.0: Sans was restricted to the
400–700 weight interval, Serif was instantiated at weight 700, and both were
subset and compressed to WOFF2. Both retain all 11,172 modern Hangul syllables,
and all upstream-supported characters in these ranges:

| Coverage | Unicode ranges |
| --- | --- |
| Latin, digits, common symbols | U+0000–024F |
| Korean Jamo and extended Jamo | U+1100–11FF, U+A960–A97F, U+D7B0–D7FF |
| General and CJK punctuation | U+2000–206F, U+3000–303F |
| Compatibility Jamo | U+3130–318F |
| Hangul syllables | U+AC00–D7AF |
| Halfwidth and fullwidth forms | U+FF00–FFEF |

The additional chart characters retained are
`甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥木火土金水陰陽年月日時生剋克`.
Other CJK ideographs and scripts are intentionally omitted and need the
system fallback. OpenType layout features and their glyph closure were kept
with `--layout-features='*'`; this is not a subset of one fixed report's text.
The Sans `wght` axis remains 400–700 with default 400; Serif remains static 700.

## Reproduction

With the two upstream TTF files in the current directory and
`fonttools[woff]==4.65.0` installed:

```sh
fonttools varLib.instancer NotoSansKR.ttf wght=400:700 --no-recalc-timestamp --output NotoSansKR-400-700.ttf
fonttools varLib.instancer NotoSerifKR.ttf wght=700 --static --update-name-table --no-recalc-timestamp --output NotoSerifKR-Bold.ttf
pyftsubset NotoSansKR-400-700.ttf --unicodes='U+0000-024F,U+1100-11FF,U+2000-206F,U+3000-303F,U+3130-318F,U+A960-A97F,U+AC00-D7AF,U+D7B0-D7FF,U+FF00-FFEF' --text='甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥木火土金水陰陽年月日時生剋克' --layout-features='*' --name-IDs='*' --name-legacy --name-languages='*' --notdef-glyph --notdef-outline --flavor=woff2 --output-file=NotoSansKR-400-700.woff2
pyftsubset NotoSerifKR-Bold.ttf --unicodes='U+0000-024F,U+1100-11FF,U+2000-206F,U+3000-303F,U+3130-318F,U+A960-A97F,U+AC00-D7AF,U+D7B0-D7FF,U+FF00-FFEF' --text='甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥木火土金水陰陽年月日時生剋克' --layout-features='*' --name-IDs='*' --name-legacy --name-languages='*' --notdef-glyph --notdef-outline --flavor=woff2 --output-file=NotoSerifKR-Bold.woff2
```

Register these files once with `next/font/local`, use `display: 'swap'`, and
apply them only to the report typography. No request to Google Fonts is made
by the browser or by the application build.
