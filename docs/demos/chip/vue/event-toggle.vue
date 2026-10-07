<script setup>
    import '@mono-lit/helper/ui/chip'
    import { ref } from 'vue'

    const selected = ref(false)

    function onToggle(event) {
        selected.value = event.detail.modelValue
    }
</script>

<template>
    <div>
        <mono-chip clickable color="primary" :model-value="selected" @click="onToggle">Toggle me</mono-chip>
        <br>
        <br>
        <div class="event-demo-status">{{ selected ? 'selected' : 'unselected' }}</div>
    </div>
</template>
