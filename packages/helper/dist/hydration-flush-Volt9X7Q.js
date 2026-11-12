import { isServer } from "lit";

//#region \0raw:C:\Users\VCT-DEV\Desktop\libs\packages\helper\src\data\theme\scrollbar.css?raw.js
var scrollbar_css_raw_default = "/* ───────────────────────────────────────────────────────────────────────────\r\n   The mono scrollbar — ONE design, defined once, used by every scroll surface.\r\n\r\n   An 8px fully-rounded pill thumb on a transparent track. Before this file the\r\n   five components that styled a scrollbar each hand-rolled their own: widths of\r\n   4 / 6 / 8px, radii of `99px` and `9999px`, and four different colour sources —\r\n   while eleven other scroll containers (the main table scroller included) had no\r\n   rule at all and fell back to the browser's own bar.\r\n\r\n   ── Two engines, two lanes, and why they must NOT be mixed ─────────────────\r\n   This is the trap that made the previous attempt a no-op: **Chrome ignores\r\n   every `::-webkit-scrollbar` rule as soon as `scrollbar-width` or\r\n   `scrollbar-color` is set on the same element.** Measured in Chrome 134 —\r\n   a scroller with `::-webkit-scrollbar { width: 14px }` reserves 14px, and the\r\n   same scroller with `scrollbar-width: thin` added reserves 11px, Chrome's own\r\n   thin bar. So declaring both \"for cross-browser safety\" silently throws away\r\n   the custom design and hands Chrome its default scrollbar back.\r\n\r\n   Hence the split: the standard properties are fenced behind `@supports` tests\r\n   that only a non-WebKit engine passes, so Chrome/Safari see the webkit lane\r\n   alone and Firefox sees the standard lane alone. Two guards rather than one\r\n   because each covers the other's uncertainty: `selector(::-webkit-scrollbar)`\r\n   is the semantically correct test (verified false-in-Firefox by construction —\r\n   Firefox implements no such pseudo-element), and `-moz-appearance` is a plain\r\n   Firefox sniff. Both are verified INERT in Chrome (`CSS.supports` returns\r\n   false for `-moz-appearance`, true for the selector test), so Chrome cannot\r\n   accidentally enter the standard lane through either door.\r\n\r\n   Firefox exposes no numeric width — `thin` is all it has — so the 8px rail and\r\n   the pill radius are WebKit-only by nature, not by choice.\r\n\r\n   ── Colour: `currentColor`, so every theme is right for free ───────────────\r\n   The thumb is a low-alpha mix of the container's OWN text colour. A scroll\r\n   container inherits `color` from the panel it sits in, so the thumb comes out\r\n   dark on a white modal and pale on ONE's navy sidebar with no colour named\r\n   anywhere and no per-component override. This replaces four bespoke sources,\r\n   three of which mixed toward `white` (assuming a light panel) and one of which\r\n   derived from the accent — which on a panel painted in that same accent\r\n   dissolves into it. A new theme, flavor or `color` preset is correct for free.\r\n\r\n   ── The token chain ───────────────────────────────────────────────────────\r\n   Standard three-tier resolvers. Two rules govern where they may be written:\r\n\r\n   1. The resolvers are declared on the SCROLL CONTAINERS, never on `:root`. A\r\n      `var()` substitutes on the element that declares it, so a resolver at\r\n      `:root` could never see a `-preset` a flavor sets on `<body>` — the same\r\n      trap `sidebar.css` documents for `.mono-sidebar-panel`. Declaring them on\r\n      the container is also what puts `currentColor` in the right place.\r\n   2. The public `--mono-scrollbar-*` vars are NOT declared anywhere. Declaring\r\n      one would mean it is always set, and a flavor's `-preset` could then never\r\n      win. The defaults live only as the innermost fallback below.\r\n\r\n   Order stays: default < flavor `-preset` < a consumer's public `--mono-*`.\r\n   No flavor overrides these today — one scrollbar across every theme is the\r\n   point — but the `-preset` slots exist for a flavor that wants its own rail.\r\n\r\n   ── Adding a scroll container ─────────────────────────────────────────────\r\n   Add its selector to the list below. `theme-parity.spec.mjs` fails the build\r\n   for any `overflow: auto|scroll` in `src/components/**` that is missing here,\r\n   and for any component CSS that styles a scrollbar itself.\r\n   ─────────────────────────────────────────────────────────────────────────── */\r\n\r\n.mono-scrollbar,\r\n:where([mono-sidebar]) :where([mono-panel]) > [mono-body],\r\n.mono-drawer-body,\r\n:where([mono-drawer] > [mono-panel]) > [mono-body],\r\n.mono-modal-body,\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel]) > [mono-body],\r\n.mono-select-dropdown-body,\r\n\r\n[mono-select] [mono-dropdown-body],\r\n.mono-tag-input-dropdown,\r\n[mono-tag-input] > [mono-dropdown],\r\n:where([mono-dropdown]) > [mono-panel],\r\n:where([mono-button-dropdown]) > [mono-panel],\r\n.mono-tag-input-more-panel,\r\n[mono-tag-input] > [mono-more-panel],\r\n.mono-textarea-field,\r\n[mono-table-scroll],\r\n[mono-search-more-panel],\r\n[mono-search-filter],\r\n[mono-search-panel],\r\n[mono-th-filter-list],\r\n[mono-dropdown-table] [mono-dd-more],\r\n[mono-dropdown-table] [mono-dd-region=\"body\"],\r\n[mono-filter-builder] > [mono-filter-group] {\r\n  --_mono-scrollbar-size: var(--mono-scrollbar-size, var(--_mono-scrollbar-size-preset, 8px));\r\n  --_mono-scrollbar-radius: var(--mono-scrollbar-radius, var(--_mono-scrollbar-radius-preset, 999px));\r\n  --_mono-scrollbar-track: var(--mono-scrollbar-track, var(--_mono-scrollbar-track-preset, transparent));\r\n  --_mono-scrollbar-thumb: var(\r\n    --mono-scrollbar-thumb,\r\n    var(--_mono-scrollbar-thumb-preset, color-mix(in srgb, currentColor 22%, transparent))\r\n  );\r\n  --_mono-scrollbar-thumb-hover: var(\r\n    --mono-scrollbar-thumb-hover,\r\n    var(--_mono-scrollbar-thumb-hover-preset, color-mix(in srgb, currentColor 38%, transparent))\r\n  );\r\n}\r\n\r\n/* ── Firefox lane. Inert in Chrome/Safari — see the header: setting either of\r\n      these there would disable the webkit lane below and restore Chrome's own\r\n      scrollbar. Duplicated across two guards rather than comma-joined because\r\n      `@supports` conditions cannot be combined with a selector list. ───────── */\r\n@supports not selector(::-webkit-scrollbar) {\r\n  .mono-scrollbar,\r\n  :where([mono-sidebar]) :where([mono-panel]) > [mono-body],\r\n  .mono-drawer-body,\r\n  :where([mono-drawer] > [mono-panel]) > [mono-body],\r\n  .mono-modal-body,\r\n  :where([mono-modal] > [mono-panel-wrap] > [mono-panel]) > [mono-body],\r\n  .mono-select-dropdown-body,\r\n\r\n  [mono-select] [mono-dropdown-body],\r\n  .mono-tag-input-dropdown,\r\n  [mono-tag-input] > [mono-dropdown],\r\n  :where([mono-dropdown]) > [mono-panel],\r\n  :where([mono-button-dropdown]) > [mono-panel],\r\n  .mono-tag-input-more-panel,\r\n  [mono-tag-input] > [mono-more-panel],\r\n  .mono-textarea-field,\r\n  [mono-table-scroll],\r\n  [mono-search-more-panel],\r\n  [mono-search-filter],\r\n  [mono-search-panel],\r\n  [mono-th-filter-list],\r\n  [mono-dropdown-table] [mono-dd-more],\r\n  [mono-dropdown-table] [mono-dd-region=\"body\"],\r\n  [mono-filter-builder] > [mono-filter-group] {\r\n    scrollbar-width: thin;\r\n    scrollbar-color: var(--_mono-scrollbar-thumb) var(--_mono-scrollbar-track);\r\n  }\r\n}\r\n\r\n@supports (-moz-appearance: none) {\r\n  .mono-scrollbar,\r\n  :where([mono-sidebar]) :where([mono-panel]) > [mono-body],\r\n  .mono-drawer-body,\r\n  :where([mono-drawer] > [mono-panel]) > [mono-body],\r\n  .mono-modal-body,\r\n  :where([mono-modal] > [mono-panel-wrap] > [mono-panel]) > [mono-body],\r\n  .mono-select-dropdown-body,\r\n\r\n  [mono-select] [mono-dropdown-body],\r\n  .mono-tag-input-dropdown,\r\n  [mono-tag-input] > [mono-dropdown],\r\n  :where([mono-dropdown]) > [mono-panel],\r\n  :where([mono-button-dropdown]) > [mono-panel],\r\n  .mono-tag-input-more-panel,\r\n  [mono-tag-input] > [mono-more-panel],\r\n  .mono-textarea-field,\r\n  [mono-table-scroll],\r\n  [mono-search-more-panel],\r\n  [mono-search-filter],\r\n  [mono-search-panel],\r\n  [mono-th-filter-list],\r\n  [mono-dropdown-table] [mono-dd-more],\r\n  [mono-dropdown-table] [mono-dd-region=\"body\"],\r\n  [mono-filter-builder] > [mono-filter-group] {\r\n    scrollbar-width: thin;\r\n    scrollbar-color: var(--_mono-scrollbar-thumb) var(--_mono-scrollbar-track);\r\n  }\r\n}\r\n\r\n/* ── WebKit / Blink lane: the actual design. ──────────────────────────────── */\r\n\r\n.mono-scrollbar::-webkit-scrollbar,\r\n:where([mono-sidebar]) :where([mono-panel]) > [mono-body]::-webkit-scrollbar,\r\n.mono-drawer-body::-webkit-scrollbar,\r\n:where([mono-drawer] > [mono-panel]) > [mono-body]::-webkit-scrollbar,\r\n.mono-modal-body::-webkit-scrollbar,\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel]) > [mono-body]::-webkit-scrollbar,\r\n.mono-select-dropdown-body::-webkit-scrollbar,\r\n\r\n[mono-select] [mono-dropdown-body]::-webkit-scrollbar,\r\n.mono-tag-input-dropdown::-webkit-scrollbar,\r\n[mono-tag-input] > [mono-dropdown]::-webkit-scrollbar,\r\n:where([mono-dropdown]) > [mono-panel]::-webkit-scrollbar,\r\n:where([mono-button-dropdown]) > [mono-panel]::-webkit-scrollbar,\r\n.mono-tag-input-more-panel::-webkit-scrollbar,\r\n[mono-tag-input] > [mono-more-panel]::-webkit-scrollbar,\r\n.mono-textarea-field::-webkit-scrollbar,\r\n[mono-table-scroll]::-webkit-scrollbar,\r\n[mono-search-more-panel]::-webkit-scrollbar,\r\n[mono-search-filter]::-webkit-scrollbar,\r\n[mono-search-panel]::-webkit-scrollbar,\r\n[mono-th-filter-list]::-webkit-scrollbar,\r\n[mono-dropdown-table] [mono-dd-more]::-webkit-scrollbar,\r\n[mono-dropdown-table] [mono-dd-region=\"body\"]::-webkit-scrollbar,\r\n[mono-filter-builder] > [mono-filter-group]::-webkit-scrollbar {\r\n  width: var(--_mono-scrollbar-size);\r\n  height: var(--_mono-scrollbar-size);\r\n}\r\n\r\n.mono-scrollbar::-webkit-scrollbar-track,\r\n:where([mono-sidebar]) :where([mono-panel]) > [mono-body]::-webkit-scrollbar-track,\r\n.mono-drawer-body::-webkit-scrollbar-track,\r\n:where([mono-drawer] > [mono-panel]) > [mono-body]::-webkit-scrollbar-track,\r\n.mono-modal-body::-webkit-scrollbar-track,\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel]) > [mono-body]::-webkit-scrollbar-track,\r\n.mono-select-dropdown-body::-webkit-scrollbar-track,\r\n\r\n[mono-select] [mono-dropdown-body]::-webkit-scrollbar-track,\r\n.mono-tag-input-dropdown::-webkit-scrollbar-track,\r\n[mono-tag-input] > [mono-dropdown]::-webkit-scrollbar-track,\r\n:where([mono-dropdown]) > [mono-panel]::-webkit-scrollbar-track,\r\n:where([mono-button-dropdown]) > [mono-panel]::-webkit-scrollbar-track,\r\n.mono-tag-input-more-panel::-webkit-scrollbar-track,\r\n[mono-tag-input] > [mono-more-panel]::-webkit-scrollbar-track,\r\n.mono-textarea-field::-webkit-scrollbar-track,\r\n[mono-table-scroll]::-webkit-scrollbar-track,\r\n[mono-search-more-panel]::-webkit-scrollbar-track,\r\n[mono-search-filter]::-webkit-scrollbar-track,\r\n[mono-search-panel]::-webkit-scrollbar-track,\r\n[mono-th-filter-list]::-webkit-scrollbar-track,\r\n[mono-dropdown-table] [mono-dd-more]::-webkit-scrollbar-track,\r\n[mono-dropdown-table] [mono-dd-region=\"body\"]::-webkit-scrollbar-track,\r\n[mono-filter-builder] > [mono-filter-group]::-webkit-scrollbar-track {\r\n  background: var(--_mono-scrollbar-track);\r\n}\r\n\r\n.mono-scrollbar::-webkit-scrollbar-thumb,\r\n:where([mono-sidebar]) :where([mono-panel]) > [mono-body]::-webkit-scrollbar-thumb,\r\n.mono-drawer-body::-webkit-scrollbar-thumb,\r\n:where([mono-drawer] > [mono-panel]) > [mono-body]::-webkit-scrollbar-thumb,\r\n.mono-modal-body::-webkit-scrollbar-thumb,\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel]) > [mono-body]::-webkit-scrollbar-thumb,\r\n.mono-select-dropdown-body::-webkit-scrollbar-thumb,\r\n\r\n[mono-select] [mono-dropdown-body]::-webkit-scrollbar-thumb,\r\n.mono-tag-input-dropdown::-webkit-scrollbar-thumb,\r\n[mono-tag-input] > [mono-dropdown]::-webkit-scrollbar-thumb,\r\n:where([mono-dropdown]) > [mono-panel]::-webkit-scrollbar-thumb,\r\n:where([mono-button-dropdown]) > [mono-panel]::-webkit-scrollbar-thumb,\r\n.mono-tag-input-more-panel::-webkit-scrollbar-thumb,\r\n[mono-tag-input] > [mono-more-panel]::-webkit-scrollbar-thumb,\r\n.mono-textarea-field::-webkit-scrollbar-thumb,\r\n[mono-table-scroll]::-webkit-scrollbar-thumb,\r\n[mono-search-more-panel]::-webkit-scrollbar-thumb,\r\n[mono-search-filter]::-webkit-scrollbar-thumb,\r\n[mono-search-panel]::-webkit-scrollbar-thumb,\r\n[mono-th-filter-list]::-webkit-scrollbar-thumb,\r\n[mono-dropdown-table] [mono-dd-more]::-webkit-scrollbar-thumb,\r\n[mono-dropdown-table] [mono-dd-region=\"body\"]::-webkit-scrollbar-thumb,\r\n[mono-filter-builder] > [mono-filter-group]::-webkit-scrollbar-thumb {\r\n  background: var(--_mono-scrollbar-thumb);\r\n  border-radius: var(--_mono-scrollbar-radius);\r\n}\r\n\r\n.mono-scrollbar::-webkit-scrollbar-thumb:hover,\r\n:where([mono-sidebar]) :where([mono-panel]) > [mono-body]::-webkit-scrollbar-thumb:hover,\r\n.mono-drawer-body::-webkit-scrollbar-thumb:hover,\r\n:where([mono-drawer] > [mono-panel]) > [mono-body]::-webkit-scrollbar-thumb:hover,\r\n.mono-modal-body::-webkit-scrollbar-thumb:hover,\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel]) > [mono-body]::-webkit-scrollbar-thumb:hover,\r\n.mono-select-dropdown-body::-webkit-scrollbar-thumb:hover,\r\n\r\n[mono-select] [mono-dropdown-body]::-webkit-scrollbar-thumb:hover,\r\n.mono-tag-input-dropdown::-webkit-scrollbar-thumb:hover,\r\n[mono-tag-input] > [mono-dropdown]::-webkit-scrollbar-thumb:hover,\r\n:where([mono-dropdown]) > [mono-panel]::-webkit-scrollbar-thumb:hover,\r\n:where([mono-button-dropdown]) > [mono-panel]::-webkit-scrollbar-thumb:hover,\r\n.mono-tag-input-more-panel::-webkit-scrollbar-thumb:hover,\r\n[mono-tag-input] > [mono-more-panel]::-webkit-scrollbar-thumb:hover,\r\n.mono-textarea-field::-webkit-scrollbar-thumb:hover,\r\n[mono-table-scroll]::-webkit-scrollbar-thumb:hover,\r\n[mono-search-more-panel]::-webkit-scrollbar-thumb:hover,\r\n[mono-search-filter]::-webkit-scrollbar-thumb:hover,\r\n[mono-search-panel]::-webkit-scrollbar-thumb:hover,\r\n[mono-th-filter-list]::-webkit-scrollbar-thumb:hover,\r\n[mono-dropdown-table] [mono-dd-more]::-webkit-scrollbar-thumb:hover,\r\n[mono-dropdown-table] [mono-dd-region=\"body\"]::-webkit-scrollbar-thumb:hover,\r\n[mono-filter-builder] > [mono-filter-group]::-webkit-scrollbar-thumb:hover {\r\n  background: var(--_mono-scrollbar-thumb-hover);\r\n}\r\n\r\n/* Chrome draws stepper arrows on a custom scrollbar in some configurations, and\r\n   the corner square where two bars meet takes the UA's own grey. Both are part\r\n   of \"do not look like the browser's scrollbar\". */\r\n.mono-scrollbar::-webkit-scrollbar-button,\r\n:where([mono-sidebar]) :where([mono-panel]) > [mono-body]::-webkit-scrollbar-button,\r\n.mono-drawer-body::-webkit-scrollbar-button,\r\n:where([mono-drawer] > [mono-panel]) > [mono-body]::-webkit-scrollbar-button,\r\n.mono-modal-body::-webkit-scrollbar-button,\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel]) > [mono-body]::-webkit-scrollbar-button,\r\n.mono-select-dropdown-body::-webkit-scrollbar-button,\r\n\r\n[mono-select] [mono-dropdown-body]::-webkit-scrollbar-button,\r\n.mono-tag-input-dropdown::-webkit-scrollbar-button,\r\n[mono-tag-input] > [mono-dropdown]::-webkit-scrollbar-button,\r\n:where([mono-dropdown]) > [mono-panel]::-webkit-scrollbar-button,\r\n:where([mono-button-dropdown]) > [mono-panel]::-webkit-scrollbar-button,\r\n.mono-tag-input-more-panel::-webkit-scrollbar-button,\r\n[mono-tag-input] > [mono-more-panel]::-webkit-scrollbar-button,\r\n.mono-textarea-field::-webkit-scrollbar-button,\r\n[mono-table-scroll]::-webkit-scrollbar-button,\r\n[mono-search-more-panel]::-webkit-scrollbar-button,\r\n[mono-search-filter]::-webkit-scrollbar-button,\r\n[mono-search-panel]::-webkit-scrollbar-button,\r\n[mono-th-filter-list]::-webkit-scrollbar-button,\r\n[mono-dropdown-table] [mono-dd-more]::-webkit-scrollbar-button,\r\n[mono-dropdown-table] [mono-dd-region=\"body\"]::-webkit-scrollbar-button,\r\n[mono-filter-builder] > [mono-filter-group]::-webkit-scrollbar-button {\r\n  display: none;\r\n}\r\n\r\n.mono-scrollbar::-webkit-scrollbar-corner,\r\n:where([mono-sidebar]) :where([mono-panel]) > [mono-body]::-webkit-scrollbar-corner,\r\n.mono-drawer-body::-webkit-scrollbar-corner,\r\n:where([mono-drawer] > [mono-panel]) > [mono-body]::-webkit-scrollbar-corner,\r\n.mono-modal-body::-webkit-scrollbar-corner,\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel]) > [mono-body]::-webkit-scrollbar-corner,\r\n.mono-select-dropdown-body::-webkit-scrollbar-corner,\r\n\r\n[mono-select] [mono-dropdown-body]::-webkit-scrollbar-corner,\r\n.mono-tag-input-dropdown::-webkit-scrollbar-corner,\r\n[mono-tag-input] > [mono-dropdown]::-webkit-scrollbar-corner,\r\n:where([mono-dropdown]) > [mono-panel]::-webkit-scrollbar-corner,\r\n:where([mono-button-dropdown]) > [mono-panel]::-webkit-scrollbar-corner,\r\n.mono-tag-input-more-panel::-webkit-scrollbar-corner,\r\n[mono-tag-input] > [mono-more-panel]::-webkit-scrollbar-corner,\r\n.mono-textarea-field::-webkit-scrollbar-corner,\r\n[mono-table-scroll]::-webkit-scrollbar-corner,\r\n[mono-search-more-panel]::-webkit-scrollbar-corner,\r\n[mono-search-filter]::-webkit-scrollbar-corner,\r\n[mono-search-panel]::-webkit-scrollbar-corner,\r\n[mono-th-filter-list]::-webkit-scrollbar-corner,\r\n[mono-dropdown-table] [mono-dd-more]::-webkit-scrollbar-corner,\r\n[mono-dropdown-table] [mono-dd-region=\"body\"]::-webkit-scrollbar-corner,\r\n[mono-filter-builder] > [mono-filter-group]::-webkit-scrollbar-corner {\r\n  background: var(--_mono-scrollbar-track);\r\n}\r\n";

