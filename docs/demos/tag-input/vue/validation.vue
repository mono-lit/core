<script setup>
import '@mono-lit/helper/ui/tag-input'
import { ref } from 'vue'
const valid = ref(['vue', 'lit'])
const invalid = ref([])
const warning = ref(['svelte'])


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
        <mono-tag-input label="Valid" :model-value.prop="valid" :items.prop="items" key-value="value" display-value="label" validation-state="valid"
            validation-message="Looks good."></mono-tag-input>
        <mono-tag-input label="Invalid" placeholder="Add at least one tag" :model-value.prop="invalid" :items.prop="items" key-value="value" display-value="label"
            validation-state="invalid" validation-message="At least one tag is required."></mono-tag-input>
        <mono-tag-input label="Warning" :model-value.prop="warning" :items.prop="items" key-value="value" display-value="label" validation-state="warning"
            validation-message="Add at least three tags for better matching."></mono-tag-input>
    </div>
</template>
