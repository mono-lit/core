<script setup>
    import '@mono-lit/helper/ui/accordion'
    import { ref } from 'vue'

    const open = ref(false)
</script>

<template>
    <div style="width: 100%;">
        <mono-accordion
            title="What is @mono-lit/helper?"
            :model-value="open"
            @toggle="open = $event.detail.modelValue"
        >
            @mono-lit/helper is a small set of Lit-powered web components designed to work in
            Vue, vanilla HTML, or any framework that runs custom elements.
        </mono-accordion>
    </div>
</template>
