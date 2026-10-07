<script setup>
import '@mono-lit/helper/ui/tag-input'
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 1rem;">
        <mono-tag-input label="Fixed 320px" width="320px" placeholder="Add a tag" />
        <mono-tag-input label="Max-width 480px" max-width="480px" placeholder="Add a tag" />
        <mono-tag-input label="Full width" width="100%" placeholder="Add a tag" />
    </div>
</template>
