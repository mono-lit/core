<script setup>
    import '@mono-lit/helper/ui/slider'
    import { ref } from 'vue'

    const levels = ref([2, 2, 3])
    const bands = ref([15, 40, 70, 90])
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- Thumbs may share a value: drag up from the stack to take its top thumb,
             down to take its bottom one. -->
        <mono-slider
            label="Three thumbs, two stacked"
            max="10"
            :model-value.prop="levels"
            @input="levels = $event.detail.modelValue"
        ></mono-slider>

        <mono-slider
            label="Four thumbs"
            :model-value.prop="bands"
            @input="bands = $event.detail.modelValue"
        ></mono-slider>
    </div>
</template>
