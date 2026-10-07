<script setup>
import '@mono-lit/helper/ui/tag-input'
    import { ref } from 'vue'

    const tags = ref(['vue'])

   const items = ref([
    { label: 'Vue', value: 'vue', description: 'Vue framework' },
    { label: 'Lit', value: 'lit', description: 'Lit web components' },
    { label: 'React', value: 'react' },
    { label: 'Angular', value: 'angular' },
    { label: 'Svelte', value: 'svelte' },
])
</script>

<template>
    <div style="width: 100%;">
        <mono-tag-input
            label="Frameworks"
            placeholder="Type to filter, Enter to add"
            helper-text="Start typing to see suggestions; Backspace removes the last tag."
            :model-value.prop="tags"
            :items.prop="items"
            key-value="value"
            display-value="label"
            @change="tags = $event.detail.modelValue"
        ></mono-tag-input>
    </div>
</template>
