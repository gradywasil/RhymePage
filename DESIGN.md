---
name: RhymePage
description: A lyric notebook printed like an album's inner sleeve, one track per song.
colors:
  sleeve: "#d3e4ee"
  sleeve-2: "#c3d8e5"
  ink: "#10243a"
  ink-2: "#3c5268"
  rule: "#9db7c9"
  accent: "#a8321c"
  on-accent: "#ffffff"
  panel: "#10243a"
  panel-2: "#1a3049"
  on-panel: "#e3eef4"
  on-panel-2: "#a9c0d0"
  panel-rule: "#2a4058"
  panel-accent: "#f08a6e"
  danger: "#a8281a"
  ok: "#1d6b45"
typography:
  display:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "76px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  numeral:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "42px"
    fontWeight: 800
    lineHeight: 1
    fontFeature: "tnum"
  headword:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  lyric:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.8
  row-title:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.375
  body:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  credit:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  control:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.07em"
  label:
    fontFamily: "Archivo Variable, Archivo, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.08em"
rounded:
  none: "0px"
  mark: "50%"
spacing:
  hairline: "1.5px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  gutter: "16px"
  gutter-md: "24px"
  tab-gap: "20px"
  dialog: "20px"
  touch: "44px"
components:
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sleeve}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "0 18px"
    height: "44px"
  button-ink-hover:
    backgroundColor: "{colors.ink-2}"
    textColor: "{colors.sleeve}"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "0 18px"
    height: "44px"
  button-accent-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sleeve}"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "0 18px"
    height: "44px"
  button-line-hover:
    backgroundColor: "{colors.sleeve-2}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  button-quiet-hover:
    backgroundColor: "{colors.sleeve-2}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "0 18px"
    height: "44px"
  button-danger-hover:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.sleeve}"
  button-sm:
    padding: "0 12px"
    height: "36px"
  icon-button:
    backgroundColor: "transparent"
    rounded: "{rounded.none}"
    size: "44px"
  input:
    backgroundColor: "{colors.sleeve-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
    height: "44px"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.control}"
    height: "44px"
  tab-selected:
    textColor: "{colors.ink}"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.none}"
    padding: "0 8px"
    height: "26px"
  tag-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sleeve}"
  notice:
    backgroundColor: "{colors.sleeve-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    padding: "12px 14px"
  suggestion-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.on-panel}"
  word-row:
    backgroundColor: "transparent"
    textColor: "{colors.on-panel}"
    padding: "0 12px"
    height: "44px"
  word-row-hover:
    backgroundColor: "{colors.panel-2}"
  menu:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.on-panel}"
    rounded: "{rounded.none}"
    padding: "6px 0"
  menu-item:
    textColor: "{colors.on-panel}"
    padding: "0 16px"
    height: "44px"
  menu-item-hover:
    backgroundColor: "{colors.panel-2}"
  dialog:
    backgroundColor: "{colors.sleeve}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    width: "28rem"
  track-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "12px 4px 12px 0"
    height: "76px"
  tab-bar:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.on-panel-2}"
    height: "58px"
---

# Design System: RhymePage

## Overview

**Creative North Star: "The Inner Sleeve"**

Every song is a track printed on an album's inner sleeve: a track number, a bold title, a small credit line, then the lyric. The ground is one flat sleeve colour, the type is sleeve ink, and a single printed accent marks whatever is active. The suggestion panel, the tab bar, the desktop rail and the menus are a solid slab of ink with sleeve-coloured type reversed out of it. Nothing floats; structure comes from printed rules and that one reversal.

The system is quiet so the writer's words carry the page. Lyrics sit in calm regular-weight text at a generous 1.8 leading; chrome speaks in small uppercase tracked labels; only titles and track numerals are set heavy. Density is phone-first: 44px touch rows everywhere, a 16px page gutter, and the same layout grows into a rail-editor-dock arrangement on desktop rather than being restyled.

A theme is a different printing of the same sleeve. Six printings ship (Harbor, Lilac, Mint, Newsprint, Night, Forest); components only ever read the semantic roles, so every theme re-colours the same rules, slab and accent. The build rejects the grey-chrome notes app with a blue accent and pill chips.

**Key Characteristics:**
- Flat sleeve ground, sleeve ink, one printed accent per printing.
- A reversed ink slab for the suggestion panel, tab bar, desktop rail and menus.
- Archivo throughout: 800 for titles and numerals, uppercase tracked 700 for controls and labels, 400 for lyrics.
- Rules instead of boxes; square corners; no cast shadows.
- Accent track numerals (two digits, zero-padded, creation order) anchor every song.
- 44px minimum touch target on every interactive row.

