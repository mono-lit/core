<script setup>
    import '@mono-lit/helper/ui/otp'

    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.25rem">
        <!-- Each box is a square at the shared control height of its size. -->
        <mono-otp v-for="s in sizes" :key="s" :size="s" length="4" :label="s" model-value="12"></mono-otp>
    </div>
</template>
