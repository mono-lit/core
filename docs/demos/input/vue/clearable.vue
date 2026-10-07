<script setup>
    import '@mono-lit/helper/ui/input'
    import { ref } from 'vue'

    const value = ref('Erase me')
</script>

<template>
    <div style="width: 100%">
        <mono-input
            label="Clearable"
            placeholder="Type then clear"
            helper-text="The clear button appears when the field has a value."
            clearable
            :model-value="value"
            @input="value = $event.detail.modelValue"
            @clear="value = ''"
        ></mono-input>
    </div>
</template>
