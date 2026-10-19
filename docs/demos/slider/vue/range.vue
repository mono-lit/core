<script setup>
    import '@mono-lit/helper/ui/slider'
    import { ref } from 'vue'

    const price = ref([20, 80])
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- An array = one thumb per entry. The span between them fills, and dragging the
             filled span moves both thumbs together. Thumbs block each other: they never cross. -->
        <mono-slider
            label="Price range"
            :model-value.prop="price"
            @input="price = $event.detail.modelValue"
        ></mono-slider>
    </div>
</template>
