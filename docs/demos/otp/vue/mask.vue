<script setup>
    import '@mono-lit/helper/ui/otp'
    import { ref } from 'vue'

    const pin = ref('')
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- mask hides the characters like a password field; the value is still the real code. -->
        <mono-otp
            mask
            length="4"
            label="PIN"
            placeholder="○"
            :model-value="pin"
            @input="pin = $event.detail.modelValue"
        ></mono-otp>
        <DemoReadout>pin = "{{ pin }}"</DemoReadout>
    </div>
</template>
