<script setup>
import '@mono-lit/helper/ui/input'
</script>

<template>
    <div style="display: grid; gap: 1rem; width: 100%;">
        <mono-input label="Search" placeholder="Find a project">
            <span slot="prefix">🔍</span>
        </mono-input>
        <mono-input label="Website" placeholder="example">
            <span slot="prefix">https://</span>
            <span slot="suffix">.com</span>
        </mono-input>
        <mono-input type="number" label="Price" placeholder="0.00">
            <span slot="prefix">$</span>
            <span slot="suffix">USD</span>
        </mono-input>
    </div>
</template>