//#endregion
//#region \0raw:C:\Users\VCT-DEV\Desktop\libs\packages\helper\src\data\theme\selection.css?raw.js
var selection_css_raw_default = "/* ───────────────────────────────────────────────────────────────────────────\r\n   Text selection on mono's painted surfaces — ONE design, defined once.\r\n\r\n   The browser's default selection swaps in its own background (a light blue in\r\n   Chrome) and leaves the text `color` alone. That is fine wherever the page owns\r\n   the ink. It is not fine on a surface mono has repainted: a navy sidebar puts\r\n   white text on that pale blue and the label disappears.\r\n\r\n   Before this file there was no `::selection` rule anywhere in the repository —\r\n   source or built — so the UA default was unconditionally in play.\r\n\r\n   ── Why `currentColor`, and NOT the `-contrast` token ──────────────────────\r\n   The ink is not always light. sidebar.css:44 spells it out: it follows\r\n   `--theme-<color>-contrast`, and `--theme-warning-contrast` is\r\n   `rgba(0,0,0,.87)` — an amber sidebar has near-BLACK text. A rule that\r\n   hardcoded a pale wash would be wrong there in precisely the way the UA default\r\n   is wrong on navy, just in the other direction.\r\n\r\n   So the wash is a low-alpha mix of the surface's OWN ink — the same device the\r\n   shared scrollbar uses for its thumb, for the same reason. Two consequences:\r\n\r\n     · `color` is deliberately NOT set. The text keeps whatever ink its surface\r\n       gave it, so the pair can never disagree — which is the entire failure this\r\n       file exists to fix.\r\n     · the wash is a tint of that ink, so it comes out pale on navy and dark on\r\n       amber with no colour named here, no per-component override, and no\r\n       per-flavor rule. A new theme, flavor or `color` preset is right for free.\r\n\r\n   ── Two traps ─────────────────────────────────────────────────────────────\r\n   1. `::selection` accepts only a handful of properties, and the `background`\r\n      SHORTHAND is not one of them. It has to be `background-color`, or the rule\r\n      parses and then silently does nothing.\r\n\r\n   2. `currentColor` inside a highlight pseudo-element resolves to that\r\n      highlight's own colour which — because `color` is left unset above —\r\n      inherits from the originating element. That is what makes it the surface's\r\n      ink rather than the UA's highlight ink. The plain rgba that precedes it is\r\n      a deliberate fallback: an engine that refuses the mix drops only the second\r\n      declaration, so a neutral grey wash still lands and stays legible against a\r\n      light AND a dark ink, instead of the whole rule falling out and restoring\r\n      the bug.\r\n\r\n   ── Scope ─────────────────────────────────────────────────────────────────\r\n   Only the surfaces mono repaints. Cards, modals and table cells are left to the\r\n   UA on purpose: mono has not touched their ink, so the default is already\r\n   correct there, and a component library has no business restyling selection\r\n   across a host page it does not own.\r\n\r\n   Both the root class and the inner panel class are listed. The light build puts\r\n   the root class on the host element; the shadow build's host is\r\n   `<mono-shadow-…>` and `toShadowCss()` rewrites only the ELEMENT selector to\r\n   `:host`, leaving `.mono-sidebar` unmatched inside the root — the inner classes\r\n   are what carry the rule in that lane.\r\n   ─────────────────────────────────────────────────────────────────────────── */\r\n\r\n.mono-sidebar::selection,\r\n.mono-sidebar ::selection,\r\n.mono-sidebar-panel::selection,\r\n.mono-sidebar-panel ::selection,\r\n.mono-nav::selection,\r\n.mono-nav ::selection,\r\n.mono-menu::selection,\r\n.mono-menu ::selection,\r\n.mono-button::selection,\r\n.mono-button ::selection {\r\n  background-color: rgba(127, 127, 127, 0.42);\r\n  background-color: color-mix(in srgb, currentColor 30%, transparent);\r\n}\r\n";

