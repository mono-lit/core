<script setup>
import '@mono-lit/helper/ui/tag-input'
import { ref, computed } from 'vue'

// `max` / `min` cap what the USER can do — nothing is disabled. Past `max` a
// pick simply does not land (the row stays clickable, a typed tag is dropped);
// at `min` the chips lose their ✕, a deselect is rejected and the clear button
// hides. Both are optional; a `model-value` pushed in is never trimmed.
const items = ref([
    { label: 'Vue', value: 'vue', description: 'Vue framework' },
    { label: 'Lit', value: 'lit', description: 'Lit web components' },
    { label: 'React', value: 'react' },
    { label: 'Angular', value: 'angular' },
    { label: 'Svelte', value: 'svelte' },
    { label: 'Solid', value: 'solid' },
])

const capped = ref(['vue', 'lit'])
const remaining = computed(() => Math.max(0, 4 - capped.value.length))

const floored = ref(['vue', 'lit', 'react'])

// The same two limits through the `chip` object — handy when the chip config
// already lives in one place. `chip.max` / `chip.min` pin over the attributes.
const chipLimits = ref(['vue', 'lit'])
const chip = { min: 1, max: 3, shape: 'rounded' }
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1rem;">
        <mono-tag-input label="At most 4 (max)" placeholder="Add a tag" clearable
            :items.prop="items" key-value="value" display-value="label" :max="4"
            :helper-text="`${remaining} tag${remaining === 1 ? '' : 's'} remaining — the 5th pick is rejected, not disabled.`"
            :model-value.prop="capped" @change="capped = $event.detail.modelValue"></mono-tag-input>

        <mono-tag-input label="At least 2 (min)" placeholder="Add a tag" clearable
            :items.prop="items" key-value="value" display-value="label" :min="2"
            helper-text="Remove down to two: the last two lose their ✕ and the clear button hides."
            :model-value.prop="floored" @change="floored = $event.detail.modelValue"></mono-tag-input>

        <mono-tag-input label="1 to 3 via chip.min / chip.max" placeholder="Add a tag" clearable
            :items.prop="items" key-value="value" display-value="label" :chip.prop="chip"
            helper-text="chip: { min: 1, max: 3 } — the same limits, set on the chip object."
            :model-value.prop="chipLimits" @change="chipLimits = $event.detail.modelValue"></mono-tag-input>
    </div>
</template>
