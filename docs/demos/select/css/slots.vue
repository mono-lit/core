<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

const options = [
    { value: 'USD', label: 'USD — US Dollar' },
    { value: 'EUR', label: 'EUR — Euro' },
    { value: 'GBP', label: 'GBP — British Pound' },
    { value: 'JPY', label: 'JPY — Japanese Yen' },
]
const fields = reactive({ currency: { open: false, value: 'USD' } })
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
        <!-- slot="label" / "prefix" / "helper" content lands inline in the label, the value row and the message -->
        <div mono-select :mono-open="fields.currency.open ? '' : null">
            <label mono-label>💱 Currency</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.currency.open" @click="fields.currency.open = !fields.currency.open">
                <span v-if="fields.currency.value" mono-value><span>$</span><span>{{ labelOf(fields.currency.value) }}</span></span>
                <span v-else mono-value mono-placeholder>Pick one</span>
                <span mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.currency.open && i === 0 ? '' : null" :mono-selected="fields.currency.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.currency.value === o.value" :disabled="o.disabled" @click="pick(fields.currency, o)">{{ o.label }}</button>
                </div>
            </div>
            <div mono-message-wrap>
                <div mono-message="helper">Used for billing and reporting.</div>
            </div>
        </div>
    </div>
</template>
