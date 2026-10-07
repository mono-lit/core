<script setup>
import '@mono-lit/helper/ui/dropdown'

const triggerStyle =
    'padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.82rem;'
</script>

<template>
    <div style="width: 100%; display: flex; gap: 1.5rem; padding: 4rem 1rem; justify-content: center;">
        <mono-dropdown size="xs" placement="bottom-start">
            <button slot="main" type="button" :style="triggerStyle">Extra small</button>
            <div slot="body">Extra compact panel with smaller padding.</div>
        </mono-dropdown>
        <mono-dropdown size="sm" placement="bottom-start">
            <button slot="main" type="button" :style="triggerStyle">Small</button>
            <div slot="body">Compact panel with smaller padding.</div>
        </mono-dropdown>
        <mono-dropdown size="md" placement="bottom-start">
            <button slot="main" type="button" :style="triggerStyle">Medium</button>
            <div slot="body">Default panel size.</div>
        </mono-dropdown>
        <mono-dropdown size="lg" placement="bottom-start">
            <button slot="main" type="button" :style="triggerStyle">Large</button>
            <div slot="body">Roomy panel with extra padding.</div>
        </mono-dropdown>
        <mono-dropdown size="xl" placement="bottom-start">
            <button slot="main" type="button" :style="triggerStyle">Extra large</button>
            <div slot="body">Extra roomy panel with extra padding.</div>
        </mono-dropdown>
        <mono-dropdown size="xxl" placement="bottom-start">
            <button slot="main" type="button" :style="triggerStyle">2X large</button>
            <div slot="body">Extra roomy panel with extra padding.</div>
        </mono-dropdown>
    </div>
</template>
