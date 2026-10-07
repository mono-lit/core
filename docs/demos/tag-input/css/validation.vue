<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

const items = [
    { value: 'vue', label: 'Vue' },
    { value: 'lit', label: 'Lit' },
    { value: 'react', label: 'React' },
    { value: 'svelte', label: 'Svelte' },
]
const fields = reactive({ valid: { open: false, draft: '', tags: ['vue', 'lit'] }, invalid: { open: false, draft: '', tags: [] }, warning: { open: false, draft: '', tags: ['vue'] } })
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
    <div style="width: 100%; display: grid; gap: 1rem;">
        <div mono-tag-input mono-validation-state="valid" :mono-open="fields.valid.open ? '' : null">
            <label mono-label>Valid</label>
            <div mono-field :mono-typing="fields.valid.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.valid.tags" :key="tag" mono-chip :mono-removable="fields.valid.min && fields.valid.tags.length <= fields.valid.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.valid.min && fields.valid.tags.length <= fields.valid.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.valid, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.valid.tags.length ? undefined : 'Add tag'" autocomplete="off" v-model="fields.valid.draft" @focus="fields.valid.open = true" @keydown.enter.prevent="add(fields.valid)" @keydown.backspace="backspace(fields.valid)" />
                <div mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.valid.open" @click.stop="fields.valid.open = !fields.valid.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.valid)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.valid, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.valid).length" mono-empty-row>No items</div>
            </div>
            <div mono-message-wrap>
                <div mono-message="valid">Looks good.</div>
            </div>
        </div>
        <div mono-tag-input mono-validation-state="invalid" :mono-open="fields.invalid.open ? '' : null">
            <label mono-label>Invalid</label>
            <div mono-field :mono-typing="fields.invalid.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.invalid.tags" :key="tag" mono-chip :mono-removable="fields.invalid.min && fields.invalid.tags.length <= fields.invalid.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.invalid.min && fields.invalid.tags.length <= fields.invalid.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.invalid, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.invalid.tags.length ? undefined : 'Add at least one tag'" autocomplete="off" v-model="fields.invalid.draft" aria-invalid="true" @focus="fields.invalid.open = true" @keydown.enter.prevent="add(fields.invalid)" @keydown.backspace="backspace(fields.invalid)" />
                <div mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.invalid.open" @click.stop="fields.invalid.open = !fields.invalid.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.invalid)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.invalid, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.invalid).length" mono-empty-row>No items</div>
            </div>
            <div mono-message-wrap>
                <div mono-message="invalid" role="alert">At least one tag is required.</div>
            </div>
        </div>
        <div mono-tag-input mono-validation-state="warning" :mono-open="fields.warning.open ? '' : null">
            <label mono-label>Warning</label>
            <div mono-field :mono-typing="fields.warning.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.warning.tags" :key="tag" mono-chip :mono-removable="fields.warning.min && fields.warning.tags.length <= fields.warning.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.warning.min && fields.warning.tags.length <= fields.warning.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.warning, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.warning.tags.length ? undefined : 'Add tag'" autocomplete="off" v-model="fields.warning.draft" @focus="fields.warning.open = true" @keydown.enter.prevent="add(fields.warning)" @keydown.backspace="backspace(fields.warning)" />
                <div mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.warning.open" @click.stop="fields.warning.open = !fields.warning.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.warning)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.warning, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.warning).length" mono-empty-row>No items</div>
            </div>
            <div mono-message-wrap>
                <div mono-message="warning">Add at least three tags for better matching.</div>
            </div>
        </div>
    </div>
</template>
