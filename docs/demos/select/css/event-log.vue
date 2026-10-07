<script setup>
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue'

const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
]
const fields = reactive({ pick: { open: false, value: null } })
const labelOf = (value) => options.find((o) => o.value === value)?.label ?? ''

function pick(field, option) {
    if (option.disabled) return
    field.value = option.value
    field.open = false
    append('[change] value=' + JSON.stringify(field.value) + ' old=' + JSON.stringify(last))
    last = field.value
}
function clear(field) {
    field.value = null
    append('[clear] value=null old=' + JSON.stringify(last))
    last = ''
}
// an outside click closes an open panel, like the element does
function onDocumentClick(event) {
    if (event.target.closest('[mono-select]')) return
    for (const f of Object.values(fields)) f.open = false
}
onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))

let last = ''
const lines = ref([])
function append(line) {
    lines.value.unshift(line)
}
const display = computed(() => (lines.value.length ? lines.value.join('\n') : 'No events yet...'))
</script>

<template>
    <div style="width: 100%;">
        <div mono-select mono-clearable :mono-open="fields.pick.open ? '' : null">
            <label mono-label>Event Select</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.pick.open" @click="fields.pick.open = !fields.pick.open">
                <span v-if="fields.pick.value" mono-value><span>{{ labelOf(fields.pick.value) }}</span></span>
                <span v-else mono-value mono-placeholder>Pick, then clear</span>
                <span mono-actions>
                    <!-- ✕ alone while there is a value to clear, the chevron otherwise -->
                    <span v-if="fields.pick.value" mono-clear role="button" tabindex="-1" aria-label="Clear select" @click.stop="clear(fields.pick)"><span mono-icon class="mono-icon i-mdi-close"></span></span>
                    <span v-else mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.pick.open && i === 0 ? '' : null" :mono-selected="fields.pick.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.pick.value === o.value" :disabled="o.disabled" @click="pick(fields.pick, o)">{{ o.label }}</button>
                </div>
            </div>
        </div>
        <br>
        <DemoLog :text="display" max-height="100px" />
    </div>
</template>
