<script setup>
    import '@mono-lit/helper/ui/slider'
    import { ref } from 'vue'

    const discount = ref(25)
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- stops: the thumb can only land on these values, however unevenly they are spaced.
             `marks` with no value puts a tick on every stop. -->
        <mono-slider
            label="Discount"
            stops="[0, 5, 10, 25, 50, 100]"
            marks
            format-display="{}%"
            :model-value.prop="discount"
            @input="discount = $event.detail.modelValue"
        ></mono-slider>
    </div>
</template>
