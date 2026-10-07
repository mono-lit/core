<script setup>
    import '@mono-lit/helper/ui/switch'
    import { ref } from 'vue'

    const enabled = ref(false)
</script>

<template>
    <div>
        <mono-switch
            label="Email notifications"
            :model-value.prop="enabled"
            @change="enabled = $event.detail.modelValue"
        ></mono-switch>
    </div>
</template>