## Colors

Each printing is a tinted paper, a near-black ink of the same hue, and one warm printed accent; the frontmatter values are the default Harbor printing.

### Primary
- **Printed Vermilion** (accent): the only colour that marks "active" on the sleeve: track numerals, the selected tab's underline, the focus ring, the input caret, text selection, the range thumb, the pinned-note icon. Also fills the one accent button.
- **Panel Coral** (panel-accent): the accent's reprint for the ink slab, lifted so it reads on dark: the selected suggestion-category underline, the active nav icon, focus rings inside the slab, and destructive menu items.

### Neutral
- **Harbor Sleeve** (sleeve): the page ground and the text colour reversed out of ink buttons and pressed tags.
- **Deeper Sleeve** (sleeve-2): the one tonal step on the ground: field fills, notices, and hover wash on quiet buttons and track rows.
- **Sleeve Ink** (ink): all primary text, the 1.5px rules under tab strips and fields, button outlines, the ink button, checked marks.
- **Faded Ink** (ink-2): credits, hints, placeholder text, unselected tabs, tags.
- **Sleeve Rule** (rule): 1px dividers between tracks, dialog footers, scrollbar thumbs, the loading track.
- **Ink Slab** (panel): the reversed panel ground; in light printings it is the ink itself.
- **Slab Step** (panel-2): hover and active rows inside the slab, avatar ground.
- **Reversed Sleeve** (on-panel) and **Reversed Faded** (on-panel-2): primary and secondary text on the slab.
- **Slab Rule** (panel-rule): dividers and tab-strip rules inside the slab.

### Status
- **Proof Red** (danger) and **Press Green** (ok): message, notice and danger-button text only; never fills at rest.

### Named Rules
**The One Printed Accent Rule.** A printing has exactly one accent (plus its slab reprint). It marks state and the track numeral; it is never a decorative fill, background tint or second brand colour.

**The Every Printing Is AA Rule.** ink, ink-2 and accent against sleeve, and on-panel, on-panel-2 and panel-accent against panel, are each at least 4.5:1 in every theme. A new printing ships only when all six pairs pass.

**The Roles Not Values Rule.** Components read semantic roles (`--sleeve`, `--ink`, `--panel`...) only. A hex inside a component is a bug; a theme is nothing but a block of role values.

## Typography

**Display Font:** Archivo Variable (with Archivo, system-ui, sans-serif)
**Body Font:** Archivo Variable (same family)

**Character:** One grotesque doing every job, the way a sleeve's credits, titles and lyrics share one typeface; hierarchy comes from weight (800 vs 400), case and tracking, not from a second family.

### Hierarchy
- **Display** (800, 42px phone / 76px desktop, 1.05, -0.015em): the landing hero title beside its numeral, max 15ch. The landing's typed demo line uses the same voice at 34px / 64px.
- **Headline** (800, 34px phone / 44px desktop, 1.05, -0.015em): page titles (Notebook, Settings, Login, Profile, legal). Balanced wrap.
- **Title** (800, 28px phone / 34px desktop, 1.05, -0.015em): the song title in the editor, set directly on the page as a bare input.
- **Numeral** (800, tabular, line-height 1, accent): track numbers, zero-padded to two digits; 26px in the notebook, 34px / 42px beside the editor title, matching the display size on the landing.
- **Headword** (800, 22px, -0.01em): the finished word heading the suggestion panel; also the RhymePage wordmark in the rail and landing header (-0.02em).
- **Lyric** (400, 18px phone / 19px desktop, 1.8): the writing surface, max 48rem, indented to sit under the title past the numeral gutter.
- **Row Title** (700, 17px): track titles in the notebook; suggested words in the panel use 17px too, ranked by weight (700 / 500 / 400 in thirds).
- **Body** (400, 16px, 1.5) and **Body Small** (400, 15px): running text, menu items, nav items (600), dialog copy.
- **Credit** (400, 13px, ink-2): the line under a title ("Words: Name · Themes: ...").
- **Control** (700, 13px, 0.07em, uppercase): buttons and tabs; 12px for small buttons and the desktop category index.
- **Label** (700, 12px, 0.08em, uppercase, ink-2): field labels, section headings inside dialogs, definition part-of-speech, stat names.

### Named Rules
**The Weight Carries Rank Rule.** Size steps are few; rank is weight. 800 is reserved for titles, numerals, the headword and the wordmark; lyrics are always 400.

