<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// The same picker as the Vue tab; the hand-written markup takes the colour as
// the `mono-color` attribute (primary is the default and emits nothing).
const color = ref('primary')
const root = ref(null)
const open = ref(false)

function toggle(e) {
    e.stopPropagation()
    open.value = !open.value
}

function onOutside(e) {
    if (!open.value) return
    if (root.value && e.composedPath().includes(root.value)) return
    open.value = false
}

function onKey(e) {
    if (e.key === 'Escape') open.value = false
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
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="form" />
        </DemoControls>

        <div style="display: flex; flex-wrap: wrap; gap: 0.85rem; padding: 4rem 1rem; justify-content: center;">
            <div
                ref="root"
                mono-dropdown
                :mono-color="color === 'primary' ? null : color"
                :mono-open="open ? '' : null"
            >
                <span mono-activator>
                    <button
                        type="button"
                        style="padding: 0.4rem 0.8rem; border-radius: 7px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.78rem;"
                        @click="toggle"
                    >Open dropdown</button>
                </span>
                <div mono-panel role="dialog" :aria-hidden="String(!open)">
                    <div mono-body>The panel's ring takes the {{ color }} role colour.</div>
                </div>
            </div>
        </div>
    </div>
</template>
