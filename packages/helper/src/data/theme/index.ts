// @unocss-include
import { DEFAULT_FLAVOR, DEFAULT_THEME, flavorPresets, themePresets, type FlavorName, type ThemeName } from './presets'

export interface ThemeConfig {
  name: ThemeName
  displayName: string
}

export interface FlavorConfig {
  name: FlavorName
  displayName: string
}

export const themes: Record<ThemeName, ThemeConfig> = Object.fromEntries(
  (Object.keys(themePresets) as ThemeName[]).map((name) => [name, { name, displayName: themePresets[name].displayName }]),
) as Record<ThemeName, ThemeConfig>

export const flavors: Record<FlavorName, FlavorConfig> = Object.fromEntries(
  (Object.keys(flavorPresets) as FlavorName[]).map((name) => [name, { name, displayName: flavorPresets[name].displayName }]),
) as Record<FlavorName, FlavorConfig>

// Color presets are orthogonal to the flavor (structure) and apply
// `.theme-color-<name>`; `one` is what :root already carries.
const COLOR_CLASS_PREFIX = 'theme-color-'
const COLOR_CLASSES = Object.keys(themes).map(
  (name) => `${COLOR_CLASS_PREFIX}${name}`,
)

// Flavor (structure). ONE is the default (no class — index.css applies it at
// :root); every Basecoat style applies `.theme-<name>` (shipped in
// `ui/theme/<name>.css`).
const STRUCTURE_CLASS_PREFIX = 'theme-'
const STRUCTURE_CLASSES = (Object.keys(flavors) as FlavorName[])
  .filter((name) => name !== DEFAULT_FLAVOR)
  .map((name) => `${STRUCTURE_CLASS_PREFIX}${name}`)

function getThemeTarget(): HTMLElement {
  return document.body || document.documentElement
}

function setColorClass(themeName: ThemeName): boolean {
  if (!themes[themeName]) {
    console.warn(`Theme color "${themeName}" not found`)
    return false
  }
  const target = getThemeTarget()
  target.classList.remove(...COLOR_CLASSES)
  target.classList.add(`${COLOR_CLASS_PREFIX}${themeName}`)
  document.documentElement.setAttribute('data-theme-color', themeName)
  return true
}

function setFlavorClass(flavorName: FlavorName): boolean {
  if (!flavors[flavorName]) {
    console.warn(`Theme "${flavorName}" not found`)
    return false
  }
  const target = getThemeTarget()
  // ONE is the default (no class); every Basecoat style adds `.theme-<name>`.
  target.classList.remove(...STRUCTURE_CLASSES)
  if (flavorName !== DEFAULT_FLAVOR) {
    target.classList.add(`${STRUCTURE_CLASS_PREFIX}${flavorName}`)
  }
  document.documentElement.setAttribute('data-theme', flavorName)
  return true
}

function dispatchThemeChanged(): void {
  const color = getCurrentTheme()
  const flavor = getCurrentFlavor()
  window.dispatchEvent(
    new CustomEvent('theme-changed', {
      detail: {
        theme: color,
        themeData: themes[color],
        color,
        flavor,
        flavorData: flavors[flavor],
      },
      bubbles: true,
      composed: true,
    }),
  )
}

export type ApplyThemeInput = ThemeName | { color?: ThemeName; flavor?: FlavorName }

export function applyTheme(input: ApplyThemeInput): void {
  let changed = false
  if (typeof input === 'string') {
    changed = setColorClass(input) || changed
  } else {
    if (input.color !== undefined) changed = setColorClass(input.color) || changed
    if (input.flavor !== undefined) changed = setFlavorClass(input.flavor) || changed
  }
  if (changed) dispatchThemeChanged()
}

export function applyFlavor(flavorName: FlavorName): void {
  if (setFlavorClass(flavorName)) dispatchThemeChanged()
}

export function getCurrentTheme(): ThemeName {
  const target = getThemeTarget()

  for (const themeName of Object.keys(themes) as ThemeName[]) {
    if (target.classList.contains(`${COLOR_CLASS_PREFIX}${themeName}`)) {
      return themeName
    }
  }

  const dataColor = document.documentElement.getAttribute('data-theme-color')
  if (dataColor && isValidTheme(dataColor)) {
    return dataColor
  }

  return DEFAULT_THEME
}

export function getCurrentFlavor(): FlavorName {
  const target = getThemeTarget()

  for (const flavorName of Object.keys(flavors) as FlavorName[]) {
    if (flavorName === DEFAULT_FLAVOR) continue
    if (target.classList.contains(`${STRUCTURE_CLASS_PREFIX}${flavorName}`)) {
      return flavorName
    }
  }

  const dataTheme = document.documentElement.getAttribute('data-theme')
  if (dataTheme && isValidFlavor(dataTheme)) {
    return dataTheme
  }

  return DEFAULT_FLAVOR
}

export function getThemeData(themeName: ThemeName): ThemeConfig | undefined {
  return themes[themeName]
}

export function getFlavorData(flavorName: FlavorName): FlavorConfig | undefined {
  return flavors[flavorName]
}

export function getAllThemes(): ThemeConfig[] {
  return Object.values(themes)
}

export function getAllFlavors(): FlavorConfig[] {
  return Object.values(flavors)
}

export function isValidTheme(themeName: string): themeName is ThemeName {
  return themeName in themes
}

export function isValidFlavor(flavorName: string): flavorName is FlavorName {
  return flavorName in flavors
}

export function resetTheme(): void {
  applyTheme({ color: DEFAULT_THEME, flavor: DEFAULT_FLAVOR })
}

export function resetFlavor(): void {
  applyFlavor(DEFAULT_FLAVOR)
}

export function createThemeClass(themeName: ThemeName): string {
  return `${COLOR_CLASS_PREFIX}${themeName}`
}

/** Structure class for a flavor — empty for `one` (the default, no class). */
export function createFlavorClass(flavorName: FlavorName): string {
  return flavorName === DEFAULT_FLAVOR ? '' : `${STRUCTURE_CLASS_PREFIX}${flavorName}`
}
