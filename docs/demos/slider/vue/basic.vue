<script setup>
    import '@mono-lit/helper/ui/slider'
    import { ref } from 'vue'

    const volume = ref(40)
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- One number = one thumb. The value is always on screen at the end of the label row. -->
        <mono-slider
            label="Volume"
            helper-text="Drag, click the track, or use the arrow keys."
            :model-value.prop="volume"
            @input="volume = $event.detail.modelValue"
        ></mono-slider>
    </div>
</template>
