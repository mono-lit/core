<script setup>
    import '@mono-lit/helper/ui/textarea'
</script>

<template>
    <div style="display: grid; gap: 1rem; width: 100%;">
        <mono-textarea
            label="Disabled"
            placeholder="Cannot focus or type"
            model-value="Disabled value"
            disabled
        ></mono-textarea>
        <mono-textarea
            label="Readonly"
            placeholder="Focus allowed, but read-only"
            model-value="Readonly value"
            readonly
        ></mono-textarea>
        <mono-textarea
            label="Required"
            placeholder="This field is required"
            helper-text="The asterisk indicates a required field."
            required
        ></mono-textarea>
    </div>
</template>
