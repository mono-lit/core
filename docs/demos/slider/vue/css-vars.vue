<script setup>
    import '@mono-lit/helper/ui/slider'
    import { ref } from 'vue'

    const a = ref([25, 65])
    const b = ref(50)
</script>

<template>
    <!-- Knobs set on a wrapper cascade into every slider inside (and through the shadow boundary). -->
    <div style="width: 100%; display: grid; gap: 1.5rem; --mono-slider-accent: #7c3aed; --mono-slider-track-height: 8px; --mono-slider-thumb-size: 20px;">
        <mono-slider
            label="Accent, track and thumb from the wrapper"
            :model-value.prop="a"
            @input="a = $event.detail.modelValue"
        ></mono-slider>

        <!-- Inline knobs on one element override the wrapper. -->
        <mono-slider
            label="Square thumb, teal, no track rounding"
            style="--mono-slider-accent: #0d9488; --mono-slider-thumb-radius: 4px; --mono-slider-track-radius: 0px;"
            :model-value.prop="b"
            @input="b = $event.detail.modelValue"
        ></mono-slider>
    </div>
</template>
