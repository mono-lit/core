<script setup>
    import '@mono-lit/helper/ui/radio'
    import { ref } from 'vue'

    const selected = ref('two')

    function pick(event) {
        selected.value = event.detail.modelValue
    }
</script>

<template>
    <div style="display: grid; gap: 0.75rem;">
        <mono-radio
            label="Customized one"
            sublabel="Bold label, larger description, generous gap."
            value="one"
            :model-value="selected"
            @change="pick"
            :css-class="{
                root: 'gap-4',
                labelText: 'font-bold text-base',
                description: 'text-sm italic',
            }"
        ></mono-radio>
        <mono-radio
            label="Customized two"
            sublabel="Same overrides, different value."
            value="two"
            :model-value="selected"
            @change="pick"
            :css-class="{
                root: 'gap-4',
                labelText: 'font-bold text-base',
                description: 'text-sm italic',
            }"
        ></mono-radio>
    </div>
</template>
