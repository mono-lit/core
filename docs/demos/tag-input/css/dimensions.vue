<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

const items = [
    { value: 'vue', label: 'Vue' },
    { value: 'lit', label: 'Lit' },
    { value: 'react', label: 'React' },
    { value: 'svelte', label: 'Svelte' },
]
const fields = reactive({ fixed: { open: false, draft: '', tags: ['vue', 'lit'] }, max: { open: false, draft: '', tags: ['vue', 'lit'] }, full: { open: false, draft: '', tags: ['vue', 'lit'] } })
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
    <div style="display: flex; flex-direction: column; gap: 1rem;">
        <!-- width / height props land on the wrapper's inline style. -->
        <div mono-tag-input style="width: 320px;" :mono-open="fields.fixed.open ? '' : null">
            <label mono-label>Fixed 320px</label>
            <div mono-field :mono-typing="fields.fixed.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.fixed.tags" :key="tag" mono-chip :mono-removable="fields.fixed.min && fields.fixed.tags.length <= fields.fixed.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.fixed.min && fields.fixed.tags.length <= fields.fixed.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.fixed, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.fixed.tags.length ? undefined : 'Add a tag'" autocomplete="off" v-model="fields.fixed.draft" @focus="fields.fixed.open = true" @keydown.enter.prevent="add(fields.fixed)" @keydown.backspace="backspace(fields.fixed)" />
                <div mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.fixed.open" @click.stop="fields.fixed.open = !fields.fixed.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.fixed)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.fixed, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.fixed).length" mono-empty-row>No items</div>
            </div>
        </div>
        <div mono-tag-input style="max-width: 480px;" :mono-open="fields.max.open ? '' : null">
            <label mono-label>Max-width 480px</label>
            <div mono-field :mono-typing="fields.max.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.max.tags" :key="tag" mono-chip :mono-removable="fields.max.min && fields.max.tags.length <= fields.max.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.max.min && fields.max.tags.length <= fields.max.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.max, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.max.tags.length ? undefined : 'Add a tag'" autocomplete="off" v-model="fields.max.draft" @focus="fields.max.open = true" @keydown.enter.prevent="add(fields.max)" @keydown.backspace="backspace(fields.max)" />
                <div mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.max.open" @click.stop="fields.max.open = !fields.max.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.max)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.max, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.max).length" mono-empty-row>No items</div>
            </div>
        </div>
        <div mono-tag-input style="width: 100%;" :mono-open="fields.full.open ? '' : null">
            <label mono-label>Full width</label>
            <div mono-field :mono-typing="fields.full.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.full.tags" :key="tag" mono-chip :mono-removable="fields.full.min && fields.full.tags.length <= fields.full.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.full.min && fields.full.tags.length <= fields.full.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.full, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.full.tags.length ? undefined : 'Add a tag'" autocomplete="off" v-model="fields.full.draft" @focus="fields.full.open = true" @keydown.enter.prevent="add(fields.full)" @keydown.backspace="backspace(fields.full)" />
                <div mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.full.open" @click.stop="fields.full.open = !fields.full.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.full)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.full, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.full).length" mono-empty-row>No items</div>
            </div>
        </div>
    </div>
</template>
