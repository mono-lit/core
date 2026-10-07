<script setup>
    import '@mono-lit/helper/ui/card'
    import { ref, computed } from 'vue'

    const active = ref(false)

    const variant = computed(() => (active.value ? 'tonal' : 'elevated'))

    function onToggle() {
        active.value = !active.value
    }
</script>

<template>
    <div style="width: 100%;">
        <mono-card clickable :variant="variant" @click="onToggle">
            <h3 slot="title">Toggle me</h3>
            <p>Click to switch between elevated and tonal variants.</p>
        </mono-card>
        <br>
        <br>
        <div class="event-demo-status">{{ variant }}</div>
    </div>
</template>
