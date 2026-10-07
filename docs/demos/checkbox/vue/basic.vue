<script setup>
import '@mono-lit/helper/ui/checkbox'
</script>

<template>
    <div>
        <h3>Default CSS Icon</h3>

        <mono-checkbox />
        <br>

        <mono-checkbox label="Accept terms" />
        <br>

        <mono-checkbox label="Accept terms and conditions" sublabel="I agree to terms of service" />

        <br>
        <br>

        <h3>Custom SVG Icon</h3>

        <mono-checkbox model-value="true" label="Custom checked icon"
            sublabel="This checkbox uses a custom SVG instead of the default CSS icon.">
            <svg slot="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8.5 11.5L11 14l4-4m6 2a9 9 0 1 1-18 0a9 9 0 0 1 18 0" />
            </svg>
        </mono-checkbox>
    </div>
</template>