**The Uppercase Means Control Rule.** Uppercase tracked type labels a control or a field. It is not used as a decorative line above a heading.

## Layout

Phone first, one column. Pages use a 16px gutter (24px from 768px). The editor heading is a numeral column (40px, 48px desktop) plus the title block; the lyric textarea is left-padded 68px / 88px so lines start under the title, not under the numeral.

Breakpoints, from the build: below 360px the word grid drops to two columns; below 640px dialogs become bottom sheets pinned to the edge; from 768px the phone tab bar is replaced by a 224px ink rail (240px at 1024px) and the suggestion sheet becomes a docked ink column on the right (320px, 416px at 1024px); from 1024px the dock's category tabs set as a two-column index.

The suggestion sheet snaps between peek (8.5rem, a single sideways row of words), half (min(19rem, 36dvh)) and full (64svh). Its word grid has fixed columns (three on phone, two in the dock) so only the words change between lookups. The phone tab bar hides while typing.

Reading measures are capped: 48rem for lyrics, 60-68ch for prose pages, max-w-md for auth forms, max-w-6xl for landing sections. Safe-area insets come from env() on iOS and injected variables on Android; the slab runs under the gesture bar while its labels stay above it.

**The Thumb Holds Still Rule.** Anything under the writer's thumb keeps its cell when content changes: tab positions, word columns, and the panel's height stay fixed; only the words swap.

## Elevation & Depth

Flat. Depth is conveyed by reversal (the ink slab against the sleeve) and by one tonal step (sleeve-2), never by cast shadows. Menus, which would conventionally float, carry a 1.5px ink edge instead so they stay distinct even on dark printings. The modal backdrop is a flat 45% black scrim.

Inset box-shadows do appear, but only as printed rules: the 3px accent underline on a selected tab, the 1.5px accent underline that thickens a focused field's bottom rule, and the 3px sleeve inset that makes a checked box read as a filled mark. They draw lines; they do not lift anything.

### Named Rules
**The No Cast Shadow Rule.** No outer or drop shadows, no glows, no blur at any state. Inset rules drawn with box-shadow are permitted because they are lines, not elevation.

## Shapes

Square. Every button, field, tag, tab, menu, dialog, avatar and range thumb has a 0 radius. The only round form is the radio mark (50%), where the circle is the semantic difference from a checkbox.

Structure is drawn with rules, not boxes: a 1.5px ink rule under tab strips and fields and around outlined controls; a 1px rule between notebook tracks and above dialog footers. Cards do not exist; a note is a ruled tracklist row.

Gradients appear only as drawing primitives: the select chevron and the switch knob are linear-gradient shapes, and the tablet-width category strip fades its right edge (mask) to signal more. No gradient is ever a surface fill.

**The Rules Not Boxes Rule.** Group with a rule and space before reaching for a border on four sides. Four-sided borders are reserved for controls (outlined buttons, checks, switches, tags) and for the dialog and menu edges.

## Components

### Buttons
Printed, uppercase, square: they read like credits you can press.
- **Shape:** square (0), 44px minimum height, 18px side padding; 36px / 12px for the small size; full-width variant for forms.
- **Ink:** ink fill, sleeve text. The default primary action. Hover steps to ink-2.
- **Accent:** accent fill, on-accent text, used sparingly for the single most important call. Hover reverses to ink.
- **Line:** 1.5px ink outline, ink text. Hover washes sleeve-2.
- **Quiet:** text only, 12px padding, sleeve-2 wash on hover.
- **Danger:** 1.5px danger outline and text; fills danger with sleeve text on hover.
- **Inside the slab:** quiet and line variants switch to on-panel text/outline and a panel-2 wash.
- **States:** colour transitions at 120ms ease-out; disabled at 45% opacity; focus is a 2px accent outline at 2px offset (panel-accent inside the slab). Icons are 18px line icons.
- **Icon button:** a bare 44px square, 20px icon, inherits colour, sleeve-2 (or panel-2) wash on hover.

### Tabs
- **Style:** uppercase control type in ink-2, 20px apart, on a 1.5px ink rule; each tab is 44px tall.
- **Selected:** ink text with a 3px accent underline sized to the label. Counts sit inline at weight 500, tabular.
- **In the slab:** on-panel-2 text on a panel-rule, selected on-panel with a panel-accent underline.

### Chips (tags)
- **Style:** square, 26px tall, 1px currentColor outline, 12px semibold ink-2 text. Not a pill.
- **State:** pressed reverses to an ink fill with sleeve text.
- In notebook rows tags are plain `#tag` credits, not outlined.

