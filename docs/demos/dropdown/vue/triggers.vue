<script setup>
import '@mono-lit/helper/ui/dropdown'

const triggerStyle =
    'padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.82rem;'
</script>

<template>
    <div style="display: flex; gap: 1.5rem; padding: 4rem 1rem; justify-content: center;">
        <mono-dropdown trigger="click" placement="bottom-start">
            <button slot="main" type="button" :style="triggerStyle">Click trigger</button>
            <div slot="body">Opens on click; closes on outside click or Escape.</div>
        </mono-dropdown>
        <mono-dropdown trigger="hover" placement="bottom-start" color="info">
            <button slot="main" type="button" :style="triggerStyle">Hover trigger</button>
            <div slot="body">Opens on mouseenter; closes on mouseleave.</div>
        </mono-dropdown>
    </div>
</template>
