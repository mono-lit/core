<script setup>
    import '@mono-lit/helper/ui/accordion'
    import { ref, computed } from 'vue'

    const open = ref(false)
    const logLines = ref([])

    const logText = computed(() =>
        logLines.value.length ? logLines.value.join('\n') : 'No events yet...',
    )

    function append(line) {
        logLines.value = [line, ...logLines.value]
    }

    function onClick(event) {
        open.value = event.detail.modelValue
        append('[toggle] modelValue=' + event.detail.modelValue + ' old=' + event.detail.oldValue)
    }
</script>

<template>
    <div style="width: 100%;">
        <mono-accordion
            title="Event accordion"
            subtitle="Toggle me to see events fire."
            :model-value="open"
            @toggle="onClick"
        >
            <svg
                slot="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                <circle cx="18" cy="5" r="3" fill="currentColor"></circle>
            </svg>
            Body content. Each open/close click fires a <code>toggle</code> event with
            the new and old <code>open</code> flags in <code>event.detail</code>.
        </mono-accordion>
        <br>
        <DemoLog :text="logText" />
    </div>
</template>
