<script setup>
import { ref } from 'vue'

const value = ref('two')
</script>

<template>
    <div style="display: grid; gap: 0.75rem;">
        <label mono-radio class="gap-4">
            <input mono-input type="radio" name="customized" value="one" v-model="value" />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label>
                <span mono-label-text class="font-bold text-base">Customized one</span>
                <span mono-description class="text-sm italic">Bold label, larger description, generous gap.</span>
            </span>
        </label>
        <label mono-radio class="gap-4">
            <input mono-input type="radio" name="customized" value="two" v-model="value" />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label>
                <span mono-label-text class="font-bold text-base">Customized two</span>
                <span mono-description class="text-sm italic">Same overrides, different value.</span>
            </span>
        </label>
    </div>
</template>
