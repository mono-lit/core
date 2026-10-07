<script setup>
import '@mono-lit/helper/ui/file-upload'
</script>

<template>
    <div style="width: 100%">
        <mono-file-upload

            label="Supporting Document"
            title="Click or drag file here"
            subtitle="PDF, DOCX, XLSX"
            helper-text="Single file upload"
        ></mono-file-upload>
    </div>
</template>
