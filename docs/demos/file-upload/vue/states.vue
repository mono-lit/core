<script setup>
import '@mono-lit/helper/ui/file-upload'
</script>

<template>
    <div style="width: 100%">
        <mono-file-upload
            label="Disabled"
            disabled
            title="Disabled upload"
            subtitle="This uploader is disabled"
        ></mono-file-upload>
        <br>
        <mono-file-upload
            label="Required"
            required
            title="Required upload"
            subtitle="Required field example"
            helper-text="Required indicator shown in label"
        ></mono-file-upload>
    </div>
</template>
