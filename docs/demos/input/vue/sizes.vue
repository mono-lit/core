<script setup>
import '@mono-lit/helper/ui/input'
</script>

<template>
    <div style="display: grid; gap: 1rem; width: 100%;">
        <mono-input size="xs" label="Extra small" placeholder="Extra small input"></mono-input>
        <mono-input size="sm" label="Small" placeholder="Small input"></mono-input>
        <mono-input size="md" label="Medium" placeholder="Medium input"></mono-input>
        <mono-input size="lg" label="Large" placeholder="Large input"></mono-input>
        <mono-input size="xl" label="Extra large" placeholder="Extra large input"></mono-input>
        <mono-input size="xxl" label="2X large" placeholder="2X large input"></mono-input>
    </div>
</template>
