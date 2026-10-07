<script setup>
import '@mono-lit/helper/ui/chip'

const STEPS = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'full']
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center">
        <!-- Unset keeps the pill a chip has always had by default. -->
        <mono-chip color="primary" variant="soft">unset</mono-chip>
        <mono-chip v-for="step in STEPS" :key="step" color="primary" variant="soft" :rounded="step">
            {{ step }}
        </mono-chip>
    </div>
</template>
