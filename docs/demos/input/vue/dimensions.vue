<script setup>
import '@mono-lit/helper/ui/input'
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 1rem;">
        <mono-input label="Fixed 260px" width="260px" placeholder="260px wide" />
        <mono-input label="Max-width 360px" max-width="360px" placeholder="caps at 360px" />
        <mono-input label="Full width" width="100%" placeholder="fills its container" />
    </div>
</template>
