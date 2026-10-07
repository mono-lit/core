<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

const items = [
    { value: 'vue', label: 'Vue' },
    { value: 'lit', label: 'Lit' },
    { value: 'react', label: 'React' },
    { value: 'svelte', label: 'Svelte' },
]
const fields = reactive({ capped: { open: false, draft: '', tags: ['vue', 'lit'], max: 4 }, floored: { open: false, draft: '', tags: ['vue', 'lit', 'react'], min: 2 }, both: { open: false, draft: '', tags: ['vue'], min: 1, max: 3 } })
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
        <div mono-tag-input mono-clearable :mono-open="fields.capped.open ? '' : null">
            <label mono-label>At most 4 (max)</label>
            <div mono-field :mono-typing="fields.capped.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.capped.tags" :key="tag" mono-chip :mono-removable="fields.capped.min && fields.capped.tags.length <= fields.capped.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.capped.min && fields.capped.tags.length <= fields.capped.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.capped, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.capped.tags.length ? undefined : 'Add a tag'" autocomplete="off" v-model="fields.capped.draft" @focus="fields.capped.open = true" @keydown.enter.prevent="add(fields.capped)" @keydown.backspace="backspace(fields.capped)" />
                <div mono-actions>
                    <button v-if="fields.capped.tags.length && !(fields.capped.min > 0)" type="button" mono-clear aria-label="Clear tags" @click.stop="clear(fields.capped)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                    <span v-else mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.capped.open" @click.stop="fields.capped.open = !fields.capped.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.capped)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.capped, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.capped).length" mono-empty-row>No items</div>
            </div>
            <div mono-message-wrap>
                <div mono-message="helper">The 5th pick is rejected, not disabled.</div>
            </div>
        </div>
        <div mono-tag-input mono-clearable :mono-open="fields.floored.open ? '' : null">
            <label mono-label>At least 2 (min)</label>
            <div mono-field :mono-typing="fields.floored.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.floored.tags" :key="tag" mono-chip :mono-removable="fields.floored.min && fields.floored.tags.length <= fields.floored.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.floored.min && fields.floored.tags.length <= fields.floored.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.floored, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.floored.tags.length ? undefined : 'Add a tag'" autocomplete="off" v-model="fields.floored.draft" @focus="fields.floored.open = true" @keydown.enter.prevent="add(fields.floored)" @keydown.backspace="backspace(fields.floored)" />
                <div mono-actions>
                    <button v-if="fields.floored.tags.length && !(fields.floored.min > 0)" type="button" mono-clear aria-label="Clear tags" @click.stop="clear(fields.floored)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                    <span v-else mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.floored.open" @click.stop="fields.floored.open = !fields.floored.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.floored)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.floored, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.floored).length" mono-empty-row>No items</div>
            </div>
            <div mono-message-wrap>
                <div mono-message="helper">Remove down to two: the last two lose their ✕ and the clear button hides.</div>
            </div>
        </div>
        <div mono-tag-input mono-clearable :mono-open="fields.both.open ? '' : null">
            <label mono-label>1 to 3 via chip.min / chip.max</label>
            <div mono-field :mono-typing="fields.both.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.both.tags" :key="tag" mono-chip :mono-removable="fields.both.min && fields.both.tags.length <= fields.both.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.both.min && fields.both.tags.length <= fields.both.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.both, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.both.tags.length ? undefined : 'Add a tag'" autocomplete="off" v-model="fields.both.draft" @focus="fields.both.open = true" @keydown.enter.prevent="add(fields.both)" @keydown.backspace="backspace(fields.both)" />
                <div mono-actions>
                    <button v-if="fields.both.tags.length && !(fields.both.min > 0)" type="button" mono-clear aria-label="Clear tags" @click.stop="clear(fields.both)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                    <span v-else mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.both.open" @click.stop="fields.both.open = !fields.both.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.both)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.both, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.both).length" mono-empty-row>No items</div>
            </div>
            <div mono-message-wrap>
                <div mono-message="helper">chip: { min: 1, max: 3 } — the same limits, set on the chip object.</div>
            </div>
        </div>
    </div>
</template>
