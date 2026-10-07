<script setup>
import { ref } from 'vue'

const drink = ref('')
</script>

<template>
    <div style="display: grid; gap: 0.5rem;">
        <label mono-radio>
            <input mono-input type="radio" name="drink" value="coffee" v-model="drink" />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label><span mono-label-text>Coffee</span></span>
        </label>
        <label mono-radio>
            <input mono-input type="radio" name="drink" value="tea" v-model="drink" />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label><span mono-label-text>Tea</span></span>
        </label>
        <label mono-radio>
            <input mono-input type="radio" name="drink" value="water" v-model="drink" />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label><span mono-label-text>Water</span></span>
        </label>
        <DemoReadout>Last picked: {{ drink || '—' }}</DemoReadout>
    </div>
</template>
