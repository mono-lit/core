// Shadow-DOM / SSR build entry for breadcrumb — `@mono-lit/helper/ui/shadow/breadcrumb`.
//
// Registers the SAME `mono-breadcrumb` AND `mono-breadcrumb-list` tags as the
// light build (`@mono-lit/helper/ui/breadcrumb`), so a document must import only one
// of the two. SSR consumers drive `mono-breadcrumb` via the `items` prop;
// `mono-breadcrumb-list` SSRs in STANDALONE mode (items / single item / direct
// single-row props) — the child-of-`<mono-breadcrumb>` composition is a
// light-only feature. Re-exports the same types/utils/render block as ./index.ts.
export { MonoBreadcrumbShadow } from './mono-breadcrumb.shadow.js'
export { MonoBreadcrumbListShadow } from './mono-breadcrumb-list.shadow.js'

export { MonoBreadcrumbCore } from './breadcrumb-core.js'
export type {
  MonoBreadcrumbCoreInterface,
  MonoBreadcrumbListLike,
} from './breadcrumb-core.js'

export type {
  BreadcrumbVariant,
  BreadcrumbSize,
  BreadcrumbColor,
  BreadcrumbBadgeColor,
  BreadcrumbItem,
  BreadcrumbCssClass,
  BreadcrumbClickEventDetail,
  BreadcrumbClickEvent,
  BreadcrumbChangeEventDetail,
  BreadcrumbChangeEvent,
  BreadcrumbProps,
  BreadcrumbEvents,
  BreadcrumbListProps,
} from './breadcrumb-types.js'

export {
  coerceItems,
  findItemIndex,
  resolveCurrentId,
  generateBreadcrumbRootClasses,
  validateBreadcrumbProps,
} from './breadcrumb-utils.js'

export {
  renderBreadcrumbList,
  renderBreadcrumbItemsLeadingSep,
  renderBreadcrumbItemRow,
  renderBreadcrumbSeparator,
  renderBreadcrumbIcon,
  renderBreadcrumbBadge,
  type BreadcrumbRenderContext,
} from './breadcrumb-render.js'
