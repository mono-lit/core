<script setup>
import '@mono-lit/helper/ui/tag-input'
import { ref } from 'vue'

const tags = ref(['vue', 'lit'])


const items = ref([
    { label: 'Vue', value: 'vue', description: 'Vue framework' },
    { label: 'Lit', value: 'lit', description: 'Lit web components' },
    { label: 'React', value: 'react' },
    { label: 'Angular', value: 'angular' },
    { label: 'Svelte', value: 'svelte' },
])
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1rem;">
        <mono-tag-input size="xs" label="Extra small" placeholder="Add tag" :model-value.prop="tags"
            :items.prop="items" key-value="value" display-value="label"></mono-tag-input>
        <mono-tag-input size="sm" label="Small" placeholder="Add tag" :model-value.prop="tags"
            :items.prop="items" key-value="value" display-value="label"></mono-tag-input>
        <mono-tag-input size="md" label="Medium" placeholder="Add tag" :model-value.prop="tags"
            :items.prop="items" key-value="value" display-value="label"></mono-tag-input>
        <mono-tag-input size="lg" label="Large" placeholder="Add tag" :model-value.prop="tags"
            :items.prop="items" key-value="value" display-value="label"></mono-tag-input>
        <mono-tag-input size="xl" label="Extra large" placeholder="Add tag" :model-value.prop="tags"
            :items.prop="items" key-value="value" display-value="label"></mono-tag-input>
        <mono-tag-input size="xxl" label="2X large" placeholder="Add tag" :model-value.prop="tags"
            :items.prop="items" key-value="value" display-value="label"></mono-tag-input>
    </div>
</template>
