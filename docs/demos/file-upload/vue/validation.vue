<script setup>
import '@mono-lit/helper/ui/file-upload'
</script>

<template>
    <div style="width: 100%">
        <mono-file-upload
            label="Valid"
            validation-state="valid"
            validation-message="File requirements are valid"
            title="Upload valid file"
            subtitle="Looks good"
        ></mono-file-upload>
        <br>
        <mono-file-upload
            label="Invalid"
            validation-state="invalid"
            validation-message="This field is required"
            title="Upload required file"
            subtitle="Validation error state"
        ></mono-file-upload>
        <br>
        <mono-file-upload
            label="Warning"
            validation-state="warning"
            validation-message="Please double-check uploaded file"
            title="Upload warning file"
            subtitle="Warning state"
        ></mono-file-upload>
    </div>
</template>
