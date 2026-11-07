---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/components","src/index.css"]
---

# RhymePage app shell and screens

Scope: the whole signed-in and guest app (Write/Sync/Play editor, Notebook, Settings, Profile, auth, legal, 404), mobile-first for the Capacitor Android/iOS apps, with the desktop web matching. The marketing landing at `/` is web-only and keeps its typing demo. Mode: Operate.

Audience/job: songwriters drafting, timing, and replaying their own lyrics on a phone and at a desk, equally.
Must keep: Write/Sync/Play as three views of one song; the suggestion bottom sheet (peek/half/full on phone, docked right column on desktop); landing typing demo; user-selectable themes (4-6, at least one dark, all AA).
Must avoid: corporate/SaaS template, decoration over writing, dark-studio neon cliché.

## Direction contract

THESIS: Each song reads like its own track on an album's inner sleeve: number, title, credit line, lyric. Refuses the grey-chrome notes app with a blue accent and pill chips.

OWN-WORLD: A flat sleeve-coloured ground per theme (default Harbor blue #D3E4EE) with dark sleeve ink (#10243A) and one printed accent (#B83A22) for active marks; a solid ink panel (suggestions, tab bar) reversed out in sleeve colour. Archivo throughout: 800 for titles and track numerals, uppercase bold tracked labels for tabs and credits, regular for lyrics. Rules, not boxes; no pills, no shadows, no gradients.

STORY: The writer sees their song as a printed track, writes in calm text, and the finished word's relatives arrive in the dark panel as a column list they tap to insert.

FIRST VIEWPORT: Phone Write: status row (back to Notebook, save state), title in 28px 800 with credit line (author, themes), uppercase Write/Sync/Play tabs on a 1.5px ink rule with an accent underline, lyrics at 18px/1.8, the ink suggestion panel with the finished word as a 22px headword, uppercase category tabs, words in three columns; ink bottom tab bar. Notebook is a numbered tracklist.

FORM: LP inner sleeve, position 1 of the re-rolled grounded list, chosen as the pick. seed:330222005f657bfb

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Signature interaction: the suggestion panel's headword swaps to the newly finished word while the category tabs and column grid hold still (only the words change); the panel snaps peek/half/full on phone.

Unresolved: iOS native Google sign-in and file export need Swift equivalents of the Android plugin; until then iOS falls back to web paths.
