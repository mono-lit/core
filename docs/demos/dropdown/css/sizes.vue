<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
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

const labels = { xs: 'Extra small', sm: 'Small', md: 'Medium', lg: 'Large', xl: 'Extra large', xxl: '2X large' }
const blurbs = {
    xs: 'Extra compact panel with smaller padding.',
    sm: 'Compact panel with smaller padding.',
    md: 'Default panel size.',
    lg: 'Roomy panel with extra padding.',
    xl: 'Extra roomy panel with extra padding.',
    xxl: 'Extra roomy panel with extra padding.',
}
</script>

<template>
    <div style="width: 100%; display: flex; gap: 1.5rem; padding: 4rem 1rem; justify-content: center;">
        <div
            v-for="s in sizes"
            :key="s"
            :ref="setRef(s)"
            mono-dropdown
            :mono-size="s === 'md' ? null : s"
            :mono-open="openKey === s ? '' : null"
        >
            <span mono-activator>
                <button type="button" style="padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.82rem;" @click="toggle(s, $event)">{{ labels[s] }}</button>
            </span>
            <div mono-panel role="dialog" :aria-hidden="String(openKey !== s)">
                <div mono-body>{{ blurbs[s] }}</div>
            </div>
        </div>
    </div>
</template>
