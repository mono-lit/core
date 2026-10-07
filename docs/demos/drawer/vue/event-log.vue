<script setup>
    import '@mono-lit/helper/ui/drawer'
    import '@mono-lit/helper/ui/button'
    import { ref, computed } from 'vue'

    const open = ref(false)
    const lines = ref([])

    const logText = computed(() =>
        lines.value.length ? lines.value.join('\n') : 'No events yet — open the drawer.',
    )

    function append(line) {
        lines.value = [line, ...lines.value].slice(0, 30)
    }

    function logEvent(name, event) {
        append(
            '[' + name + '] modelValue=' + event.detail.modelValue +
            ' old=' + event.detail.oldValue +
            ' source="' + event.detail.source + '"',
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
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.65rem;">
            <mono-button size="sm" @click="open = true">Open</mono-button>
            <mono-button size="sm" variant="outline" color="secondary" @click="open = false">Hide (manual)</mono-button>
        </div>

        <DemoLog :text="logText" max-height="200px" />

        <mono-drawer
            position="right"
            size="md"
            color="info"
            title="Watch the log"
            :model-value="open"
            @toggle="onClick"
            @open="onOpen"
            @close="onClose"
        >
            <p style="margin: 0 0 0.55rem;">
                Three events fire per state change:
            </p>
            <ul style="margin: 0 0 0.65rem; padding-left: 1.1rem; line-height: 1.65;">
                <li><code>toggle</code> — every state change</li>
                <li><code>open</code> — only on false → true</li>
                <li><code>close</code> — only on true → false</li>
            </ul>
            <p style="margin: 0; opacity: 0.8;">
                Try Esc, the overlay, the ✕, or the manual buttons.
            </p>
        </mono-drawer>
    </div>
</template>
