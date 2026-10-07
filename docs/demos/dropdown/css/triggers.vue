<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const clickRoot = ref(null)
const hoverRoot = ref(null)
const clickOpen = ref(false)
const hoverOpen = ref(false)

function onOutside(e) {
    if (clickOpen.value) {
        if (!(clickRoot.value && e.composedPath().includes(clickRoot.value))) {
            clickOpen.value = false
        }
    }
    // hover dropdown closes via mouseleave; outside click also closes it for parity
    if (hoverOpen.value) {
        if (!(hoverRoot.value && e.composedPath().includes(hoverRoot.value))) {
            hoverOpen.value = false
        }
    }
}

function onKey(e) {
    if (e.key !== 'Escape') return
    clickOpen.value = false
    hoverOpen.value = false
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
    'padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--theme-border); background: var(--theme-surface); color: var(--theme-text); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.82rem;'
</script>

<template>
    <div style="display: flex; gap: 1.5rem; padding: 4rem 1rem; justify-content: center;">
        <div ref="clickRoot" mono-dropdown :mono-open="clickOpen ? '' : null">
            <span mono-activator>
                <button type="button" :style="triggerStyle" @click.stop="clickOpen = !clickOpen">Click trigger</button>
            </span>
            <div mono-panel role="dialog" :aria-hidden="String(!clickOpen)">
                <div mono-body>Opens on click; closes on outside click or Escape.</div>
            </div>
        </div>
        <div
            ref="hoverRoot"
            mono-dropdown
            mono-color="info"
            mono-trigger="hover"
            :mono-open="hoverOpen ? '' : null"
            @mouseenter="hoverOpen = true"
            @mouseleave="hoverOpen = false"
        >
            <span mono-activator>
                <button type="button" :style="triggerStyle">Hover trigger</button>
            </span>
            <div mono-panel role="dialog" :aria-hidden="String(!hoverOpen)">
                <div mono-body>Opens on mouseenter; closes on mouseleave.</div>
            </div>
        </div>
    </div>
</template>
