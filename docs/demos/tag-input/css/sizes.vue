<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

const items = [
    { value: 'vue', label: 'Vue' },
    { value: 'lit', label: 'Lit' },
    { value: 'react', label: 'React' },
    { value: 'svelte', label: 'Svelte' },
]
const fields = reactive({ xs: { open: false, draft: '', tags: ['vue', 'lit'] }, sm: { open: false, draft: '', tags: ['vue', 'lit'] }, md: { open: false, draft: '', tags: ['vue', 'lit'] }, lg: { open: false, draft: '', tags: ['vue', 'lit'] }, xl: { open: false, draft: '', tags: ['vue', 'lit'] }, xxl: { open: false, draft: '', tags: ['vue', 'lit'] } })
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
        <div mono-tag-input mono-size="xs" :mono-open="fields.xs.open ? '' : null">
            <label mono-label>Extra small</label>
            <div mono-field :mono-typing="fields.xs.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.xs.tags" :key="tag" mono-chip :mono-removable="fields.xs.min && fields.xs.tags.length <= fields.xs.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.xs.min && fields.xs.tags.length <= fields.xs.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.xs, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.xs.tags.length ? undefined : 'Add tag'" autocomplete="off" v-model="fields.xs.draft" @focus="fields.xs.open = true" @keydown.enter.prevent="add(fields.xs)" @keydown.backspace="backspace(fields.xs)" />
                <div mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.xs.open" @click.stop="fields.xs.open = !fields.xs.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.xs)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.xs, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.xs).length" mono-empty-row>No items</div>
            </div>
        </div>
        <div mono-tag-input mono-size="sm" :mono-open="fields.sm.open ? '' : null">
            <label mono-label>Small</label>
            <div mono-field :mono-typing="fields.sm.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.sm.tags" :key="tag" mono-chip :mono-removable="fields.sm.min && fields.sm.tags.length <= fields.sm.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.sm.min && fields.sm.tags.length <= fields.sm.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.sm, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.sm.tags.length ? undefined : 'Add tag'" autocomplete="off" v-model="fields.sm.draft" @focus="fields.sm.open = true" @keydown.enter.prevent="add(fields.sm)" @keydown.backspace="backspace(fields.sm)" />
                <div mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.sm.open" @click.stop="fields.sm.open = !fields.sm.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.sm)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.sm, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.sm).length" mono-empty-row>No items</div>
            </div>
        </div>
        <div mono-tag-input :mono-open="fields.md.open ? '' : null">
            <label mono-label>Medium</label>
            <div mono-field :mono-typing="fields.md.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.md.tags" :key="tag" mono-chip :mono-removable="fields.md.min && fields.md.tags.length <= fields.md.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.md.min && fields.md.tags.length <= fields.md.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.md, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.md.tags.length ? undefined : 'Add tag'" autocomplete="off" v-model="fields.md.draft" @focus="fields.md.open = true" @keydown.enter.prevent="add(fields.md)" @keydown.backspace="backspace(fields.md)" />
                <div mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.md.open" @click.stop="fields.md.open = !fields.md.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.md)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.md, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.md).length" mono-empty-row>No items</div>
            </div>
        </div>
        <div mono-tag-input mono-size="lg" :mono-open="fields.lg.open ? '' : null">
            <label mono-label>Large</label>
            <div mono-field :mono-typing="fields.lg.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.lg.tags" :key="tag" mono-chip :mono-removable="fields.lg.min && fields.lg.tags.length <= fields.lg.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.lg.min && fields.lg.tags.length <= fields.lg.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.lg, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.lg.tags.length ? undefined : 'Add tag'" autocomplete="off" v-model="fields.lg.draft" @focus="fields.lg.open = true" @keydown.enter.prevent="add(fields.lg)" @keydown.backspace="backspace(fields.lg)" />
                <div mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.lg.open" @click.stop="fields.lg.open = !fields.lg.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.lg)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.lg, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.lg).length" mono-empty-row>No items</div>
            </div>
        </div>
        <div mono-tag-input mono-size="xl" :mono-open="fields.xl.open ? '' : null">
            <label mono-label>Extra large</label>
            <div mono-field :mono-typing="fields.xl.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.xl.tags" :key="tag" mono-chip :mono-removable="fields.xl.min && fields.xl.tags.length <= fields.xl.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.xl.min && fields.xl.tags.length <= fields.xl.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.xl, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.xl.tags.length ? undefined : 'Add tag'" autocomplete="off" v-model="fields.xl.draft" @focus="fields.xl.open = true" @keydown.enter.prevent="add(fields.xl)" @keydown.backspace="backspace(fields.xl)" />
                <div mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.xl.open" @click.stop="fields.xl.open = !fields.xl.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.xl)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.xl, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.xl).length" mono-empty-row>No items</div>
            </div>
        </div>
        <div mono-tag-input mono-size="xxl" :mono-open="fields.xxl.open ? '' : null">
            <label mono-label>2X large</label>
            <div mono-field :mono-typing="fields.xxl.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="tag in fields.xxl.tags" :key="tag" mono-chip :mono-removable="fields.xxl.min && fields.xxl.tags.length <= fields.xxl.min ? null : ''">
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ labelOf(tag) }}</span>
                            <button v-if="!(fields.xxl.min && fields.xxl.tags.length <= fields.xxl.min)" type="button" mono-chip-close :aria-label="`Remove ${labelOf(tag)}`" @click.stop="remove(fields.xxl, tag)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="fields.xxl.tags.length ? undefined : 'Add tag'" autocomplete="off" v-model="fields.xxl.draft" @focus="fields.xxl.open = true" @keydown.enter.prevent="add(fields.xxl)" @keydown.backspace="backspace(fields.xxl)" />
                <div mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="fields.xxl.open" @click.stop="fields.xxl.open = !fields.xxl.open"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button v-for="(o, i) in suggestions(fields.xxl)" :key="o.value" type="button" role="option" mono-item :mono-active="i === 0 ? '' : null" @click="pick(fields.xxl, o)"><div mono-item-text><div mono-item-title>{{ o.label }}</div></div></button>
                <div v-if="!suggestions(fields.xxl).length" mono-empty-row>No items</div>
            </div>
        </div>
    </div>
</template>
