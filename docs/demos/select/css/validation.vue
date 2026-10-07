<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
]
const fields = reactive({ valid: { open: false, value: 'apple' }, invalid: { open: false, value: null }, warning: { open: false, value: 'banana' } })
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
    <div style="width: 100%; display: grid; gap: 1rem;">
        <div mono-select mono-validation-state="valid" :mono-open="fields.valid.open ? '' : null">
            <label mono-label>Valid</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.valid.open" @click="fields.valid.open = !fields.valid.open">
                <span v-if="fields.valid.value" mono-value><span>{{ labelOf(fields.valid.value) }}</span></span>
                <span v-else mono-value mono-placeholder>Pick one</span>
                <span mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.valid.open && i === 0 ? '' : null" :mono-selected="fields.valid.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.valid.value === o.value" :disabled="o.disabled" @click="pick(fields.valid, o)">{{ o.label }}</button>
                </div>
            </div>
            <div mono-message-wrap>
                <div mono-message="valid">Looks good.</div>
            </div>
        </div>
        <div mono-select mono-validation-state="invalid" :mono-open="fields.invalid.open ? '' : null">
            <label mono-label>Invalid</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.invalid.open" @click="fields.invalid.open = !fields.invalid.open">
                <span v-if="fields.invalid.value" mono-value><span>{{ labelOf(fields.invalid.value) }}</span></span>
                <span v-else mono-value mono-placeholder>Pick a fruit</span>
                <span mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.invalid.open && i === 0 ? '' : null" :mono-selected="fields.invalid.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.invalid.value === o.value" :disabled="o.disabled" @click="pick(fields.invalid, o)">{{ o.label }}</button>
                </div>
            </div>
            <div mono-message-wrap>
                <div mono-message="invalid" role="alert">A fruit is required.</div>
            </div>
        </div>
        <div mono-select mono-validation-state="warning" :mono-open="fields.warning.open ? '' : null">
            <label mono-label>Warning</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.warning.open" @click="fields.warning.open = !fields.warning.open">
                <span v-if="fields.warning.value" mono-value><span>{{ labelOf(fields.warning.value) }}</span></span>
                <span v-else mono-value mono-placeholder>Pick one</span>
                <span mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.warning.open && i === 0 ? '' : null" :mono-selected="fields.warning.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.warning.value === o.value" :disabled="o.disabled" @click="pick(fields.warning, o)">{{ o.label }}</button>
                </div>
            </div>
            <div mono-message-wrap>
                <div mono-message="warning">Bananas are out of stock — try another.</div>
            </div>
        </div>
    </div>
</template>
