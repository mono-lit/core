<script setup>
    import '@mono-lit/helper/ui/slider'
    import { ref } from 'vue'

    const temp = ref([18, 24])
    const marks = [
        { value: 10, label: 'Cold' },
        18,
        { value: 21, label: 'Comfort' },
        24,
        { value: 30, label: 'Hot' },
    ]
    const step = ref(40)
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- A list of values and { value, label } pairs: a label under each, falling back
             to the formatted value. -->
        <mono-slider
            label="Thermostat"
            min="10"
            max="30"
            format-display="{}°"
            :marks.prop="marks"
            :model-value.prop="temp"
            @input="temp = $event.detail.modelValue"
        ></mono-slider>

        <!-- `marks` alone: a tick at every step, no labels. -->
        <mono-slider
            label="Every 10"
            step="10"
            marks
            :model-value.prop="step"
            @input="step = $event.detail.modelValue"
        ></mono-slider>
    </div>
</template>
