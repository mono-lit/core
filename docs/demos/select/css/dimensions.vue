<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
]
const fields = reactive({ fixed: { open: false, value: null }, max: { open: false, value: null }, full: { open: false, value: null } })
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
    <div style="display: flex; flex-direction: column; gap: 1rem;">
        <!-- width / height props land on the wrapper's inline style. -->
        <div mono-select style="width: 260px;" :mono-open="fields.fixed.open ? '' : null">
            <label mono-label>Fixed 260px</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.fixed.open" @click="fields.fixed.open = !fields.fixed.open">
                <span v-if="fields.fixed.value" mono-value><span>{{ labelOf(fields.fixed.value) }}</span></span>
                <span v-else mono-value mono-placeholder>Pick one</span>
                <span mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.fixed.open && i === 0 ? '' : null" :mono-selected="fields.fixed.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.fixed.value === o.value" :disabled="o.disabled" @click="pick(fields.fixed, o)">{{ o.label }}</button>
                </div>
            </div>
        </div>
        <div mono-select style="max-width: 360px;" :mono-open="fields.max.open ? '' : null">
            <label mono-label>Max-width 360px</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.max.open" @click="fields.max.open = !fields.max.open">
                <span v-if="fields.max.value" mono-value><span>{{ labelOf(fields.max.value) }}</span></span>
                <span v-else mono-value mono-placeholder>Pick one</span>
                <span mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.max.open && i === 0 ? '' : null" :mono-selected="fields.max.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.max.value === o.value" :disabled="o.disabled" @click="pick(fields.max, o)">{{ o.label }}</button>
                </div>
            </div>
        </div>
        <div mono-select style="width: 100%;" :mono-open="fields.full.open ? '' : null">
            <label mono-label>Full width</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.full.open" @click="fields.full.open = !fields.full.open">
                <span v-if="fields.full.value" mono-value><span>{{ labelOf(fields.full.value) }}</span></span>
                <span v-else mono-value mono-placeholder>Pick one</span>
                <span mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.full.open && i === 0 ? '' : null" :mono-selected="fields.full.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.full.value === o.value" :disabled="o.disabled" @click="pick(fields.full, o)">{{ o.label }}</button>
                </div>
            </div>
        </div>
    </div>
</template>
