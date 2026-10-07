<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const open = ref(false)
const status = ref('Idle')

function act(action) {
    status.value = action === 'confirm' ? 'Deleted' : 'Cancelled'
    open.value = false
}

function onKey(e) {
    if (e.key === 'Escape' && open.value) open.value = false
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
    <div style="display: grid; gap: 0.55rem;">
        <div style="justify-self: start;" mono-button mono-color="danger"><button mono-native type="button" @click="open = true">Delete record</button></div>
        <div style="font-size: 0.78rem; color: var(--theme-text); opacity: 0.7;">Status: {{ status }}</div>

        <div
            mono-modal mono-color="danger"
            :mono-open="open ? '' : null"
            role="dialog"
            aria-modal="true"
            :aria-hidden="!open"
        >
            <div mono-overlay @click="open = false"></div>
            <div mono-panel-wrap @click="open = false">
                <div mono-panel @click.stop>
                    <div mono-header>
                        <div mono-title>Delete this record?</div>
                        <button type="button" mono-close aria-label="Close" @click="open = false">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div mono-body>
                        <p style="margin: 0 0 0.4rem; font-weight: 600;">This action can't be undone.</p>
                        <p style="margin: 0; opacity: 0.8;">The record and all its attachments will be permanently removed.</p>
                    </div>
                    <div mono-footer>
                        <div mono-button mono-variant="tonal" mono-color="secondary" mono-size="sm"><button mono-native type="button" @click="act('cancel')">Cancel</button></div>
                        <div mono-button mono-color="danger" mono-size="sm"><button mono-native type="button" @click="act('confirm')">Delete</button></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
