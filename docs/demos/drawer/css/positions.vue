<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const positions = ['left', 'right', 'top', 'bottom']
const openPos = ref(null)

function onKey(e) {
    if (e.key === 'Escape' && openPos.value) openPos.value = null
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
    <div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            <div mono-button mono-size="sm"><button mono-native type="button" @click="openPos = 'left'">← Left</button></div>
            <div mono-button mono-size="sm"><button mono-native type="button" @click="openPos = 'right'">Right →</button></div>
            <div mono-button mono-size="sm"><button mono-native type="button" @click="openPos = 'top'">↑ Top</button></div>
            <div mono-button mono-size="sm"><button mono-native type="button" @click="openPos = 'bottom'">↓ Bottom</button></div>
        </div>

        <div
            v-for="pos in positions"
            :key="pos"
            mono-drawer
            :mono-position="pos === 'right' ? null : pos"
            :mono-open="openPos === pos ? '' : null"
            role="dialog"
            aria-modal="true"
            :aria-hidden="openPos !== pos"
        >
            <div mono-overlay @click="openPos = null"></div>
            <div mono-panel>
                <div mono-header>
                    <div mono-title>Drawer — {{ pos }}</div>
                    <button type="button" mono-close aria-label="Close drawer" @click="openPos = null">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div mono-body>
                    <p style="margin:0">This drawer is anchored to the <strong>{{ pos }}</strong> edge.</p>
                </div>
            </div>
        </div>
    </div>
</template>
