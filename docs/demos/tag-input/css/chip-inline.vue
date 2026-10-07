<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

const items = [
    { value: 'vue', label: 'Vue' }, { value: 'lit', label: 'Lit' }, { value: 'react', label: 'React' }, { value: 'svelte', label: 'Svelte' },
    { value: 'angular', label: 'Angular' }, { value: 'solid', label: 'Solid' }, { value: 'qwik', label: 'Qwik' }, { value: 'astro', label: 'Astro' },
    { value: 'ember', label: 'Ember' }, { value: 'preact', label: 'Preact' },
]
const fields = reactive({ flex: { open: false, draft: '', tags: ['vue', 'lit', 'react', 'svelte', 'angular', 'solid', 'qwik', 'astro', 'ember', 'preact'] }, inline: { open: false, draft: '', tags: ['vue', 'lit', 'react', 'svelte', 'angular', 'solid', 'qwik', 'astro', 'ember', 'preact'] } })
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
            <!-- flex (the default): the chips wrap and the field grows -->
            <div mono-tag-input mono-clearable :mono-open="fields.flex.open ? '' : null">
                <label mono-label>Ten tags (flex)</label>
                <div mono-field :mono-typing="fields.flex.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                    <div v-for="tag in fields.flex.tags" :key="tag" mono-chip :mono-removable="fields.flex.min && fields.flex.tags.length <= fields.flex.min ? null : ''">
                        <span mono-chip-main>
                            <span mono-chip-content>
                                <span mono-chip-label>{{ labelOf(tag) }}</span>
                                <button v-if="!(fields.flex.min && fields.flex.tags.length <= fields.flex.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.flex, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                            </span>
                        </span>
                    </div>
                    <input mono-native type="text" :placeholder="fields.flex.tags.length ? undefined : 'Add tag'" autocomplete="off" v-model="fields.flex.draft" @focus="fields.flex.open = true" @keydown.enter.prevent="add(fields.flex)" @keydown.backspace="backspace(fields.flex)" />
                    <div mono-actions>
                        <button v-if="fields.flex.tags.length && !(fields.flex.min > 0)" type="button" mono-clear aria-label="Clear tags" @click.stop="clear(fields.flex)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        <span v-else mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.flex.open" @click.stop="fields.flex.open = !fields.flex.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                    </div>
                </div>
                <div mono-dropdown role="listbox">
                    <button v-for="(o, i) in suggestions(fields.flex)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.flex, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                    <div v-if="!suggestions(fields.flex).length" mono-empty-row>No items</div>
                </div>
            </div>
            <!-- inline: one line that never grows — the chips live in [mono-chip-strip] and the ‹ › pager pages it -->
            <div mono-tag-input mono-clearable :mono-open="fields.inline.open ? '' : null">
                <label mono-label>Ten tags (inline)</label>
                <div mono-field mono-inline :mono-typing="fields.inline.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                    <div mono-chip-strip>
                        <div v-for="tag in fields.inline.tags" :key="tag" mono-chip :mono-removable="fields.inline.min && fields.inline.tags.length <= fields.inline.min ? null : ''">
                            <span mono-chip-main>
                                <span mono-chip-content>
                                    <span mono-chip-label>{{ labelOf(tag) }}</span>
                                    <button v-if="!(fields.inline.min && fields.inline.tags.length <= fields.inline.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.inline, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                                </span>
                            </span>
                        </div>
                    </div>
                    <input mono-native type="text" :placeholder="fields.inline.tags.length ? undefined : 'Add tag'" autocomplete="off" v-model="fields.inline.draft" @focus="fields.inline.open = true" @keydown.enter.prevent="add(fields.inline)" @keydown.backspace="backspace(fields.inline)" />
                    <div mono-actions>
                        <!-- the strip's ‹ › pager: the element shows the pair only while the chips overflow -->
                        <button type="button" mono-scroll="prev" mono-idle aria-label="Scroll tags backward" aria-hidden="true" disabled tabindex="-1"><span mono-icon class="mono-icon i-mdi-chevron-left"></span></button>
                        <button type="button" mono-scroll="next" aria-label="Scroll tags forward" tabindex="-1"><span mono-icon class="mono-icon i-mdi-chevron-right"></span></button>
                        <button v-if="fields.inline.tags.length && !(fields.inline.min > 0)" type="button" mono-clear aria-label="Clear tags" @click.stop="clear(fields.inline)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        <span v-else mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.inline.open" @click.stop="fields.inline.open = !fields.inline.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                    </div>
                </div>
                <div mono-dropdown role="listbox">
                    <button v-for="(o, i) in suggestions(fields.inline)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.inline, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                    <div v-if="!suggestions(fields.inline).length" mono-empty-row>No items</div>
                </div>
            </div>
        </div>
    </div>
</template>
