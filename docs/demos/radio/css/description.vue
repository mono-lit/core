<script setup>
import { ref } from 'vue'

const plan = ref('annual')
</script>

<template>
    <div style="display: grid; gap: 0.75rem;">
        <label mono-radio>
            <input mono-input type="radio" name="plan" value="monthly" v-model="plan" />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label>
                <span mono-label-text>Monthly</span>
                <span mono-description>Billed every month at $9. Cancel anytime.</span>
            </span>
        </label>
        <label mono-radio>
            <input mono-input type="radio" name="plan" value="annual" v-model="plan" />
            <span mono-circle aria-hidden="true"></span>
            <span mono-label>
                <span mono-label-text>Annual</span>
                <span mono-description>Billed once a year at $84. Save 22%.</span>
            </span>
        </label>
    </div>
</template>
