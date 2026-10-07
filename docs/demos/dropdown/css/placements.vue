<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const placements = [
    'top-start', 'top', 'top-end',
    'right-start', 'right', 'right-end',
    'bottom-start', 'bottom', 'bottom-end',
    'left-start', 'left', 'left-end',
]
// One `placement` prop becomes the two attributes the CSS keys on — the same
// split Basecoat uses (`data-side` / `data-align`). Each default emits nothing.
function side(p) {
    const s = p.split('-')[0]
    return s === 'bottom' ? null : s
}
function align(p) {
    if (p.endsWith('-end')) return 'end'
    if (p.endsWith('-start')) return null
    return 'center'
}

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
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem 1rem; padding: 6rem 4rem; place-items: center;">
        <div
            v-for="p in placements"
            :key="p"
            :ref="setRef(p)"
            mono-dropdown
            :mono-side="side(p)"
            :mono-align="align(p)"
            :mono-open="openKey === p ? '' : null"
        >
            <span mono-activator>
                <button
                    type="button"
                    style="padding: 0.4rem 0.7rem; border-radius: 7px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.72rem; min-width: 110px;"
                    @click="toggle(p, $event)"
                >{{ p }}</button>
            </span>
            <div mono-panel role="dialog" :aria-hidden="String(openKey !== p)">
                <div mono-body>Anchored at <code>{{ p }}</code>.</div>
            </div>
        </div>
    </div>
</template>
