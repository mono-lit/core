<script setup>
import '@mono-lit/helper/ui/file-upload'
</script>

<template>
    <div style="display: grid; gap: 1.25rem; width: 100%;">
        <!-- Iconify class via the `icon` prop (+ `remove-icon` for the list). -->
        <mono-file-upload
            label="Iconify icon prop"
            icon="i-mdi-cloud-upload"
            remove-icon="i-mdi-close"
            title="Click or drag file here"
            subtitle="icon = i-mdi-cloud-upload"
            multiple
        ></mono-file-upload>

        <!-- A slot="icon" child overrides the `icon` prop. -->
        <mono-file-upload
            label="Slot icon (overrides the prop)"
            icon="i-mdi-cloud-upload"
            title="Click or drag file here"
            subtitle="slot wins over the icon prop"
        >
            <span slot="icon" class="i-mdi-folder-upload"></span>
        </mono-file-upload>
    </div>
</template>
