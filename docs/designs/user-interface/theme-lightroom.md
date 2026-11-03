# Theme: Lightroom-inspired dark

**Traces to:** ADR-0003, DES-001

Central definition: [`src/app/globals.css`](../../../src/app/globals.css) CSS variables + Tailwind `@theme`.

| Token role | Intent |
|------------|--------|
| `background` | Main canvas (~oklch 0.14) — photo-forward |
| `sidebar`, `card` | Elevated chrome |
| `primary` / ring | Cool blue selection accent |
| `muted-foreground` | Field labels in detail panel |
| `--panel-width` | RHS context panel (400px) |
| `--photo-grid-gap` | Grid gutter |

Default: `class="dark"` on `<html>`. No hard-coded hex in components—use semantic utilities only.

## Typography

Lightroom uses proprietary **Adobe Clean**; curator uses open substitutes ([`layout.tsx`](../../../src/app/layout.tsx)):

| Role | Font | Notes |
|------|------|--------|
| UI / body | **Source Sans 3** | Adobe open sans; closest licensed alternative to Clean |
| Fallbacks | Segoe UI, `system-ui` | Windows / native UI parity |
| Code / asset IDs | **Source Code Pro** | Mono metadata in detail panel |

Tailwind `--font-sans` / `--font-mono` in `globals.css` must reference `--font-curator-sans` (not self-referential `var(--font-sans)`).
