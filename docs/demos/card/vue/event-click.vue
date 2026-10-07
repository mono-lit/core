<script setup>
    import '@mono-lit/helper/ui/card'
    import { ref } from 'vue'

    const count = ref(0)

    function onClick() {
        count.value += 1
    }
</script>

<template>
    <div style="width: 100%;">
        <mono-card clickable @click="onClick">
            <h3 slot="title">Click me</h3>
            <p>Each click increments the counter.</p>
        </mono-card>
        <br>
        <br>
        <div class="event-demo-status">clicked {{ count }} times</div>
    </div>
</template>
