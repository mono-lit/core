<script setup>
import { ref } from 'vue'

const marketing = ref(false)
const security = ref(true)
</script>

<template>
    <div style="display: grid; gap: 0.75rem;">
        <label mono-switch>
            <input mono-input type="checkbox" role="switch" v-model="marketing" />
            <span mono-track aria-hidden="true"><span mono-thumb></span></span>
            <span mono-label>
                <span mono-label-text>Marketing emails</span>
                <span mono-description>Promos, newsletters and product updates from us.</span>
            </span>
        </label>
        <label mono-switch>
            <input mono-input type="checkbox" role="switch" v-model="security" />
            <span mono-track aria-hidden="true"><span mono-thumb></span></span>
            <span mono-label>
                <span mono-label-text>Security alerts</span>
                <span mono-description>Sign-ins from new devices and suspicious activity.</span>
            </span>
        </label>
    </div>
</template>
