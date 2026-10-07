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
    <div style="padding: 4rem 1rem; display: flex; justify-content: center;">
        <div ref="root" mono-dropdown :mono-open="open ? '' : null">
            <span mono-activator>
                <mono-button color="primary" @click.stop="open = !open">Open menu</mono-button>
            </span>
            <div mono-panel role="dialog" :aria-hidden="String(!open)">
                <div mono-body>
                    The activator above is a real <code>&lt;mono-button&gt;</code>.
                    Clicking it toggles the dropdown — no extra wiring needed.
                </div>
            </div>
        </div>
    </div>
</template>
