<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

const items = [
    { value: 'vue', label: 'Vue' },
    { value: 'lit', label: 'Lit' },
    { value: 'react', label: 'React' },
    { value: 'svelte', label: 'Svelte' },
]
const fields = reactive({ disabled: { open: false, draft: '', tags: ['vue', 'lit'] }, readonly: { open: false, draft: '', tags: ['vue', 'lit'] }, required: { open: false, draft: '', tags: [] } })
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
        <div mono-tag-input mono-clearable mono-disabled :mono-open="fields.disabled.open ? '' : null">
            <label mono-label>Disabled</label>
            <div mono-field :mono-typing="fields.disabled.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.disabled.tags" :key="tag" mono-chip>
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.disabled.tags.length ? undefined : 'Cannot edit'" autocomplete="off" v-model="fields.disabled.draft" disabled />
                <div mono-actions>
                    <!-- disabled / readonly: no ✕, no caret; the gutter stays -->
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.disabled)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.disabled, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.disabled).length" mono-empty-row>No items</div>
            </div>
        </div>
        <div mono-tag-input mono-clearable mono-readonly :mono-open="fields.readonly.open ? '' : null">
            <label mono-label>Readonly</label>
            <div mono-field :mono-typing="fields.readonly.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.readonly.tags" :key="tag" mono-chip>
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.readonly.tags.length ? undefined : 'Display only'" autocomplete="off" v-model="fields.readonly.draft" readonly />
                <div mono-actions>
                    <!-- disabled / readonly: no ✕, no caret; the gutter stays -->
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.readonly)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.readonly, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.readonly).length" mono-empty-row>No items</div>
            </div>
        </div>
        <div mono-tag-input mono-required :mono-open="fields.required.open ? '' : null">
            <label mono-label>Required<span mono-required-mark>*</span></label>
            <div mono-field :mono-typing="fields.required.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.required.tags" :key="tag" mono-chip :mono-removable="fields.required.min && fields.required.tags.length <= fields.required.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.required.min && fields.required.tags.length <= fields.required.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.required, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.required.tags.length ? undefined : 'Add at least one tag'" autocomplete="off" v-model="fields.required.draft" :required="!fields.required.tags.length" @focus="fields.required.open = true" @keydown.enter.prevent="add(fields.required)" @keydown.backspace="backspace(fields.required)" />
                <div mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.required.open" @click.stop="fields.required.open = !fields.required.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.required)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.required, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.required).length" mono-empty-row>No items</div>
            </div>
            <div mono-message-wrap>
                <div mono-message="helper">The asterisk indicates a required field.</div>
            </div>
        </div>
    </div>
</template>
