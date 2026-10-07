<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
const openSize = ref(null)

function onKey(e) {
    if (e.key === 'Escape' && openSize.value) openSize.value = null
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
    <div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            <div v-for="s in sizes" :key="s" mono-button mono-size="sm"><button mono-native type="button" @click="openSize = s">{{ s }}</button></div>
        </div>

        <div
            v-for="s in sizes"
            :key="`d-${s}`"
            mono-drawer mono-color="secondary"
            :mono-size="s"
            :mono-open="openSize === s ? '' : null"
            role="dialog"
            aria-modal="true"
            :aria-hidden="openSize !== s"
        >
            <div mono-overlay @click="openSize = null"></div>
            <div mono-panel>
                <div mono-header>
                    <div mono-title>Size — {{ s }}</div>
                    <button type="button" mono-close aria-label="Close drawer" @click="openSize = null">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div mono-body>
                    <p style="margin:0">Width modifier <code>{{ s }}</code>.</p>
                </div>
            </div>
        </div>
    </div>
</template>
