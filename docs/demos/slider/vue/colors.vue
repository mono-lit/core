<script setup>
    import '@mono-lit/helper/ui/slider'

    const colors = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'teal', 'purple', 'neutral', 'dark']
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- `color` paints the fill, the thumb and its focus halo. -->
        <mono-slider
            v-for="(color, i) in colors"
            :key="color"
            :color="color"
            :label="color"
            :show-value="false"
            :model-value.prop="[10 + i * 3, 55 + i * 4]"
        ></mono-slider>
    </div>
</template>
