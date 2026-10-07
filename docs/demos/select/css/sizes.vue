<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
]
const fields = reactive({ xs: { open: false, value: null }, sm: { open: false, value: null }, md: { open: false, value: null }, lg: { open: false, value: null }, xl: { open: false, value: null }, xxl: { open: false, value: null } })
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
        <div mono-select mono-size="xs" :mono-open="fields.xs.open ? '' : null">
            <label mono-label>Extra small</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.xs.open" @click="fields.xs.open = !fields.xs.open">
                <span v-if="fields.xs.value" mono-value><span>{{ labelOf(fields.xs.value) }}</span></span>
                <span v-else mono-value mono-placeholder>Extra small</span>
                <span mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.xs.open && i === 0 ? '' : null" :mono-selected="fields.xs.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.xs.value === o.value" :disabled="o.disabled" @click="pick(fields.xs, o)">{{ o.label }}</button>
                </div>
            </div>
        </div>
        <div mono-select mono-size="sm" :mono-open="fields.sm.open ? '' : null">
            <label mono-label>Small</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.sm.open" @click="fields.sm.open = !fields.sm.open">
                <span v-if="fields.sm.value" mono-value><span>{{ labelOf(fields.sm.value) }}</span></span>
                <span v-else mono-value mono-placeholder>Small</span>
                <span mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.sm.open && i === 0 ? '' : null" :mono-selected="fields.sm.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.sm.value === o.value" :disabled="o.disabled" @click="pick(fields.sm, o)">{{ o.label }}</button>
                </div>
            </div>
        </div>
        <div mono-select :mono-open="fields.md.open ? '' : null">
            <label mono-label>Medium</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.md.open" @click="fields.md.open = !fields.md.open">
                <span v-if="fields.md.value" mono-value><span>{{ labelOf(fields.md.value) }}</span></span>
                <span v-else mono-value mono-placeholder>Medium</span>
                <span mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.md.open && i === 0 ? '' : null" :mono-selected="fields.md.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.md.value === o.value" :disabled="o.disabled" @click="pick(fields.md, o)">{{ o.label }}</button>
                </div>
            </div>
        </div>
        <div mono-select mono-size="lg" :mono-open="fields.lg.open ? '' : null">
            <label mono-label>Large</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.lg.open" @click="fields.lg.open = !fields.lg.open">
                <span v-if="fields.lg.value" mono-value><span>{{ labelOf(fields.lg.value) }}</span></span>
                <span v-else mono-value mono-placeholder>Large</span>
                <span mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.lg.open && i === 0 ? '' : null" :mono-selected="fields.lg.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.lg.value === o.value" :disabled="o.disabled" @click="pick(fields.lg, o)">{{ o.label }}</button>
                </div>
            </div>
        </div>
        <div mono-select mono-size="xl" :mono-open="fields.xl.open ? '' : null">
            <label mono-label>Extra large</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.xl.open" @click="fields.xl.open = !fields.xl.open">
                <span v-if="fields.xl.value" mono-value><span>{{ labelOf(fields.xl.value) }}</span></span>
                <span v-else mono-value mono-placeholder>Extra large</span>
                <span mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.xl.open && i === 0 ? '' : null" :mono-selected="fields.xl.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.xl.value === o.value" :disabled="o.disabled" @click="pick(fields.xl, o)">{{ o.label }}</button>
                </div>
            </div>
        </div>
        <div mono-select mono-size="xxl" :mono-open="fields.xxl.open ? '' : null">
            <label mono-label>2X large</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.xxl.open" @click="fields.xxl.open = !fields.xxl.open">
                <span v-if="fields.xxl.value" mono-value><span>{{ labelOf(fields.xxl.value) }}</span></span>
                <span v-else mono-value mono-placeholder>2X large</span>
                <span mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.xxl.open && i === 0 ? '' : null" :mono-selected="fields.xxl.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.xxl.value === o.value" :disabled="o.disabled" @click="pick(fields.xxl, o)">{{ o.label }}</button>
                </div>
            </div>
        </div>
    </div>
</template>
