<script setup>
import '@mono-lit/helper/ui/nav'
import { ref, onMounted, onUnmounted } from 'vue'

const navHeight = ref('—')
let observer = null

function readVar() {
    const v = getComputedStyle(document.documentElement)
        .getPropertyValue('--mono-nav-height')
        .trim()
    navHeight.value = v || '—'
}

onMounted(() => {
    readVar()
    observer = new MutationObserver(readVar)
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style'],
    })
})

onUnmounted(() => {
    observer?.disconnect()
})

const wrapStyle =
    'border: 1px solid var(--border); border-radius: var(--mono-nav-radius, var(--mono-radius-xl)); overflow: hidden; background: var(--muted);'
const bodyStyle =
    'padding: 1.25rem; color: var(--foreground); font-size: 0.85rem; line-height: 1.7;'
const codeStyle =
    'background: color-mix(in oklab, var(--primary) 8%, transparent); color: var(--primary); padding: 0.1rem 0.4rem; border-radius: 4px; font-family: ui-monospace, monospace; font-size: 0.85em;'
</script>

<template>
    <div :style="wrapStyle">
        <mono-nav :sticky="false">
            <span slot="start" style="font-weight: 800; color: var(--primary);">Layout var demo</span>
            <span slot="end" style="font-size: 0.78rem; opacity: 0.7;">→ writes to :root</span>
        </mono-nav>

        <div :style="bodyStyle">
            <p style="margin: 0 0 0.5rem;">
                Current value of <code :style="codeStyle">--mono-nav-height</code> on
                <code :style="codeStyle">document.documentElement</code>:
            </p>
            <p style="margin: 0; font-family: ui-monospace, monospace; font-size: 1.1rem; color: var(--primary); font-weight: 700;">
                {{ navHeight }}
            </p>
            <p style="margin: 0.75rem 0 0; font-size: 0.78rem; opacity: 0.7;">
                Wrap your main content in <code :style="codeStyle">.mono-layout-content</code>
                and it pads itself below the nav automatically — no prop drilling.
            </p>
        </div>
    </div>
</template>
