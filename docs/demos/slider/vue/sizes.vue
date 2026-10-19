<script setup>
    import '@mono-lit/helper/ui/slider'

    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- `size` scales the track and thumb on the flavor's own geometry. -->
        <mono-slider
            v-for="(size, i) in sizes"
            :key="size"
            :size="size"
            :label="size"
            :model-value.prop="[10 + i * 5, 60 + i * 5]"
        ></mono-slider>
    </div>
</template>
