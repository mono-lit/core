<script setup>
import { onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/button'
import { controlMonoTooltip } from '@mono-lit/helper'

// `placement` is the PREFERRED side — with no room there, Floating UI flips it to
// the opposite side and shifts it along the anchor to stay on screen.
const placements = [
    'top-start', 'top', 'top-end',
    'left-start', 'left', 'left-end',
    'right-start', 'right', 'right-end',
    'bottom-start', 'bottom', 'bottom-end',
]

const tips = placements.map((placement) =>
    controlMonoTooltip(`[data-tip="${placement}"]`, { content: placement, placement }),
)

onBeforeUnmount(() => tips.forEach((t) => t.destroy()))
</script>

<template>
    <div class="example-tooltip-grid">
        <mono-button
            v-for="p in placements"
            :key="p"
            :data-tip="p"
            size="sm"
            variant="outline"
        >
            {{ p }}
        </mono-button>
    </div>
</template>

<style>
.example-tooltip-grid {
    display: grid;
    grid-template-columns: repeat(3, max-content);
    gap: 0.75rem 2.5rem;
    justify-content: center;
    padding: 1.5rem 0;
}
</style>
