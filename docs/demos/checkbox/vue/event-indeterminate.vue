<script setup>
import '@mono-lit/helper/ui/checkbox'
import { ref } from 'vue'

const value = ref(false)
const isIndeterminate = ref(true)

function onChange(event) {
    value.value = event.detail.modelValue
    isIndeterminate.value = false
}
</script>

<template>
    <div>
        <mono-checkbox :model-value="value" :indeterminate="isIndeterminate" @change="onChange" label="Indeterminate" />
        <br>
        <br>
        <div>
            <button type="button" class="demo-button" @click="isIndeterminate = !isIndeterminate">
                Toggle Indeterminate
            </button>
        </div>
    </div>
</template>
