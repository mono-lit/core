<script setup>
    import '@mono-lit/helper/ui/input'
    import { ref } from 'vue'

    const value = ref('')
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1rem;">
        <!-- Plain text: the attribute is enough. -->
        <mono-input
            label="Username"
            placeholder="e.g. ada.lovelace"
            helper-text="Lowercase letters, digits and dots."
            tooltip="Your username is public and shows on every comment you post. It can be changed once every 30 days."
            :model-value="value"
            @input="value = $event.detail.modelValue"
        ></mono-input>

        <!-- Full mono-tooltip options as an object. -->
        <mono-input
            label="Employee ID"
            model-value="EMP-00421"
            disabled
            required
            :tooltip.prop="{ content: 'Assigned by HR — this field cannot be edited here.', placement: 'right', color: 'warning' }"
        ></mono-input>
    </div>
</template>
