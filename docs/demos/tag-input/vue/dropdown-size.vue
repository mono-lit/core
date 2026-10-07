<script setup>
import { computed, ref } from 'vue'
import '@mono-lit/helper/ui/tag-input'
import '@mono-lit/helper/ui/input'

const items = Array.from({ length: 40 }, (_, i) => ({
    id: i + 1,
    label: `(51${String(i).padStart(2, '0')}) Biaya Promosi Cabang ${i + 1}`,
}))

const panelWidth = ref(420)
const panelHeight = ref(240)

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

        <!-- The field is full width; the panel is not. Without `dropdown` the panel would match
             the field and every option row would run the width of the page. -->
        <mono-tag-input label="COA" width="100%" placeholder="Pilih..." checkable searchable key-value="id"
            display-value="label" :items.prop="items" :dropdown.prop="dropdown" />
    </div>
</template>
