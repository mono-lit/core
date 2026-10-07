<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { themes, flavors, DEFAULT_THEME, DEFAULT_FLAVOR, type ThemeName, type FlavorName } from '@mono-lit/helper'

// "Theme color" presets apply `.theme-color-*`; the "Theme" (ONE, or a Basecoat
// style: vega, nova, …) applies `.theme-<name>` — ONE is the default (no class).
const THEME_STORAGE_KEY = 'mono-helper-theme-color'
const FLAVOR_STORAGE_KEY = 'mono-helper-theme'

const THEME_NAMES = Object.keys(themes) as ThemeName[]
const THEME_CLASSES = THEME_NAMES.map((name) => `theme-color-${name}`)

const FLAVOR_NAMES = Object.keys(flavors) as FlavorName[]
const FLAVOR_CLASSES = FLAVOR_NAMES
    .filter((name) => name !== DEFAULT_FLAVOR)
    .map((name) => `theme-${name}`)

const defaultTheme: ThemeName = DEFAULT_THEME
const defaultFlavor: FlavorName = DEFAULT_FLAVOR

const selectedTheme = ref<ThemeName>(defaultTheme)
const selectedFlavor = ref<FlavorName>(defaultFlavor)

const isOpen = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const summary = computed(() =>
    `${flavors[selectedFlavor.value]?.displayName ?? selectedFlavor.value} · ${themes[selectedTheme.value]?.displayName ?? selectedTheme.value}`,
)

function isValidTheme(value: unknown): value is ThemeName {
    return typeof value === 'string' && (THEME_NAMES as string[]).includes(value)
}

function isValidFlavor(value: unknown): value is FlavorName {
    return typeof value === 'string' && (FLAVOR_NAMES as string[]).includes(value)
}

function readInitialTheme(): ThemeName {
    if (typeof document === 'undefined') return defaultTheme

    const html = document.documentElement
    for (const name of THEME_NAMES) {
        if (html.classList.contains(`theme-color-${name}`)) return name
    }

    try {
        const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
        if (isValidTheme(saved)) return saved
    } catch {
        /* ignore localStorage failures (private mode, disabled storage) */
    }

    return defaultTheme
}

function readInitialFlavor(): FlavorName {
    if (typeof document === 'undefined') return defaultFlavor

    const html = document.documentElement
    for (const name of FLAVOR_NAMES) {
        if (name === DEFAULT_FLAVOR) continue
        if (html.classList.contains(`theme-${name}`)) return name
    }

    try {
        const saved = window.localStorage.getItem(FLAVOR_STORAGE_KEY)
        if (isValidFlavor(saved)) return saved
    } catch {
        /* ignore */
    }

    return defaultFlavor
}

function applyThemeName(name: ThemeName): void {
    if (typeof document === 'undefined') return

    const html = document.documentElement
    html.classList.remove(...THEME_CLASSES)
    html.classList.add(`theme-color-${name}`)
    html.setAttribute('data-theme-color', name)

    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, name)
    } catch {
        /* ignore */
    }
}

function applyFlavorName(name: FlavorName): void {
    if (typeof document === 'undefined') return

    const html = document.documentElement
    html.classList.remove(...FLAVOR_CLASSES)
    if (name !== DEFAULT_FLAVOR) html.classList.add(`theme-${name}`)
    html.setAttribute('data-theme', name)

    try {
        window.localStorage.setItem(FLAVOR_STORAGE_KEY, name)
    } catch {
        /* ignore */
    }
}

function dispatchChange(): void {
    if (typeof window === 'undefined') return
    window.dispatchEvent(
        new CustomEvent('theme-changed', {
            detail: {
                theme: selectedTheme.value,
                themeData: themes[selectedTheme.value],
                color: selectedTheme.value,
                flavor: selectedFlavor.value,
                flavorData: flavors[selectedFlavor.value],
            },
            bubbles: true,
            composed: true,
        }),
    )
}

function onDocPointer(event: PointerEvent | MouseEvent) {
    if (!isOpen.value) return
    const target = event.target as Node | null
    if (rootEl.value && target && !rootEl.value.contains(target)) {
        isOpen.value = false
    }
}

function onDocKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen.value) {
        isOpen.value = false
    }
}

onMounted(() => {
    selectedTheme.value = readInitialTheme()
    selectedFlavor.value = readInitialFlavor()
    applyThemeName(selectedTheme.value)
    applyFlavorName(selectedFlavor.value)
    dispatchChange()

    document.addEventListener('pointerdown', onDocPointer)
    document.addEventListener('keydown', onDocKey)
})

onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onDocPointer)
    document.removeEventListener('keydown', onDocKey)
})

