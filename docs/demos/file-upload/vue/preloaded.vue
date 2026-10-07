<script setup>
    import '@mono-lit/helper/ui/file-upload'
    import { ref } from 'vue'

    // `.prop` binds the ARRAY as a property (it has no attribute form), and it
    // lands whenever the element renders — an onMounted assignment would miss the
    // Shadow tab, whose element is not upgraded yet at that point.
    const files = ref([
        { id: 'design.pdf', name: 'design-spec.pdf', size: 142336, type: 'application/pdf' },
        { id: 'photo.png', name: 'reference-photo.png', size: 482301, type: 'image/png' },
    ])
</script>

<template>
    <div style="width: 100%">
        <mono-file-upload
            :model-value.prop="files"
            label="Existing Attachments"
            title="Add more files"
            subtitle="Preloaded file list"
            helper-text="Model value injected from JavaScript"
            @change="files = $event.detail.modelValue"
            @remove="files = $event.detail.modelValue"
        ></mono-file-upload>
    </div>
</template>
