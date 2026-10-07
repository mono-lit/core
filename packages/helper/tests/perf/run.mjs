// Browser-driven regression tests for @mono-lit/helper.
//
//   pnpm build && pnpm test:perf
//
// Requires a built `dist/` — the fixtures import the public `@mono-lit/helper/ui/*` entry
// points so the tests exercise exactly what a consumer loads. `playwright` and
// `esbuild` come from the workspace root.

import {
  assertBuilt,
  bundleFixture,
  createReporter,
  flavorCss,
  loadPlaywright,
  pageHtml,
  serve,
  sunEditorCss,
} from './harness.mjs'

import { run as buttonDropdown } from './button-dropdown.spec.mjs'
import { run as guardedProps } from './guarded-props.spec.mjs'
import { run as dialogZIndex } from './dialog-z-index.spec.mjs'
import { run as dialogOutsideClick } from './dialog-outside-click.spec.mjs'
import { run as dialogOverlayStack } from './dialog-overlay-stack.spec.mjs'
import { run as tooltipArrow } from './tooltip-arrow.spec.mjs'
import { run as sizeDefaults } from './size-defaults.spec.mjs'
import { run as breadcrumbIcons } from './breadcrumb-icons.spec.mjs'
import { run as modalSlots } from './modal-slots.spec.mjs'
import { run as modalController } from './modal-controller.spec.mjs'
import { run as controlPairing } from './control-pairing.spec.mjs'
import { run as selectLoop } from './select-loop.spec.mjs'
import { run as fieldHeights } from './field-heights.spec.mjs'
import { run as headerFilterScroll } from './header-filter-scroll.spec.mjs'
import { run as dropdownTableInfinity } from './dropdown-table-infinity.spec.mjs'
import { run as attrContract } from './attr-contract.spec.mjs'
import { run as dropdownTableNested } from './dropdown-table-nested.spec.mjs'
import { run as fieldOpenGesture } from './field-open-gesture.spec.mjs'
import { run as selectPortal } from './select-portal.spec.mjs'
import { run as dateFilter } from './date-filter.spec.mjs'
import { run as rowSelectionKey } from './row-selection-key.spec.mjs'
import { run as tableCellControls } from './table-cell-controls.spec.mjs'
import { run as dropdownSelectAll } from './dropdown-select-all.spec.mjs'
import { run as dropdownEdge } from './dropdown-edge.spec.mjs'
import { run as dropdownAttributes } from './dropdown-attributes.spec.mjs'
import { run as buttonDropdownAttributes } from './button-dropdown-attributes.spec.mjs'
import { run as accordionAttributes } from './accordion-attributes.spec.mjs'
import { run as tabsAttributes } from './tabs-attributes.spec.mjs'
import { run as modalAttributes } from './modal-attributes.spec.mjs'
import { run as drawerAttributes } from './drawer-attributes.spec.mjs'
import { run as navAttributes } from './nav-attributes.spec.mjs'
import { run as breadcrumbAttributes } from './breadcrumb-attributes.spec.mjs'
import { run as filterAttributes } from './filter-attributes.spec.mjs'
import { run as dropdownTableAttributes } from './dropdown-table-attributes.spec.mjs'
import { run as chartTheme } from './chart-theme.spec.mjs'
import { run as richTextEditorAttributes } from './rich-text-editor-attributes.spec.mjs'
import { run as themeParity } from './theme-parity.spec.mjs'
import { run as demoWrapperParity } from './demo-wrapper-parity.spec.mjs'
import { run as demoClassNames } from './demo-class-names.spec.mjs'
import { run as demoTableNesting } from './demo-table-nesting.spec.mjs'
import { run as colorDocs } from './color-docs.spec.mjs'
import { run as listSlotParity } from './list-slot-parity.spec.mjs'
import { run as chipStripCost } from './chip-strip-cost.spec.mjs'
import { run as tagInputSelectAll } from './tag-input-select-all.spec.mjs'
import { run as tableEmpty } from './table-empty.spec.mjs'
import { run as tableLoadingManual } from './table-loading-manual.spec.mjs'
import { run as formFeedbackLoop } from './form-feedback-loop.spec.mjs'
import { run as tableError } from './table-error.spec.mjs'
import { run as tableLegacyClasses } from './table-legacy-classes.spec.mjs'
import { run as richTextEditor } from './rich-text-editor.spec.mjs'
import { run as eventAliases } from './event-aliases.spec.mjs'
import { run as controllerEvents } from './controller-events.spec.mjs'
import { run as morePanel } from './more-panel.spec.mjs'
import { run as buttonRounded } from './button-rounded.spec.mjs'
import { run as buttonShadowParity } from './button-shadow-parity.spec.mjs'
import { run as buttonCssVars } from './button-css-vars.spec.mjs'
// Controller-only (no fixture, no page) — it drives `monoDataGrid` through the node entry.
import { run as scrollPagingRace } from './scroll-paging-race.spec.mjs'
import { run as baseFilter } from './base-filter.spec.mjs'
import { run as chartBaseQuery } from './chart-base-query.spec.mjs'
import { run as scrollModeChurn } from './scroll-mode-churn.spec.mjs'

