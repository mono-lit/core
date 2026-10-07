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
    <div style="width: 100%;">
        <mono-tag-input
            placeholder="Add a label"
            :model-value.prop="tags"
            @change="tags = $event.detail.modelValue"
            :items.prop="items"
            key-value="value"
            display-value="label"
        >
            <span slot="label">🏷️ Issue labels</span>
            <span slot="helper">Used by triage to route incoming issues.</span>
        </mono-tag-input>
    </div>
</template>