watch(selectedTheme, (next) => {
    applyThemeName(next)
    dispatchChange()
})

watch(selectedFlavor, (next) => {
    applyFlavorName(next)
    dispatchChange()
})

function onThemeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value
    if (isValidTheme(value)) selectedTheme.value = value
}

function onFlavorChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value
    if (isValidFlavor(value)) selectedFlavor.value = value
}

function toggleOpen() {
    isOpen.value = !isOpen.value
}
</script>

<template>
    <div ref="rootEl" class="mono-theme-switcher-root">
        <button
            type="button"
            class="mono-theme-switcher-trigger"
            :aria-expanded="isOpen"
            aria-haspopup="true"
            @click="toggleOpen"
        >
            <span class="mono-theme-switcher-trigger-icon" aria-hidden="true">🎨</span>
            <span class="mono-theme-switcher-trigger-label">{{ summary }}</span>
            <span class="mono-theme-switcher-trigger-caret" aria-hidden="true"></span>
        </button>

        <div v-if="isOpen" class="mono-theme-switcher-panel" role="dialog" aria-label="Theme settings">
            <label class="mono-theme-switcher-row">
                <span class="mono-theme-switcher-label">Theme</span>
                <select
                    class="mono-theme-switcher-select"
                    :value="selectedFlavor"
                    aria-label="Select theme"
                    @change="onFlavorChange"
                >
                    <option v-for="name in FLAVOR_NAMES" :key="name" :value="name">
                        {{ flavors[name].displayName }}
                    </option>
                </select>
            </label>
            <label class="mono-theme-switcher-row">
                <span class="mono-theme-switcher-label">Theme color</span>
                <select
                    class="mono-theme-switcher-select"
                    :value="selectedTheme"
                    aria-label="Select theme color"
                    @change="onThemeChange"
                >
                    <option v-for="name in THEME_NAMES" :key="name" :value="name">
                        {{ themes[name].displayName }}
                    </option>
                </select>
            </label>
        </div>
    </div>
</template>

<style scoped>
.mono-theme-switcher-root {
    position: relative;
    display: inline-flex;
    margin-left: 0.75rem;
}

.mono-theme-switcher-trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.65rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    background: var(--vp-c-bg-soft);
    font-size: 0.78rem;
    line-height: 1;
    color: var(--vp-c-text-1);
    cursor: pointer;
    transition: border-color 0.18s ease, background-color 0.18s ease;
}

.mono-theme-switcher-trigger:hover {
    border-color: var(--vp-c-brand-1);
    background: var(--vp-c-bg);
}

.mono-theme-switcher-trigger:focus-visible {
    outline: 2px solid var(--vp-c-brand-1);
    outline-offset: 2px;
}

.mono-theme-switcher-trigger-icon {
    font-size: 0.95rem;
    line-height: 1;
}

.mono-theme-switcher-trigger-label {
    font-weight: 600;
    color: var(--vp-c-text-1);
    user-select: none;
}

.mono-theme-switcher-trigger-caret {
    width: 0;
    height: 0;
    margin-left: 0.15rem;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 5px solid currentColor;
    opacity: 0.65;
}

.mono-theme-switcher-panel {
    position: absolute;
    top: calc(100% + 0.4rem);
    right: 0;
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 14rem;
    padding: 0.6rem 0.7rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 10px;
    background: var(--vp-c-bg);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.mono-theme-switcher-row {
    display: grid;
    grid-template-columns: 4.5rem 1fr;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.78rem;
    line-height: 1;
    color: var(--vp-c-text-2);
}

.mono-theme-switcher-label {
    font-weight: 600;
    color: var(--vp-c-text-1);
    user-select: none;
}

.mono-theme-switcher-select {
    appearance: none;
    border: 1px solid var(--vp-c-divider);
    border-radius: 6px;
    background: var(--vp-c-bg-soft);
    color: inherit;
    font: inherit;
    padding: 0.3rem 1.6rem 0.3rem 0.5rem;
    cursor: pointer;
    background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
        linear-gradient(135deg, currentColor 50%, transparent 50%);
    background-position: calc(100% - 12px) 55%, calc(100% - 8px) 55%;
    background-size: 4px 4px, 4px 4px;
    background-repeat: no-repeat;
}

.mono-theme-switcher-select:focus-visible {
    outline: 2px solid var(--vp-c-brand-1);
    outline-offset: 2px;
}

@media (max-width: 768px) {
    .mono-theme-switcher-root {
        margin-left: 0.25rem;
    }

    .mono-theme-switcher-trigger-label {
        display: none;
    }

    .mono-theme-switcher-panel {
        right: -0.25rem;
        min-width: 12rem;
    }
}
</style>
