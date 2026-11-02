/**
 * The tooltip addon as `field-tooltip` lazy-loads it — ONE module, imported dynamically and
 * from nowhere else.
 *
 * `field-tooltip` used to `import()` `control-tooltip` and `tooltip-loader` directly. Both are
 * also imported STATICALLY by the root entry, so rolldown had to hand the dynamic importer a
 * synthesized namespace object (`__exportAll`) — and its runtime helpers sat in the report
 * engine's markdown chunk, so `import … from '@mono-lit/helper'` loaded and evaluated ~500KB of
 * remark/micromark. A module that is only ever dynamically imported is its own chunk entry, and
 * `import()` returns its real namespace: no helper, no markdown.
 */
import { controlMonoTooltip } from './control-tooltip'
import { loadFloatingUi } from './tooltip-loader'

/** `controlMonoTooltip` once the optional `@floating-ui/dom` peer has loaded; rejects without it. */
export async function loadFieldTooltipAddon(): Promise<typeof controlMonoTooltip> {
  await loadFloatingUi()
  return controlMonoTooltip
}
