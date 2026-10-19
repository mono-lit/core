<script setup>
    import '@mono-lit/helper/ui/otp'
</script>

<template>
    <!-- Knobs set on a wrapper cascade into every code field inside (and through the shadow boundary). -->
    <div style="width: 100%; display: grid; gap: 1.5rem; --mono-otp-radius: 9999px; --mono-otp-gap: 0.75rem;">
        <mono-otp label="Round boxes, wider gap" length="4" model-value="42"></mono-otp>

        <!-- Inline knobs on one element override the wrapper. -->
        <mono-otp
            label="Wide boxes, purple focus, big type"
            groups="3"
            style="--mono-otp-radius: 4px; --mono-otp-cell-width: 3.25rem; --mono-otp-cell-size-md: 3.5rem; --mono-otp-font-md: 1.5rem; --mono-otp-ring-color: #7c3aed; --mono-otp-separator-color: #7c3aed;"
        ></mono-otp>

        <!-- Joined boxes: no gap, only the outer corners rounded. -->
        <mono-otp label="Joined" length="6" class="example-otp-joined" style="--mono-otp-gap: 0px;"></mono-otp>
    </div>
</template>

<style>
    .example-otp-joined [mono-otp-cell] {
        border-radius: 0;
        margin-inline-start: -1px;
    }
    .example-otp-joined [mono-otp-cell]:first-child {
        border-start-start-radius: var(--mono-radius-md);
        border-end-start-radius: var(--mono-radius-md);
        margin-inline-start: 0;
    }
    .example-otp-joined [mono-otp-cell]:last-child {
        border-start-end-radius: var(--mono-radius-md);
        border-end-end-radius: var(--mono-radius-md);
    }
    .example-otp-joined [mono-otp-cell]:focus {
        position: relative;
        z-index: 1;
    }
</style>
