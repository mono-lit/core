<script setup>
import '@mono-lit/helper/ui/file-upload'
</script>

<template>
    <div style="width: 100%">
        <mono-file-upload
            label="Limited Files"
            multiple
            max-files="3"
            max-file-size="2097152"
            title="Upload up to 3 files"
            subtitle="Max 3 files · 2MB each"
            helper-text="Try uploading too many files or an oversized file"
        ></mono-file-upload>
    </div>
</template>
