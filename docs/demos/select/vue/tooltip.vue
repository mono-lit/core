<script setup>
    import '@mono-lit/helper/ui/select'
    import { ref } from 'vue'

    const priority = ref(null)

    const items = [
        { label: 'Low', value: 'low' },
        { label: 'Normal', value: 'normal' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' },
    ]
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1rem;">
        <mono-select
            label="Priority"
            placeholder="Pick one"
            helper-text="How soon this needs attention."
            tooltip="Urgent tickets page the on-call engineer immediately. Use High for anything that can wait until morning."
            :items.prop="items"
            key-value="value"
            display-value="label"
            :model-value="priority"
            @change="priority = $event.detail.modelValue"
        ></mono-select>

        <mono-select
            label="Region"
            placeholder="Asia Pacific"
            disabled
            :items.prop="items"
            :tooltip.prop="{ content: 'Your account region is fixed. Contact support to move it.', placement: 'right' }"
        ></mono-select>
    </div>
</template>
