<script setup>
    import '@mono-lit/helper/ui/chip'
    import { ref } from 'vue'

    const count = ref(0)

    function onClick() {
        count.value += 1
    }
</script>

<template>
    <div>
        <mono-chip clickable color="primary" @click="onClick">Click me</mono-chip>
        <br>
        <br>
        <div class="event-demo-status">clicked {{ count }} times</div>
    </div>
</template>
