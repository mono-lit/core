<script setup lang="ts">
import '@mono-lit/helper/ui/checkbox'
import { ref } from 'vue'

const active = ref(true)

const premiumCheckboxClass = {
    root: `
    group
    items-start gap-3
    rounded-5
    border border-emerald-200/70
    bg-gradient-to-br from-white via-emerald-50/70 to-teal-50
    px-4 py-3
    shadow-[0_14px_35px_rgba(16,185,129,0.13)]
    hover:shadow-[0_20px_55px_rgba(16,185,129,0.20)]
    hover:-translate-y-0.5
    transition-all duration-300
  `,
    box: `
    mt-0.5
    rounded-3
    border-emerald-300
    shadow-[0_6px_18px_rgba(16,185,129,0.16)]
    group-hover:scale-105
  `,
    label: `
    min-w-0
  `,
    labelText: `
    text-sm font-800
    text-emerald-950
    tracking-tight
  `,
    description: `
    mt-1
    text-xs leading-relaxed
    text-emerald-700/75
  `,
}
</script>

<template>
    <mono-checkbox :model-value="active" color="success" size="lg" label="Revenue Growth"
        sublabel="Enable monthly performance tracking" :css-class="premiumCheckboxClass"
        @change="active = $event.detail.modelValue" />
</template>