<script setup>
import { ref } from 'vue'
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/shadow/button'

// No controlMonoTooltip call: once the app ran `createMonoTooltip()` (main.ts, or
// `mono.helper.tooltip` in Nuxt), the attribute alone is the tooltip.
const count = ref(0)
</script>

<template>
    <div class="example-tooltip-basic-row">
        <button type="button" class="example-tooltip-basic-native" mono-tooltip-content="A plain <button>">plain HTML</button>
        <mono-button mono-tooltip-content="A light <mono-button>" color="primary">light</mono-button>
        <mono-shadow-button mono-tooltip-content="A shadow <mono-shadow-button>" variant="outline">shadow</mono-shadow-button>
        <mono-button :mono-tooltip-content="`Clicked ${count} times`" variant="outline" @click="count++">bound</mono-button>
        <span mono-tooltip-message="mono-tooltip-message is an alias" class="example-tooltip-basic-text">message</span>
    </div>
</template>

<style>
.example-tooltip-basic-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
}

.example-tooltip-basic-native {
    padding: 0.35rem 0.75rem;
    border: 1px solid currentColor;
    border-radius: 0.375rem;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
}

.example-tooltip-basic-text {
    text-decoration: underline dotted;
    cursor: default;
}
</style>
