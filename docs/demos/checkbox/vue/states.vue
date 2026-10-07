<script setup>
import '@mono-lit/helper/ui/checkbox'
</script>

<template>
    <div>
        <mono-checkbox disabled label="Disabled checkbox" />
        <br>
        <mono-checkbox disabled model-value label="Disabled checked" />
        <br>
        <mono-checkbox indeterminate label="Indeterminate state" />
        <br>
        <mono-checkbox model-value label="Initially checked" />
    </div>
</template>