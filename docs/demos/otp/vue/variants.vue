<script setup>
    import '@mono-lit/helper/ui/otp'
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <mono-otp variant="outlined" groups="3" label="outlined (default)" model-value="123"></mono-otp>
        <mono-otp variant="filled" groups="3" label="filled" model-value="123"></mono-otp>
        <mono-otp variant="underlined" groups="3" label="underlined" model-value="123"></mono-otp>
    </div>
</template>
