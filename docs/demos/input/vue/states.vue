<script setup>
import '@mono-lit/helper/ui/input'
</script>

<template>
    <div style="display: grid; gap: 1rem; width: 100%;">
        <mono-input
            label="Disabled"
            placeholder="Cannot focus or type"
            model-value="Disabled value"
            disabled
        ></mono-input>
        <mono-input
            label="Readonly"
            placeholder="Focus allowed, but read-only"
            model-value="Readonly value"
            readonly
        ></mono-input>
        <mono-input
            label="Required"
            placeholder="This field is required"
            helper-text="The asterisk indicates a required field."
            required
        ></mono-input>
    </div>
</template>
