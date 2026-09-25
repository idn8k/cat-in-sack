# Mobile design system: NativeWind + Flat Design + Pet Tech palette

`apps/mobile` needed a styling approach and a visual language before Phase 1's six screen-building tickets (#4–#9) could be built consistently by separate, isolated `/implement` runs. We chose **NativeWind** (Tailwind classes for React Native) over plain `StyleSheet`, `react-native-paper`, or Tamagui, and paired it with the **Flat Design** style (2D, no shadows/gradients, limited bold palette, WCAG AAA) rather than a more "consumer/entertainment" vibrant style — CatOps's screens are CRUD forms, lists, and a KPI-style dashboard, not a marketing surface. The **Pet Tech palette** (warm orange primary, blue CTA) sits on top of Flat Design's neutral mechanics so the app still reads as a pet product rather than a generic SaaS dashboard. Typography is the **Soft Rounded** pairing (Varela Round / Nunito Sans), reinforcing the same warmth. Concrete values live in `docs/design/mobile-tokens.md`.

## Considered options

- **Styling**: plain `StyleSheet` (most control, most boilerplate across many screens), `react-native-paper` (fast but locks the app into Material Design's look), Tamagui (best perf/theming, steepest learning curve for a small MVP). NativeWind won because it gives every isolated `/implement` run the same utility-class vocabulary instead of each one inventing its own `StyleSheet` conventions, and it's a well-worn library.
- **Style/palette**: the catalog's own product-type match for "Pet Tech App" paired a bold/playful "Vibrant & Block-based" style with the same palette — rejected because that style targets gaming/entertainment/youth products, not a daily-use logistics utility. We kept the Pet Tech palette but paired it with Flat Design's more utilitarian layout mechanics instead.

## Consequences

- **Phase 1 is light-mode only.** Dark-mode tokens are deliberately not defined yet; add them as a follow-up ADR/update when it's actually prioritized, don't half-implement them per-screen.
- Design tokens are mobile-only (`apps/mobile`), not `packages/shared` — the API has no UI concerns.
- Issues #4–#9 each carry a one-line pointer to this ADR since each is built in its own cleared context and won't otherwise discover it.
