<script setup>
    import '@mono-lit/helper/ui/switch'
    import { ref } from 'vue'

    const dark = ref(true)
</script>

<template>
    <div>
        <mono-switch
            :model-value="dark"
            @change="dark = $event.detail.modelValue"
        >
            <span slot="label">🌙 Dark mode</span>
            <span slot="sublabel">Switch the interface to a low-light palette.</span>
        </mono-switch>
    </div>
</template>
