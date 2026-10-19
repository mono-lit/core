<script setup>
    import '@mono-lit/helper/ui/slider'
    import { ref } from 'vue'

    const auto = ref([30, 60])
    const always = ref([30, 60])
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- value-tooltip: auto (hover, focus, drag) / always / never. -->
        <mono-slider
            label="value-tooltip=&quot;auto&quot; — hover or drag a thumb"
            :show-value="false"
            :model-value.prop="auto"
            @input="auto = $event.detail.modelValue"
        ></mono-slider>

        <mono-slider
            label="value-tooltip=&quot;always&quot;"
            value-tooltip="always"
            :show-value="false"
            :model-value.prop="always"
            @input="always = $event.detail.modelValue"
        ></mono-slider>
    </div>
</template>
