<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

const items = [
    { value: 'vue', label: 'Vue' },
    { value: 'lit', label: 'Lit' },
    { value: 'react', label: 'React' },
    { value: 'svelte', label: 'Svelte' },
]
const fields = reactive({ follow: { open: false, draft: '', tags: ['vue', 'lit', 'react'] }, pinned: { open: false, draft: '', tags: ['vue', 'lit', 'react'] } })
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
            <div style="display: grid; gap: 1rem;">
            <!-- chips follow the field: a muted combobox chip; `chip.dot` adds the dot -->
            <div mono-tag-input mono-color="success" :mono-open="fields.follow.open ? '' : null">
                <label mono-label>Chips follow the field</label>
                <div mono-field :mono-typing="fields.follow.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                    <div v-for="tag in fields.follow.tags" :key="tag" mono-chip :mono-removable="fields.follow.min && fields.follow.tags.length <= fields.follow.min ? null : ''">
                        <span mono-chip-main>
                            <span mono-chip-content>
                                <span mono-chip-dot aria-hidden="true"></span>
                                <span mono-chip-label>{{ labelOf(tag) }}</span>
                                <button v-if="!(fields.follow.min && fields.follow.tags.length <= fields.follow.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.follow, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                            </span>
                        </span>
                    </div>
                    <input mono-native type="text" :placeholder="fields.follow.tags.length ? undefined : 'Add tag'" autocomplete="off" v-model="fields.follow.draft" @focus="fields.follow.open = true" @keydown.enter.prevent="add(fields.follow)" @keydown.backspace="backspace(fields.follow)" />
                    <div mono-actions>
                        <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.follow.open" @click.stop="fields.follow.open = !fields.follow.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                    </div>
                </div>
                <div mono-dropdown role="listbox">
                    <button v-for="(o, i) in suggestions(fields.follow)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.follow, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                    <div v-if="!suggestions(fields.follow).length" mono-empty-row>No items</div>
                </div>
            </div>
            <!-- `chip.color` pins a hue instead (the tonal badge pattern) -->
            <div mono-tag-input mono-color="success" mono-variant="filled" :mono-open="fields.pinned.open ? '' : null">
                <label mono-label>…and the field variant</label>
                <div mono-field :mono-typing="fields.pinned.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                    <div v-for="tag in fields.pinned.tags" :key="tag" mono-chip mono-chip-color="success" :mono-removable="fields.pinned.min && fields.pinned.tags.length <= fields.pinned.min ? null : ''">
                        <span mono-chip-main>
                            <span mono-chip-content>
                                <span mono-chip-dot aria-hidden="true"></span>
                                <span mono-chip-label>{{ labelOf(tag) }}</span>
                                <button v-if="!(fields.pinned.min && fields.pinned.tags.length <= fields.pinned.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.pinned, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                            </span>
                        </span>
                    </div>
                    <input mono-native type="text" :placeholder="fields.pinned.tags.length ? undefined : 'Add tag'" autocomplete="off" v-model="fields.pinned.draft" @focus="fields.pinned.open = true" @keydown.enter.prevent="add(fields.pinned)" @keydown.backspace="backspace(fields.pinned)" />
                    <div mono-actions>
                        <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.pinned.open" @click.stop="fields.pinned.open = !fields.pinned.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                    </div>
                </div>
                <div mono-dropdown role="listbox">
                    <button v-for="(o, i) in suggestions(fields.pinned)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.pinned, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                    <div v-if="!suggestions(fields.pinned).length" mono-empty-row>No items</div>
                </div>
            </div>
        </div>
    </div>
</template>