const SPECS = [
  ['mono-button-dropdown', buttonDropdown],
  ['mono-button-dropdown attributes', buttonDropdownAttributes],
  ['mono-accordion attributes', accordionAttributes],
  ['mono-tabs attributes', tabsAttributes],
  ['mono-modal attributes', modalAttributes],
  ['mono-drawer attributes', drawerAttributes],
  ['mono-nav attributes', navAttributes],
  ['mono-breadcrumb attributes', breadcrumbAttributes],
  ['mono-filter-builder attributes', filterAttributes],
  ['arrayHasChanged guards', guardedProps],
  ['modal / drawer z-index', dialogZIndex],
  ['modal / drawer outside click without an overlay', dialogOutsideClick],
  ['modal / drawer stacked overlays', dialogOverlayStack],
  ['tooltip arrow on rounded bubbles', tooltipArrow],
  ['size defaults (md)', sizeDefaults],
  ['breadcrumb icons', breadcrumbIcons],
  ['modal header/footer aliases', modalSlots],
  ['modal controller + programmatic dialog', modalController],
  ['checkbox / radio ↔ input pairing', controlPairing],
  ['mono-select in a loop', selectLoop],
  ['inline chip strip: cost', chipStripCost],
  ['field heights ↔ --theme-control-height', fieldHeights],
  ['header filter panel does not scroll away', headerFilterScroll],
  ['dropdown-table: infinity scroll after the portal move', dropdownTableInfinity],
  ['attribute-only markup reaches the class-keyed logic', attrContract],
  ['nested popups keep the dropdown-table open', dropdownTableNested],
  ['dropdown-table styling attributes', dropdownTableAttributes],
  ['chart: the canvas takes the Basecoat tokens', chartTheme],
  ['rich-text-editor styling attributes', richTextEditorAttributes],
  ['field-click gesture: chevron opens and closes', fieldOpenGesture],
  ['select portal mirrors the styling attributes', selectPortal],
  ['date filter: the year → second tree', dateFilter],
  ['row selection vs a mismatched keyExpr', rowSelectionKey],
  ['checkbox / radio / switch inside a cell', tableCellControls],
  ['dropdown-table selectAll', dropdownSelectAll],
  ['tag-input selectAll from the server', tagInputSelectAll],
  ['mono-table-empty', tableEmpty],
  ['mono-table-loading manual', tableLoadingManual],
  ['controlMonoForm feedback loop', formFeedbackLoop],
  ['mono-table-error', tableError],
  ['table legacy class contract (.mono-table… ≡ [mono-table…])', tableLegacyClasses],
  ['mono-rich-text-editor (suneditor addon)', richTextEditor],
  ['plain event names ↔ mno-* aliases (light + shadow)', eventAliases],
  ['event handlers through controller props', controllerEvents],
  ['"+N more" chip panel floats (tag-input + dropdown-table)', morePanel],
  ['button rounded scale', buttonRounded],
  ['button: light === shadow', buttonShadowParity],
  ['button css vars', buttonCssVars],
  ['dropdown at a viewport edge', dropdownEdge],
  ['dropdown styling attributes', dropdownAttributes],
  ['theme flavors: light === shadow', themeParity],
  ['demo tabs: css/ wrapper === vue/ wrapper', demoWrapperParity],
  ['demo CSS: example-* class names', demoClassNames],
  ['demo markup: table elements in valid hosts', demoTableNesting],
  ['ui/color.md matches index.css', colorDocs],
  ['slot="list" lines === mono option rules', listSlotParity],
  ['scroll paging: a reset overtaking loadNext()', scrollPagingRace],
  ['base query: a consumer filter survives the grid', baseFilter],
  ['base query: the chart carries it on drain, page and odata', chartBaseQuery],
  ['scroll mode churn: portal move costs no requests', scrollModeChurn],
]

