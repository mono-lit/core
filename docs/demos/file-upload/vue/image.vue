<script setup>
import '@mono-lit/helper/ui/file-upload'
</script>

<template>
    <div style="width: 100%">
        <mono-file-upload
            label="Gallery Images"
            accept="image/*"
            multiple
            title="Upload multiple images"
            subtitle="Multiple image upload"
            helper-text="Image previews are generated automatically"
        ></mono-file-upload>
    </div>
</template>
