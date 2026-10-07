<script setup>
import { computed, reactive, onMounted, onUnmounted } from 'vue'

const frameworks = [
    { id: 'vue', name: 'Vue' },
    { id: 'react', name: 'React' },
    { id: 'angular', name: 'Angular' },
    { id: 'svelte', name: 'Svelte' },
    { id: 'solid', name: 'Solid' },
    { id: 'qwik', name: 'Qwik' },
    { id: 'preact', name: 'Preact' },
    { id: 'lit', name: 'Lit' },
]
const MAX_VISIBLE = 3

// Pre-select 4 so the "+N more" overflow shows immediately (max-visible = 3).
const field = reactive({ open: false, moreOpen: false, draft: '', selected: ['vue', 'react', 'svelte', 'solid'] })
const nameOf = (id) => frameworks.find((o) => o.id === id)?.name ?? id
const visible = computed(() => field.selected.slice(0, MAX_VISIBLE))
const overflow = computed(() => field.selected.slice(MAX_VISIBLE))
const rows = computed(() => frameworks.filter((o) => o.name.toLowerCase().includes(field.draft.toLowerCase())))
// the "All" row is tri-state: none / some / all of the listed rows
const allState = computed(() => {
    const n = rows.value.filter((o) => field.selected.includes(o.id)).length
    return n === 0 ? 'none' : n === rows.value.length ? 'all' : 'some'
})

function toggle(id) {
    field.selected = field.selected.includes(id) ? field.selected.filter((t) => t !== id) : [...field.selected, id]
}
function toggleAll() {
    const ids = rows.value.map((o) => o.id)
    field.selected = allState.value === 'all'
        ? field.selected.filter((t) => !ids.includes(t))
        : [...field.selected, ...ids.filter((id) => !field.selected.includes(id))]
}
function remove(id) {
    field.selected = field.selected.filter((t) => t !== id)
}
function openList() {
    field.open = true
    field.moreOpen = false
}
function toggleMore() {
    field.moreOpen = !field.moreOpen
    if (field.moreOpen) field.open = false
}
// an outside click closes an open panel, like the element does
function onDocumentClick(event) {
    if (event.target.closest('[mono-tag-input]')) return
    field.open = false
    field.moreOpen = false
}
onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
    <div style="width: 100%;">
        <!-- `mono-checkable` mirrors the prop; the boxes in the rows are mono-checkbox's OWN
             markup (`[mono-checkbox] > [mono-box]`, size sm) and checkbox.css paints them. -->
        <div mono-tag-input mono-checkable :mono-open="field.open ? '' : null" :mono-more-open="field.moreOpen ? '' : null">
            <label mono-label>Frameworks</label>
            <div mono-field :mono-typing="field.draft ? '' : null" @click="$event.currentTarget.querySelector('[mono-native]').focus()">
                <div v-for="id in visible" :key="id" mono-chip mono-removable>
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ nameOf(id) }}</span>
                            <button type="button" mono-chip-close :aria-label="`Remove ${nameOf(id)}`" @click.stop="remove(id)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
                <div v-if="overflow.length" mono-chip mono-more>
                    <span mono-chip-main role="button" tabindex="0" @click.stop="toggleMore()" @keydown.enter.prevent="toggleMore()">
                        <span mono-chip-content>
                            <span mono-chip-label>+{{ overflow.length }} more</span>
                        </span>
                    </span>
                </div>
                <input mono-native type="text" :placeholder="field.selected.length ? undefined : 'Pick frameworks…'" autocomplete="off" v-model="field.draft" @focus="openList()" />
                <div mono-actions>
                    <span mono-arrow role="button" tabindex="-1" aria-label="Toggle suggestions" :aria-expanded="field.open" @click.stop="field.open ? (field.open = false) : openList()"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </div>
            </div>
            <div mono-dropdown role="listbox">
                <button type="button" role="option" mono-item mono-select-all mono-check :mono-selected="allState !== 'none' ? '' : null" :aria-selected="allState === 'all'" @mousedown.prevent @click="toggleAll()">
                    <span mono-check-box mono-checkbox mono-size="sm" :mono-checked="allState === 'all' ? '' : null" :mono-indeterminate="allState === 'some' ? '' : null" aria-hidden="true"><span mono-box></span></span>
                    <div mono-item-text><div mono-item-title>All</div></div>
                </button>
                <button v-for="(o, i) in rows" :key="o.id" type="button" role="option" mono-item mono-check mono-level="0" :mono-active="o.id === field.selected[field.selected.length - 1] ? '' : null" :mono-selected="field.selected.includes(o.id) ? '' : null" :aria-selected="field.selected.includes(o.id)" @mousedown.prevent @click="toggle(o.id)">
                    <span mono-check-box mono-checkbox mono-size="sm" :mono-checked="field.selected.includes(o.id) ? '' : null" aria-hidden="true"><span mono-box></span></span>
                    <div mono-item-text><div mono-item-title>{{ o.name }}</div></div>
                </button>
                <div v-if="!rows.length" mono-empty-row>No items</div>
            </div>
            <div mono-more-panel>
                <div v-for="id in overflow" :key="id" mono-chip mono-removable>
                    <span mono-chip-main>
                        <span mono-chip-content>
                            <span mono-chip-label>{{ nameOf(id) }}</span>
                            <button type="button" mono-chip-close :aria-label="`Remove ${nameOf(id)}`" @click.stop="remove(id)"><span mono-icon class="mono-icon i-mdi-close"></span></button>
                        </span>
                    </span>
                </div>
            </div>
        </div>

        <p style="margin-top: 0.75rem; font-size: 0.82rem; opacity: 0.7;">
            selected: {{ field.selected.length ? field.selected.join(', ') : '—' }}
        </p>
    </div>
</template>