### Track Row (notebook)
- A ruled list item at least 76px tall: accent numeral (26px, right-aligned in a 36px column), row title in 17px bold, first lyric line in muted small text, then credits (sharing, tags).
- The whole row opens the note; hover washes sleeve-2 at 60%. Pin and overflow icon buttons sit at the end; the unpinned pin shows on hover, focus, or always on coarse pointers. A pinned note's pin is filled accent.
- Track numbers are creation order and never renumber when pinning or editing reorders the list.

### Inputs / Fields
- **Style:** sleeve-2 fill, no side or top border, a 1.5px ink bottom rule, square, 16px text (prevents iOS zoom), 44px minimum. Label above in label type with 6px gap; hints in 13px ink-2.
- **Focus:** the bottom rule turns accent and thickens to 3px via an inset rule; no outline glow.
- **Error / Disabled:** invalid turns the bottom rule danger; disabled at 55% opacity.
- **Bare inputs:** the editor title and lyrics are borderless, transparent, and inherit type; they are the page.
- **Check / radio:** 20px cells with a 1.5px ink edge; checked fills ink with a sleeve inset so it reads as a printed mark.
- **Switch:** a 44x26 square track with a 17px square knob that slides right and reverses on check (160ms).
- **Range:** a 2px ink track with an 18px square accent thumb.

### Navigation
- **Phone:** an ink tab bar, 58px rows, 22px icon above 12px semibold label; active is on-panel with a panel-accent icon, inactive on-panel-2. It hides while the keyboard is up.
- **Desktop:** a 224-240px ink rail with the wordmark, 44px nav rows (15px semibold, 18px icon), active row on panel-2 with a panel-accent icon, and the account block below a panel-rule.

### Suggestion Panel (signature)
The ink slab that answers the writer. A headword row (the finished word in 22px 800, lifting in over 260ms from 45% opacity), uppercase category tabs with counts on a panel-rule, then words as full-width 44px rows in fixed columns, ranked by weight in thirds (strongest bold on-panel, weakest regular on-panel-2). Tap inserts at the cursor; long-press or right-click shows a definition in place. On a phone it is a bottom sheet snapping peek / half / full over 260ms; from 768px it is a docked column, and from 1024px the categories become a two-column index.

### Menus and Dialogs
- **Menu:** the ink slab with a 1.5px ink edge, 6px vertical padding, 44px items in 15px on-panel with 18px on-panel-2 icons; hover panel-2; destructive items in panel-accent.
- **Dialog:** sleeve ground, 1.5px ink edge, max 28rem, 20px padding, footer actions right-aligned above a 1px rule. Below 640px it becomes a full-width bottom sheet with only a top edge.

### Notices and Loading
- **Notice:** a sleeve-2 band, 12px 14px padding, 14px text, optional 18px icon; danger and ok variants change only the text colour.
- **Loading:** a 120px, 2px rule with a short ink segment running along it (1.1s); reduced motion shows a static half-opacity bar.

## Do's and Don'ts

### Do:
- **Do** read only semantic roles in components so all six printings stay correct.
- **Do** mark exactly the active thing with the accent: selected tab underline, focus ring, track numeral, pinned state.
- **Do** put suggestions, navigation and menus on the reversed ink slab, and everything else on the flat sleeve.
- **Do** set titles and numerals at 800, lyrics at 400 with 1.8 leading, and controls in uppercase 700 at 0.07-0.08em.
- **Do** keep every interactive row at least 44px tall and fields at 16px text.
- **Do** separate with 1px or 1.5px rules; keep corners square.
- **Do** give every new song view its two-digit accent track numeral from creation order.
- **Do** honour reduced motion: the sheet, headword lift, loading run and control transitions all switch off.

### Don't:
- **Don't** add drop shadows, glows or blur; distinguish floating surfaces with an ink edge instead.
- **Don't** round corners or make pill chips; the radio mark is the only circle.
- **Don't** use gradients as fills; they are allowed only to draw small shapes (chevron, knob) or fade an overflow edge.
- **Don't** introduce a second accent or tint surfaces with the accent.
- **Don't** add a second typeface or set lyrics in a heavy weight.
- **Don't** set an uppercase tracked line above a heading as decoration; uppercase labels name controls and fields.
- **Don't** let a content change move a tab, column or the panel height under the writer's thumb.
- **Don't** wrap notes or settings groups in cards; use ruled rows.
