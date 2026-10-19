<script setup>
    import '@mono-lit/helper/ui/otp'
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem;">
        <!-- Plain text: the attribute is enough. -->
        <mono-otp
            label="Verification code"
            tooltip="Codes are valid for 5 minutes. Request a new one if yours has expired."
        ></mono-otp>

        <!-- Full mono-tooltip options as an object. -->
        <mono-otp
            label="Backup code"
            type="alphanumeric"
            length="8"
            groups="4"
            required
            :tooltip.prop="{ content: 'Printed on the recovery sheet you saved when you turned on 2FA.', placement: 'right', color: 'warning' }"
        ></mono-otp>
    </div>
</template>
