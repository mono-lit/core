<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

const items = [
    { value: 'admin', label: 'Administrator' },
    { value: 'editor', label: 'Editor' },
    { value: 'viewer', label: 'Viewer' },
]
const fields = reactive({ roles: { open: false, draft: '', tags: ['admin'] } })
const labelOf = (value) => items.find((o) => o.value === value)?.label ?? value
const suggestions = (field) => items.filter((o) => !field.tags.includes(o.value) && labelOf(o.value).toLowerCase().includes(field.draft.toLowerCase()))

function add(field) {
    const value = field.draft.trim()
    field.draft = ''
    if (!value || field.tags.includes(value) || field.max && field.tags.length >= field.max) return
    field.tags.push(value)
}
function pick(field, option) {
    field.draft = ''
    if (field.max && field.tags.length >= field.max) return
    field.tags.push(option.value)
}
function remove(field, value) {
    if (field.min && field.tags.length <= field.min) return
    field.tags = field.tags.filter((t) => t !== value)
}
function clear(field) {
    field.tags = []
    field.open = false
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
</script>

<template>
    <div style="width: 100%; display: grid; gap: 0.7rem;">
        <!-- searchable=false: the box is read-only, the caret and the rows still pick -->
        <div mono-tag-input mono-checkable :mono-open="fields.roles.open ? '' : null">
            <label mono-label>Roles</label>
            <div mono-field :mono-typing="fields.roles.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.roles.tags" :key="tag" mono-chip :mono-removable="fields.roles.min && fields.roles.tags.length <= fields.roles.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.roles.min && fields.roles.tags.length <= fields.roles.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.roles, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.roles.tags.length ? undefined : 'Click to pick'" autocomplete="off" v-model="fields.roles.draft" readonly @focus="fields.roles.open = true" @keydown.enter.prevent="add(fields.roles)" @keydown.backspace="backspace(fields.roles)" />
                <div mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.roles.open" @click.stop="fields.roles.open = !fields.roles.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.roles)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.roles, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.roles).length" mono-empty-row>No items</div>
            </div>
        </div>
        <DemoReadout>selected → {{ fields.roles.tags.length ? fields.roles.tags.join(', ') : '—' }}</DemoReadout>
    </div>
</template>
