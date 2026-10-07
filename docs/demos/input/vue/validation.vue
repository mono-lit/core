<script setup>
import '@mono-lit/helper/ui/input'
</script>

<template>
    <div style="display: grid; gap: 1rem; width: 100%;">
        <mono-input
            label="Valid"
            model-value="hello@example.com"
            validation-state="valid"
            validation-message="Looks good."
        ></mono-input>
        <mono-input
            label="Invalid"
            model-value="not-an-email"
            validation-state="invalid"
            validation-message="Please enter a valid email address."
        ></mono-input>
        <mono-input
            label="Warning"
            model-value="abc"
            validation-state="warning"
            validation-message="Short values are easy to guess."
        ></mono-input>
    </div>
</template>
