// Shadow-DOM / SSR build entry for dropdown-table —
// `@mono-lit/helper/ui/shadow/dropdown-table`. Registers the DISTINCT
// `mono-shadow-dropdown-table` tag (the light `mono-dropdown-table` coexists).
export { MonoDropdownTableShadow } from './mono-dropdown-table.shadow.js'
export { MonoDropdownTableCore } from './dropdown-table-core.js'
export { monoDataDropdown } from './mono-data-dropdown.js'
export type {
  MonoDropdownController,
  MonoDropdownItem,
  MonoDataDropdownOptions,
} from './mono-data-dropdown.js'
export type {
  DropdownTableProps,
  DropdownTableEvents,
  DropdownTableChangeEvent,
  DropdownTableChangeEventDetail,
  DropdownTableSize,
  DropdownTableColor,
  DropdownTableVariant,
  DropdownTableValidationState,
  DropdownPanelOptions,
  DropdownTableChipProps,
  ChipBehaviour,
} from './dropdown-table-types.js'
