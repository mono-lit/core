<script setup>
import '@mono-lit/helper/ui/file-upload'
</script>

<template>
    <div style="width: 100%">
        <mono-file-upload
            label="Compact Upload"
            variant="compact"
            title="Upload one file"
            subtitle="Compact dropzone style"
            helper-text="Compact mode"
        ></mono-file-upload>
    </div>
</template>
