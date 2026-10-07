<script setup>
import { reactive, computed, onMounted, onUnmounted } from 'vue'

const options = [
    { value: 'coffee', label: 'Coffee' },
    { value: 'tea', label: 'Tea' },
    { value: 'water', label: 'Water' },
]
const fields = reactive({ drink: { open: false, value: null } })
const labelOf = (value) => options.find((o) => o.value === value)?.label ?? ''

function pick(field, option) {
    if (option.disabled) return
    field.value = option.value
    field.open = false
}
function clear(field) {
    field.value = null
}
// an outside click closes an open panel, like the element does
function onDocumentClick(event) {
    if (event.target.closest('[mono-select]')) return
    for (const f of Object.values(fields)) f.open = false
}
onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))

const out = computed(() =>
    fields.drink.value
        ? `Last picked: ${labelOf(fields.drink.value)} (${JSON.stringify(fields.drink.value)})`
        : 'Last picked: —',
)
</script>

<template>
    <div style="width: 100%; display: grid; gap: 0.5rem;">
        <div mono-select :mono-open="fields.drink.open ? '' : null">
            <label mono-label>Drink</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.drink.open" @click="fields.drink.open = !fields.drink.open">
                <span v-if="fields.drink.value" mono-value><span>{{ labelOf(fields.drink.value) }}</span></span>
                <span v-else mono-value mono-placeholder>Pick a drink</span>
                <span mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.drink.open && i === 0 ? '' : null" :mono-selected="fields.drink.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.drink.value === o.value" :disabled="o.disabled" @click="pick(fields.drink, o)">{{ o.label }}</button>
                </div>
            </div>
        </div>
        <DemoReadout>{{ out }}</DemoReadout>
    </div>
</template>
