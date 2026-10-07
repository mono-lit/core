<script setup>
import '@mono-lit/helper/ui/dropdown'

const placements = [
    'top-start', 'top', 'top-end',
    'right-start', 'right', 'right-end',
    'bottom-start', 'bottom', 'bottom-end',
    'left-start', 'left', 'left-end',
]

const triggerStyle =
    'padding: 0.4rem 0.7rem; border-radius: 7px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.72rem; min-width: 110px;'
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem 1rem; padding: 6rem 4rem; place-items: center;">
        <mono-dropdown v-for="p in placements" :key="p" :placement="p">
            <button slot="main" type="button" :style="triggerStyle">{{ p }}</button>
            <div slot="body">Anchored at <code>{{ p }}</code>.</div>
        </mono-dropdown>
    </div>
</template>
