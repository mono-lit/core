<script setup>
import { reactive, onMounted, onUnmounted } from 'vue'

const options = [
    { value: 'espresso', label: 'Espresso' },
    { value: 'latte', label: 'Latte' },
    { value: 'mocha', label: 'Mocha' },
]
const fields = reactive({ drink: { open: false, value: null } })
const labelOf = (value) => options.find((o) => o.value === value)?.label ?? ''

function pick(field, option) {
    if (option.disabled) return
    field.value = option.value
    field.open = false
}
function clear(field) {
    field.value = null
}
// an outside click closes an open panel, like the element does
function onDocumentClick(event) {
    if (event.target.closest('[mono-select]')) return
    for (const f of Object.values(fields)) f.open = false
}
onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
    <div style="width: 100%;">
        <!-- `class` is free for your own utilities: the parts are styled by attribute. -->
        <div mono-select mono-clearable class="max-w-md" :mono-open="fields.drink.open ? '' : null">
            <label mono-label class="font-bold text-base">Customized via class names</label>
            <button type="button" mono-trigger aria-haspopup="listbox" :aria-expanded="fields.drink.open" @click="fields.drink.open = !fields.drink.open">
                <span v-if="fields.drink.value" mono-value class="text-base"><span>{{ labelOf(fields.drink.value) }}</span></span>
                <span v-else mono-value mono-placeholder class="text-base">Wider, bolder, italic message</span>
                <span mono-actions>
                    <!-- ✕ alone while there is a value to clear, the chevron otherwise -->
                    <span v-if="fields.drink.value" mono-clear role="button" tabindex="-1" aria-label="Clear select" @click.stop="clear(fields.drink)"><span mono-icon class="mono-icon i-mdi-close"></span></span>
                    <span v-else mono-arrow role="button" tabindex="-1" aria-label="Toggle options"><span mono-icon class="mono-icon i-mdi-chevron-down"></span></span>
                </span>
            </button>
            <div mono-dropdown role="listbox">
                <div mono-dropdown-body>
                    <!-- opening highlights the first row, like the element's keyboard cursor -->
                    <button v-for="(o, i) in options" :key="o.value" type="button" role="option" mono-item :mono-active="fields.drink.open && i === 0 ? '' : null" :mono-selected="fields.drink.value === o.value ? '' : null" :mono-disabled="o.disabled ? '' : null" :aria-selected="fields.drink.value === o.value" :disabled="o.disabled" @click="pick(fields.drink, o)">{{ o.label }}</button>
                </div>
            </div>
            <div mono-message-wrap>
                <div mono-message="helper" class="italic">Width, label weight, value font and message style are overridden by composing utility classes onto the root markup.</div>
            </div>
        </div>
    </div>
</template>
