<script setup>
import '@mono-lit/helper/ui/checkbox'
import { ref } from 'vue'

const controlled = ref(false)
</script>

<template>
    <div>
        <mono-checkbox :model-value="controlled" @change="controlled = $event.detail.modelValue"
            label="Controlled checkbox" />
        <br>
        <br>
        <div class="checkbox-controls">
            <button type="button" class="demo-button" @click="controlled = !controlled">Toggle</button>
            <br>
            <button type="button" class="demo-button" @click="controlled = true">Set On</button>
            <br>
            <button type="button" class="demo-button" @click="controlled = false">Set Off</button>
        </div>
    </div>
</template>
