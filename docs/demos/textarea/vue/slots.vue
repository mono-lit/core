<script setup>
    import '@mono-lit/helper/ui/textarea'
    import { ref } from 'vue'

    const value = ref('')
</script>

<template>
    <div style="width: 100%">
        <mono-textarea
            placeholder="Drop your release notes here"
            :model-value="value"
            @input="value = $event.detail.modelValue"
        >
            <span slot="label">📝 Release notes</span>
            <span slot="helper">Markdown is supported. Pasted images are uploaded automatically.</span>
        </mono-textarea>
    </div>
</template>
