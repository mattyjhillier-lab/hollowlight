# Hollowlight identity brief (draft, Matt approved the concept 2026-10-14)

## The one big idea: "The Hollow"
The world starts drained: grey, ghostly, hollow. Your spirits' light brings colour and life back. Enemies bring corruption back. The run is a visible tug of war you can read from a screenshot. Dawn floods the restored ground with colour.

Three ideas Matt liked, merged into one system:
- **A. Colour returns.** Ground/props/trees go from hollow grey to vivid living colour where spirits have been.
- **B. Spirit-painted.** Spirits leave luminous trails/marks on the ground that fade slowly; a run builds a glowing mural.
- **C. The creeping Hollow.** Enemies spread dark, cracked, root-veined corruption; light burns it away in a radius.

## One system powers all three: the life map
A low-resolution grid texture (about 128x128 cells over the 4000x4000 world, covering the visible area) holding a value per cell: 0 = hollow, 1 = alive, below 0 = corrupted. Spirits and the hero's lantern add life along their paths; enemies and time add corruption; both decay or fade. The ground and props are shaded from this texture (desaturate when hollow, tint/colour when alive, dark veins when corrupted). Cost: one small texture update plus one shader/blend pass. Works in 2D or 3D. Keeps gameplay untouched (pure visual); any gameplay link (e.g. restored ground heals) is a parked idea that needs Matt's OK.

## Rules
- Hollow world is muted and simple, so living colour and spirit light are the stars (colour = life).
- Gold stays reserved for evolutions; danger/corruption is dark and cracked, not just red.
- Hero, boss and signature spirits are designed specifically for Hollowlight (unique silhouettes); generic pack assets only for background enemies/props, themed to fit.
- Restraint: one strong idea, few colours, few effects; the identity does the work.

## Open
- Art style family: LOCKED polished 2D cartoon, P1 Warm Lantern (3D parked).
- Palette to be set after the spike; role tokens in src/gfx/palette.js make swaps cheap.
