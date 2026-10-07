<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const refs = ref({})
const openKey = ref(null)

function setRef(k) {
    return (el) => { if (el) refs.value[k] = el }
}

function toggle(k, e) {
    e.stopPropagation()
    openKey.value = openKey.value === k ? null : k
}

function onOutside(e) {
    if (!openKey.value) return
    const el = refs.value[openKey.value]
    if (el && e.composedPath().includes(el)) return
    openKey.value = null
}

function onKey(e) {
    if (e.key === 'Escape') openKey.value = null
}

onMounted(() => {
    document.addEventListener('click', onOutside, true)
    document.addEventListener('keydown', onKey)
})
onUnmounted(() => {
    document.removeEventListener('click', onOutside, true)
    document.removeEventListener('keydown', onKey)
})

const triggerStyle =
    'padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--theme-border); background: var(--theme-surface); color: var(--theme-text); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.78rem;'

const cardStyle =
    'position: relative; border: 1px dashed color-mix(in srgb, var(--theme-primary) 30%, transparent); border-radius: 12px; height: 320px; padding: 0.75rem; background: var(--theme-surface-soft);'
</script>

<template>
    <div style="padding: 1rem;">
        <p style="font-size: 0.78rem; color: var(--foreground); opacity: 0.75; margin: 0 0 0.75rem;">
            Note: the CSS-only fallback uses the static <code>mono-side</code> / <code>mono-align</code>
            placement, so it does <em>not</em> auto-flip. Toggle to <strong>Vue</strong> to see the
            JS-driven flip + shift in action.
        </p>
        <div :style="cardStyle">
            <div
                :ref="setRef('a')"
                mono-dropdown
                style="position: absolute; top: 0.75rem; left: 0.75rem;"
                :mono-open="openKey === 'a' ? '' : null"
            >
                <span mono-activator>
                    <button type="button" :style="triggerStyle" @click="toggle('a', $event)">top-left corner</button>
                </span>
                <div mono-panel role="dialog" :aria-hidden="String(openKey !== 'a')">
                    <div mono-body>Asks for bottom-start. Stays bottom because there's room.</div>
                </div>
            </div>

            <div
                :ref="setRef('b')"
                mono-dropdown
                mono-align="end"
                style="position: absolute; top: 0.75rem; right: 0.75rem;"
                :mono-open="openKey === 'b' ? '' : null"
            >
                <span mono-activator>
                    <button type="button" :style="triggerStyle" @click="toggle('b', $event)">top-right corner</button>
                </span>
                <div mono-panel role="dialog" :aria-hidden="String(openKey !== 'b')">
                    <div mono-body>Shifts left so it doesn't run off the right edge.</div>
                </div>
            </div>

            <div
                :ref="setRef('c')"
                mono-dropdown
                mono-side="top"
                style="position: absolute; bottom: 0.75rem; left: 0.75rem;"
                :mono-open="openKey === 'c' ? '' : null"
            >
                <span mono-activator>
                    <button type="button" :style="triggerStyle" @click="toggle('c', $event)">bottom-left corner</button>
                </span>
                <div mono-panel role="dialog" :aria-hidden="String(openKey !== 'c')">
                    <div mono-body>Flips to the top because there's no room below.</div>
                </div>
            </div>

            <div
                :ref="setRef('d')"
                mono-dropdown
                mono-side="top"
                mono-align="end"
                style="position: absolute; bottom: 0.75rem; right: 0.75rem;"
                :mono-open="openKey === 'd' ? '' : null"
            >
                <span mono-activator>
                    <button type="button" :style="triggerStyle" @click="toggle('d', $event)">bottom-right corner</button>
                </span>
                <div mono-panel role="dialog" :aria-hidden="String(openKey !== 'd')">
                    <div mono-body>Flips to the top AND shifts left to stay inside.</div>
                </div>
            </div>
        </div>
    </div>
</template>
