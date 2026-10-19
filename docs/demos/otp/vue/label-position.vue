<script setup>
    import '@mono-lit/helper/ui/otp'
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <mono-otp label-position="top" label="Top (default)" length="4"></mono-otp>
        <!-- The side label centres on the row of boxes; --mono-otp-label-width sets its column. -->
        <mono-otp label-position="left" label="Left" length="4" helper-text="Messages stay under the boxes." style="--mono-otp-label-width: 6rem"></mono-otp>
        <mono-otp label-position="right" label="Right" length="4" style="--mono-otp-label-width: 6rem"></mono-otp>
        <!-- notched has no single box to cut into, so it renders as top. -->
        <mono-otp label-position="notched" label="Notched renders as top" length="4"></mono-otp>
    </div>
</template>
