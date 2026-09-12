# Report layout

The application preserves the visual treatment of [Figma 1991:3079](https://www.figma.com/design/KuFWGYWdTDWmMaaamF5C5G/korea-days?node-id=1991-3079) and uses the report-body structure of [1968:2414](https://www.figma.com/design/KuFWGYWdTDWmMaaamF5C5G/korea-days?node-id=1968-2414).

- Lemon guinea-pig hero, light rays, gold accents, navy chart cards: first reference.
- Eight numbered cards, heading, gold rule, three paragraphs and actual character count: second reference.
- Cards grow with content; long accepted reports are never clipped to a fixed Figma frame height.
- Existing calculated scores, chart variants, generation endpoint and validated report text are preserved. The hero score explicitly labels the mean of the five existing axes; it is not a predicted real-world relationship probability.
- `/report/example` uses the existing accepted synthetic fixture, clearly labels it as an example and makes no generation request. It is excluded from search indexing.
- Sharing is user-triggered and saving downloads plain text locally; neither claims persistent server storage. API availability is unchanged.

## Assets

`public/report/` contains the original Figma-exported `light.png`, `score-mascot.png`, `side-mascot.png`, `lemon-guinea.png`, `lemon-ring.png` and `back-circle.svg`. No replacement illustration or traced SVG was used. Font sources, licenses and reproducible subsetting commands are documented in `src/app/fonts/report/README.md`.

## Verification

Run `node --import tsx --test tests/*.test.ts`, TypeScript, ESLint and the production Next.js build. Inspect `/report/example` at mobile widths, including its last chapter and footer. The sample does not demonstrate that fresh API generation is enabled.
