<script setup>
import '@mono-lit/helper/ui/dropdown'
import { ref, computed } from 'vue'

const open = ref(false)
const logLines = ref([])

const logText = computed(() =>
    logLines.value.length ? logLines.value.join('\n') : 'No events yet...',
)

const triggerStyle =
    'padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.82rem;'

function append(line) {
    logLines.value = [line, ...logLines.value]
}

function logEvent(name, event) {
    append(
        '[' + name + '] modelValue=' + event.detail.modelValue +
        ' old=' + event.detail.oldValue +
        ' source=' + JSON.stringify(event.detail.source) +
        ' resolvedSide=' + JSON.stringify(event.detail.resolvedSide),
    )
}

function onClick(event) {
    open.value = event.detail.modelValue
    logEvent('toggle', event)
}

function onOpen(event) {
    logEvent('open', event)
}

function onClose(event) {
    logEvent('close', event)
}
</script>

<template>
    <div>
        <div style="padding: 3rem 1rem; display: flex; justify-content: center;">
            <mono-dropdown
                placement="bottom-start"
                :model-value="open"
                @toggle="onClick"
                @open="onOpen"
                @close="onClose"
            >
                <button slot="main" type="button" :style="triggerStyle">
                    Open and watch the log
                </button>
                <div slot="body">
                    <code>toggle</code> fires on every state change.
                    <code>open</code> only fires on open transitions,
                    <code>close</code> only on close transitions.
                    <code>resolvedSide</code> reports which side the panel
                    actually rendered on after auto-flip.
                </div>
            </mono-dropdown>
        </div>
        <DemoLog :text="logText" max-height="160px" />
    </div>
</template>
