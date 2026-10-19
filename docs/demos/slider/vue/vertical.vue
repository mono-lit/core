<script setup>
    import '@mono-lit/helper/ui/slider'
    import { ref } from 'vue'

    const level = ref(60)
    const band = ref([25, 75])
    const db = ref(0)
</script>

<template>
    <div style="width: 100%; display: flex; gap: 3rem">
        <!-- type="vertical": min at the bottom; `height` sets the track length. -->
        <mono-slider
            type="vertical"
            height="180"
            aria-label="Level"
            :model-value.prop="level"
            @input="level = $event.detail.modelValue"
        ></mono-slider>

        <mono-slider
            type="vertical"
            height="180"
            aria-label="Band"
            :model-value.prop="band"
            @input="band = $event.detail.modelValue"
        ></mono-slider>

        <mono-slider
            type="vertical"
            height="180"
            min="-12"
            max="12"
            marks="[-12, 0, 12]"
            format-display="{} dB"
            aria-label="Gain"
            :model-value.prop="db"
            @input="db = $event.detail.modelValue"
        ></mono-slider>
    </div>
</template>
