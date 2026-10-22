# secure-pride-aegis-icons — Claude Context

Icon pack companion to Secure Pride (`/Users/daedalus/Code/secure-pride/secure-pride-site`).

## Structure
- `icons/` — icon assets (SVG source + export targets)
- `pack.json` — pack metadata/manifest (name, version, icon list)

## Icon Standards
- Format: SVG source required; export PNG at 16×16, 32×32, 64×64
- Dark mode: every icon needs a `-dark` variant (suffix convention)
- Palette: low-stimulation only — no saturated primaries; reference secure-pride CSS vars
- Accessibility: icons used as UI controls need ARIA labels in the consumer component
- Contrast: icons on backgrounds must pass WCAG AA (3:1 minimum for UI components)

## Adding a New Icon
1. Create SVG in `icons/` — kebab-case name (`shield-check.svg`)
2. Add dark variant (`shield-check-dark.svg`)
3. Register in `pack.json` with `name`, `variants`, and `category`
4. Export PNG sizes manually or via export script if present in `scripts/`

## Parent Project Context
Security standards, accessibility requirements, and palette constraints:
`/Users/daedalus/Code/secure-pride/secure-pride-site/CLAUDE.md`
