<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const open = ref(false)
const lines = ref([])
const empty = 'No events yet...'

const logText = computed(() => lines.value.length ? lines.value.join('\n') : empty)

function append(line) {
    lines.value = [line, ...lines.value]
}

function setOpen(next, source) {
    const oldValue = open.value
    if (oldValue === next) return
    open.value = next
    if (!next && oldValue) {
        append(`[close] modelValue=${next} old=${oldValue} source=${JSON.stringify(source)}`)
    }
}

function onKey(e) {
    if (e.key !== 'Escape') return
    if (!open.value) return
    setOpen(false, 'escape')
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
    <div style="display: grid; gap: 0.55rem;">
        <div style="justify-self: start;" mono-button><button mono-native type="button" @click="setOpen(true, 'manual')">Open and watch the log</button></div>
        <DemoLog :text="logText" max-height="160px" />

        <div
            mono-modal
            :mono-open="open ? '' : null"
            role="dialog"
            aria-modal="true"
            :aria-hidden="!open"
        >
            <div mono-overlay @click="setOpen(false, 'overlay')"></div>
            <div mono-panel-wrap @click="setOpen(false, 'overlay')">
                <div mono-panel @click.stop>
                    <div mono-header>
                        <div mono-title>Close source disambiguation</div>
                        <button type="button" mono-close aria-label="Close" @click="setOpen(false, 'close')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div mono-body>
                        <p style="margin: 0;">
                            <code>close</code> fires whenever the modal closes itself.
                            The <code>source</code> field disambiguates between overlay click
                            (<code>overlay</code>), the ✕ button (<code>close</code>), Escape
                            (<code>escape</code>), and manual closes (<code>manual</code>).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
