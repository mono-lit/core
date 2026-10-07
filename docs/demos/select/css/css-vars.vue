<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
]
const fields = reactive({ fruit: { open: false, value: null } })
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
    <!-- The focus colour and the resting border set on a wrapper cascade into the select inside. -->
    <div style="box-sizing: border-box; width: 100%; --mono-select-ring-color: #7c3aed; --mono-select-border-color: #e9d5ff;">
        <div mono-select :mono-open="fields.fruit.open ? '' : null">
            <label mono-label>Favourite fruit</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.fruit.open" @click="fields.fruit.open = !fields.fruit.open">
                <span v-if="fields.fruit.value" mono-value><span>{{ labelOf(fields.fruit.value) }}</span></span>
                <span v-else mono-value mono-placeholder>Pick one</span>
                <span mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.fruit.open && i === 0 ? '' : null" :mono-selected="fields.fruit.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.fruit.value === o.value" :disabled="o.disabled" @click="pick(fields.fruit, o)">{{ o.label }}</button>
                </div>
            </div>
            <div mono-message-wrap>
                <div mono-message="helper">Focus colour + border themed via --mono-select-*.</div>
            </div>
        </div>
    </div>
</template>
