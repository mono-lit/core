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
        <div mono-button><button mono-native type="button" @click="open = true">Open modal</button></div>

        <div
            mono-modal
            :mono-open="open ? '' : null"
            role="dialog"
            aria-modal="true"
            :aria-hidden="!open"
        >
            <div mono-overlay @click="open = false"></div>
            <div mono-panel-wrap @click="open = false">
                <div mono-panel @click.stop>
                    <div mono-header>
                        <div mono-title>Modal title</div>
                        <button type="button" mono-close aria-label="Close" @click="open = false">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div mono-body>
                        <p style="margin: 0 0 0.6rem; font-weight: 600;">A centered dialog rendered through a body portal.</p>
                        <p style="margin: 0; opacity: 0.8;">Click the close button, the dimmed overlay, or press Escape to dismiss.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