//#endregion
//#region \0raw:C:\Users\VCT-DEV\Desktop\libs\packages\helper\src\components\skeleton\skeleton.css?raw.js
var skeleton_css_raw_default = "/*\r\n * The automatic skeleton (`pending`, see src/composables/mono-skeleton.ts).\r\n *\r\n * Every mono element that renders wrapped draws `<phantom-ui mono-skeleton>` around its\r\n * content and only toggles `loading`. phantom-ui (the optional peer\r\n * `@aejkatappaja/phantom-ui`) measures the element's real DOM and overlays shimmer\r\n * blocks; these rules make that overlay FOLLOW THE MONO THEME and cost nothing while\r\n * idle.\r\n *\r\n * Shipped in `@mono-lit/helper/ui/index.css` (via src/entries/index.css) and appended to\r\n * every shadow sheet by `toShadowCss()` — a shadow root never sees the global sheet.\r\n *\r\n * Theming hooks (set anywhere above the element, or on it):\r\n *   --mono-skeleton-bg        block colour        (default: the theme's muted surface)\r\n *   --mono-skeleton-color     sweep colour        (default: a translucent foreground wash)\r\n *   --mono-skeleton-duration  cycle length        (default 1.5s)\r\n *   --mono-skeleton-radius    the wrapper's frame (default: the theme radius)\r\n * All defaults resolve from the theme tokens, which already change per flavor and under\r\n * `.dark` — so there is no separate dark block here, and no colour is hard-coded.\r\n */\r\n\r\nphantom-ui[mono-skeleton] {\r\n  /* phantom reads these three on its host; declaring them on the element (document\r\n     level) beats its `:host` defaults, and they inherit into its shadow overlay. */\r\n  --shimmer-bg: var(--mono-skeleton-bg, var(--mono-mode-surface-hover, var(--muted)));\r\n  --shimmer-color: var(\r\n    --mono-skeleton-color,\r\n    color-mix(in oklab, var(--mono-mode-surface-strong, var(--foreground)) 22%, transparent)\r\n  );\r\n  --shimmer-duration: var(--mono-skeleton-duration, 1.5s);\r\n\r\n  /* The wrapper only exists while loading (see mono-pending.ts); should one ever sit idle,\r\n     it is not a box at all — phantom's own `:host { display: block; position: relative;\r\n     overflow: hidden }` would otherwise turn an inline control into a block. */\r\n  display: contents;\r\n}\r\n\r\n/* LOADING: become the box phantom measures against — the host's content size. */\r\nphantom-ui[mono-skeleton][loading] {\r\n  display: block;\r\n  position: relative;\r\n  overflow: hidden;\r\n  box-sizing: border-box;\r\n  max-width: 100%;\r\n  border-radius: var(--mono-skeleton-radius, var(--mono-radius-md, var(--radius)));\r\n}\r\n\r\n/* Inline hosts keep their inline flow while loading (button.css etc. set the host to\r\n   inline-block / inline-flex; a block wrapper inside would break the line). */\r\n:is(mono-button, mono-chip, mono-checkbox, mono-radio, mono-switch, mono-dropdown, mono-status-dot)\r\n  > phantom-ui[mono-skeleton][loading] {\r\n  display: inline-block;\r\n  vertical-align: middle;\r\n  width: 100%;\r\n}\r\n\r\n:is(mono-button-dropdown, mono-table-detail, mono-table-checkbox)\r\n  > phantom-ui[mono-skeleton][loading] {\r\n  display: inline-flex;\r\n}\r\n\r\n/* NESTED pending (a card still loading around a table still loading): the OUTER\r\n   skeleton is the one the user sees; the inner one goes transparent rather than\r\n   shimmering through it. The vars inherit into phantom's shadow overlay. */\r\nphantom-ui[mono-skeleton][loading] phantom-ui[mono-skeleton][loading] {\r\n  --shimmer-color: transparent;\r\n  --shimmer-bg: transparent;\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  phantom-ui[mono-skeleton] {\r\n    --shimmer-duration: 0s;\r\n  }\r\n}\r\n\r\n/* ── CSS-only skeleton: the `mono-pending` attribute ──────────────────────────\r\n   The JS-free half of the feature, for everything that has to look like a skeleton\r\n   BEFORE any script runs or where phantom-ui has nothing to measure: server HTML,\r\n   the hydration window, a plain `<div mono-pending>` bar. One vocabulary with the\r\n   component prop / phantom options:\r\n\r\n     <div mono-pending style=\"height:2rem\"></div>\r\n     <div mono-pending mono-pending-animation=\"pulse\" mono-pending-mode=\"skeleton\">…</div>\r\n\r\n   `mono-pending-animation`  shimmer (default) | pulse | breathe | solid\r\n   `mono-pending-mode`       skeleton (default: the element becomes one block, its\r\n                             content hidden) | overlay (content stays, dimmed, swept)\r\n\r\n   The mono elements set these on their HOST while `pending` resolves true, so an\r\n   element paints as a block the instant it exists; once phantom-ui is defined the\r\n   element also carries `mono-pending-covered` and this paint steps aside for\r\n   phantom's measured blocks. Without phantom-ui this IS the skeleton. */\r\n\r\n/* Every rule below mirrors phantom-ui's own stylesheet for its `.shimmer-block` (1.6.x:\r\n   `.shimmer-block { background: var(--shimmer-bg) }`, its `::after` sweep, the\r\n   `animation=\"pulse|breathe|solid\"` variants, `mode=\"overlay\"` and the reduced-motion\r\n   fallback) — one block per host instead of one per measured leaf, but the same look. */\r\n[mono-pending]:not([mono-pending=\"false\"]):not([mono-pending-covered]) {\r\n  /* phantom-ui's three knobs, resolved from the SAME mono tokens the wrapper above\r\n     hands to phantom — so this paint and phantom's measured blocks are literally the\r\n     same colours, the same gradient and the same clock. */\r\n  --shimmer-bg: var(--mono-skeleton-bg, var(--mono-mode-surface-hover, var(--muted)));\r\n  --shimmer-color: var(\r\n    --mono-skeleton-color,\r\n    color-mix(in oklab, var(--mono-mode-surface-strong, var(--foreground)) 22%, transparent)\r\n  );\r\n  --shimmer-duration: var(--mono-skeleton-duration, 1.5s);\r\n  position: relative;\r\n  overflow: hidden;\r\n  isolation: isolate;\r\n  /* phantom's `fallbackRadius` (4px) — the radius a measured leaf gets when it has none */\r\n  border-radius: var(--mono-skeleton-radius, 4px);\r\n  pointer-events: none;\r\n  user-select: none;\r\n  /* phantom hides text with -webkit-text-fill-color (see its #phantom-ui-loading-styles) */\r\n  -webkit-text-fill-color: transparent !important;\r\n  color: transparent !important;\r\n  caret-color: transparent;\r\n}\r\n\r\n/* skeleton mode (the default): the block — `.shimmer-block { background: var(--shimmer-bg) }` */\r\n[mono-pending]:not([mono-pending=\"false\"]):not([mono-pending-covered]):not([mono-pending-mode=\"overlay\"]) {\r\n  background: var(--shimmer-bg);\r\n  background-clip: padding-box;\r\n}\r\n\r\n[mono-pending]:not([mono-pending=\"false\"]):not([mono-pending-covered]):not([mono-pending-mode=\"overlay\"]) > * {\r\n  visibility: hidden;\r\n}\r\n\r\n/* overlay mode — `:host([mode=\"overlay\"]) { --shimmer-bg: transparent }` + the content stays,\r\n   dimmed: `::slotted(*) { opacity: var(--phantom-content-opacity, 0.5); transition: opacity 0.2s ease-out }` */\r\n[mono-pending][mono-pending-mode=\"overlay\"]:not([mono-pending=\"false\"]):not([mono-pending-covered]) {\r\n  --shimmer-bg: transparent;\r\n  -webkit-text-fill-color: initial !important;\r\n  color: inherit !important;\r\n}\r\n\r\n[mono-pending][mono-pending-mode=\"overlay\"]:not([mono-pending=\"false\"]):not([mono-pending-covered]) > * {\r\n  opacity: var(--phantom-content-opacity, 0.5);\r\n  transition: opacity 0.2s ease-out;\r\n}\r\n\r\n/* the sweep — `.shimmer-block::after`, verbatim */\r\n[mono-pending]:not([mono-pending=\"false\"]):not([mono-pending-covered])::after {\r\n  content: \"\";\r\n  position: absolute;\r\n  inset: 0;\r\n  z-index: 1;\r\n  pointer-events: none;\r\n  background: linear-gradient(\r\n    90deg,\r\n    var(--shimmer-bg) 30%,\r\n    var(--shimmer-color) 50%,\r\n    var(--shimmer-bg) 70%\r\n  );\r\n  background-size: 200% 100%;\r\n  animation: mono-shimmer-horizontal var(--shimmer-duration) linear infinite;\r\n}\r\n\r\n@keyframes mono-shimmer-horizontal {\r\n  0% { background-position: 200% 0; }\r\n  100% { background-position: -200% 0; }\r\n}\r\n\r\n/* pulse / breathe animate the BLOCK itself and drop the sweep; solid only drops the sweep */\r\n[mono-pending][mono-pending-animation=\"pulse\"]:not([mono-pending=\"false\"]):not([mono-pending-covered]) {\r\n  animation: mono-phantom-pulse var(--shimmer-duration) ease-in-out infinite;\r\n}\r\n\r\n[mono-pending][mono-pending-animation=\"breathe\"]:not([mono-pending=\"false\"]):not([mono-pending-covered]) {\r\n  animation: mono-phantom-breathe var(--shimmer-duration) ease-in-out infinite;\r\n}\r\n\r\n[mono-pending][mono-pending-animation=\"pulse\"]:not([mono-pending=\"false\"]):not([mono-pending-covered])::after,\r\n[mono-pending][mono-pending-animation=\"breathe\"]:not([mono-pending=\"false\"]):not([mono-pending-covered])::after,\r\n[mono-pending][mono-pending-animation=\"solid\"]:not([mono-pending=\"false\"]):not([mono-pending-covered])::after {\r\n  display: none;\r\n}\r\n\r\n@keyframes mono-phantom-pulse {\r\n  0%, 100% { opacity: 1; }\r\n  50% { opacity: 0.4; }\r\n}\r\n\r\n@keyframes mono-phantom-breathe {\r\n  0%, 100% { opacity: 0.6; transform: scale(1); }\r\n  50% { opacity: 1; transform: scale(1.02); }\r\n}\r\n\r\n/* overlay + pulse/breathe/solid: phantom keeps a flat veil (`background: var(--shimmer-color)`)\r\n   so the refresh still shows; pulse/breathe animate that veil, not the content under it */\r\n[mono-pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"pulse\"]:not([mono-pending=\"false\"]):not([mono-pending-covered]),\r\n[mono-pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"breathe\"]:not([mono-pending=\"false\"]):not([mono-pending-covered]) {\r\n  animation: none;\r\n}\r\n\r\n[mono-pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"pulse\"]:not([mono-pending=\"false\"]):not([mono-pending-covered])::after,\r\n[mono-pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"breathe\"]:not([mono-pending=\"false\"]):not([mono-pending-covered])::after,\r\n[mono-pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"solid\"]:not([mono-pending=\"false\"]):not([mono-pending-covered])::after {\r\n  display: block;\r\n  animation: none;\r\n  background: var(--shimmer-color);\r\n}\r\n\r\n[mono-pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"pulse\"]:not([mono-pending=\"false\"]):not([mono-pending-covered])::after {\r\n  animation: mono-phantom-pulse var(--shimmer-duration) ease-in-out infinite;\r\n}\r\n\r\n[mono-pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"breathe\"]:not([mono-pending=\"false\"]):not([mono-pending-covered])::after {\r\n  animation: mono-phantom-breathe var(--shimmer-duration) ease-in-out infinite;\r\n}\r\n\r\n/* reduced motion — phantom degrades every mode to the static solid block; overlay keeps\r\n   its veil, held still */\r\n@media (prefers-reduced-motion: reduce) {\r\n  [mono-pending]:not([mono-pending=\"false\"]):not([mono-pending-covered]),\r\n  [mono-pending]:not([mono-pending=\"false\"]):not([mono-pending-covered])::after {\r\n    animation: none;\r\n  }\r\n\r\n  [mono-pending]:not([mono-pending=\"false\"]):not([mono-pending-covered]):not([mono-pending-mode=\"overlay\"])::after {\r\n    display: none;\r\n  }\r\n\r\n  [mono-pending][mono-pending-mode=\"overlay\"]:not([mono-pending=\"false\"]):not([mono-pending-covered])::after {\r\n    display: block;\r\n    background: var(--shimmer-color);\r\n  }\r\n}\r\n\r\n/* NESTED blocks (a held input inside a held card): the outer block already hides them\r\n   (`visibility: hidden` on its children), so they must not each run their own animated\r\n   `::after` — on a page with dozens of controls that is dozens of composited sweeps for\r\n   nothing, and it is what made a page switch feel heavy. Inner ones go flat. */\r\n[mono-pending]:not([mono-pending=\"false\"]):not([mono-pending-covered]) [mono-pending]::after {\r\n  display: none;\r\n}\r\n\r\n[mono-pending]:not([mono-pending=\"false\"]):not([mono-pending-covered]) [mono-pending] {\r\n  animation: none;\r\n}\r\n";

