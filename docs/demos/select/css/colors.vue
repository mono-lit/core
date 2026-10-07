<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

// The same picker as the Vue tab; the hand-written markup takes the colour as
// the `mono-color` attribute (primary is the default and emits nothing).
const color = ref('primary')

const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
]
const fields = reactive({ outlined: { open: false, value: null }, filled: { open: false, value: null }, underlined: { open: false, value: null } })
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
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="form" />
        </DemoControls>

        <div style="display: grid; gap: 1rem;">
            <div mono-select :mono-color="color === 'primary' ? null : color" :mono-open="fields.outlined.open ? '' : null">
                <label mono-label>Outlined</label>
                <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.outlined.open" @click="fields.outlined.open = !fields.outlined.open">
                    <span v-if="fields.outlined.value" mono-value><span>{{ labelOf(fields.outlined.value) }}</span></span>
                    <span v-else mono-value mono-placeholder>Outlined</span>
                    <span mono-actions>
                        <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                    </span>
                </button>
                <div mono-dropdown role="listbox">
                    <div mono-dropdown-body>
                        <!-- opening highlights the first row, like the element's keyboard cursor -->
                        <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.outlined.open && i === 0 ? '' : null" :mono-selected="fields.outlined.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.outlined.value === o.value" :disabled="o.disabled" @click="pick(fields.outlined, o)">{{ o.label }}</button>
                    </div>
                </div>
            </div>
            <div mono-select mono-variant="filled" :mono-color="color === 'primary' ? null : color" :mono-open="fields.filled.open ? '' : null">
                <label mono-label>Filled</label>
                <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.filled.open" @click="fields.filled.open = !fields.filled.open">
                    <span v-if="fields.filled.value" mono-value><span>{{ labelOf(fields.filled.value) }}</span></span>
                    <span v-else mono-value mono-placeholder>Filled</span>
                    <span mono-actions>
                        <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                    </span>
                </button>
                <div mono-dropdown role="listbox">
                    <div mono-dropdown-body>
                        <!-- opening highlights the first row, like the element's keyboard cursor -->
                        <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.filled.open && i === 0 ? '' : null" :mono-selected="fields.filled.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.filled.value === o.value" :disabled="o.disabled" @click="pick(fields.filled, o)">{{ o.label }}</button>
                    </div>
                </div>
            </div>
            <div mono-select mono-variant="underlined" :mono-color="color === 'primary' ? null : color" :mono-open="fields.underlined.open ? '' : null">
                <label mono-label>Underlined</label>
                <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.underlined.open" @click="fields.underlined.open = !fields.underlined.open">
                    <span v-if="fields.underlined.value" mono-value><span>{{ labelOf(fields.underlined.value) }}</span></span>
                    <span v-else mono-value mono-placeholder>Underlined</span>
                    <span mono-actions>
                        <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                    </span>
                </button>
                <div mono-dropdown role="listbox">
                    <div mono-dropdown-body>
                        <!-- opening highlights the first row, like the element's keyboard cursor -->
                        <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.underlined.open && i === 0 ? '' : null" :mono-selected="fields.underlined.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.underlined.value === o.value" :disabled="o.disabled" @click="pick(fields.underlined, o)">{{ o.label }}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
