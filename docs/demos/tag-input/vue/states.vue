<script setup>
import '@mono-lit/helper/ui/tag-input'
import { ref } from 'vue'
    const items = ref([
    { label: 'Vue', value: 'vue', description: 'Vue framework' },
    { label: 'Lit', value: 'lit', description: 'Lit web components' },
    { label: 'React', value: 'react' },
    { label: 'Angular', value: 'angular' },
    { label: 'Svelte', value: 'svelte' },
])

const tags = ref(['vue', 'lit'])
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1rem;">
        <mono-tag-input
            label="Disabled"
            placeholder="Cannot edit"
            :items.prop="items"
            key-value="value"
            display-value="label"
            :model-value.prop="tags"
            clearable
            disabled
        ></mono-tag-input>
        <mono-tag-input
            label="Readonly"
            placeholder="Display only"
            :items.prop="items"
            key-value="value"
            display-value="label"
            :model-value.prop="tags"
            clearable
            readonly
        ></mono-tag-input>
        <mono-tag-input
            label="Required"
            placeholder="Add at least one tag"
            helper-text="The asterisk indicates a required field."
            required
            :items.prop="items"
            key-value="value"
            display-value="label"
            :model-value.prop="tags"
        ></mono-tag-input>
    </div>
</template>