//#endregion
//#region \0raw:C:\Users\VCT-DEV\Desktop\libs\packages\helper\src\components\skeleton\skeleton-shadow.css?raw.js
var skeleton_shadow_css_raw_default = "/*\r\n * Shadow-only companion of skeleton.css (appended by `toShadowCss()`, never in the\r\n * global sheet).\r\n *\r\n * phantom-ui hides the content it measures with ONE stylesheet it injects into\r\n * `document.head` (`#phantom-ui-loading-styles`: text made transparent, media and\r\n * buttons faded, pointer events off). A `<phantom-ui>` rendered INSIDE a shadow root\r\n * cannot be reached by that sheet, so a shadow element with a manual `pending` would\r\n * shimmer over still-visible text. These are the same rules (phantom ships them as its\r\n * `ssr.css` too), scoped to our wrapper, so the shadow build hides what the light build\r\n * hides.\r\n */\r\n\r\nphantom-ui[mono-skeleton][loading]:not([mode=\"overlay\"]) * {\r\n  -webkit-text-fill-color: transparent !important;\r\n  pointer-events: none;\r\n  user-select: none;\r\n}\r\n\r\nphantom-ui[mono-skeleton][loading]:not([mode=\"overlay\"]) :is(img, svg, video, canvas, button, [role=\"button\"]) {\r\n  opacity: 0 !important;\r\n}\r\n\r\nphantom-ui[mono-skeleton][loading]:not([mode=\"overlay\"]) [data-shimmer-ignore],\r\nphantom-ui[mono-skeleton][loading]:not([mode=\"overlay\"]) [data-shimmer-ignore] * {\r\n  -webkit-text-fill-color: initial !important;\r\n  pointer-events: auto;\r\n  user-select: auto;\r\n}\r\n\r\nphantom-ui[mono-skeleton][loading]:not([mode=\"overlay\"]) [data-shimmer-ignore] :is(img, svg, video, canvas, button, [role=\"button\"]) {\r\n  opacity: 1 !important;\r\n}\r\n\r\n/* The `mono-pending` attribute on a SHADOW host. The global sheet's `[mono-pending]` rules do\r\n   not reach a host from inside its own root, so the same paint is restated as `:host(...)`.\r\n   `[pending]` (the prop's own attribute, present in server HTML) counts too, so a\r\n   server-rendered `<mono-shadow-x pending>` is a skeleton before hydration. */\r\n:host([mono-pending]:not([mono-pending=\"false\"]):not([mono-pending-covered])),\r\n:host([pending]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered])) {\r\n  /* phantom-ui's three knobs, resolved from the SAME mono tokens the wrapper above\r\n     hands to phantom — so this paint and phantom's measured blocks are literally the\r\n     same colours, the same gradient and the same clock. */\r\n  --shimmer-bg: var(--mono-skeleton-bg, var(--mono-mode-surface-hover, var(--muted)));\r\n  --shimmer-color: var(\r\n    --mono-skeleton-color,\r\n    color-mix(in oklab, var(--mono-mode-surface-strong, var(--foreground)) 22%, transparent)\r\n  );\r\n  --shimmer-duration: var(--mono-skeleton-duration, 1.5s);\r\n  position: relative;\r\n  overflow: hidden;\r\n  isolation: isolate;\r\n  border-radius: var(--mono-skeleton-radius, 4px);\r\n  pointer-events: none;\r\n  user-select: none;\r\n  -webkit-text-fill-color: transparent !important;\r\n  color: transparent !important;\r\n  caret-color: transparent;\r\n}\r\n\r\n:host([mono-pending]:not([mono-pending-mode=\"overlay\"]):not([mono-pending=\"false\"]):not([mono-pending-covered])),\r\n:host([pending]:not([mono-pending-mode=\"overlay\"]):not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered])) {\r\n  background: var(--shimmer-bg);\r\n  background-clip: padding-box;\r\n}\r\n\r\n:host([mono-pending]:not([mono-pending-mode=\"overlay\"]):not([mono-pending=\"false\"]):not([mono-pending-covered])) > *,\r\n:host([mono-pending]:not([mono-pending-mode=\"overlay\"]):not([mono-pending=\"false\"]):not([mono-pending-covered])) slot,\r\n:host([pending]:not([mono-pending-mode=\"overlay\"]):not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered])) > *,\r\n:host([pending]:not([mono-pending-mode=\"overlay\"]):not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered])) slot {\r\n  visibility: hidden;\r\n}\r\n/* The `slot` selectors cover SLOTTED content (a sidebar's menu list, a modal's body):\r\n   `:host(...) > *` reaches only the shadow root's own children, and `:host(...)::slotted(*)`\r\n   — the obvious spelling — is INVALID in Chrome (the `:host()` + `::slotted()` combination\r\n   matches nothing; verified against 1234). Hiding the SLOT itself works: visibility follows\r\n   the FLAT tree, so everything the slot renders — slotted nodes and fallback alike — hides. */\r\n\r\n:host([mono-pending][mono-pending-mode=\"overlay\"]:not([mono-pending=\"false\"]):not([mono-pending-covered])),\r\n:host([pending][mono-pending-mode=\"overlay\"]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered])) {\r\n  --shimmer-bg: transparent;\r\n  -webkit-text-fill-color: initial !important;\r\n  color: inherit !important;\r\n}\r\n\r\n:host([mono-pending][mono-pending-mode=\"overlay\"]:not([mono-pending=\"false\"]):not([mono-pending-covered])) > *,\r\n:host([mono-pending][mono-pending-mode=\"overlay\"]:not([mono-pending=\"false\"]):not([mono-pending-covered])) slot,\r\n:host([pending][mono-pending-mode=\"overlay\"]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered])) > *,\r\n:host([pending][mono-pending-mode=\"overlay\"]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered])) slot {\r\n  opacity: var(--phantom-content-opacity, 0.5);\r\n  transition: opacity 0.2s ease-out;\r\n}\r\n\r\n:host([mono-pending]:not([mono-pending=\"false\"]):not([mono-pending-covered]))::after,\r\n:host([pending]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered]))::after {\r\n  content: \"\";\r\n  position: absolute;\r\n  inset: 0;\r\n  z-index: 1;\r\n  pointer-events: none;\r\n  background: linear-gradient(\r\n    90deg,\r\n    var(--shimmer-bg) 30%,\r\n    var(--shimmer-color) 50%,\r\n    var(--shimmer-bg) 70%\r\n  );\r\n  background-size: 200% 100%;\r\n  animation: mono-shimmer-horizontal var(--shimmer-duration) linear infinite;\r\n}\r\n\r\n:host([mono-pending][mono-pending-animation=\"pulse\"]:not([mono-pending=\"false\"]):not([mono-pending-covered])),\r\n:host([pending][mono-pending-animation=\"pulse\"]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered])) {\r\n  animation: mono-phantom-pulse var(--shimmer-duration) ease-in-out infinite;\r\n}\r\n\r\n:host([mono-pending][mono-pending-animation=\"breathe\"]:not([mono-pending=\"false\"]):not([mono-pending-covered])),\r\n:host([pending][mono-pending-animation=\"breathe\"]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered])) {\r\n  animation: mono-phantom-breathe var(--shimmer-duration) ease-in-out infinite;\r\n}\r\n\r\n:host([mono-pending][mono-pending-animation=\"pulse\"]:not([mono-pending=\"false\"]):not([mono-pending-covered]))::after,\r\n:host([pending][mono-pending-animation=\"pulse\"]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered]))::after,\r\n:host([mono-pending][mono-pending-animation=\"breathe\"]:not([mono-pending=\"false\"]):not([mono-pending-covered]))::after,\r\n:host([pending][mono-pending-animation=\"breathe\"]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered]))::after,\r\n:host([mono-pending][mono-pending-animation=\"solid\"]:not([mono-pending=\"false\"]):not([mono-pending-covered]))::after,\r\n:host([pending][mono-pending-animation=\"solid\"]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered]))::after {\r\n  display: none;\r\n}\r\n\r\n:host([mono-pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"pulse\"]:not([mono-pending=\"false\"]):not([mono-pending-covered])),\r\n:host([pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"pulse\"]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered])),\r\n:host([mono-pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"breathe\"]:not([mono-pending=\"false\"]):not([mono-pending-covered])),\r\n:host([pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"breathe\"]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered])) {\r\n  animation: none;\r\n}\r\n\r\n:host([mono-pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"pulse\"]:not([mono-pending=\"false\"]):not([mono-pending-covered]))::after,\r\n:host([pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"pulse\"]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered]))::after,\r\n:host([mono-pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"breathe\"]:not([mono-pending=\"false\"]):not([mono-pending-covered]))::after,\r\n:host([pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"breathe\"]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered]))::after,\r\n:host([mono-pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"solid\"]:not([mono-pending=\"false\"]):not([mono-pending-covered]))::after,\r\n:host([pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"solid\"]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered]))::after {\r\n  display: block;\r\n  animation: none;\r\n  background: var(--shimmer-color);\r\n}\r\n\r\n:host([mono-pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"pulse\"]:not([mono-pending=\"false\"]):not([mono-pending-covered]))::after,\r\n:host([pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"pulse\"]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered]))::after {\r\n  animation: mono-phantom-pulse var(--shimmer-duration) ease-in-out infinite;\r\n}\r\n\r\n:host([mono-pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"breathe\"]:not([mono-pending=\"false\"]):not([mono-pending-covered]))::after,\r\n:host([pending][mono-pending-mode=\"overlay\"][mono-pending-animation=\"breathe\"]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered]))::after {\r\n  animation: mono-phantom-breathe var(--shimmer-duration) ease-in-out infinite;\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  :host([mono-pending]:not([mono-pending=\"false\"]):not([mono-pending-covered])),\r\n  :host([pending]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered])),\r\n  :host([mono-pending]:not([mono-pending=\"false\"]):not([mono-pending-covered]))::after,\r\n  :host([pending]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered]))::after {\r\n    animation: none;\r\n  }\r\n\r\n  :host([mono-pending]:not([mono-pending-mode=\"overlay\"]):not([mono-pending=\"false\"]):not([mono-pending-covered]))::after,\r\n  :host([pending]:not([mono-pending-mode=\"overlay\"]):not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered]))::after {\r\n    display: none;\r\n  }\r\n\r\n  :host([mono-pending][mono-pending-mode=\"overlay\"]:not([mono-pending=\"false\"]):not([mono-pending-covered]))::after,\r\n  :host([pending][mono-pending-mode=\"overlay\"]:not([pending=\"false\"]):not([pending=\"auto\"]):not([mono-pending-covered]))::after {\r\n    display: block;\r\n    background: var(--shimmer-color);\r\n  }\r\n}\r\n\r\n/* The keyframes are per root: a shadow sheet cannot see the global sheet's. Same\r\n   definitions as skeleton.css (phantom-ui's `shimmer-horizontal` / `phantom-pulse` /\r\n   `phantom-breathe`). */\r\n@keyframes mono-shimmer-horizontal {\r\n  0% { background-position: 200% 0; }\r\n  100% { background-position: -200% 0; }\r\n}\r\n\r\n@keyframes mono-phantom-pulse {\r\n  0%, 100% { opacity: 1; }\r\n  50% { opacity: 0.4; }\r\n}\r\n\r\n@keyframes mono-phantom-breathe {\r\n  0%, 100% { opacity: 0.6; transform: scale(1); }\r\n  50% { opacity: 1; transform: scale(1.02); }\r\n}\r\n";

