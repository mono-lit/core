<script setup>
    import '@mono-lit/helper/ui/textarea'
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 1rem;">
        <mono-textarea label="Fixed 320px" width="320px" placeholder="320px wide" />
        <mono-textarea label="Max-width 480px" max-width="480px" placeholder="caps at 480px" />
        <mono-textarea label="Full width" width="100%" placeholder="fills its container" />
    </div>
</template>
