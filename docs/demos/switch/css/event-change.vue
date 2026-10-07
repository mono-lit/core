<script setup>
import { ref } from 'vue'

const enabled = ref(false)
</script>

<template>
    <div style="display: grid; gap: 0.5rem;">
        <label mono-switch>
            <input mono-input type="checkbox" role="switch" v-model="enabled" />
            <span mono-track aria-hidden="true"><span mono-thumb></span></span>
            <span mono-label><span mono-label-text>Wi-Fi</span></span>
        </label>
        <DemoReadout>enabled = {{ enabled }}</DemoReadout>
    </div>
</template>