//#endregion
//#region src/composables/shadow-css.ts
function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function toShadowCss(css, opts = {}) {
	let out = css;
	if (opts.host) {
		const tag = escapeRegExp(opts.host);
		out = out.replace(new RegExp(`(^|[\\s,{}])${tag}\\[([^\\]]*)\\]`, "g"), (_m, pre, attr) => `${pre}:host([${attr}])`);
		out = out.replace(new RegExp(`(^|[\\s,{}])${tag}\\b(?![-[])`, "g"), (_m, pre) => `${pre}:host`);
	}
	const prepend = opts.hostDisplay ? `:host { display: ${opts.hostDisplay}; }\n` : "";
	const append = opts.append ? `\n${opts.append}` : "";
	return `${prepend}${out}${append}\n${scrollbar_css_raw_default}\n${selection_css_raw_default}\n${skeleton_css_raw_default}\n${skeleton_shadow_css_raw_default}`;
}
let _iconSheet = null;
/** True once we've captured at least one real `.i-…` ICON rule (not just helpers). */
let _iconSheetReady = false;
/** How many icon rules the last collection saw, so a later one can be detected. */
let _iconRuleCount = -1;
/**
* The refresh poll ran its course without seeing a glyph rule (a page whose icons are all inline
* SVG has none). From then on the sheet is treated like a ready one — re-collected only when the
* rule count moves — instead of a full collect + `replaceSync` on every adopt, and the poll is
* never re-armed.
*/
let _iconPollDone = false;
/** A rule count was taken this frame — later adopts in the same frame trust it. */
let _iconCountFresh = false;
/**
* `countIconRules()` walks every rule of every stylesheet. `adoptIconStyles` runs from
* `updated()` (every render of a shadow button-dropdown, for one), so the walk is taken at most
* once per frame; a rule UnoCSS generates mid-frame is picked up on the next.
*/
function iconRulesUnchanged() {
	if (_iconCountFresh) return true;
	_iconCountFresh = true;
	if (typeof requestAnimationFrame !== "undefined") requestAnimationFrame(() => _iconCountFresh = false);
	else _iconCountFresh = false;
	return countIconRules() === _iconRuleCount;
}
/** Selectors that target an icon utility class (`.i-…`) or the `.mono-icon` helper. */
const ICON_SELECTOR = /(^|[\s,>+~(])\.(i-[a-z0-9]|mono-icon)/i;
/** A real data-driven icon utility (`.i-mdi-…`) — what we actually wait for. */
const ICON_GLYPH_SELECTOR = /(^|[\s,>+~(])\.i-[a-z0-9]/i;
/**
* The mask a collected icon rule loses on the way in.
*
* UnoCSS emits `--un-icon: url(…)` together with `mask-image: var(--un-icon)`,
* but Chrome serialises that mask back out of `cssText` as an EMPTY value — so
* copying the rule text, which is the only way to move a rule into a
* constructable sheet, drops the one declaration that paints the glyph. The
* result is an element with the right size, the right `currentColor` fill and
* nothing to show for it.
*
* Restating it here costs one rule. An element without `--un-icon` resolves the
* var to nothing, which makes `mask-image` invalid at computed-value time and
* therefore `none` — so this cannot mask anything that is not an icon.
*/
const ICON_MASK_RULE = `
[class^='i-'],
[class*=' i-'] {
  mask-image: var(--un-icon);
  -webkit-mask-image: var(--un-icon);
  mask-size: 100% 100%;
  -webkit-mask-size: 100% 100%;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
}`;
/**
* How many icon rules the document currently carries. Counting is far cheaper
* than collecting, and it is the only way to notice that UnoCSS has generated a
* class since the last collection.
*/
function countIconRules() {
	if (typeof document === "undefined") return -1;
	let n = 0;
	for (const styleSheet of Array.from(document.styleSheets)) {
		let rules;
		try {
			rules = styleSheet.cssRules;
		} catch {
			continue;
		}
		for (const rule of Array.from(rules)) {
			const selector = rule.selectorText;
			if (selector && ICON_SELECTOR.test(selector)) n++;
		}
	}
	return n;
}
function ensureIconSheet() {
	if (isServer || typeof document === "undefined" || typeof CSSStyleSheet === "undefined") return null;
	if (!_iconSheet) try {
		_iconSheet = new CSSStyleSheet();
	} catch {
		return null;
	}
	if ((_iconSheetReady || _iconPollDone) && iconRulesUnchanged()) return _iconSheet;
	const collected = [];
	const seen = /* @__PURE__ */ new Set();
	let glyphFound = false;
	for (const styleSheet of Array.from(document.styleSheets)) {
		let rules;
		try {
			rules = styleSheet.cssRules;
		} catch {
			continue;
		}
		for (const rule of Array.from(rules)) {
			const selector = rule.selectorText;
			if (!selector || !ICON_SELECTOR.test(selector)) continue;
			if (ICON_GLYPH_SELECTOR.test(selector)) glyphFound = true;
			const text = rule.cssText;
			if (seen.has(text)) continue;
			seen.add(text);
			collected.push(text);
		}
	}
	try {
		_iconSheet.replaceSync(collected.join("\n") + ICON_MASK_RULE);
	} catch {
		for (const text of [...collected, ICON_MASK_RULE]) try {
			_iconSheet.insertRule(text, _iconSheet.cssRules.length);
		} catch {}
	}
	if (glyphFound) _iconSheetReady = true;
	_iconRuleCount = collected.length;
	return _iconSheet;
}
let _refreshScheduled = false;
/**
* The page's UnoCSS (`/_nuxt/__uno.css`) is a `<link>` that may finish loading
* AFTER the menu's last render — so `updated()` won't fire again to recapture
* the icon rules. Poll briefly (~1s of animation frames) to repopulate the live
* shared sheet; because adopters hold a reference to that same object, the
* glyphs appear as soon as the rules land — no component re-render required.
*/
function scheduleIconRefresh() {
	if (_refreshScheduled || _iconSheetReady || _iconPollDone || isServer) return;
	const raf = typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : typeof setTimeout !== "undefined" ? (cb) => setTimeout(cb, 16) : null;
	if (!raf) return;
	_refreshScheduled = true;
	let attempts = 0;
	const tick = () => {
		attempts++;
		ensureIconSheet();
		if (_iconSheetReady || attempts > 60) {
			_refreshScheduled = false;
			if (!_iconSheetReady) _iconPollDone = true;
			return;
		}
		raf(tick);
	};
	raf(tick);
}
/**
* Adopt the page's icon utility CSS into `root` so `i-…` / `.mono-icon` glyphs
* render inside the shadow tree. Idempotent and SSR-safe (no-op on the server).
* Call from `firstUpdated` AND `updated` — early calls adopt the (live) shared
* sheet; later calls / the scheduled refresh repopulate it once UnoCSS loads.
*/
function adoptIconStyles(root) {
	if (isServer || !root || !("adoptedStyleSheets" in root)) return;
	const sheet = ensureIconSheet();
	if (!sheet) return;
	if (!root.adoptedStyleSheets.includes(sheet)) root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
	if (!_iconSheetReady) scheduleIconRefresh();
}
let _utilitySheet = null;
/** True once the shared sheet has settled — after this we never re-scan on adopt. */
let _utilitySheetReady = false;
/** A rule we adopt: leading class selector, not an icon/theme rule. */
function isAdoptableUtilityRule(selector) {
	if (!/^\s*\./.test(selector)) return false;
	if (/^\s*\.vp-/.test(selector)) return false;
	return !ICON_SELECTOR.test(selector);
}
/** Collect adoptable style rules, descending into `@media`/`@supports` groups. */
function collectUtilityRules(rules, collected, seen) {
	for (const rule of Array.from(rules)) {
		const selector = rule.selectorText;
		if (selector) {
			if (!isAdoptableUtilityRule(selector)) continue;
			const text = rule.cssText;
			if (seen.has(text)) continue;
			seen.add(text);
			collected.push(text);
			continue;
		}
		if (rule.name === "mono-tokens") continue;
		const group = rule;
		if (group.cssRules?.length) {
			if (Array.from(group.cssRules).some((inner) => {
				const innerSel = inner.selectorText;
				return Boolean(innerSel && isAdoptableUtilityRule(innerSel));
			})) {
				const text = rule.cssText;
				if (seen.has(text)) continue;
				seen.add(text);
				collected.push(text);
			}
		}
	}
}
/** (Re)scan the page's stylesheets into the shared sheet. Called only while the
*  sheet is not yet "ready" (initial mount + the one-time settle poll). */
/**
* The slice of a utility framework's preflight that its own classes DEPEND ON.
*
* Tailwind / UnoCSS emit `border` as `border-width: 1px` alone, because their
* preflight has already set `border-style: solid` on every element. A shadow root
* gets no preflight, so that class painted nothing: a `cssClass` of
* `"border border-emerald-200"` gave the light build a 1px line and the shadow
* build none — the two drifted by 2px and the colour was the giveaway (it applied,
* the width did not).
*
* Kept to what is strictly needed to make the collected utilities behave; it is
* NOT a full reset, which would fight the component's own styles.
*/
const UTILITY_PREFLIGHT = `
*, ::before, ::after { border-style: solid; border-width: 0; border-color: currentColor; }
`;
function buildUtilitySheet() {
	if (!_utilitySheet) return;
	const collected = [UTILITY_PREFLIGHT];
	const seen = /* @__PURE__ */ new Set();
	for (const styleSheet of Array.from(document.styleSheets)) {
		let rules;
		try {
			rules = styleSheet.cssRules;
		} catch {
			continue;
		}
		collectUtilityRules(rules, collected, seen);
	}
	try {
		_utilitySheet.replaceSync(collected.join("\n"));
	} catch {
		for (const text of collected) try {
			_utilitySheet.insertRule(text, _utilitySheet.cssRules.length);
		} catch {}
	}
}
function ensureUtilitySheet() {
	if (isServer || typeof document === "undefined" || typeof CSSStyleSheet === "undefined") return null;
	if (!_utilitySheet) try {
		_utilitySheet = new CSSStyleSheet();
	} catch {
		return null;
	}
	if (_utilitySheetReady) return _utilitySheet;
	buildUtilitySheet();
	return _utilitySheet;
}
let _utilityRefreshScheduled = false;
/**
* The page's UnoCSS may finish loading / grow AFTER a shadow component's last
* render. Poll briefly (~1s of animation frames), repopulating the live shared
* sheet each frame; adopters hold a reference to that same object, so utilities
* appear as soon as their rules land — no component re-render required.
*/
function scheduleUtilityRefresh() {
	if (_utilityRefreshScheduled || _utilitySheetReady || isServer) return;
	const raf = typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : typeof setTimeout !== "undefined" ? (cb) => setTimeout(cb, 16) : null;
	if (!raf) return;
	_utilityRefreshScheduled = true;
	let attempts = 0;
	let lastCount = -1;
	let stable = 0;
	const tick = () => {
		attempts++;
		buildUtilitySheet();
		const count = _utilitySheet?.cssRules.length ?? 0;
		if (count === lastCount) stable++;
		else {
			stable = 0;
			lastCount = count;
		}
		if (stable >= 3 || attempts > 60) {
			_utilitySheetReady = true;
			return;
		}
		raf(tick);
	};
	raf(tick);
}
/**
* Adopt the page's utility CSS into `root` so consumer `cssClass` utilities
* (UnoCSS etc.) render inside the shadow tree. Idempotent and SSR-safe (no-op on
* the server). Call from `firstUpdated` AND `updated` — early calls adopt the
* (live) shared sheet; the scheduled refresh repopulates it as UnoCSS loads.
*/
function adoptUtilityStyles(root) {
	if (isServer || !root || !("adoptedStyleSheets" in root)) return;
	const sheet = ensureUtilitySheet();
	if (!sheet) return;
	if (!root.adoptedStyleSheets.includes(sheet)) root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
	if (!_utilitySheetReady) scheduleUtilityRefresh();
}
/** Reactive controller that re-adopts the utility sheet after every render. */
var UtilityStylesController = class {
	constructor(host) {
		this.host = host;
		host.addController(this);
	}
	hostUpdated() {
		adoptUtilityStyles(this.host.renderRoot);
	}
};
/**
* Mixin for `*.shadow.ts` builds: adopts the page's utility CSS into the shadow
* root so consumer `cssClass` utilities (UnoCSS etc.) paint inside the tree.
* Uses a reactive controller (its `hostUpdated` runs after EVERY render), so it
* works regardless of whether a subclass overrides `updated`/`firstUpdated`.
* Client-only — skipped entirely on the server (SSR renders unstyled, utilities
* snap in on hydration). Apply as `extends withShadowUtilityStyles(XCore(LitElement))`.
*/
function withShadowUtilityStyles(superClass) {
	class WithShadowUtilityStyles extends superClass {
		constructor(...args) {
			super(...args);
			if (!isServer) new UtilityStylesController(this);
		}
	}
	return WithShadowUtilityStyles;
}

//#endregion
//#region src/composables/hydration-flush.ts
/**
* Force an SSR'd element's first client update to flush.
*
* Under `nuxt-ssr-lit` the server-rendered element can stay `hasUpdated: false`
* with updates disabled even after `<LitWrapper>` removes `defer-hydration` —
* so `render()` never re-runs and its event handlers never bind. The element is
* then frozen at whatever the SERVER assumed, while its JS properties keep
* taking client values: a silent divergence between the rendered DOM and the
* live props.
*
* Poll `requestUpdate()` for a few ticks until the element reports `hasUpdated`.
* A no-op once the element has hydrated normally.
*
* Scheduling races `requestAnimationFrame` against a `setTimeout` backstop:
* rAF does NOT fire in a hidden, minimized, or fully occluded tab, and relying
* on it alone leaves the element frozen until the tab is next painted.
*/
function flushSsrHydration(el, options = {}) {
	if (typeof window === "undefined") return;
	const { gate, maxTries = 30 } = options;
	const schedule = (cb) => {
		let fired = false;
		const once = () => {
			if (fired) return;
			fired = true;
			cb();
		};
		if (typeof requestAnimationFrame !== "undefined") requestAnimationFrame(once);
		setTimeout(once, 32);
	};
	let tries = 0;
	const tick = () => {
		if (el.hasUpdated || tries++ > maxTries) return;
		if (!gate || gate()) {
			el.removeAttribute("defer-hydration");
			el.requestUpdate();
		}
		schedule(tick);
	};
	schedule(tick);
}

//#endregion
export { withShadowUtilityStyles as i, adoptIconStyles as n, toShadowCss as r, flushSsrHydration as t };