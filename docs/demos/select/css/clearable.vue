<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
]
const fields = reactive({ fruit: { open: false, value: 'banana' } })
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
</script>

<template>
    <div style="width: 100%;">
        <div mono-select mono-clearable :mono-open="fields.fruit.open ? '' : null">
            <label mono-label>Clearable</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.fruit.open" @click="fields.fruit.open = !fields.fruit.open">
                <span v-if="fields.fruit.value" mono-value><span>{{ labelOf(fields.fruit.value) }}</span></span>
                <span v-else mono-value mono-placeholder>Pick a fruit</span>
                <span mono-actions>
                    <!-- ✕ alone while there is a value to clear, the chevron otherwise -->
                    <span v-if="fields.fruit.value" mono-clear role="button" tabindex="-1" aria-label="Clear select" @click.stop="clear(fields.fruit)"><span mono-icon class="mono-icon i-mdi-close"></span></span>
                    <span v-else mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.fruit.open && i === 0 ? '' : null" :mono-selected="fields.fruit.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.fruit.value === o.value" :disabled="o.disabled" @click="pick(fields.fruit, o)">{{ o.label }}</button>
                </div>
            </div>
            <div mono-message-wrap>
                <div mono-message="helper">The clear button appears when a value is selected.</div>
            </div>
        </div>
    </div>
</template>
