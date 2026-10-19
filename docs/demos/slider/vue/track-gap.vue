<script setup>
    import '@mono-lit/helper/ui/slider'
    import { ref } from 'vue'

    const one = ref(55)
    const two = ref([25, 70])
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- track-gap: px of empty track around each thumb (Material 3's slider). -->
        <mono-slider
            label="Single, 4px gap"
            track-gap="4"
            :model-value.prop="one"
            @input="one = $event.detail.modelValue"
        ></mono-slider>

        <mono-slider
            label="Range, 6px gap"
            track-gap="6"
            :model-value.prop="two"
            @input="two = $event.detail.modelValue"
        ></mono-slider>
    </div>
</template>