const css = assertBuilt()
const { server, port } = await serve({
  app: pageHtml(css, await bundleFixture('app')),
  guarded: pageHtml(css, await bundleFixture('guarded')),
  'dialog-z': pageHtml(css, await bundleFixture('dialog-z')),
  'dialog-outside-click': pageHtml(css, await bundleFixture('dialog-outside-click')),
  'dialog-overlay-stack': pageHtml(css, await bundleFixture('dialog-overlay-stack')),
  'tooltip-arrow': pageHtml(
    css + ['vega', 'luma', 'lyra', 'maia', 'mira', 'nova', 'rhea', 'sera', 'one'].map((f) => flavorCss(f)).join('\n'),
    await bundleFixture('tooltip-arrow'),
  ),
  'size-defaults': pageHtml(css, await bundleFixture('size-defaults')),
  'breadcrumb-icons': pageHtml(css, await bundleFixture('breadcrumb-icons')),
  'modal-slots': pageHtml(css, await bundleFixture('modal-slots')),
  'modal-controller': pageHtml(css, await bundleFixture('modal-controller')),
  'control-pairing': pageHtml(css, await bundleFixture('control-pairing')),
  'select-loop': pageHtml(css, await bundleFixture('select-loop')),
  'field-heights': pageHtml(css, await bundleFixture('field-heights')),
  'header-filter-scroll': pageHtml(css, await bundleFixture('header-filter-scroll')),
  'dropdown-table-nested': pageHtml(css, await bundleFixture('dropdown-table-nested')),
  'dropdown-table-infinity': pageHtml(css, await bundleFixture('dropdown-table-infinity')),
  'attr-contract': pageHtml(css, await bundleFixture('attr-contract')),
  'field-open-gesture': pageHtml(css, await bundleFixture('field-open-gesture')),
  'select-portal': pageHtml(css, await bundleFixture('select-portal')),
  'date-filter': pageHtml(css, await bundleFixture('date-filter')),
  'date-filter-odata': pageHtml(css, await bundleFixture('date-filter-odata')),
  'row-selection-key': pageHtml(css, await bundleFixture('row-selection-key')),
  'table-cell-controls': pageHtml(css, await bundleFixture('table-cell-controls')),
  'dropdown-select-all': pageHtml(css, await bundleFixture('dropdown-select-all')),
  'dropdown-edge': pageHtml(css, await bundleFixture('dropdown-edge')),
  'dropdown-attributes': pageHtml(css, await bundleFixture('dropdown-attributes')),
  'button-dropdown-attributes': pageHtml(css, await bundleFixture('button-dropdown-attributes')),
  // The accordion spec asserts the PORT's reference metrics, so its page loads
  // vega on top of the default sheet — that one carries ONE, whose accordion
  // identity deliberately differs (see flavors/one.css).
  'accordion-attributes': pageHtml(
    css + flavorCss('vega'),
    await bundleFixture('accordion-attributes'),
  ),
  // Same reason as the accordion page above: upstream's own numbers.
  'tabs-attributes': pageHtml(css + flavorCss('vega'), await bundleFixture('tabs-attributes')),
  'modal-attributes': pageHtml(css + flavorCss('vega'), await bundleFixture('modal-attributes')),
  'drawer-attributes': pageHtml(css + flavorCss('vega'), await bundleFixture('drawer-attributes')),
  'nav-attributes': pageHtml(css + flavorCss('vega'), await bundleFixture('nav-attributes')),
  'breadcrumb-attributes': pageHtml(css + flavorCss('vega'), await bundleFixture('breadcrumb-attributes')),
  'filter-attributes': pageHtml(css + flavorCss('vega'), await bundleFixture('filter-attributes')),
  'dropdown-table-attributes': pageHtml(css + flavorCss('vega'), await bundleFixture('dropdown-table-attributes')),
  'chart-theme': pageHtml(css, await bundleFixture('chart-theme')),
  'rich-text-editor-attributes': pageHtml(css + flavorCss('vega') + sunEditorCss(), await bundleFixture('rich-text-editor-attributes')),
  'chip-strip': pageHtml(css, await bundleFixture('chip-strip')),
  'tag-input-select-all': pageHtml(css, await bundleFixture('tag-input-select-all')),
  'table-empty': pageHtml(css, await bundleFixture('table-empty')),
  'table-loading-manual': pageHtml(css, await bundleFixture('table-loading-manual')),
  'form-feedback-loop': pageHtml(css, await bundleFixture('form-feedback-loop')),
  'table-error': pageHtml(css, await bundleFixture('table-error')),
  'table-legacy-classes': pageHtml(css, await bundleFixture('table-legacy-classes')),
  'rich-text-editor': pageHtml(css + sunEditorCss(), await bundleFixture('rich-text-editor')),
  'event-aliases': pageHtml(css, await bundleFixture('event-aliases')),
  'controller-events': pageHtml(css, await bundleFixture('controller-events')),
  'more-panel': pageHtml(css, await bundleFixture('more-panel')),
  'button-rounded': pageHtml(css, await bundleFixture('button-rounded')),
  'button-shadow-parity': pageHtml(css, await bundleFixture('button-shadow-parity')),
  'button-css-vars': pageHtml(css, await bundleFixture('button-css-vars')),
})

const { chromium } = await loadPlaywright()
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } })
const page = await context.newPage()

const failures = []
page.on('pageerror', (e) => failures.push(`page error: ${e.message}`))

let ok = true
try {
  for (const [title, spec] of SPECS) {
    const reporter = createReporter(title)
    await spec({ port, page, reporter })
    if (!reporter.report()) ok = false
  }
} finally {
  await browser.close()
  server.close()
}

if (failures.length) {
  ok = false
  console.log('  Uncaught page errors:')
  for (const f of failures) console.log(`    ${f}`)
}

process.exit(ok ? 0 : 1)
