<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const open = ref(false)

function onKey(e) {
    if (e.key === 'Escape' && open.value) open.value = false
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
    <div>
        <div mono-button mono-color="purple"><button mono-native type="button" @click="open = true">Open customized drawer</button></div>

        <div
            mono-drawer mono-size="lg"
            :mono-open="open ? '' : null"
            role="dialog"
            aria-modal="true"
            :aria-hidden="!open"
        >
            <div mono-overlay @click="open = false"></div>
            <div mono-panel class="shadow-2xl">
                <div mono-header class="border-b-2">
                    <div mono-title class="tracking-wide uppercase text-sm">Custom styling</div>
                    <button type="button" mono-close aria-label="Close drawer" @click="open = false">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div mono-body class="leading-relaxed">
                    <p style="margin: 0 0 0.6rem;">Bare utility classes flow through directly on the panel, head, title, and body.</p>
                    <p style="margin: 0;">Same hooks as the Vue <code>cssClass</code> object.</p>
                </div>
            </div>
        </div>
    </div>
</template>
