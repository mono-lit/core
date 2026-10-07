<script setup>
import { computed, ref } from 'vue'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/input'

const items = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    label: `${1000 + i} — Operating account for branch ${i + 1}`,
}))

const panelWidth = ref(420)
const panelHeight = ref(220)

// A NEW object identity is what re-renders — `dropdown` is a reactive property, and mutating the
// same object in place would not be seen.
const dropdown = computed(() => ({ width: panelWidth.value, maxHeight: panelHeight.value }))
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; gap: 1rem;">
            <mono-input label="Panel width" type="number" size="sm" :model-value="String(panelWidth)"
                @change="panelWidth = Number($event.detail.modelValue)" />
            <mono-input label="Panel max-height" type="number" size="sm" :model-value="String(panelHeight)"
                @change="panelHeight = Number($event.detail.modelValue)" />
        </div>

        <!-- The field is narrow; the panel is not. Without `dropdown` the panel would match the
             field and clip these long labels. -->
        <mono-select label="Account" width="220px" placeholder="Pick an account…" searchable clearable
            key-value="id" display-value="label" :items.prop="items" :dropdown.prop="dropdown" />
    </div>
</template>
