<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

// The same picker as the Vue tab; the hand-written markup takes the colour as
// the `mono-color` attribute (primary is the default and emits nothing).
const color = ref('primary')

const items = [
    { value: 'vue', label: 'Vue' },
    { value: 'lit', label: 'Lit' },
    { value: 'react', label: 'React' },
    { value: 'svelte', label: 'Svelte' },
]
const fields = reactive({ outlined: { open: false, draft: '', tags: ['vue', 'lit'] }, filled: { open: false, draft: '', tags: ['vue', 'lit'] }, underlined: { open: false, draft: '', tags: ['vue', 'lit'] } })
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
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="form" />
        </DemoControls>

        <div style="display: grid; gap: 1rem;">
            <div mono-tag-input :mono-color="color === 'primary' ? null : color" :mono-open="fields.outlined.open ? '' : null">
                <label mono-label>Outlined</label>
                <div mono-field :mono-typing="fields.outlined.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                    <div v-for="tag in fields.outlined.tags" :key="tag" mono-chip :mono-removable="fields.outlined.min && fields.outlined.tags.length <= fields.outlined.min ? null : ''">
                        <span mono-chip-main>
                            <span mono-chip-content>
                                <span mono-chip-label>{{ labelOf(tag) }}</span>
                                <button v-if="!(fields.outlined.min && fields.outlined.tags.length <= fields.outlined.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.outlined, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                            </span>
                        </span>
                    </div>
                    <input mono-native type="text" :placeholder="fields.outlined.tags.length ? undefined : 'Add tag'" autocomplete="off" v-model="fields.outlined.draft" @focus="fields.outlined.open = true" @keydown.enter.prevent="add(fields.outlined)" @keydown.backspace="backspace(fields.outlined)" />
                    <div mono-actions>
                        <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.outlined.open" @click.stop="fields.outlined.open = !fields.outlined.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                    </div>
                </div>
                <div mono-dropdown role="listbox">
                    <button v-for="(o, i) in suggestions(fields.outlined)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.outlined, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                    <div v-if="!suggestions(fields.outlined).length" mono-empty-row>No items</div>
                </div>
            </div>
            <div mono-tag-input mono-variant="filled" :mono-color="color === 'primary' ? null : color" :mono-open="fields.filled.open ? '' : null">
                <label mono-label>Filled</label>
                <div mono-field :mono-typing="fields.filled.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                    <div v-for="tag in fields.filled.tags" :key="tag" mono-chip :mono-removable="fields.filled.min && fields.filled.tags.length <= fields.filled.min ? null : ''">
                        <span mono-chip-main>
                            <span mono-chip-content>
                                <span mono-chip-label>{{ labelOf(tag) }}</span>
                                <button v-if="!(fields.filled.min && fields.filled.tags.length <= fields.filled.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.filled, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                            </span>
                        </span>
                    </div>
                    <input mono-native type="text" :placeholder="fields.filled.tags.length ? undefined : 'Add tag'" autocomplete="off" v-model="fields.filled.draft" @focus="fields.filled.open = true" @keydown.enter.prevent="add(fields.filled)" @keydown.backspace="backspace(fields.filled)" />
                    <div mono-actions>
                        <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.filled.open" @click.stop="fields.filled.open = !fields.filled.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                    </div>
                </div>
                <div mono-dropdown role="listbox">
                    <button v-for="(o, i) in suggestions(fields.filled)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.filled, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                    <div v-if="!suggestions(fields.filled).length" mono-empty-row>No items</div>
                </div>
            </div>
            <div mono-tag-input mono-variant="underlined" :mono-color="color === 'primary' ? null : color" :mono-open="fields.underlined.open ? '' : null">
                <label mono-label>Underlined</label>
                <div mono-field :mono-typing="fields.underlined.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                    <div v-for="tag in fields.underlined.tags" :key="tag" mono-chip :mono-removable="fields.underlined.min && fields.underlined.tags.length <= fields.underlined.min ? null : ''">
                        <span mono-chip-main>
                            <span mono-chip-content>
                                <span mono-chip-label>{{ labelOf(tag) }}</span>
                                <button v-if="!(fields.underlined.min && fields.underlined.tags.length <= fields.underlined.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.underlined, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                            </span>
                        </span>
                    </div>
                    <input mono-native type="text" :placeholder="fields.underlined.tags.length ? undefined : 'Add tag'" autocomplete="off" v-model="fields.underlined.draft" @focus="fields.underlined.open = true" @keydown.enter.prevent="add(fields.underlined)" @keydown.backspace="backspace(fields.underlined)" />
                    <div mono-actions>
                        <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.underlined.open" @click.stop="fields.underlined.open = !fields.underlined.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                    </div>
                </div>
                <div mono-dropdown role="listbox">
                    <button v-for="(o, i) in suggestions(fields.underlined)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.underlined, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                    <div v-if="!suggestions(fields.underlined).length" mono-empty-row>No items</div>
                </div>
            </div>
        </div>
    </div>
</template>
