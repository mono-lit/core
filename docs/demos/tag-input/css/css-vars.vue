<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

const items = [
    { value: 'vue', label: 'Vue' },
    { value: 'lit', label: 'Lit' },
    { value: 'react', label: 'React' },
    { value: 'svelte', label: 'Svelte' },
]
const fields = reactive({ skills: { open: false, draft: '', tags: ['vue', 'lit'] } })
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
    <!-- The focus colour and the resting border set on a wrapper cascade into the field inside. -->
    <div style="box-sizing: border-box; width: 100%; --mono-tag-input-ring-color: #7c3aed; --mono-tag-input-border-color: #e9d5ff;">
        <div mono-tag-input :mono-open="fields.skills.open ? '' : null">
            <label mono-label>Skills</label>
            <div mono-field :mono-typing="fields.skills.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.skills.tags" :key="tag" mono-chip :mono-removable="fields.skills.min && fields.skills.tags.length <= fields.skills.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.skills.min && fields.skills.tags.length <= fields.skills.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.skills, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.skills.tags.length ? undefined : 'Add a skill and press Enter'" autocomplete="off" v-model="fields.skills.draft" @focus="fields.skills.open = true" @keydown.enter.prevent="add(fields.skills)" @keydown.backspace="backspace(fields.skills)" />
                <div mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.skills.open" @click.stop="fields.skills.open = !fields.skills.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.skills)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.skills, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.skills).length" mono-empty-row>No items</div>
            </div>
            <div mono-message-wrap>
                <div mono-message="helper">Focus colour + border themed via --mono-tag-input-*.</div>
            </div>
        </div>
    </div>
</template>
