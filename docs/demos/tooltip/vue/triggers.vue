<script setup>
import { onBeforeUnmount, ref } from 'vue'
import '@mono-lit/helper/ui/button'
import { controlMonoTooltip } from '@mono-lit/helper'

const hover = controlMonoTooltip('[data-tip="hover"]', { content: 'Hover or keyboard focus', trigger: ['hover', 'focus'] })
const focusOnly = controlMonoTooltip('[data-tip="focus"]', { content: 'Tab to me', trigger: 'focus' })
const click = controlMonoTooltip('[data-tip="click"]', { content: 'Click again (or anywhere else) to close', trigger: 'click' })
const delayed = controlMonoTooltip('[data-tip="delay"]', { content: 'Opened after 600ms', delay: [600, 200] })

// `manual`: only the controller opens it.
const target = ref(null)
const manual = controlMonoTooltip(target, { content: 'Opened from code', trigger: 'manual', placement: 'right' })

onBeforeUnmount(() => [hover, focusOnly, click, delayed, manual].forEach((t) => t.destroy()))
</script>

<template>
    <div class="example-tooltip-triggers-row">
        <mono-button data-tip="hover">hover + focus</mono-button>
        <mono-button data-tip="focus">focus</mono-button>
        <mono-button data-tip="click">click</mono-button>
        <mono-button data-tip="delay">delay</mono-button>
    </div>
    <div class="example-tooltip-triggers-row example-tooltip-manual">
        <mono-button color="primary" @click="manual.toggle()">toggle()</mono-button>
        <span ref="target" class="example-tooltip-target">target</span>
    </div>
</template>

<style>
.example-tooltip-triggers-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
}

.example-tooltip-manual {
    margin-top: 1rem;
}

.example-tooltip-target {
    padding: 0.25rem 0.75rem;
    border: 1px dashed currentColor;
    border-radius: 0.375rem;
    opacity: 0.7;
}
</style>
