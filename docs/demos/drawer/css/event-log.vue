<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const open = ref(false)
const lines = ref([])

function append(line) {
    const next = [line, ...lines.value]
    if (next.length > 30) next.length = 30
    lines.value = next
}

function fmt(name, modelValue, oldValue, source) {
    return `[${name}] modelValue=${modelValue} old=${oldValue} source="${source}"`
}

function setOpen(value, source) {
    const old = open.value
    if (old === value) return
    open.value = value
    append(fmt('toggle', value, old, source))
    if (value && !old) append(fmt('open', value, old, source))
    else if (!value && old) append(fmt('close', value, old, source))
}

function onKey(e) {
    if (e.key === 'Escape' && open.value) setOpen(false, 'escape')
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
    <div>
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.65rem;">
            <div mono-button mono-size="sm"><button mono-native type="button" @click="setOpen(true, 'manual')">Open</button></div>
            <div mono-button mono-size="sm" mono-variant="outline" mono-color="secondary"><button mono-native type="button" @click="setOpen(false, 'manual')">Hide (manual)</button></div>
        </div>

        <DemoLog :lines="lines" empty="No events yet — open the drawer." max-height="200px" />

        <div
            mono-drawer mono-color="info"
            :mono-open="open ? '' : null"
            role="dialog"
            aria-modal="true"
            :aria-hidden="!open"
        >
            <div mono-overlay @click="setOpen(false, 'overlay')"></div>
            <div mono-panel>
                <div mono-header>
                    <div mono-title>Watch the log</div>
                    <button type="button" mono-close aria-label="Close drawer" @click="setOpen(false, 'close')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div mono-body>
                    <p style="margin: 0 0 0.55rem;">Three events fire per state change:</p>
                    <ul style="margin: 0 0 0.65rem; padding-left: 1.1rem; line-height: 1.65;">
                        <li><code>toggle</code> — every state change</li>
                        <li><code>open</code> — only on false → true</li>
                        <li><code>close</code> — only on true → false</li>
                    </ul>
                    <p style="margin: 0; opacity: 0.8;">Try Esc, the overlay, the ✕, or the manual buttons.</p>
                </div>
            </div>
        </div>
    </div>
</template>
