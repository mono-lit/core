// Colour presets + structure flavors — the typed face of src/data/theme/presets.json.
//
// Colours are Basecoat / shadcn token names (camelCased): the generated CSS
// (`pnpm theme:build`) turns them into `--background`, `--primary-foreground`,
// `.theme-color-<name>` blocks and their `.dark` twins. Values here are the hex
// the presets were authored in; the CSS carries OKLCH.

import presetsJson from './presets.json'

/** Colour presets: ONE (the `:root` default) and Basecoat's own neutral palette. */
export type ThemeName = 'basecoat' | 'one'

/** `system` follows `prefers-color-scheme`; the others pin `html.dark` on/off. */
export type ThemeMode = 'light' | 'dark' | 'system'

/**
 * The shadcn / Basecoat token set (`--background` … `--sidebar-ring`). Every
 * key is optional except the six a palette cannot be derived without; the
 * generator fills the rest (foregrounds by contrast, popover from card, …).
 */
export interface BasecoatTokens {
  radius?: string
  background: string
  foreground: string
  card?: string
  cardForeground?: string
  popover?: string
  popoverForeground?: string
  primary: string
  primaryForeground?: string
  secondary?: string
  secondaryForeground?: string
  muted: string
  mutedForeground?: string
  accent?: string
  accentForeground?: string
  destructive: string
  destructiveForeground?: string
  border: string
  input?: string
  ring?: string
  chart1?: string
  chart2?: string
  chart3?: string
  chart4?: string
  chart5?: string
  sidebar?: string
  sidebarForeground?: string
  sidebarPrimary?: string
  sidebarPrimaryForeground?: string
  sidebarAccent?: string
  sidebarAccentForeground?: string
  sidebarBorder?: string
  sidebarRing?: string
}

/** mono's extension roles — Basecoat has only `primary` + `destructive`. */
export interface MonoRoleTokens {
  success: string
  successForeground?: string
  warning: string
  warningForeground?: string
  info: string
  infoForeground?: string
  teal: string
  tealForeground?: string
  purple: string
  purpleForeground?: string
  neutral: string
  neutralForeground?: string
  dark: string
  darkForeground?: string
}

export type ThemePalette = BasecoatTokens & MonoRoleTokens

export interface ThemeColors {
  displayName: string
  /** Light-mode palette. For the `basecoat` preset only the extension roles are listed — the rest is Basecoat's own base.css. */
  light: Partial<ThemePalette>
  /**
   * Dark-mode overrides; a missing block is derived (see scripts/theme-build.mjs).
   * `false` = the preset has no dark mode and keeps its light values under `html.dark`.
   */
  dark?: Partial<ThemePalette> | false
}

type PresetsJson = Record<string, unknown>
const raw = presetsJson as PresetsJson

function pick(name: ThemeName): ThemeColors {
  const p = raw[name] as { displayName: string; light: Partial<ThemePalette>; dark?: Partial<ThemePalette> | false }
  return { displayName: p.displayName, light: p.light, dark: p.dark }
}

export const themePresets: Record<ThemeName, ThemeColors> = {
  one: pick('one'),
  basecoat: pick('basecoat'),
}

/** ONE (the default) plus Basecoat's eight styles, mirrored 1:1 as opt-in flavors. */
export type FlavorName = 'vega' | 'nova' | 'maia' | 'lyra' | 'mira' | 'luma' | 'sera' | 'rhea' | 'one'

export const DEFAULT_THEME: ThemeName = 'one'
export const DEFAULT_FLAVOR: FlavorName = 'one'

/**
 * A flavor is a Basecoat STYLE: it never changes tokens or fonts, only
 * per-component metrics (the control ladder, radius steps, paddings, text
 * sizes, whether a shadow is present). ONE is the default (index.css applies
 * it at :root); every Basecoat style ships as `@mono-lit/helper/ui/theme/<name>.css`
 * and is activated with `class="theme-<name>"`.
 */
export interface ThemeFlavor {
  displayName: string
  /** One line on what the style changes against vega. */
  summary: string
  /** The Basecoat style it mirrors (`one` is mono's own). */
  vendor?: 'vega' | 'nova' | 'maia' | 'lyra' | 'mira' | 'luma' | 'sera' | 'rhea'
  /** Control heights (xs … xxl) in rem — the `--mono-control-height-*` ladder. */
  controlHeights: [number, number, number, number, number, number]
}

export const flavorPresets: Record<FlavorName, ThemeFlavor> = {
  one: { displayName: 'ONE', summary: 'EJI ONE design system: Poppins, 40px controls, 8px control radius, semibold sentence-case labels, soft shadows.', controlHeights: [1.75, 2.25, 2.5, 2.75, 3, 3.25] },
  vega: { displayName: 'Vega', summary: 'The Basecoat default: rounded-md, h-9 controls.', vendor: 'vega', controlHeights: [1.5, 2, 2.25, 2.5, 2.75, 3] },
  nova: { displayName: 'Nova', summary: 'Compact, rounded-lg, h-8 controls.', vendor: 'nova', controlHeights: [1.5, 1.75, 2, 2.25, 2.5, 2.75] },
  maia: { displayName: 'Maia', summary: 'Pill-shaped, roomy padding, tinted outline surfaces.', vendor: 'maia', controlHeights: [1.5, 2, 2.25, 2.5, 2.75, 3] },
  lyra: { displayName: 'Lyra', summary: 'Square corners, small type, 1px focus ring.', vendor: 'lyra', controlHeights: [1.5, 1.75, 2, 2.25, 2.5, 2.75] },
  mira: { displayName: 'Mira', summary: 'Dense: h-7 controls, text-xs, tight padding.', vendor: 'mira', controlHeights: [1.25, 1.5, 1.75, 2, 2.25, 2.5] },
  luma: { displayName: 'Luma', summary: 'Pill-shaped and soft, 30% focus ring.', vendor: 'luma', controlHeights: [1.5, 2, 2.25, 2.5, 2.75, 3] },
  sera: { displayName: 'Sera', summary: 'Editorial: square, uppercase, h-10 controls, wide padding.', vendor: 'sera', controlHeights: [1.75, 2.25, 2.5, 2.75, 3, 3.25] },
  rhea: { displayName: 'Rhea', summary: 'Compact, rounded-2xl, 30% focus ring.', vendor: 'rhea', controlHeights: [1.5, 1.75, 2, 2.25, 2.5, 2.75] },
}
