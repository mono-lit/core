<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const root = ref(null)
const open = ref(false)

function onOutside(e) {
    if (!open.value) return
    if (root.value && e.composedPath().includes(root.value)) return
    open.value = false
}

function onKey(e) {
    if (!open.value) return
    if (e.key === 'Escape') {
        e.preventDefault()
        open.value = false
    }
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
    <div style="padding: 4rem 1rem; display: flex; justify-content: center;">
        <div ref="root" mono-dropdown :mono-open="open ? '' : null">
            <span mono-activator>
                <button type="button" style="padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.82rem;" @click.stop="open = !open">
                    Click me
                </button>
            </span>
            <div mono-panel role="dialog" :aria-hidden="String(!open)">
                <div mono-body>
                    Any HTML goes here. Click outside or press Escape to close.
                </div>
            </div>
        </div>
    </div>
</template>
