<script setup>
    import '@mono-lit/helper/ui/slider'
    import { ref } from 'vue'

    const hours = ref([9, 17])
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- min-gap: the thumbs stop this far apart. Here a shift is never shorter than 4 hours. -->
        <mono-slider
            label="Shift"
            min="0"
            max="24"
            min-gap="4"
            format-display="{}:00"
            helper-text="At least 4 hours between start and end."
            :model-value.prop="hours"
            @input="hours = $event.detail.modelValue"
        ></mono-slider>
    </div>
</template>
