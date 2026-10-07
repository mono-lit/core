<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

const items = [
    { value: 'bug', label: 'bug' },
    { value: 'feature', label: 'feature' },
    { value: 'docs', label: 'docs' },
]
const fields = reactive({ labels: { open: false, draft: '', tags: ['bug'] } })
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
    <div style="width: 100%;">
        <!-- slot="label" / "helper" content lands inline in the label and the message -->
        <div mono-tag-input :mono-open="fields.labels.open ? '' : null">
            <label mono-label>🏷️ Issue labels</label>
            <div mono-field :mono-typing="fields.labels.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.labels.tags" :key="tag" mono-chip :mono-removable="fields.labels.min && fields.labels.tags.length <= fields.labels.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.labels.min && fields.labels.tags.length <= fields.labels.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.labels, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.labels.tags.length ? undefined : 'Add a label'" autocomplete="off" v-model="fields.labels.draft" @focus="fields.labels.open = true" @keydown.enter.prevent="add(fields.labels)" @keydown.backspace="backspace(fields.labels)" />
                <div mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.labels.open" @click.stop="fields.labels.open = !fields.labels.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.labels)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.labels, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.labels).length" mono-empty-row>No items</div>
            </div>
            <div mono-message-wrap>
                <div mono-message="helper">Used by triage to route incoming issues.</div>
            </div>
        </div>
    </div>
</template>
