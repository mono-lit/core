<script setup>
import '@mono-lit/helper/ui/dropdown'
import { ref } from 'vue'

const open = ref(false)

const triggerStyle =
    'padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.82rem;'
</script>

<template>
    <div style="padding: 4rem 1rem; display: flex; justify-content: center;">
        <mono-dropdown
            placement="bottom-start"
            :model-value="open"
            @toggle="open = $event.detail.modelValue"
        >
            <button slot="main" type="button" :style="triggerStyle">
                Click me
            </button>
            <div slot="body">
                Any HTML goes here. Click outside or press Escape to close.
            </div>
        </mono-dropdown>
    </div>
</template>
