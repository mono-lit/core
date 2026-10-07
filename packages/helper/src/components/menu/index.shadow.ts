// Shadow-DOM / SSR build entry for menu — `@mono-lit/helper/ui/shadow/menu`.
// Registers the SAME `mono-menu` tag as the light build (`@mono-lit/helper/ui/menu`),
// so a document must import only one of the two. SSR consumers drive the menu
// via the `items` prop (the declarative `<mono-menu-list>` composition is a
// light-only feature and has no shadow build).
export { MonoMenuShadow } from './mono-menu.shadow.js'

export { MonoMenuCore } from './menu-core.js'
export type { MonoMenuCoreInterface, MonoMenuListLike } from './menu-core.js'

export type {
  MenuDensity,
  MenuColor,
  MenuBadgeColor,
  MenuItem,
  MenuItemBase,
  MenuCssClass,
  MenuChangeEventDetail,
  MenuChangeEvent,
  MenuClickEventDetail,
  MenuClickEvent,
  MenuToggleGroupEventDetail,
  MenuToggleGroupEvent,
  MenuProps,
  MenuEvents,
  MonoMenuListType,
  MenuListProps,
} from './menu-types.js'

export {
  isItem,
  isGroup,
  isDivider,
  isSubheader,
  isIconifyClass,
  findActivePath,
  findItem,
  collectDefaultOpenGroups,
  generateMenuRootClasses,
  getMenuAlias,
  validateMenuProps,
} from './menu-utils.js'

export {
  renderMenuList,
  renderMenuGroupsOnly,
  renderMenuItemRow,
  renderMenuGroup,
  renderMenuDivider,
  renderMenuSubheader,
  renderMenuIcon,
  renderMenuBadge,
  renderMenuAppend,
  type MenuRenderContext,
} from './menu-render.js'
