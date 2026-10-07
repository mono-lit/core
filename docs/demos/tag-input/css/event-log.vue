<script setup>
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue'

const items = [
    { value: 'vue', label: 'Vue' },
    { value: 'lit', label: 'Lit' },
    { value: 'react', label: 'React' },
    { value: 'svelte', label: 'Svelte' },
]
const fields = reactive({ tags: { open: false, draft: '', tags: ['vue', 'lit'] } })
const labelOf = (value) => items.find((o) => o.value === value)?.label ?? value
const suggestions = (field) => items.filter((o) => !field.tags.includes(o.value) && labelOf(o.value).toLowerCase().includes(field.draft.toLowerCase()))

function add(field) {
    const value = field.draft.trim()
    field.draft = ''
    if (!value || field.tags.includes(value) || field.max && field.tags.length >= field.max) return
    field.tags.push(value)
    log('change', field)
}
function pick(field, option) {
    field.draft = ''
    if (field.max && field.tags.length >= field.max) return
    field.tags.push(option.value)
    log('change', field)
}
function remove(field, value) {
    if (field.min && field.tags.length <= field.min) return
    field.tags = field.tags.filter((t) => t !== value)
    log('change', field)
}
function clear(field) {
    field.tags = []
    field.open = false
    log('change', field)
}
function backspace(field) {
    if (!field.draft && field.tags.length) remove(field, field.tags[field.tags.length - 1])
}
// an outside click closes an open panel, like the element does
function onDocumentClick(event) {
    if (event.target.closest('[mono-tag-input]')) return
    for (const f of Object.values(fields)) f.open = false
}
onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))

const lines = ref([])
const logText = computed(() => (lines.value.length ? lines.value.join('\n') : 'No events yet...'))
function log(kind, field) {
    lines.value.unshift('[' + kind + '] ' + JSON.stringify(field.tags))
}
</script>

<template>
    <div style="width: 100%;">
        <div mono-tag-input mono-clearable :mono-open="fields.tags.open ? '' : null">
            <label mono-label>Event Tag Input</label>
            <div mono-field :mono-typing="fields.tags.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.tags.tags" :key="tag" mono-chip :mono-removable="fields.tags.min && fields.tags.tags.length <= fields.tags.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.tags.min && fields.tags.tags.length <= fields.tags.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.tags, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.tags.tags.length ? undefined : 'Add, remove, clear'" autocomplete="off" v-model="fields.tags.draft" @focus="fields.tags.open = true" @keydown.enter.prevent="add(fields.tags)" @keydown.backspace="backspace(fields.tags)" />
                <div mono-actions>
                    <button v-if="fields.tags.tags.length && !(fields.tags.min > 0)" type="button" mono-clear aria-label="Clear tags" @click.stop="clear(fields.tags)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                    <span v-else mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.tags.open" @click.stop="fields.tags.open = !fields.tags.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.tags)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.tags, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.tags).length" mono-empty-row>No items</div>
            </div>
        </div>
        <br>
        <DemoLog :text="logText" />
    </div>
</template>
