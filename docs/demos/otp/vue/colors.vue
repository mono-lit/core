<script setup>
    import '@mono-lit/helper/ui/otp'

    const colors = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'teal', 'purple', 'neutral', 'dark']
</script>

<template>
    <!-- color is the FOCUS colour: click into a field to see it. -->
    <div style="width: 100%; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem">
        <mono-otp v-for="c in colors" :key="c" :color="c" length="4" size="sm" :label="c"></mono-otp>
    </div>
</template>
