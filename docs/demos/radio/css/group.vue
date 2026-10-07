<script setup>
import { ref } from 'vue'

const size = ref('medium')
</script>

<template>
    <div style="display: grid; gap: 0.5rem;">
        <label mono-radio>
            <input mono-input type="radio" name="size" value="small" v-model="size" />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label>
                <span mono-label-text>Small</span>
            </span>
        </label>
        <label mono-radio>
            <input mono-input type="radio" name="size" value="medium" v-model="size" />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label>
                <span mono-label-text>Medium</span>
            </span>
        </label>
        <label mono-radio>
            <input mono-input type="radio" name="size" value="large" v-model="size" />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label>
                <span mono-label-text>Large</span>
            </span>
        </label>
        <DemoReadout>selected = "{{ size }}"</DemoReadout>
    </div>
</template>
