<script setup>
    import '@mono-lit/helper/ui/textarea'
</script>

<template>
    <div style="display: grid; gap: 1rem; width: 100%;">
        <mono-textarea
            label="Valid"
            model-value="Looks good to me."
            validation-state="valid"
            validation-message="Looks good."
        ></mono-textarea>
        <mono-textarea
            label="Invalid"
            model-value="too short"
            validation-state="invalid"
            validation-message="Please write at least 20 characters."
        ></mono-textarea>
        <mono-textarea
            label="Warning"
            model-value="Quick draft"
            validation-state="warning"
            validation-message="Drafts may be reviewed before publishing."
        ></mono-textarea>
    </div>
</template>
