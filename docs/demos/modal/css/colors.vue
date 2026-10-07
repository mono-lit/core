<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// The same picker as the Vue tab; the hand-written markup takes the colour as
// the `mono-color` attribute (primary is the default and emits nothing).
const color = ref('primary')
const open = ref(false)

function cap(s) {
    return s[0].toUpperCase() + s.slice(1)
}

function onKey(e) {
    if (e.key === 'Escape') open.value = false
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="form" />
        </DemoControls>

        <div style="display: flex; flex-wrap: wrap; gap: 0.55rem;">
            <div mono-button :mono-color="color === 'primary' ? null : color" mono-size="sm"><button mono-native type="button" @click="open = true">Open modal</button></div>
        </div>

        <div
            mono-modal
            :mono-color="color === 'primary' ? null : color"
            :mono-open="open ? '' : null"
            role="dialog"
            aria-modal="true"
            :aria-hidden="!open"
        >
            <div mono-overlay @click="open = false"></div>
            <div mono-panel-wrap @click="open = false">
                <div mono-panel @click.stop>
                    <div mono-header>
                        <div mono-title>{{ cap(color) }} accent</div>
                        <button type="button" mono-close aria-label="Close" @click="open = false">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div mono-body>
                        <p style="margin: 0;">The thin ring, the glow under the panel and the close-button hover take the {{ color }} accent.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
