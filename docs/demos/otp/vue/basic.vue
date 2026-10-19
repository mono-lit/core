<script setup>
    import '@mono-lit/helper/ui/otp'
    import { ref } from 'vue'

    const code = ref('')
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- Six boxes that act as one field: typing moves on, Backspace steps back, a paste fills them all. -->
        <mono-otp
            label="Verification code"
            helper-text="Enter the 6-digit code we sent to your phone."
            clearable
            :model-value="code"
            @input="code = $event.detail.modelValue"
        ></mono-otp>
        <DemoReadout>code = "{{ code }}"</DemoReadout>
    </div>
</template>
