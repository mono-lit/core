<script setup>
import '@mono-lit/helper/ui/file-upload'
</script>

<template>
    <div style="width: 100%">
        <mono-file-upload
            label="Customized via cssClass"
            title="Drop a wide file here"
            subtitle="Uses utility classes per element"
            helper-text="Width, padding and weight are overridden per element."
            :css-class="{ 
                root: 'max-full',
                label: 'font-bold text-base',
                dropzone: 'p-9',  
                title: 'text-lg',
                message: 'italic',
            }"
        ></mono-file-upload>
    </div>
</template>
