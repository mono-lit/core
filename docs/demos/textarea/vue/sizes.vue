<script setup>
    import '@mono-lit/helper/ui/textarea'
</script>

<template>
    <div style="display: grid; gap: 1rem; width: 100%;">
        <mono-textarea size="xs" label="Extra small" placeholder="Extra small textarea"></mono-textarea>
        <mono-textarea size="sm" label="Small" placeholder="Small textarea"></mono-textarea>
        <mono-textarea size="md" label="Medium" placeholder="Medium textarea"></mono-textarea>
        <mono-textarea size="lg" label="Large" placeholder="Large textarea"></mono-textarea>
        <mono-textarea size="xl" label="Extra large" placeholder="Extra large textarea"></mono-textarea>
        <mono-textarea size="xxl" label="2X large" placeholder="2X large textarea"></mono-textarea>
    </div>
</template>
