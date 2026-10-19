<script setup>
    import '@mono-lit/helper/ui/slider'
    import { ref } from 'vue'

    const budget = ref([2000000, 7500000])
    const share = ref(80)
    const size = ref(512)

    // A function gets the raw value as text and returns the finished label.
    const bytes = ({ value }) => (Number(value) >= 1024 ? Number(value) / 1024 + ' GB' : value + ' MB')
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- format-display shapes the readout, bubbles, mark labels and aria-valuetext.
             The model stays a plain number. -->
        <mono-slider
            label="Budget"
            min="0"
            max="10000000"
            step="250000"
            format-display='"Rp "#,##0'
            format-locale="id-ID"
            :model-value.prop="budget"
            @input="budget = $event.detail.modelValue"
        ></mono-slider>

        <mono-slider
            label="Minimum achievement"
            format-display="{}%"
            :model-value.prop="share"
            @input="share = $event.detail.modelValue"
        ></mono-slider>

        <mono-slider
            label="Disk quota"
            stops="[128, 256, 512, 1024, 2048, 4096]"
            marks
            :format-display.prop="bytes"
            :model-value.prop="size"
            @input="size = $event.detail.modelValue"
        ></mono-slider>
    </div>
</template>
