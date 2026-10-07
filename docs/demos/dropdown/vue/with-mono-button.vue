<script setup>
import '@mono-lit/helper/ui/dropdown'
import '@mono-lit/helper/ui/button'
</script>

<template>
    <div style="padding: 4rem 1rem; display: flex; justify-content: center;">
        <mono-dropdown placement="bottom-start" color="primary">
            <mono-button slot="main" color="primary">Open menu</mono-button>
            <div slot="body">
                The activator above is a real <code>&lt;mono-button&gt;</code>. Clicking
                it toggles the dropdown — no extra wiring needed.
            </div>
        </mono-dropdown>
    </div>
</template>
