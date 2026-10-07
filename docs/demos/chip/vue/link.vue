<script setup>
import '@mono-lit/helper/ui/chip'
</script>

<template>
    <div>
        <mono-chip href="https://example.com" target="_blank" color="primary">External Link</mono-chip>
        <br>
        <mono-chip href="/dashboard" target="_blank" color="success">Dashboard</mono-chip>
        <br>
        <mono-chip href="/profile" target="_blank" color="info">Profile</mono-chip>
    </div>
</template>
