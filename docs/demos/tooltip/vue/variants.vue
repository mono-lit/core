<script setup>
import { onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/button'
import { controlMonoTooltip } from '@mono-lit/helper'

// Every colour resolves from theme tokens — switch the flavour, colour preset or
// dark mode and these follow with no extra CSS.
const colors = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'teal', 'purple', 'neutral', 'dark']

const tips = [
    controlMonoTooltip('[data-tip="inverted"]', { content: 'inverted (default)' }),
    controlMonoTooltip('[data-tip="popover"]', { content: 'popover surface', variant: 'popover' }),
    controlMonoTooltip('[data-tip="sm"]', { content: 'size sm', size: 'sm' }),
    controlMonoTooltip('[data-tip="lg"]', { content: 'size lg', size: 'lg' }),
    controlMonoTooltip('[data-tip="no-arrow"]', { content: 'no arrow', arrow: false }),
    controlMonoTooltip('[data-tip="wide"]', {
        content: 'A long description wraps inside maxWidth instead of running off the screen — handy for help text.',
        maxWidth: '14rem',
    }),
    ...colors.map((color) => controlMonoTooltip(`[data-tip="c-${color}"]`, { content: color, color })),
]

onBeforeUnmount(() => tips.forEach((t) => t.destroy()))
</script>

<template>
    <div class="example-tooltip-variants-row">
        <mono-button data-tip="inverted">inverted</mono-button>
        <mono-button data-tip="popover">popover</mono-button>
        <mono-button data-tip="sm" variant="outline">sm</mono-button>
        <mono-button data-tip="lg" variant="outline">lg</mono-button>
        <mono-button data-tip="no-arrow" variant="outline">no arrow</mono-button>
        <mono-button data-tip="wide" variant="outline">maxWidth</mono-button>
    </div>
    <div class="example-tooltip-variants-row example-tooltip-colors">
        <mono-button v-for="c in colors" :key="c" :data-tip="`c-${c}`" :color="c" size="sm">{{ c }}</mono-button>
    </div>
</template>

<style>
.example-tooltip-variants-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
}

.example-tooltip-colors {
    margin-top: 1rem;
}
</style>
