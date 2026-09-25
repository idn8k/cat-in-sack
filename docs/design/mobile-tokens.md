# Mobile design tokens

Concrete values for the design system recorded in [ADR-0002](../adr/0002-mobile-design-system.md). Build `apps/mobile` screens against these — don't invent new colors, fonts, or spacing rules per screen.

## Setup

- Styling: [NativeWind](https://www.nativewind.dev/) — Tailwind classes on React Native components.
- Icons: SVG icon set, not emoji (e.g. `lucide-react-native`). Fixed 24x24 viewBox, consistent sizing.

## Color palette

| Token | Hex | Use |
|---|---|---|
| `primary` | `#F97316` | Primary actions, active tab, brand accents |
| `secondary` | `#FB923C` | Secondary emphasis, hover/pressed states |
| `cta` | `#2563EB` | Primary call-to-action buttons (e.g. "Save", "Log visit") |
| `background` | `#FFF7ED` | Screen backgrounds |
| `text` | `#9A3412` | Primary text — verify 4.5:1 contrast against `background` before using on smaller text |

Status colors (not part of the core palette, used for alerts like the Pantry low-stock indicator):

| Token | Hex | Use |
|---|---|---|
| `status-warning` | `#F59E0B` | Reorder-threshold warning |
| `status-danger` | `#EF4444` | Overdue / critical |
| `status-success` | `#22C55E` | Confirmations |

Light mode only for Phase 1 — no dark-mode token set yet.

## Typography — Soft Rounded

- Headings: **Varela Round**
- Body: **Nunito Sans** (weights 300–700)
- Google Fonts: https://fonts.google.com/share?selection.family=Nunito+Sans:wght@300;400;500;600;700|Varela+Round

```js
// tailwind.config.js
fontFamily: {
  heading: ['Varela Round', 'sans-serif'],
  body: ['Nunito Sans', 'sans-serif'],
}
```

## Layout rules (inherited from Flat Design)

- No shadows or gradients — flat fills only.
- Limited palette: stick to the tokens above, don't introduce new hues per screen.
- Border radius: small and consistent (2–4px) across cards/buttons.
- Minimum 44x44px touch targets.
- Minimum 16px body text.
