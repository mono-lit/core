<script setup>
    import '@mono-lit/helper/ui/otp'
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- numeric (default): digits only, numeric keypad on phones. -->
        <mono-otp label="numeric (default)" helper-text="Letters are ignored."></mono-otp>
        <!-- alphanumeric: letters and digits, letters uppercased. -->
        <mono-otp type="alphanumeric" length="8" groups="4" label="alphanumeric" helper-text="Type ab12cd34 and it becomes AB12CD34."></mono-otp>
        <!-- text: any non-space character. -->
        <mono-otp type="text" length="4" label="text" helper-text="Symbols are accepted too."></mono-otp>
    </div>
</template>
