<script setup>
    import '@mono-lit/helper/ui/slider'
    import { ref } from 'vue'

    const start = ref(40)
    const end = ref(40)
    const none = ref([20, 50, 80])
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- fill: auto (default) fills min → thumb, or between thumbs; start / end / none. -->
        <mono-slider
            label="fill=&quot;start&quot;"
            fill="start"
            :model-value.prop="start"
            @input="start = $event.detail.modelValue"
        ></mono-slider>

        <mono-slider
            label="fill=&quot;end&quot;"
            fill="end"
            :model-value.prop="end"
            @input="end = $event.detail.modelValue"
        ></mono-slider>

        <mono-slider
            label="fill=&quot;none&quot;"
            fill="none"
            :model-value.prop="none"
            @input="none = $event.detail.modelValue"
        ></mono-slider>
    </div>
</template>
