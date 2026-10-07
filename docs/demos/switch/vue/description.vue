<script setup>
    import '@mono-lit/helper/ui/switch'
    import { ref } from 'vue'

    const marketing = ref(false)
    const updates = ref(true)
</script>

<template>
    <div style="display: grid; gap: 0.75rem;">
        <mono-switch
            label="Marketing emails"
            sublabel="Promos, newsletters and product updates from us."
            :model-value="marketing"
            @change="marketing = $event.detail.modelValue"
        ></mono-switch>
        <mono-switch
            label="Security alerts"
            sublabel="Sign-ins from new devices and suspicious activity."
            :model-value="updates"
            @change="updates = $event.detail.modelValue"
        ></mono-switch>
    </div>
</template>
