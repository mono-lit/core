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
        <div ref="root" mono-dropdown mono-color="success" :mono-open="open ? '' : null">
            <span mono-activator>
                <button type="button" style="padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.82rem;" @click.stop="open = !open">Customized</button>
            </span>
            <div mono-panel class="shadow-xl" role="dialog" :aria-hidden="String(!open)">
                <div mono-body class="italic">
                    Italic body, beefier shadow — overrides applied via the
                    <code>cssClass</code> prop. Theme accent unchanged.
                </div>
            </div>
        </div>
    </div>
</template>
