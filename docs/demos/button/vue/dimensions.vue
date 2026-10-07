<script setup>
import '@mono-lit/helper/ui/button'
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.6rem; width: 100%;">
        <mono-button color="primary" width="220px">Fixed 220px</mono-button>
        <mono-button color="primary" width="100%">Full width — width="100%"</mono-button>
        <mono-button color="success" min-width="80px">Min-width 80px</mono-button>
    </div>
</template>
