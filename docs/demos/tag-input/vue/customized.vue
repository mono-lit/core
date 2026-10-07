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
        <mono-tag-input label="Customized via cssClass" placeholder="Wider, bolder, italic message"
            helper-text="Width, label weight and message style are overridden via the cssClass prop." clearable
            :items.prop="items" key-value="value" display-value="label" :model-value.prop="tags" @change="tags = $event.detail.modelValue" :css-class="{
                root: 'max-w-md',
                label: 'font-bold text-base',
                chip: 'text-sm',
                message: 'italic',
            }"></mono-tag-input>
    </div>
</template>
