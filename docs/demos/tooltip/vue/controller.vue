<script setup>
import { onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/button'
import { controlMonoTooltip } from '@mono-lit/helper'

// Called in <script setup>, before the buttons exist. Nothing is queried up
// front — a hover or keyboard focus on anything matching the selector opens it,
// so elements that mount (or re-mount) later just work.
const save = controlMonoTooltip('[data-tip="save"]', { content: 'Save your changes' })

// No `content`: the anchor supplies it — here from its native `title`.
const fromTitle = controlMonoTooltip('[data-tip="title"]')

onBeforeUnmount(() => {
    save.destroy()
    fromTitle.destroy()
})
</script>

<template>
    <div class="example-tooltip-controller-row">
        <mono-button data-tip="save" color="primary">Save</mono-button>
        <mono-button data-tip="title" title="The native title, restyled" variant="outline">title</mono-button>
    </div>
</template>

<style>
.example-tooltip-controller-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
}
</style>
