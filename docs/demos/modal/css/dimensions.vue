<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Each variant sets the panel box via an inline style on [mono-panel],
// except `full` which uses the `fullscreen` class on .mono-modal.
const variants = {
    fixed: {
        label: 'Fixed 480 × 520',
        title: 'Fixed 480 × 520',
        panelStyle: 'width: 480px; height: 520px;',
        body: 'Panel sized with inline width / height on [mono-panel].',
    },
    wide: {
        label: 'Wide 760px',
        title: 'Wide — 760px',
        panelStyle: 'width: 760px;',
        body: 'A wider panel for tables or side-by-side content. Height stays auto.',
    },
    preset: {
        label: 'Preset width="lg"',
        title: 'width="lg" -> min(90vw, 680px)',
        panelStyle: 'width: min(90vw, 680px);',
        body: 'The xs..xxl width tokens are an element feature: <mono-modal width="lg"> resolves to this length. In hand-written CSS you write the length yourself.',
    },
    minmax: {
        label: 'Min / max',
        title: 'Min width 420 · max height 240',
        panelStyle: 'min-width: 420px; max-height: 240px;',
        body: 'min-width keeps it ≥ 420px; max-height caps the panel so the body scrolls.',
    },
    full: {
        label: 'Full screen',
        title: 'Full screen',
        fullscreen: true,
        body: 'The `fullscreen` class makes the panel cover the whole viewport.',
    },
}
const keys = Object.keys(variants)
const openKey = ref(null)

function onKey(e) {
    if (e.key === 'Escape') openKey.value = null
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 0.55rem;">
        <div v-for="k in keys" :key="k" mono-button mono-size="sm"><button mono-native type="button" @click="openKey = k">{{ variants[k].label }}</button></div>

        <div
            v-for="k in keys"
            :key="`m-${k}`"
            mono-modal
            :mono-open="openKey === k ? '' : null"
            :mono-fullscreen="variants[k].fullscreen ? '' : null"
            role="dialog"
            aria-modal="true"
            :aria-hidden="openKey !== k"
        >
            <div mono-overlay @click="openKey = null"></div>
            <div mono-panel-wrap @click="openKey = null">
                <div mono-panel :style="variants[k].panelStyle" @click.stop>
                    <div mono-header>
                        <div mono-title>{{ variants[k].title }}</div>
                        <button type="button" mono-close aria-label="Close" @click="openKey = null">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div mono-body>
                        <p style="margin: 0;">{{ variants[k].body }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
