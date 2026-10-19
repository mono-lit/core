<script setup>
    import '@mono-lit/helper/ui/otp'
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <mono-otp label="Disabled" disabled model-value="123" helper-text="Not editable right now."></mono-otp>
        <mono-otp label="Readonly" readonly model-value="482913" helper-text="Focusable, but the code never changes."></mono-otp>
        <mono-otp label="Required" required></mono-otp>
        <mono-otp label="Invalid" validation-state="invalid" validation-message="That code is wrong. Try again." model-value="000000"></mono-otp>
        <mono-otp label="Warning" validation-state="warning" validation-message="This code expires in 30 seconds." model-value="52"></mono-otp>
        <mono-otp label="Valid" success-message="Code verified." model-value="482913"></mono-otp>
    </div>
</template>
