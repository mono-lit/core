<script setup>
import { onBeforeUnmount, ref } from 'vue'
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/shadow/button'
import { controlMonoTooltip } from '@mono-lit/helper'

// One selector reaches light elements AND shadow hosts — the match runs on the
// event's composed path, which crosses shadow boundaries.
const any = controlMonoTooltip('[data-tip="any"]', {
    content: (el) => `<${el.localName}>`,
    placement: 'bottom',
})

// A Vue template ref works too — it is read on every event, so `null` before mount is fine.
const input = ref(null)
const field = controlMonoTooltip(input, { content: 'Only letters and digits', placement: 'right', trigger: 'focus' })

onBeforeUnmount(() => [any, field].forEach((t) => t.destroy()))
</script>

<template>
    <div class="example-tooltip-components-row">
        <mono-button data-tip="any">light</mono-button>
        <mono-shadow-button data-tip="any">shadow</mono-shadow-button>
    </div>
    <div class="example-tooltip-field">
        <mono-input ref="input" placeholder="Focus me" />
    </div>
</template>

<style>
.example-tooltip-components-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
}

.example-tooltip-field {
    max-width: 16rem;
    margin-top: 1rem;
}
</style>
